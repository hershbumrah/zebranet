"""League ORM model."""

from typing import List, Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class League(Base):
    __tablename__ = "leagues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, unique=True)
    name: Mapped[Optional[str]] = mapped_column(String(255))
    primary_region: Mapped[Optional[str]] = mapped_column(String(255))
    level: Mapped[Optional[str]] = mapped_column(String(100))

    user = relationship("User", back_populates="league_profile")
    games: Mapped[List["Game"]] = relationship(back_populates="league")
    ratings: Mapped[List["Rating"]] = relationship(back_populates="league")
    notes: Mapped[List["RefNote"]] = relationship(back_populates="league")
