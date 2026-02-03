"""Game and assignment business logic."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.game import Game
from app.models.league import League


def create_game(db: Session, league: League, data: dict) -> Game:
    game = Game(league_id=league.id, **data)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


def list_games(db: Session, league: League, status_filter: Optional[str] = None) -> List[Game]:
    query = db.query(Game).filter(Game.league_id == league.id)
    if status_filter:
        query = query.filter(Game.status == status_filter)
    return query.order_by(Game.scheduled_start.asc()).all()


def get_game(db: Session, game_id: int, league: League) -> Game:
    game = db.query(Game).filter(Game.id == game_id, Game.league_id == league.id).first()
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    return game


def update_game(db: Session, game: Game, data: dict) -> Game:
    for key, value in data.items():
        setattr(game, key, value)
    db.commit()
    db.refresh(game)
    return game


def request_assignment(
    db: Session, league: League, game: Game, referee_id: int, role: str
) -> Assignment:
    assignment = Assignment(game_id=game.id, referee_id=referee_id, role=role, status="requested")
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def list_assignments_for_game(db: Session, game: Game) -> List[Assignment]:
    return (
        db.query(Assignment).filter(Assignment.game_id == game.id).order_by(Assignment.id.asc()).all()
    )
