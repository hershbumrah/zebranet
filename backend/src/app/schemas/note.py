"""Note schemas."""

from datetime import datetime
from pydantic import BaseModel


class NoteCreate(BaseModel):
    referee_id: int
    game_id: int
    note_text: str
    visibility: str


class NoteResponse(BaseModel):
    id: int
    league_id: int
    referee_id: int
    game_id: int
    note_text: str
    visibility: str
    created_at: datetime

    class Config:
        from_attributes = True
