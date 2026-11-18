"""
Подключение к БД: engine, сессия на единицу работы, зависимость FastAPI, ping.

SQLite в памяти (`sqlite://`, тесты) — одно соединение на процесс (`StaticPool`), иначе
TestClient в другом потоке видит пустую БД. Postgres — драйвер psycopg 3, `pool_pre_ping` от обрывов.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


def normalize_url(url: str) -> str:
    if url.startswith("postgres://"):  # формат Render/Heroku
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


def make_engine(url: str) -> Engine:
    url = normalize_url(url)
    if url.startswith("sqlite"):
        kwargs: dict = {"connect_args": {"check_same_thread": False}}
        if url in ("sqlite://", "sqlite:///:memory:"):
            kwargs["poolclass"] = StaticPool
        return create_engine(url, **kwargs)
    return create_engine(url, pool_pre_ping=True)


class Database:
    def __init__(self, url: str):
        self.engine = make_engine(url)
        self._sessions = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)

    @contextmanager
    def session(self) -> Iterator[Session]:
        """Commit при успехе, rollback при исключении."""
        s = self._sessions()
        try:
            yield s
            s.commit()
        except BaseException:
            s.rollback()
            raise
        finally:
            s.close()

    def get_session(self) -> Iterator[Session]:
        """Зависимость FastAPI: `Depends(db.get_session)`."""
        with self.session() as s:
            yield s

    def ping(self) -> bool:
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
