from fastapi import APIRouter
from app.api.endpoints import asteroids, planets, sentry, hazardous, trajectory, health

api_router = APIRouter()

api_router.include_router(asteroids.router, prefix="/asteroids", tags=["Asteroids"])
api_router.include_router(planets.router, prefix="/planets", tags=["Planets"])
api_router.include_router(sentry.router, prefix="/sentry", tags=["Sentry"])
api_router.include_router(hazardous.router, prefix="/hazardous", tags=["Hazardous"])
api_router.include_router(trajectory.router, prefix="/trajectory", tags=["Trajectory"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
