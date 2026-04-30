import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней
    
    @classmethod
    def get_database_url(cls) -> str:
        url = cls.DATABASE_URL
        if not url:
            print("⚠️ DATABASE_URL не установлен, использую SQLite")
            return "sqlite:///./test.db"
        
        # Для PostgreSQL на Render
        if "render.com" in url and "?" not in url:
            url += "?sslmode=require"
        return url

config = Config()