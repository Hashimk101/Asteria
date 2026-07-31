from sqlalchemy import Column, String, BigInteger, Float, DateTime, Index
from sqlalchemy.sql import func
from app.database.base import Base


class PlanetTrajectory(Base):
    __tablename__ = "planet_trajectories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    planet_name = Column(String(50), nullable=False, index=True)
    jd = Column(Float, nullable=False, index=True)
    datetime = Column(String(100), nullable=False)
    x_km = Column(Float, nullable=False)
    y_km = Column(Float, nullable=False)
    z_km = Column(Float, nullable=False)
    vx_kms = Column(Float, nullable=False)
    vy_kms = Column(Float, nullable=False)
    vz_kms = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("uix_planet_trajectory_name_jd", "planet_name", "jd", unique=True),
    )
