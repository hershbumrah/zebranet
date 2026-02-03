"""Referee profile schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class RefereeProfileBase(BaseModel):
    full_name: Optional[str] = None
    cert_level: Optional[str] = None
    years_experience: Optional[int] = None
    primary_positions: Optional[str] = None
    home_location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    travel_radius_km: Optional[float] = None
    bio: Optional[str] = None


class RefereeProfileCreate(RefereeProfileBase):
    pass


class RefereeProfileUpdate(RefereeProfileBase):
    pass


class RefereeProfilePublic(RefereeProfileBase):
    id: int

    class Config:
        from_attributes = True


class NoteSummary(BaseModel):
    id: int
    note_text: str
    visibility: str

    class Config:
        from_attributes = True


class RefereeStatsResponse(BaseModel):
    games_reffed: int
    average_rating: Optional[float]
    recent_notes: List[NoteSummary]


class AvailabilityCreate(BaseModel):
    start_time: datetime
    end_time: datetime
