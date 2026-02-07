"""AI matching schemas."""

from typing import List

from pydantic import BaseModel


class FindRefRequest(BaseModel):
    natural_language_query: str
    league_id: int


class FindRefResult(BaseModel):
    suggested_ref_ids: List[int]
    explanation: str
