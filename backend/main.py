from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import hashlib
import hmac
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Разрешаем запросы с твоего фронтенда (GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://твой-username.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Твой токен от BotFather
BOT_TOKEN = os.getenv("BOT_TOKEN")

class UserData(BaseModel):
    message: str
    timestamp: str

def verify_telegram_auth(init_data: str) -> dict:
    """
    Проверяет, что данные пришли от реального пользователя Telegram
    Использует алгоритм проверки подписи Telegram[citation:8]
    """
    try:
        # Парсим init_data
        params = {}
        for item in init_data.split('&'):
            key, value = item.split('=', 1)
            params[key] = value
        
        # Извлекаем hash (подпись)
        received_hash = params.pop('hash', None)
        if not received_hash:
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
        
        # Сравниваем подписи
        if computed_hash != received_hash:
            return None
        
        # Проверяем, что данные не устарели (не старше 24 часов)
        auth_date = int(params.get('auth_date', 0))
        if datetime.now().timestamp() - auth_date > 86400:
            return None
        
        # Возвращаем данные пользователя
        user_data = json.loads(params.get('user', '{}'))
        return user_data
        
    except Exception as e:
        print(f"Auth error: {e}")
        return None

@app.get("/api/health")
async def health_check():
    """Проверка, что бэкенд работает"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/api/message")
async def save_message(
    request: Request, 
    user_data: UserData,
    authorization: Optional[str] = Header(None)
):
    """
    Сохраняет сообщение от пользователя после проверки аутентификации
    """
    if not authorization or not authorization.startswith("tg:"):
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    # Извлекаем initData из заголовка
    init_data = authorization[3:]  # убираем "tg:"
    
    # Проверяем подлинность пользователя
    user = verify_telegram_auth(init_data)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid authentication")
    
    # Здесь можно сохранить сообщение в базу данных
    print(f"📝 Пользователь {user.get('first_name')} (id: {user.get('id')}) написал: {user_data.message}")
    
    return {
        "status": "success",
        "user": user,
        "received": user_data.message,
        "timestamp": user_data.timestamp
    }

@app.get("/api/user/{telegram_id}")
async def get_user_data(telegram_id: int, authorization: Optional[str] = Header(None)):
    """Получает данные пользователя"""
    if not authorization or not authorization.startswith("tg:"):
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    init_data = authorization[3:]
    user = verify_telegram_auth(init_data)
    
    if not user or user.get('id') != telegram_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Здесь можно получить данные из БД
    return {
        "telegram_id": telegram_id,
        "name": user.get('first_name'),
        "messages_count": 0  # заглушка, пока нет БД
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)