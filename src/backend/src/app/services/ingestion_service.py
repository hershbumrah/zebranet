"""Data ingestion service for games and field locations."""

from __future__ import annotations

import csv
import io
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.field_location import FieldLocation
from app.models.game import Game
from app.models.league import League


@dataclass
class IngestionWarning:
    row_index: Optional[int]
    message: str


@dataclass
class IngestionResult:
    created_games: int
    created_locations: int
    skipped_rows: int
    warnings: List[IngestionWarning]


def ingest_games_from_file(
    db: Session,
    league: League,
    filename: str,
    file_bytes: bytes,
    use_llm: bool = True,
) -> IngestionResult:
    """Ingest games/fields from a file into the database.

    Supports CSV/TSV/JSON and unstructured text (LLM-assisted).
    """
    warnings: List[IngestionWarning] = []

    rows, raw_text = _parse_file(filename, file_bytes)

    normalized_rows: List[Dict[str, Any]] = []
    if rows:
        normalized_rows = _normalize_rows(rows, warnings)

    if use_llm and _should_use_llm(normalized_rows, raw_text):
        llm_rows = _extract_with_llm(raw_text or _rows_to_text(rows))
        if llm_rows:
            normalized_rows = _normalize_rows(llm_rows, warnings)

    created_games = 0
    created_locations = 0
    skipped_rows = 0

    for idx, row in enumerate(normalized_rows):
        try:
            scheduled_start = _parse_datetime(row.get("scheduled_start"))
            if not scheduled_start:
                warnings.append(IngestionWarning(idx, "Missing or invalid scheduled_start"))
                skipped_rows += 1
                continue

            field_name = (row.get("field_name") or row.get("location_name") or "Unknown Field").strip()
            address = (row.get("address") or row.get("location") or "").strip() or None
            latitude = _parse_float(row.get("latitude"))
            longitude = _parse_float(row.get("longitude"))

            if latitude is None or longitude is None:
                warnings.append(IngestionWarning(idx, "Missing latitude/longitude; defaulted to 0.0"))
                latitude = latitude if latitude is not None else 0.0
                longitude = longitude if longitude is not None else 0.0

            field_location, created = _get_or_create_field_location(
                db,
                league_id=league.id,
                name=field_name,
                address=address,
                latitude=latitude,
                longitude=longitude,
            )
            if created:
                created_locations += 1

            game = Game(
                league_id=league.id,
                field_location_id=field_location.id,
                scheduled_start=scheduled_start,
                age_group=_safe_str(row.get("age_group")),
                competition_level=_safe_str(row.get("competition_level")),
                gender_focus=_safe_str(row.get("gender_focus")),
                center_fee=_parse_float(row.get("center_fee")),
                ar_fee=_parse_float(row.get("ar_fee")),
                status=_safe_str(row.get("status")) or "open",
            )
            db.add(game)
            created_games += 1
        except Exception as exc:
            warnings.append(IngestionWarning(idx, f"Failed to ingest row: {exc}"))
            skipped_rows += 1

    db.commit()

    return IngestionResult(
        created_games=created_games,
        created_locations=created_locations,
        skipped_rows=skipped_rows,
        warnings=warnings,
    )


def _parse_file(filename: str, file_bytes: bytes) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext in {"csv", "tsv"}:
        delimiter = "\t" if ext == "tsv" else ","
        text = file_bytes.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        return list(reader), None

    if ext in {"json"}:
        text = file_bytes.decode("utf-8", errors="ignore")
        data = json.loads(text)
        if isinstance(data, list):
            return [row if isinstance(row, dict) else {"value": row} for row in data], None
        if isinstance(data, dict):
            if "rows" in data and isinstance(data["rows"], list):
                return [row if isinstance(row, dict) else {"value": row} for row in data["rows"]], None
            return [data], None

    # Fallback: treat as text for LLM
    text = file_bytes.decode("utf-8", errors="ignore")
    return [], text


