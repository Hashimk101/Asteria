from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from app.models.asteroid import Asteroid, AsteroidTrajectory
from app.models.planet import PlanetTrajectory
from app.models.sentry import SentryObject


class AsteroidService:
    @staticmethod
    def get_asteroids(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        is_hazardous: Optional[bool] = None,
        is_sentry: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[Asteroid]:
        query = db.query(Asteroid)
        if is_hazardous is not None:
            query = query.filter(Asteroid.is_hazardous == is_hazardous)
        if is_sentry is not None:
            query = query.filter(Asteroid.is_sentry_object == is_sentry)
        if search:
            query = query.filter(Asteroid.name.ilike(f"%{search}%"))
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_asteroid_by_spk(db: Session, spk_id: int) -> Optional[Asteroid]:
        return (
            db.query(Asteroid)
            .options(joinedload(Asteroid.close_approaches), joinedload(Asteroid.sentry))
            .filter((Asteroid.spk_id == spk_id) | (Asteroid.id == str(spk_id)))
            .first()
        )

    @staticmethod
    def get_hazardous_asteroids(db: Session, skip: int = 0, limit: int = 100) -> List[Asteroid]:
        return (
            db.query(Asteroid)
            .filter((Asteroid.is_hazardous == True) | (Asteroid.pha == True))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_sentry_objects(db: Session) -> List[SentryObject]:
        return db.query(SentryObject).options(joinedload(SentryObject.asteroid)).all()

    @staticmethod
    def get_trajectory(db: Session, spk_id: int) -> List[AsteroidTrajectory]:
        return (
            db.query(AsteroidTrajectory)
            .filter((AsteroidTrajectory.spk_id == spk_id) | (AsteroidTrajectory.asteroid_id == str(spk_id)))
            .order_by(AsteroidTrajectory.jd.asc())
            .all()
        )

    @staticmethod
    def get_all_planet_trajectories(db: Session) -> Dict[str, List[PlanetTrajectory]]:
        planets_data = db.query(PlanetTrajectory).order_by(PlanetTrajectory.jd.asc()).all()
        result: Dict[str, List[PlanetTrajectory]] = {}
        for row in planets_data:
            result.setdefault(row.planet_name, []).append(row)
        return result
