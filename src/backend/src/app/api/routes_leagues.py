"""League routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_league, get_db_dep
from app.schemas.league import LeagueResponse, LeagueUpdate
from app.services.league_service import update_league

router = APIRouter()


@router.get("/me", response_model=LeagueResponse)
def get_me(current_league=Depends(get_current_league)) -> LeagueResponse:
    return LeagueResponse.model_validate(current_league)


@router.put("/me", response_model=LeagueResponse)
def update_me(
    payload: LeagueUpdate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> LeagueResponse:
    league = update_league(db, current_league, payload.model_dump(exclude_unset=True))
    return LeagueResponse.model_validate(league)
