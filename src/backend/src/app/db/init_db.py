"""Database initialization utilities."""

from app.db.base import Base
from app.db.session import engine
from app.models import assignment, availability, field_location, game, league, note, rating, referee, user


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
