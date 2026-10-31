import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Liveness: без тяжёлых COUNT — для Render health check.

    Мёртвая БД → 503: балансировщик смотрит на код, а не на тело (PR-05).
    Текст исключения (хост, DSN) наружу не отдаём — только в лог.
    """
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("health check: database unavailable")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "timestamp": datetime.now().isoformat(),
                "database": "unavailable",
            },
        )
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
    }
