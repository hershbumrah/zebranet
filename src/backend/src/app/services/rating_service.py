"""Rating and notes business logic."""

from sqlalchemy.orm import Session

from app.models.league import League
from app.models.note import RefNote
from app.models.rating import Rating


def create_rating(db: Session, league: League, data: dict) -> Rating:
    rating = Rating(league_id=league.id, **data)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


def create_note(db: Session, league: League, data: dict) -> RefNote:
    note = RefNote(league_id=league.id, **data)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note
