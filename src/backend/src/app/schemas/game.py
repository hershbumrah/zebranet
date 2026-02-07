"""Game schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class GameBase(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    scheduled_start: datetime
    age_group: Optional[str] = None
    competition_level: Optional[str] = None
    status: Optional[str] = None
    center_fee: Optional[float] = None
    ar_fee: Optional[float] = None


class GameCreate(GameBase):
    pass


class GameUpdate(BaseModel):
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    scheduled_start: Optional[datetime] = None
    age_group: Optional[str] = None
    competition_level: Optional[str] = None
    status: Optional[str] = None
    center_fee: Optional[float] = None
    ar_fee: Optional[float] = None


class GameResponse(GameBase):
    id: int
    league_id: int

    class Config:
        from_attributes = True
