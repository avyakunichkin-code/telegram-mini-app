from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Аутентификация
from passlib.context import CryptContext
from jose import JWTError, jwt

# PostgreSQL
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

load_dotenv()

app = FastAPI(title="Telegram Mini App API", version="2.0.0")

# CORS
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

# ==================== КОНФИГУРАЦИЯ ====================

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-me-123456789")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

# Хеширование паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# ==================== ПОДКЛЮЧЕНИЕ К БАЗЕ ====================

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")

# Для Render Internal URL нужно добавить ?sslmode=require
if "render.com" in DATABASE_URL and "?" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==================== МОДЕЛИ БАЗЫ ДАННЫХ ====================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    telegram_id = Column(Integer, unique=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связи
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Связи
    user = relationship("User", back_populates="messages")

# Создаём таблицы
Base.metadata.create_all(bind=engine)

# ==================== МОДЕЛИ PYDANTIC ====================

class UserRegister(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    telegram_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str

class MessageCreate(BaseModel):
    text: str

class MessageResponse(BaseModel):
    id: int
    text: str
    timestamp: datetime
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    messages_count: int
    created_at: datetime

# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def get_db():
    """Получение сессии БД"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Получение текущего пользователя по JWT токену"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ==================== ЭНДПОИНТЫ ====================

@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """Проверка здоровья"""
    user_count = db.query(User).count()
    message_count = db.query(Message).count()
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
        "users": user_count,
        "messages": message_count
    }

@app.post("/api/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверяем, существует ли пользователь
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Создаём пользователя
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        telegram_id=user_data.telegram_id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Создаём токен
    access_token = create_access_token(data={"sub": new_user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "username": new_user.username
    }

@app.post("/api/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Вход в систему"""
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/api/messages")
async def create_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового сообщения"""
    new_message = Message(
        text=message.text,
        user_id=current_user.id,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return {
        "id": new_message.id,
        "text": new_message.text,
        "timestamp": new_message.timestamp,
        "user_id": current_user.id,
        "username": current_user.username
    }

@app.get("/api/messages", response_model=List[MessageResponse])
async def get_messages(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сообщений текущего пользователя"""
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

@app.get("/api/user/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получение профиля текущего пользователя"""
    messages_count = db.query(Message).filter(Message.user_id == current_user.id).count()
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        messages_count=messages_count,
        created_at=current_user.created_at
    )

@app.delete("/api/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление сообщения"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    
    return {"status": "success", "deleted_id": message_id}

# ==================== ЗАПУСК ====================

if __name__ == "__main__":
    import uvicorn
    print("🚀 Запуск Telegram Mini App Backend с PostgreSQL...")
    print(f"📌 База данных: {DATABASE_URL[:50]}...")
    uvicorn.run(app, host="0.0.0.0", port=10000)