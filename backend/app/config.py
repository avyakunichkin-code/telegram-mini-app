import os
from dotenv import load_dotenv

load_dotenv()

# Публичный URL Mini App (GitHub Pages + HashRouter). Переопределяется через env.
DEFAULT_PUBLIC_APP_URL = "https://avyakunichkin-code.github.io/telegram-mini-app/#"
DEFAULT_LOCAL_APP_URL = "http://localhost:5173/telegram-mini-app/#"


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


def _resolve_admin_web_base_url() -> str:
    """
    Ссылки в ops-уведомлениях Telegram.
    Приоритет: ADMIN_WEB_BASE_URL → PUBLIC_APP_URL → Render (prod) → localhost.
    """
    for key in ("ADMIN_WEB_BASE_URL", "PUBLIC_APP_URL"):
        raw = os.getenv(key, "").strip()
        if raw:
            return raw.rstrip("/")
    database_url = os.getenv("DATABASE_URL", "")
    if "render.com" in database_url:
        return DEFAULT_PUBLIC_APP_URL.rstrip("/")
    return DEFAULT_LOCAL_APP_URL.rstrip("/")


class Config:
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

    # A0 Watchtower (MVP 1.2)
    ADMIN_USER_IDS = _parse_int_set(os.getenv("ADMIN_USER_IDS", ""))
    OPS_TELEGRAM_BOT_TOKEN = os.getenv("OPS_TELEGRAM_BOT_TOKEN", "").strip()
    OPS_TELEGRAM_CHAT_ID = os.getenv("OPS_TELEGRAM_CHAT_ID", "").strip()
    ADMIN_WEB_BASE_URL = _resolve_admin_web_base_url()
    
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