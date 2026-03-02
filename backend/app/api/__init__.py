from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.hub import router as hub_router
from app.api.sso import router as sso_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(sso_router)
api_router.include_router(hub_router)
