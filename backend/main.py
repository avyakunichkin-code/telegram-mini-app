from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import hashlib
import hmac
import json
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Telegram Mini App API", description="API для Telegram Mini App", version="1.0.0")

# Разрешаем CORS для GitHub Pages и локальной разработки
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
if not BOT_TOKEN:
    print("⚠️ ВНИМАНИЕ: BOT_TOKEN не установлен! Аутентификация не будет работать.")

# Хранилище данных (в реальном проекте используй БД)
messages_db: Dict[int, List[Dict]] = {}  # user_id -> list of messages
users_db: Dict[int, Dict] = {}           # user_id -> user data


def verify_telegram_auth(init_data: str) -> Optional[Dict[str, Any]]:
    """
    Проверяет подлинность данных от Telegram
    Возвращает данные пользователя или None
    """
    # 🆕 ДОБАВЬТЕ ЭТУ ОТЛАДКУ
    print(f"🔍 Verifying auth, BOT_TOKEN present: {bool(BOT_TOKEN)}")
    print(f"📦 init_data length: {len(init_data) if init_data else 0}")
    
    if not init_data or not BOT_TOKEN:
        print("❌ Missing init_data or BOT_TOKEN")
        return None
    
    try:
        # Парсим init_data
        params = {}
        for item in init_data.split('&'):
            if '=' in item:
                key, value = item.split('=', 1)
                params[key] = value
        
        received_hash = params.pop('hash', None)
        if not received_hash:
            print("No hash in init_data")
            return None
        
        # Сортируем параметры и создаём строку для проверки
        data_check_string = '\n'.join(
            f"{k}={v}" for k, v in sorted(params.items())
        )
        
        # Создаём HMAC-SHA256 подпись
        secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if computed_hash != received_hash:
            print(f"Hash mismatch: computed={computed_hash}, received={received_hash}")
            return None
        
        # Проверяем, что данные не устарели (не старше 24 часов)
        auth_date = int(params.get('auth_date', 0))
        if datetime.now().timestamp() - auth_date > 86400:
            print(f"Auth data too old: {auth_date}")
            return None
        
        # Извлекаем данные пользователя
        user_data = json.loads(params.get('user', '{}'))
        if user_data:
            # Сохраняем пользователя в БД
            user_id = user_data.get('id')
            if user_id and user_id not in users_db:
                users_db[user_id] = {
                    "id": user_id,
                    "first_name": user_data.get('first_name', ''),
                    "last_name": user_data.get('last_name', ''),
                    "username": user_data.get('username', ''),
                    "language_code": user_data.get('language_code', ''),
                    "is_premium": user_data.get('is_premium', False),
                    "created_at": datetime.now().isoformat()
                }
        
        return user_data
        
    except Exception as e:
        print(f"Auth error: {e}")
        return None


def get_user_from_auth(authorization: Optional[str]) -> Optional[Dict]:
    """Извлекает пользователя из заголовка Authorization"""
    if not authorization:
        return None
    
    if not authorization.startswith("tg:"):
        return None
    
    init_data = authorization[3:]  # Убираем "tg:"
    user_data = verify_telegram_auth(init_data)
    return user_data


# ==================== МОДЕЛИ ДАННЫХ ====================

class MessageData(BaseModel):
    message: str
    timestamp: str
    user_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    text: str
    timestamp: str
    user_id: int


class UserResponse(BaseModel):
    telegram_id: int
    name: str
    messages_count: int
    username: Optional[str] = None
    language_code: Optional[str] = None
    is_premium: bool = False


# ==================== ЭНДПОИНТЫ ====================

@app.get("/")
async def root():
    """Корневой эндпоинт с информацией об API"""
    return {
        "name": "Telegram Mini App API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "message": "/api/message (POST)",
            "messages": "/api/messages (GET)",
            "user": "/api/user/{id} (GET)",
            "users": "/api/users (GET)"
        }
    }


@app.get("/api/health")
async def health_check():
    """
    GET /api/health
    Проверка здоровья сервера
    """
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
    """
    POST /api/message
    Сохраняет сообщение от пользователя
    
    Заголовки:
        Authorization: tg:initData (строка авторизации от Telegram)
    
    Тело запроса:
        {
            "message": "текст сообщения",
            "timestamp": "2024-01-01T12:00:00.000Z",
            "user_id": 123456789 (опционально, если нет авторизации)
        }
    """
    # Проверяем аутентификацию
    user = get_user_from_auth(authorization)
    
    if user:
        user_id = user.get('id')
    elif message_data.user_id:
        user_id = message_data.user_id
    else:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Provide Authorization header or user_id"
        )
    
    # Сохраняем сообщение
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
    
    print(f"📝 Saved message from user {user_id}: {message_data.message[:50]}...")
    
    return {
        "status": "success",
        "message_id": message_id,
        "user_id": user_id,
        "timestamp": message_data.timestamp,
        "message_preview": message_data.message[:100]
    }


