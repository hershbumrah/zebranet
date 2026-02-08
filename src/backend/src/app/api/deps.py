"""API dependencies for auth and database."""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.league import League
from app.models.referee import RefereeProfile
from app.models.user import User

security = HTTPBearer()


def get_db_dep() -> Generator:
    yield from get_db()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db_dep),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_referee(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_dep),
) -> RefereeProfile:
    if current_user.role != "referee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Referee role required")
    profile = db.query(RefereeProfile).filter(RefereeProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referee profile missing")
    return profile


def get_current_league(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_dep),
) -> League:
    if current_user.role != "league":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="League role required")
    league = db.query(League).filter(League.user_id == current_user.id).first()
    if not league:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League profile missing")
    return league
