from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import config
from .database import get_db
from .models import User

security = HTTPBearer(auto_error=False)  # ← auto_error=False — не выдавать ошибку автоматически


def get_password_hash(password: str) -> str:
    """Хеширование пароля с солью. Формат: "salt:hash" """
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((password + salt).encode())
    return f"{salt}:{hash_obj.hexdigest()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    try:
        salt, stored_hash = hashed_password.split(":")
        hash_obj = hashlib.sha256((plain_password + salt).encode())
        return hash_obj.hexdigest() == stored_hash
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    """Создание JWT токена"""
    to_encode = data.copy()
    if "sub" in to_encode:
        # JWT subject обычно строка; так избегаем проблем несовместимости по типам.
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return encoded_jwt


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Получение пользователя из токена (опционально)"""
    if not credentials:
        return None
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub)
    except JWTError:
        return None
    except (TypeError, ValueError):
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Получение пользователя из токена (обязательно)"""
    user = get_current_user_optional(credentials, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user