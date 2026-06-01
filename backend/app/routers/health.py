from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Liveness: без тяжёлых COUNT — для Render health check."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
