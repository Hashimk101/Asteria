from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class CloseApproachSchema(BaseModel):
    id: int
    date: str
    date_full: Optional[str] = None
    miss_distance_km: Optional[float] = None
    relative_velocity_km_s: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class AsteroidSummarySchema(BaseModel):
    id: str
    spk_id: Optional[int] = None
    name: str
    designation: Optional[str] = None
    estimated_diameter_min_m: Optional[float] = None
    estimated_diameter_max_m: Optional[float] = None
    is_hazardous: bool
    is_sentry_object: bool
    pha: Optional[bool] = None
    orbit_class_name: Optional[str] = None
    moid_au: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class AsteroidDetailSchema(AsteroidSummarySchema):
    semi_major_axis_au: Optional[float] = None
    eccentricity: Optional[float] = None
    inclination_degrees: Optional[float] = None
    longitude_of_ascending_node_degrees: Optional[float] = None
    argument_of_perihelion_degrees: Optional[float] = None
    mean_anomaly_degrees: Optional[float] = None
    orbital_period_days: Optional[float] = None
    sbdb_error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    close_approaches: List[CloseApproachSchema] = []

    model_config = ConfigDict(from_attributes=True)
