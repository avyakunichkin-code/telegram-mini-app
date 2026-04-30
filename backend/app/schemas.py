from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# Auth
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


# Messages
class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    id: int
    text: str
    timestamp: datetime
    username: str


# User
class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    messages_count: int
    created_at: datetime