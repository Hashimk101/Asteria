from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Optional


class VectorSchema(BaseModel):
    jd: float
    datetime: str
    x_km: float
    y_km: float
    z_km: float
    vx_kms: float
    vy_kms: float
    vz_kms: float

    model_config = ConfigDict(from_attributes=True)


class PlanetTrajectoryResponse(BaseModel):
    planet: str
    total_points: int
    vectors: List[VectorSchema]


class AllPlanetsTrajectoryResponse(BaseModel):
    planets: Dict[str, List[VectorSchema]]
