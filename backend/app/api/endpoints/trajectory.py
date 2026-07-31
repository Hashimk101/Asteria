from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.trajectory import TrajectoryResponseSchema
from app.schemas.planet import VectorSchema
from app.services.asteroid_service import AsteroidService

router = APIRouter()


@router.get("/{spk_id}", response_model=TrajectoryResponseSchema, summary="Get asteroid trajectory vectors by SPK ID")
def get_trajectory(spk_id: int, db: Session = Depends(get_db)):
    """
    Retrieve Sun-centered state vectors for an asteroid by SPK ID.
    """
    asteroid = AsteroidService.get_asteroid_by_spk(db, spk_id=spk_id)
    trajectories = AsteroidService.get_trajectory(db, spk_id=spk_id)

    if not trajectories and not asteroid:
        raise HTTPException(status_code=404, detail=f"Trajectory vectors for SPK ID {spk_id} not found")

    vectors = [VectorSchema.model_validate(t) for t in trajectories]
    return TrajectoryResponseSchema(
        spk_id=spk_id,
        asteroid_id=asteroid.id if asteroid else str(spk_id),
        asteroid_name=asteroid.name if asteroid else None,
        total_points=len(vectors),
        vectors=vectors,
    )