@app.get("/api/messages")
async def get_messages(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    GET /api/messages
    Получает ВСЕ сообщения текущего пользователя
    
    Заголовки:
        Authorization: tg:initData (обязательно)
    
    Возвращает:
        {
            "status": "success",
            "user_id": 123456789,
            "total": 10,
            "messages": [...]
        }
    """
    # Проверяем аутентификацию
    user = get_user_from_auth(authorization)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Provide valid Authorization header (tg:initData)"
        )
    
    user_id = user.get('id')
    user_messages = messages_db.get(user_id, [])
    
    # Сортируем по времени (новые сверху)
    user_messages_sorted = sorted(
        user_messages, 
        key=lambda x: x.get('timestamp', ''), 
        reverse=True
    )
    
    return {
        "status": "success",
        "user_id": user_id,
        "total": len(user_messages_sorted),
        "messages": user_messages_sorted
    }


@app.get("/api/messages/latest")
async def get_latest_messages(
    limit: int = 10,
    authorization: Optional[str] = Header(None)
):
    """
    GET /api/messages/latest?limit=10
    Получает последние N сообщений пользователя
    
    Query параметры:
        limit: количество сообщений (по умолчанию 10)
    
    Заголовки:
        Authorization: tg:initData (обязательно)
    """
    user = get_user_from_auth(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get('id')
    user_messages = messages_db.get(user_id, [])
    
    # Берём последние limit сообщений
    latest_messages = user_messages[-limit:] if user_messages else []
    latest_messages.reverse()  # Новые сверху
    
    return {
        "status": "success",
        "user_id": user_id,
        "limit": limit,
        "total": len(user_messages),
        "messages": latest_messages
    }


@app.get("/api/user/{telegram_id}")
async def get_user_data(
    telegram_id: int,
    authorization: Optional[str] = Header(None)
):
    """
    GET /api/user/{telegram_id}
    Получает данные пользователя по ID
    
    Заголовки:
        Authorization: tg:initData (обязательно, для проверки прав)
    
    Возвращает:
        {
            "telegram_id": 123456789,
            "name": "Имя",
            "messages_count": 5,
            "username": "username",
            "language_code": "ru",
            "is_premium": false
        }
    """
    # Проверяем аутентификацию
    user = get_user_from_auth(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Проверяем, что пользователь запрашивает свои данные
    if user.get('id') != telegram_id:
        raise HTTPException(status_code=403, detail="Access denied: can only access your own data")
    
    # Получаем данные из БД или создаём заглушку
    user_info = users_db.get(telegram_id, {})
    user_messages = messages_db.get(telegram_id, [])
    
    return {
        "telegram_id": telegram_id,
        "name": user_info.get('first_name', user.get('first_name', 'Unknown')),
        "username": user_info.get('username', user.get('username')),
        "language_code": user_info.get('language_code', user.get('language_code')),
        "is_premium": user_info.get('is_premium', user.get('is_premium', False)),
        "messages_count": len(user_messages),
        "registered_at": user_info.get('created_at'),
        "last_message": user_messages[-1]["timestamp"] if user_messages else None
    }


@app.get("/api/users")
async def get_all_users(authorization: Optional[str] = Header(None)):
    """
    GET /api/users
    Получает список всех пользователей (только для админов)
    """
    # Здесь можно добавить проверку на админа
    user = get_user_from_auth(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Для простоты показываем всех (в продакшене нужно ограничить)
    return {
        "status": "success",
        "total_users": len(users_db),
        "users": [
            {
                "id": uid,
                "name": data.get('first_name', 'Unknown'),
                "messages": len(messages_db.get(uid, []))
            }
            for uid, data in users_db.items()
        ]
    }


@app.delete("/api/messages/{message_id}")
async def delete_message(
    message_id: int,
    authorization: Optional[str] = Header(None)
):
    """
    DELETE /api/messages/{message_id}
    Удаляет сообщение пользователя (по ID сообщения)
    """
    user = get_user_from_auth(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get('id')
    user_messages = messages_db.get(user_id, [])
    
    # Ищем сообщение
    for i, msg in enumerate(user_messages):
        if msg.get('id') == message_id:
            deleted = user_messages.pop(i)
            messages_db[user_id] = user_messages
            return {
                "status": "success",
                "deleted_message": deleted
            }
    
    raise HTTPException(status_code=404, detail="Message not found")


# ==================== ЗАПУСК ====================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Запуск Telegram Mini App Backend...")
    print(f"📌 BOT_TOKEN: {'✅ установлен' if BOT_TOKEN else '❌ НЕ УСТАНОВЛЕН'}")
    print("📍 Сервер запущен на http://localhost:8000")
    print("\n📋 Доступные эндпоинты:")
    print("   GET    /               - информация об API")
    print("   GET    /api/health     - проверка здоровья")
    print("   POST   /api/message    - сохранить сообщение")
    print("   GET    /api/messages   - все сообщения пользователя")
    print("   GET    /api/messages/latest - последние сообщения")
    print("   GET    /api/user/{id}  - данные пользователя")
    print("   GET    /api/users      - список пользователей")
    print("   DELETE /api/messages/{id} - удалить сообщение")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)