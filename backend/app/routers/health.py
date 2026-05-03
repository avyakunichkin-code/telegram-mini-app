from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import User, Message, Liability, Asset

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Проверка здоровья сервера — не требует авторизации"""
    try:
        user_count = db.query(User).count()
        message_count = db.query(Message).count()
        liabilities_count = db.query(Liability).count()
        assets_count = db.query(Asset).count()
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "users": user_count,
            "messages": message_count,
            "liabilities": liabilities_count,
            "assets": assets_count
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}