from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
from datetime import datetime


class SentryObjectSchema(BaseModel):
    id: int
    asteroid_id: str
    spk_id: Optional[int] = None
    status: str
    impact_probability: Optional[float] = None
    palermo_scale_cumulative: Optional[float] = None
    palermo_scale_max: Optional[float] = None
    torino_scale_max: Optional[int] = None
    impact_energy_megatons: Optional[float] = None
    potential_impact_dates: Optional[Any] = None
    potential_impacts: Optional[Any] = None
    removed_date: Optional[str] = None
    error: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
