from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.schemas.sentry import SentryObjectSchema
from app.services.asteroid_service import AsteroidService

router = APIRouter()


@router.get("", response_model=List[SentryObjectSchema], summary="Get Sentry impact risk objects")
def get_sentry(db: Session = Depends(get_db)):
    """
    Retrieve all monitored asteroids and their JPL Sentry impact risk records.
    """
    return AsteroidService.get_sentry_objects(db)
