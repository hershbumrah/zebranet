"""Referee note ORM model."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RefNote(Base):
    __tablename__ = "ref_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id"), nullable=False)
    referee_id: Mapped[int] = mapped_column(ForeignKey("referee_profiles.id"), nullable=False)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    note_text: Mapped[str] = mapped_column(String(2000), nullable=False)
    visibility: Mapped[str] = mapped_column(String(50), default="private_to_league")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    league = relationship("League", back_populates="notes")
    referee = relationship("RefereeProfile", back_populates="notes")
    game = relationship("Game", back_populates="notes")
