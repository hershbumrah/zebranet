"""League schemas."""

from typing import Optional

from pydantic import BaseModel


class LeagueBase(BaseModel):
    name: Optional[str] = None
    primary_region: Optional[str] = None
    level: Optional[str] = None


class LeagueCreate(LeagueBase):
    pass


class LeagueUpdate(LeagueBase):
    pass


class LeagueResponse(LeagueBase):
    id: int

    class Config:
        from_attributes = True
