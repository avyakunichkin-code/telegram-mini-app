import os
from dotenv import load_dotenv

load_dotenv()

def _parse_int_set(raw: str) -> set[int]:
    out: set[int] = set()
    for part in (raw or "").split(","):
        part = part.strip()
        if not part:
            continue
        try:
            out.add(int(part))
        except ValueError:
            continue
    return out


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

    # A0 Watchtower (MVP 1.2)
    ADMIN_USER_IDS = _parse_int_set(os.getenv("ADMIN_USER_IDS", ""))
    OPS_TELEGRAM_BOT_TOKEN = os.getenv("OPS_TELEGRAM_BOT_TOKEN", "").strip()
    OPS_TELEGRAM_CHAT_ID = os.getenv("OPS_TELEGRAM_CHAT_ID", "").strip()
    ADMIN_WEB_BASE_URL = os.getenv(
        "ADMIN_WEB_BASE_URL",
        "http://localhost:5173/telegram-mini-app/#",
    ).rstrip("/")
    
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