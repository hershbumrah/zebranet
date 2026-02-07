"""Assignment schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AssignmentCreate(BaseModel):
    referee_id: int
    role: str


class AssignmentResponse(BaseModel):
    id: int
    game_id: int
    referee_id: int
    role: str
    status: str
    assigned_at: datetime
    responded_at: Optional[datetime]

    class Config:
        from_attributes = True
