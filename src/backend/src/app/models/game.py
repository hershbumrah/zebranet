"""Game ORM model."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    league_id: Mapped[int] = mapped_column(ForeignKey("leagues.id"), nullable=False)
    field_location_id: Mapped[int] = mapped_column(ForeignKey("field_locations.id"), nullable=False)
    
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    age_group: Mapped[Optional[str]] = mapped_column(String(100))
    gender_focus: Mapped[Optional[str]] = mapped_column(String(50))
    competition_level: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="open")
    center_fee: Mapped[Optional[float]] = mapped_column(Float)
    ar_fee: Mapped[Optional[float]] = mapped_column(Float)

    league = relationship("League", back_populates="games")
    field_location = relationship("FieldLocation", back_populates="games")
    assignments: Mapped[List["Assignment"]] = relationship(back_populates="game")
    ratings: Mapped[List["Rating"]] = relationship(back_populates="game")
    notes: Mapped[List["RefNote"]] = relationship(back_populates="game")
    messages: Mapped[List["Message"]] = relationship(back_populates="game")
