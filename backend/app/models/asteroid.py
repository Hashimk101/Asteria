from sqlalchemy import Column, String, BigInteger, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Asteroid(Base):
    __tablename__ = "asteroids"

    id = Column(String(64), primary_key=True, index=True)  # NeoWs ID e.g. "2524474"
    spk_id = Column(BigInteger, index=True, nullable=True)  # JPL SPK ID e.g. 20524474
    name = Column(String(255), nullable=False)
    designation = Column(String(255), nullable=True)
    estimated_diameter_min_m = Column(Float, nullable=True)
    estimated_diameter_max_m = Column(Float, nullable=True)
    is_hazardous = Column(Boolean, default=False, index=True)
    is_sentry_object = Column(Boolean, default=False, index=True)
    pha = Column(Boolean, nullable=True, index=True)
    orbit_class_name = Column(String(100), nullable=True)
    semi_major_axis_au = Column(Float, nullable=True)
    eccentricity = Column(Float, nullable=True)
    inclination_degrees = Column(Float, nullable=True)
    longitude_of_ascending_node_degrees = Column(Float, nullable=True)
    argument_of_perihelion_degrees = Column(Float, nullable=True)
    mean_anomaly_degrees = Column(Float, nullable=True)
    orbital_period_days = Column(Float, nullable=True)
    moid_au = Column(Float, nullable=True)
    sbdb_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    close_approaches = relationship("CloseApproach", back_populates="asteroid", cascade="all, delete-orphan")
    trajectories = relationship("AsteroidTrajectory", back_populates="asteroid", cascade="all, delete-orphan")
    sentry = relationship("SentryObject", back_populates="asteroid", uselist=False, cascade="all, delete-orphan")


class CloseApproach(Base):
    __tablename__ = "close_approaches"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    asteroid_id = Column(String(64), ForeignKey("asteroids.id", ondelete="CASCADE"), nullable=False, index=True)
    spk_id = Column(BigInteger, nullable=True, index=True)
    date = Column(String(50), nullable=False, index=True)
    date_full = Column(String(100), nullable=True)
    miss_distance_km = Column(Float, nullable=True)
    relative_velocity_km_s = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asteroid = relationship("Asteroid", back_populates="close_approaches")


class AsteroidTrajectory(Base):
    __tablename__ = "asteroid_trajectories"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    asteroid_id = Column(String(64), ForeignKey("asteroids.id", ondelete="CASCADE"), nullable=False, index=True)
    spk_id = Column(BigInteger, nullable=False, index=True)
    jd = Column(Float, nullable=False, index=True)
    datetime = Column(String(100), nullable=False)
    x_km = Column(Float, nullable=False)
    y_km = Column(Float, nullable=False)
    z_km = Column(Float, nullable=False)
    vx_kms = Column(Float, nullable=False)
    vy_kms = Column(Float, nullable=False)
    vz_kms = Column(Float, nullable=False)

    asteroid = relationship("Asteroid", back_populates="trajectories")

    __table_args__ = (
        Index("uix_asteroid_trajectory_spk_jd", "spk_id", "jd", unique=True),
    )
