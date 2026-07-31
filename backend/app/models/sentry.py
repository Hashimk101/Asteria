from sqlalchemy import Column, String, BigInteger, Float, Integer, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class SentryObject(Base):
    __tablename__ = "sentry_objects"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    asteroid_id = Column(String(64), ForeignKey("asteroids.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    spk_id = Column(BigInteger, nullable=True, index=True)
    status = Column(String(50), nullable=False)
    impact_probability = Column(Float, nullable=True)
    palermo_scale_cumulative = Column(Float, nullable=True)
    palermo_scale_max = Column(Float, nullable=True)
    torino_scale_max = Column(Integer, nullable=True)
    impact_energy_megatons = Column(Float, nullable=True)
    potential_impact_dates = Column(JSON, nullable=True)
    potential_impacts = Column(JSON, nullable=True)
    removed_date = Column(String(50), nullable=True)
    error = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    asteroid = relationship("Asteroid", back_populates="sentry")
