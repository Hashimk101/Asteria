from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.planet import AllPlanetsTrajectoryResponse, VectorSchema
from app.services.asteroid_service import AsteroidService

router = APIRouter()


@router.get("", response_model=AllPlanetsTrajectoryResponse, summary="Get planet trajectory vectors")
def get_planets(db: Session = Depends(get_db)):
    """
    Retrieve Sun-centered state vectors for all 8 solar system planets.
    """
    planets_db = AsteroidService.get_all_planet_trajectories(db)
    result = {}
    for planet_name, vectors in planets_db.items():
        result[planet_name] = [VectorSchema.model_validate(v) for v in vectors]
    return AllPlanetsTrajectoryResponse(planets=result)
