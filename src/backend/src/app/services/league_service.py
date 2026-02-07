"""League-related business logic."""

from sqlalchemy.orm import Session

from app.models.league import League


def update_league(db: Session, league: League, data: dict) -> League:
    for key, value in data.items():
        setattr(league, key, value)
    db.commit()
    db.refresh(league)
    return league
