"""AI routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_league, get_db_dep
from app.schemas.ai import FindRefRequest, FindRefResult
from app.services.ai_matching_service import find_best_refs_from_nl

router = APIRouter()


@router.post("/find-ref", response_model=FindRefResult)
def find_ref(
    payload: FindRefRequest,
    db: Session = Depends(get_db_dep),
    _league=Depends(get_current_league),
) -> FindRefResult:
    return find_best_refs_from_nl(db, payload)
