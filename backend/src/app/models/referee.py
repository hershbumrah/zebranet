"""Referee profile ORM model."""

from typing import List, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RefereeProfile(Base):
    __tablename__ = "referee_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    cert_level: Mapped[Optional[str]] = mapped_column(String(100))
    years_experience: Mapped[Optional[int]] = mapped_column(Integer)
    primary_positions: Mapped[Optional[str]] = mapped_column(String(255))
    home_location: Mapped[Optional[str]] = mapped_column(String(255))
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    travel_radius_km: Mapped[Optional[float]] = mapped_column(Float)
    bio: Mapped[Optional[str]] = mapped_column(Text)

    user = relationship("User", back_populates="referee_profile")
    assignments: Mapped[List["Assignment"]] = relationship(back_populates="referee")
    ratings: Mapped[List["Rating"]] = relationship(back_populates="referee")
    notes: Mapped[List["RefNote"]] = relationship(back_populates="referee")
    availability: Mapped[List["AvailabilitySlot"]] = relationship(back_populates="referee")
