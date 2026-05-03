from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Message
from ..schemas import MessageCreate, MessageResponse
from ..auth import get_current_user  # ← обязательно для защищённых эндпоинтов

router = APIRouter(prefix="/api", tags=["messages"])


@router.post("/messages", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,
    current_user = Depends(get_current_user),  # ← требует авторизацию
    db: Session = Depends(get_db)
):
    """Создание нового сообщения — ТРЕБУЕТ авторизацию"""
    new_message = Message(
        text=message.text,
        user_id=current_user.id,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return MessageResponse(
        id=new_message.id,
        text=new_message.text,
        timestamp=new_message.timestamp,
        username=current_user.username
    )


@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    limit: int = 50,
    current_user = Depends(get_current_user),  # ← требует авторизацию
    db: Session = Depends(get_db)
):
    """Получение сообщений — ТРЕБУЕТ авторизацию"""
    messages = db.query(Message).filter(
        Message.user_id == current_user.id
    ).order_by(Message.timestamp.desc()).limit(limit).all()
    
    return [
        MessageResponse(
            id=m.id,
            text=m.text,
            timestamp=m.timestamp,
            username=current_user.username
        )
        for m in messages
    ]


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user = Depends(get_current_user),  # ← требует авторизацию
    db: Session = Depends(get_db)
):
    """Удаление сообщения — ТРЕБУЕТ авторизацию"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    
    return {"status": "success", "deleted_id": message_id}