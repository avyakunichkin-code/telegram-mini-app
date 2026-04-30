from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import hashlib
import hmac
import json
from datetime import datetime
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Telegram Mini App API", description="API для Telegram Mini App", version="1.0.0")

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://avyakunichkin-code.github.io",
        "https://*.github.io",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")

# Хранилище данных
messages_db: Dict[int, List[Dict]] = {}
users_db: Dict[int, Dict] = {}

# ==================== МОДЕЛИ ====================

class MessageData(BaseModel):
    message: str
    timestamp: str
    user_id: Optional[int] = None

# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def get_user_id_from_request(authorization: Optional[str] = None, user_id_param: Optional[int] = None) -> Optional[int]:
    """
    Упрощённое получение user_id.
    Сначала пытается из авторизации, потом из параметра, потом берёт тестовый ID.
    """
    # Пытаемся извлечь из заголовка Authorization (упрощённо)
    if authorization and authorization.startswith("tg:"):
        try:
            init_data = authorization[3:]
            params = {}
            for item in init_data.split('&'):
                if '=' in item:
                    key, value = item.split('=', 1)
                    params[key] = value
            
            user_param = params.get('user', '')
            if user_param:
                user_decoded = urllib.parse.unquote(user_param)
                user_data = json.loads(user_decoded)
                user_id = user_data.get('id')
                if user_id:
                    return user_id
        except:
            pass
    
    # Если передан параметр user_id
    if user_id_param:
        return user_id_param
    
    # Тестовый ID (твой Telegram ID)
    return 247028870

# ==================== ЭНДПОИНТЫ ====================

@app.get("/")
async def root():
    return {
        "name": "Telegram Mini App API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "message": "/api/message (POST)",
            "messages": "/api/messages (GET)",
            "user": "/api/user/{id} (GET)",
        }
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "bot_token_configured": bool(BOT_TOKEN),
        "users_count": len(users_db),
        "messages_count": sum(len(msgs) for msgs in messages_db.values())
    }


@app.post("/api/message")
async def save_message(
    message_data: MessageData,
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Сохраняет сообщение от пользователя"""
    # Получаем ID пользователя
    user_id = get_user_id_from_request(authorization, message_data.user_id)
    
    print(f"📝 Сохраняем сообщение от user_id: {user_id}")
    print(f"📝 Текст: {message_data.message[:50]}...")
    
    # Инициализируем хранилище для пользователя если нужно
    if user_id not in messages_db:
        messages_db[user_id] = []
    
    message_id = len(messages_db[user_id])
    new_message = {
        "id": message_id,
        "text": message_data.message,
        "timestamp": message_data.timestamp,
        "user_id": user_id
    }
    messages_db[user_id].append(new_message)
    
    # Создаём пользователя если его нет
    if user_id not in users_db:
        users_db[user_id] = {
            "id": user_id,
            "first_name": "User",
            "created_at": datetime.now().isoformat()
        }
    
    return {
        "status": "success",
        "message_id": message_id,
        "user_id": user_id,
        "timestamp": message_data.timestamp
    }


@app.get("/api/messages")
async def get_messages(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """Получает все сообщения пользователя"""
    user_id = get_user_id_from_request(authorization)
    
    print(f"📋 Загружаем сообщения для user_id: {user_id}")
    
    user_messages = messages_db.get(user_id, [])
    # Сортируем от новых к старым
    user_messages_sorted = sorted(user_messages, key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return {
        "status": "success",
        "user_id": user_id,
        "total": len(user_messages_sorted),
        "messages": user_messages_sorted
    }


@app.get("/api/user/{telegram_id}")
async def get_user_data(
    telegram_id: int,
    authorization: Optional[str] = Header(None)
):
    """Получает данные пользователя"""
    # Проверяем, что запрашивает свои данные
    request_user_id = get_user_id_from_request(authorization)
    
    print(f"👤 Запрос профиля: requested={telegram_id}, auth_user={request_user_id}")
    
    # Если ID не совпадают, но это тестовый режим — разрешаем
    if telegram_id != request_user_id and request_user_id != 247028870:
        # Не совпадает — пробуем взять из запроса
        pass
    
    # Создаём пользователя если его нет
    if telegram_id not in users_db:
        users_db[telegram_id] = {
            "id": telegram_id,
            "first_name": "User",
            "username": None,
            "language_code": "ru",
            "is_premium": False,
            "created_at": datetime.now().isoformat()
        }
    
    user_info = users_db.get(telegram_id, {})
    user_messages = messages_db.get(telegram_id, [])
    
    return {
        "telegram_id": telegram_id,
        "name": user_info.get('first_name', 'User'),
        "username": user_info.get('username'),
        "language_code": user_info.get('language_code', 'ru'),
        "is_premium": user_info.get('is_premium', False),
        "messages_count": len(user_messages),
        "registered_at": user_info.get('created_at')
    }


@app.get("/api/messages/latest")
async def get_latest_messages(
    limit: int = 10,
    authorization: Optional[str] = Header(None)
):
    """Получает последние N сообщений"""
    user_id = get_user_id_from_request(authorization)
    user_messages = messages_db.get(user_id, [])
    
    latest_messages = user_messages[-limit:] if user_messages else []
    latest_messages.reverse()
    
    return {
        "status": "success",
        "user_id": user_id,
        "limit": limit,
        "total": len(user_messages),
        "messages": latest_messages
    }


@app.delete("/api/messages/{message_id}")
async def delete_message(
    message_id: int,
    authorization: Optional[str] = Header(None)
):
    """Удаляет сообщение"""
    user_id = get_user_id_from_request(authorization)
    user_messages = messages_db.get(user_id, [])
    
    for i, msg in enumerate(user_messages):
        if msg.get('id') == message_id:
            deleted = user_messages.pop(i)
            messages_db[user_id] = user_messages
            return {"status": "success", "deleted_message": deleted}
    
    raise HTTPException(status_code=404, detail="Message not found")


# ==================== ЗАПУСК ====================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Запуск Telegram Mini App Backend...")
    print(f"📌 BOT_TOKEN: {'✅ установлен' if BOT_TOKEN else '❌ НЕ УСТАНОВЛЕН'}")
    print("📍 Сервер запущен")
    print("\n✨ Авторизация ВРЕМЕННО ОТКЛЮЧЕНА — используется тестовый user_id=247028870")
    
    uvicorn.run(app, host="0.0.0.0", port=10000)