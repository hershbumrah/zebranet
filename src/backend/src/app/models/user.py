"""User ORM model."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.league import League
    from app.models.message import Message
    from app.models.referee import RefereeProfile


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    referee_profile: Mapped[Optional["RefereeProfile"]] = relationship(
        back_populates="user", uselist=False
    )
    league_profile: Mapped[Optional["League"]] = relationship(
        back_populates="user", uselist=False
    )
    sent_messages: Mapped[List["Message"]] = relationship(
        "Message", foreign_keys="[Message.sender_id]", back_populates="sender"
    )
    received_messages: Mapped[List["Message"]] = relationship(
        "Message", foreign_keys="[Message.recipient_id]", back_populates="recipient"
    )
