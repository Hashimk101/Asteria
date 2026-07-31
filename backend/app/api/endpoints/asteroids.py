from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.schemas.asteroid import AsteroidSummarySchema, AsteroidDetailSchema
from app.services.asteroid_service import AsteroidService

router = APIRouter()


@router.get("", response_model=List[AsteroidSummarySchema], summary="Get list of near-Earth asteroids")
def get_asteroids(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_hazardous: Optional[bool] = Query(None, description="Filter by hazardous status"),
    is_sentry: Optional[bool] = Query(None, description="Filter by sentry status"),
    search: Optional[str] = Query(None, description="Search asteroid name"),
    db: Session = Depends(get_db),
):
    """
    Retrieve near-Earth asteroids from the database.
    Query filters supported: skip, limit, is_hazardous, is_sentry, search.
    """
    return AsteroidService.get_asteroids(
        db, skip=skip, limit=limit, is_hazardous=is_hazardous, is_sentry=is_sentry, search=search
    )


@router.get("/{spk_id}", response_model=AsteroidDetailSchema, summary="Get asteroid detail by SPK ID")
def get_asteroid_detail(spk_id: int, db: Session = Depends(get_db)):
    """
    Retrieve detailed asteroid record including orbital parameters and close approach data by SPK ID.
    """
    asteroid = AsteroidService.get_asteroid_by_spk(db, spk_id=spk_id)
    if not asteroid:
        raise HTTPException(status_code=404, detail=f"Asteroid with SPK ID {spk_id} not found")
    return asteroid
