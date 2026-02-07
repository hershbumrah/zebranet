"""OpenAI client helpers for parsing referee requests."""

from typing import Any, Dict

from openai import OpenAI

from app.config import get_settings


def _client() -> OpenAI:
    settings = get_settings()
    return OpenAI(api_key=settings.OPENAI_API_KEY or None)


def parse_ref_request(user_query: str, league_id: int) -> Dict[str, Any]:
    if not user_query:
        return {}

    client = _client()
    system_prompt = (
        "You are an assistant that extracts structured referee assignment constraints. "
        "Return function call arguments only."
    )

    tool_schema = {
        "type": "function",
        "function": {
            "name": "ref_constraints",
            "description": "Extract constraints for referee search",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "object",
                        "properties": {
                            "lat": {"type": "number"},
                            "lon": {"type": "number"},
                        },
                    },
                    "kickoff": {"type": "string"},
                    "age_group": {"type": "string"},
                    "competition_level": {"type": "string"},
                    "role": {"type": "string"},
                    "max_distance_km": {"type": "number"},
                    "min_rating": {"type": "number"},
                },
            },
        },
    }

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"League {league_id}: {user_query}"},
        ],
        tools=[tool_schema],
        tool_choice={"type": "function", "function": {"name": "ref_constraints"}},
    )

    tool_calls = response.choices[0].message.tool_calls
    if not tool_calls:
        return {}
    arguments = tool_calls[0].function.arguments
    if isinstance(arguments, str):
        import json

        try:
            return json.loads(arguments)
        except json.JSONDecodeError:
            return {}
    return arguments
