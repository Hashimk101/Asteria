from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.schemas.planet import VectorSchema


class TrajectoryResponseSchema(BaseModel):
    spk_id: int
    asteroid_id: str
    asteroid_name: Optional[str] = None
    total_points: int
    vectors: List[VectorSchema]

    model_config = ConfigDict(from_attributes=True)
