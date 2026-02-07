"""Referee-related business logic."""

from datetime import datetime
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.note import RefNote
from app.models.rating import Rating
from app.models.referee import RefereeProfile


def get_referee_stats(db: Session, ref_id: int) -> Dict[str, object]:
    games_reffed = (
        db.query(Assignment)
        .filter(Assignment.referee_id == ref_id, Assignment.status == "accepted")
        .count()
    )
    avg_rating = (
        db.query(func.avg(Rating.score))
        .filter(Rating.referee_id == ref_id)
        .scalar()
    )
    notes = (
        db.query(RefNote)
        .filter(RefNote.referee_id == ref_id)
        .order_by(RefNote.created_at.desc())
        .limit(5)
        .all()
    )
    return {
        "games_reffed": games_reffed,
        "average_rating": float(avg_rating) if avg_rating is not None else None,
        "recent_notes": notes,
    }


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import asin, cos, radians, sin, sqrt

    r = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return r * c


def search_candidate_refs(db: Session, constraints: Dict[str, object]) -> List[RefereeProfile]:
    min_rating = constraints.get("min_rating")
    max_distance_km = constraints.get("max_distance_km")
    location = constraints.get("location") or {}
    lat = location.get("lat")
    lon = location.get("lon")

    query = db.query(RefereeProfile)

    if min_rating is not None:
        query = query.join(Rating, Rating.referee_id == RefereeProfile.id).group_by(
            RefereeProfile.id
        ).having(func.avg(Rating.score) >= float(min_rating))

    refs = query.all()
    if lat is None or lon is None or max_distance_km is None:
        return refs

    filtered: List[RefereeProfile] = []
    for ref in refs:
        if ref.latitude is None or ref.longitude is None:
            continue
        distance = _haversine_km(lat, lon, ref.latitude, ref.longitude)
        if distance <= float(max_distance_km):
            filtered.append(ref)
    return filtered
