"""Auth routes."""

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep, get_current_user
from app.core.auth import authenticate_user, create_access_token_for_user, create_user
from app.models.league import League
from app.models.referee import RefereeProfile
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, Token, UserResponse

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db_dep)) -> AuthResponse:
    """Register a new user (referee or league manager)."""
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Validate role (frontend sends "ref" / "league", normalize to DB values)
    if payload.role not in {"ref", "referee", "league"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'referee' or 'league'"
        )

    # Normalize to database role values ('referee' or 'league')
    normalized_role = "referee" if payload.role in {"ref", "referee"} else "league"
    
    # Validate required fields by role
    if normalized_role == "referee":
        if not payload.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referee name is required",
            )
        if not payload.home_location:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referee location is required",
            )
        if not payload.cert_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referee experience level is required",
            )
    if normalized_role == "league" and not payload.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="League name is required",
        )

    # Create user account
    user = create_user(
        db,
        payload.email,
        payload.password,
        normalized_role,
        profile_image_url=payload.profile_image_url,
    )
    
    # Create associated profile
    if normalized_role == "referee":
        profile = RefereeProfile(
            user_id=user.id,
            full_name=payload.name,
            home_location=payload.home_location,
            cert_level=payload.cert_level,
        )
        db.add(profile)
    elif normalized_role == "league":
        league = League(
            user_id=user.id,
            name=payload.name,
            primary_region=payload.primary_region or payload.region,
        )
        db.add(league)
    
    db.commit()
    db.refresh(user)
    token = create_access_token_for_user(user)
    return AuthResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db_dep)) -> AuthResponse:
    """Login with email and password. Returns JWT access token."""
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token_for_user(user)
    return AuthResponse(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def me(current_user=Depends(get_current_user)) -> UserResponse:
    """Get current authenticated user info."""
    return UserResponse.model_validate(current_user)


@router.post("/profile-image", response_model=UserResponse)
def upload_profile_image(
    file: UploadFile,
    db: Session = Depends(get_db_dep),
    current_user=Depends(get_current_user),
) -> UserResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file")

    extension = Path(file.filename or "").suffix or ".png"
    filename = f"{uuid4().hex}{extension}"
    uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    destination = uploads_dir / filename

    with destination.open("wb") as buffer:
        buffer.write(file.file.read())

    current_user.profile_image_url = f"/uploads/{filename}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
