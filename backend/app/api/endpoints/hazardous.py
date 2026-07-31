from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.asteroid import AsteroidSummarySchema
from app.services.asteroid_service import AsteroidService

router = APIRouter()


@router.get("", response_model=List[AsteroidSummarySchema], summary="Get potentially hazardous asteroids")
def get_hazardous(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Retrieve all asteroids classified as potentially hazardous (PHA).
    """
    return AsteroidService.get_hazardous_asteroids(db, skip=skip, limit=limit)
