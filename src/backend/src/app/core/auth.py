"""Authentication helpers."""

from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(
    db: Session,
    email: str,
    password: str,
    role: str,
    profile_image_url: Optional[str] = None,
) -> User:
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
        profile_image_url=profile_image_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_access_token_for_user(user: User, expires_delta: Optional[timedelta] = None) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role}, expires_delta)
