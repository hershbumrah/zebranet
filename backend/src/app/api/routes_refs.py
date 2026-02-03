"""Referee routes."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_league, get_current_referee, get_db_dep
from app.models.assignment import Assignment
from app.models.availability import AvailabilitySlot
from app.models.note import RefNote
from app.models.rating import Rating
from app.models.referee import RefereeProfile
from app.schemas.assignment import AssignmentResponse
from app.schemas.note import NoteCreate, NoteResponse
from app.schemas.rating import RatingCreate, RatingResponse
from app.schemas.referee import (
    AvailabilityCreate,
    RefereeProfilePublic,
    RefereeProfileUpdate,
    RefereeStatsResponse,
)
from app.services.referee_service import get_referee_stats, search_candidate_refs
from app.services.rating_service import create_note, create_rating

router = APIRouter()


@router.get("/me", response_model=RefereeProfilePublic)
def get_me(current_ref: RefereeProfile = Depends(get_current_referee)) -> RefereeProfilePublic:
    return RefereeProfilePublic.model_validate(current_ref)


@router.put("/me", response_model=RefereeProfilePublic)
def update_me(
    payload: RefereeProfileUpdate,
    db: Session = Depends(get_db_dep),
    current_ref: RefereeProfile = Depends(get_current_referee),
) -> RefereeProfilePublic:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_ref, key, value)
    db.commit()
    db.refresh(current_ref)
    return RefereeProfilePublic.model_validate(current_ref)


@router.get("/{ref_id}", response_model=RefereeProfilePublic)
def get_ref(ref_id: int, db: Session = Depends(get_db_dep)) -> RefereeProfilePublic:
    ref = db.query(RefereeProfile).filter(RefereeProfile.id == ref_id).first()
    if not ref:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referee not found")
    return RefereeProfilePublic.model_validate(ref)


@router.get("/{ref_id}/stats", response_model=RefereeStatsResponse)
def get_stats(ref_id: int, db: Session = Depends(get_db_dep)) -> RefereeStatsResponse:
    stats = get_referee_stats(db, ref_id)
    return RefereeStatsResponse(
        games_reffed=stats["games_reffed"],
        average_rating=stats["average_rating"],
        recent_notes=stats["recent_notes"],
    )


@router.get("/{ref_id}/ratings", response_model=List[RatingResponse])
def get_ratings(ref_id: int, db: Session = Depends(get_db_dep)) -> List[RatingResponse]:
    ratings = db.query(Rating).filter(Rating.referee_id == ref_id).all()
    return [RatingResponse.model_validate(r) for r in ratings]


@router.post("/{ref_id}/ratings", response_model=RatingResponse)
def add_rating(
    ref_id: int,
    payload: RatingCreate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> RatingResponse:
    data = payload.model_dump()
    data["referee_id"] = ref_id
    rating = create_rating(db, current_league, data)
    return RatingResponse.model_validate(rating)


@router.get("/{ref_id}/notes", response_model=List[NoteResponse])
def get_notes(ref_id: int, db: Session = Depends(get_db_dep)) -> List[NoteResponse]:
    notes = db.query(RefNote).filter(RefNote.referee_id == ref_id).all()
    return [NoteResponse.model_validate(n) for n in notes]


@router.post("/{ref_id}/notes", response_model=NoteResponse)
def add_note(
    ref_id: int,
    payload: NoteCreate,
    db: Session = Depends(get_db_dep),
    current_league=Depends(get_current_league),
) -> NoteResponse:
    data = payload.model_dump()
    data["referee_id"] = ref_id
    note = create_note(db, current_league, data)
    return NoteResponse.model_validate(note)


@router.get("/search", response_model=List[RefereeProfilePublic])
def search_refs(
    min_rating: Optional[float] = Query(None),
    max_distance_km: Optional[float] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db_dep),
) -> List[RefereeProfilePublic]:
    constraints = {
        "min_rating": min_rating,
        "max_distance_km": max_distance_km,
        "location": {"lat": lat, "lon": lon},
    }
    refs = search_candidate_refs(db, constraints)
    return [RefereeProfilePublic.model_validate(r) for r in refs]


@router.post("/me/availability")
def add_availability(
    payload: AvailabilityCreate,
    db: Session = Depends(get_db_dep),
    current_ref: RefereeProfile = Depends(get_current_referee),
) -> dict:
    slot = AvailabilitySlot(
        referee_id=current_ref.id, start_time=payload.start_time, end_time=payload.end_time
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return {"id": slot.id}


@router.get("/me/assignments", response_model=List[AssignmentResponse])
def my_assignments(
    db: Session = Depends(get_db_dep),
    current_ref: RefereeProfile = Depends(get_current_referee),
) -> List[AssignmentResponse]:
    assignments = db.query(Assignment).filter(Assignment.referee_id == current_ref.id).all()
    return [AssignmentResponse.model_validate(a) for a in assignments]


@router.post("/assignments/{assignment_id}/respond", response_model=AssignmentResponse)
def respond_assignment(
    assignment_id: int,
    response: str = Query(..., pattern="^(accepted|declined)$"),
    db: Session = Depends(get_db_dep),
    current_ref: RefereeProfile = Depends(get_current_referee),
) -> AssignmentResponse:
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id, Assignment.referee_id == current_ref.id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    assignment.status = response
    assignment.responded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assignment)
    return AssignmentResponse.model_validate(assignment)
