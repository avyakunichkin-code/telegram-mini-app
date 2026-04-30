from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User, Message

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        user_count = db.query(User).count()
        message_count = db.query(Message).count()
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "users": user_count,
            "messages": message_count
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}