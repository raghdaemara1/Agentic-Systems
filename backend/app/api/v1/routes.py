from fastapi import APIRouter

from app.api.v1.agent import router as agent_router
from app.api.v1.documents import router as documents_router

router = APIRouter(prefix="/api/v1")

router.include_router(agent_router, prefix="/agent", tags=["agent"])
router.include_router(documents_router, prefix="/documents", tags=["documents"])