def _normalize_rows(rows: Iterable[Dict[str, Any]], warnings: List[IngestionWarning]) -> List[Dict[str, Any]]:
    normalized = []
    for idx, row in enumerate(rows):
        if not isinstance(row, dict):
            warnings.append(IngestionWarning(idx, "Row is not an object"))
            continue

        row_lower = {str(k).strip().lower(): v for k, v in row.items()}

        date_value = _first_value(row_lower, ["date", "game_date", "scheduled_date"])
        time_value = _first_value(row_lower, ["time", "start_time", "kickoff", "scheduled_time"])
        datetime_value = _first_value(row_lower, ["datetime", "scheduled_start", "start", "kickoff_time"])

        scheduled_start = datetime_value or _combine_date_time(date_value, time_value)

        normalized.append(
            {
                "scheduled_start": scheduled_start,
                "field_name": _first_value(row_lower, ["field", "field_name", "field_number", "pitch"]),
                "location_name": _first_value(row_lower, ["location", "facility", "site"]),
                "address": _first_value(row_lower, ["address", "location_address", "site_address"]),
                "latitude": _first_value(row_lower, ["lat", "latitude"]),
                "longitude": _first_value(row_lower, ["lon", "lng", "longitude"]),
                "age_group": _first_value(row_lower, ["age_group", "age", "division"]),
                "competition_level": _first_value(row_lower, ["competition_level", "level", "league"]),
                "gender_focus": _first_value(row_lower, ["gender", "gender_focus"]),
                "center_fee": _first_value(row_lower, ["center_fee", "center pay", "center_fee_usd"]),
                "ar_fee": _first_value(row_lower, ["ar_fee", "assistant_fee", "ar pay"]),
                "status": _first_value(row_lower, ["status"]),
            }
        )

    return normalized


def _first_value(row: Dict[str, Any], keys: List[str]) -> Optional[Any]:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return None


def _combine_date_time(date_value: Any, time_value: Any) -> Optional[str]:
    if not date_value:
        return None
    if time_value:
        return f"{date_value} {time_value}"
    return str(date_value)


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None

    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%Y",
        "%m-%d-%Y %H:%M",
        "%m-%d-%Y",
    ]

    for fmt in formats:
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    try:
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def _parse_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_str(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _get_or_create_field_location(
    db: Session,
    league_id: int,
    name: str,
    address: Optional[str],
    latitude: float,
    longitude: float,
) -> Tuple[FieldLocation, bool]:
    existing = (
        db.query(FieldLocation)
        .filter(
            FieldLocation.league_id == league_id,
            FieldLocation.name == name,
            FieldLocation.address == address,
        )
        .first()
    )
    if existing:
        return existing, False

    location = FieldLocation(
        league_id=league_id,
        name=name,
        address=address,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(location)
    db.flush()
    return location, True


def _should_use_llm(normalized_rows: List[Dict[str, Any]], raw_text: Optional[str]) -> bool:
    if raw_text:
        return True
    if not normalized_rows:
        return True

    missing_dates = sum(1 for row in normalized_rows if not row.get("scheduled_start"))
    return missing_dates >= max(1, len(normalized_rows) // 2)


def _rows_to_text(rows: Iterable[Dict[str, Any]]) -> str:
    return json.dumps(list(rows), ensure_ascii=False)


def _extract_with_llm(text: str) -> List[Dict[str, Any]]:
    settings = get_settings()
    if not settings.OPENAI_API_KEY:
        return []

    client = OpenAI(api_key=settings.OPENAI_API_KEY or None)

    system_prompt = (
        "You are an assistant that extracts structured game schedule data. "
        "Return a JSON array of objects with keys: scheduled_start, field_name, "
        "address, location_name, field_number, age_group, competition_level, "
        "gender_focus, center_fee, ar_fee, latitude, longitude, status. "
        "Use ISO8601 for scheduled_start when possible."
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text[:12000]},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content or "[]"
    try:
        data = json.loads(content)
        if isinstance(data, list):
            return [row for row in data if isinstance(row, dict)]
    except json.JSONDecodeError:
        return []

    return []