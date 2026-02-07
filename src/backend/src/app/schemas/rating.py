"""Rating schemas."""

from datetime import datetime
from pydantic import BaseModel


class RatingCreate(BaseModel):
    referee_id: int
    game_id: int
    score: int
    comment: str


class RatingResponse(BaseModel):
    id: int
    league_id: int
    referee_id: int
    game_id: int
    score: int
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True
