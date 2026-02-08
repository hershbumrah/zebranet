"""Field location schemas."""

from typing import Optional

from pydantic import BaseModel


class FieldLocationBase(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float


class FieldLocationCreate(FieldLocationBase):
    pass


class FieldLocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FieldLocationResponse(FieldLocationBase):
    id: int
    league_id: int

    class Config:
        from_attributes = True
