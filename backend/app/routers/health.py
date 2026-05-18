from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, GameProfile, FinanceLiability, FinanceAsset, EventDefinition

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Проверка здоровья сервера — не требует авторизации."""
    try:
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "users": db.query(User).count(),
            "game_profiles": db.query(GameProfile).count(),
            "finance_liabilities": db.query(FinanceLiability).count(),
            "finance_assets": db.query(FinanceAsset).count(),
            "event_definitions": db.query(EventDefinition).count(),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
