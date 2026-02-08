"""Auth routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, get_current_user
from app.core.auth import authenticate_user, create_access_token_for_user, create_user
from app.models.league import League
from app.models.referee import RefereeProfile
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserResponse

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db_dep)) -> UserResponse:
    """Register a new user (referee or league manager)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Validate role
    if payload.role not in {"referee", "league"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'referee' or 'league'"
        )
    
    # Create user account
    user = create_user(db, payload.email, payload.password, payload.role)
    
    # Create associated profile
    if payload.role == "referee":
        profile = RefereeProfile(user_id=user.id, full_name=payload.name)
        db.add(profile)
    elif payload.role == "league":
        league = League(user_id=user.id, name=payload.name, primary_region=payload.region)
        db.add(league)
    
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db_dep)) -> Token:
    """Login with email and password. Returns JWT access token."""
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token_for_user(user)
    return Token(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)) -> UserResponse:
    """Get current authenticated user info."""
    return UserResponse.model_validate(current_user)
