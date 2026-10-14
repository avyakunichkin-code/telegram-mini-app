from datetime import datetime, timedelta, timezone
import hashlib
import hmac
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from .config import config
from .database import get_db
from .models import User

security = HTTPBearer(auto_error=False)  # ← auto_error=False — не выдавать ошибку автоматически


# argon2id с параметрами argon2-cffi по умолчанию (RFC 9106, профиль low-memory).
_password_hasher = PasswordHasher()


def get_password_hash(password: str) -> str:
    """Хеш пароля argon2id. Формат PHC: "$argon2id$v=19$m=...,t=...,p=...$salt$hash"."""
    return _password_hasher.hash(password)


def _is_legacy_hash(hashed_password: str) -> bool:
    """Старый формат до argon2: "salt:sha256(password + salt)" (hex)."""
    return not hashed_password.startswith("$") and hashed_password.count(":") == 1


def _verify_legacy(plain_password: str, hashed_password: str) -> bool:
    salt, stored_hash = hashed_password.split(":")
    computed = hashlib.sha256((plain_password + salt).encode()).hexdigest()
    return hmac.compare_digest(computed.encode(), stored_hash.encode())


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Проверка пароля: argon2id или legacy "salt:sha256". Битый/пустой хеш → False."""
    if not isinstance(plain_password, str) or not isinstance(hashed_password, str) or not hashed_password:
        return False
    if _is_legacy_hash(hashed_password):
        return _verify_legacy(plain_password, hashed_password)
    try:
        return _password_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def password_needs_rehash(hashed_password: str) -> bool:
    """True для legacy-хеша и для argon2 с устаревшими параметрами — перехешировать при входе."""
    if _is_legacy_hash(hashed_password):
        return True
    try:
        return _password_hasher.check_needs_rehash(hashed_password)
    except InvalidHashError:
        return True


def create_access_token(data: dict) -> str:
    """Создание JWT токена"""
    to_encode = data.copy()
    if "sub" in to_encode:
        # JWT subject обычно строка; так избегаем проблем несовместимости по типам.
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
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
    except InvalidTokenError:
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