"""Game routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_league, get_db_dep
from app.models.game import Game
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.schemas.game import GameCreate, GameResponse, GameUpdate
from app.services.game_service import (
    create_game,
    get_game,
    list_assignments_for_game,
    list_games,
    request_assignment,
    update_game,
)

router = APIRouter()


@router.post("", response_model=GameResponse)
def create_game_route(
    payload: GameCreate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> GameResponse:
    game = create_game(db, current_league, payload.model_dump())
    return GameResponse.model_validate(game)


@router.get("", response_model=List[GameResponse])
def list_games_route(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> List[GameResponse]:
    games = list_games(db, current_league, status)
    return [GameResponse.model_validate(g) for g in games]


@router.get("/{game_id}", response_model=GameResponse)
def get_game_route(
    game_id: int,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> GameResponse:
    game = get_game(db, game_id, current_league)
    return GameResponse.model_validate(game)


@router.patch("/{game_id}", response_model=GameResponse)
def update_game_route(
    game_id: int,
    payload: GameUpdate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> GameResponse:
    game = get_game(db, game_id, current_league)
    updated = update_game(db, game, payload.model_dump(exclude_unset=True))
    return GameResponse.model_validate(updated)


@router.post("/{game_id}/assignments", response_model=AssignmentResponse)
def create_assignment_route(
    game_id: int,
    payload: AssignmentCreate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> AssignmentResponse:
    game = get_game(db, game_id, current_league)
    assignment = request_assignment(db, current_league, game, payload.referee_id, payload.role)
    return AssignmentResponse.model_validate(assignment)


@router.get("/{game_id}/assignments", response_model=List[AssignmentResponse])
def list_assignments_route(
    game_id: int,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> List[AssignmentResponse]:
    game = get_game(db, game_id, current_league)
    assignments = list_assignments_for_game(db, game)
    return [AssignmentResponse.model_validate(a) for a in assignments]
