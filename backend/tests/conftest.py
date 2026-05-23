"""Фикстуры API-тестов: SQLite in-memory, TestClient, пользователь с JWT."""

from __future__ import annotations

import json
import os
import tempfile
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("SECRET_KEY", "test-secret-key")

import app.models  # noqa: F401

from app.auth import create_access_token, get_current_user, get_password_hash  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.models import GameStarterTemplate, User  # noqa: E402
from app.victory_seeds import victory_config_json_for_template  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def db_engine():
    # Файловый SQLite — одна БД видна из thread pool TestClient (in-memory :memory: — нет).
    db_path = os.path.join(tempfile.gettempdir(), f"money_quest_pytest_{uuid.uuid4().hex}.db")
    url = f"sqlite:///{db_path}"
    engine = create_engine(url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
        engine.dispose()
        try:
            os.remove(db_path)
        except OSError:
            pass


@pytest.fixture()
def db_session(db_engine):
    session = sessionmaker(bind=db_engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def test_user(db_session):
    user = User(
        username="pytest_user",
        hashed_password=get_password_hash("secret"),
        email="pytest@example.com",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_headers(test_user):
    token = create_access_token({"sub": test_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_env(test_user, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", str(test_user.id))
    from app.config import config

    config.ADMIN_USER_IDS = {test_user.id}
    monkeypatch.delenv("OPS_TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("OPS_TELEGRAM_CHAT_ID", raising=False)
    from app import config as config_module

    config_module.config.OPS_TELEGRAM_BOT_TOKEN = ""
    config_module.config.OPS_TELEGRAM_CHAT_ID = ""
    yield test_user


@pytest.fixture()
def seed_basic_template(db_session):
    db_session.add(
        GameStarterTemplate(
            template_key="mq_game_basic_v1",
            title="Базовый старт",
            difficulty_rank=1,
            base_monthly_lifestyle_expense=25000.0,
            blueprint_json=json.dumps(
                {
                    "period_duration_seconds": 300,
                    "cash_balance": 15000,
                    "monthly_salary": 50000,
                    "assets": [],
                    "liabilities": [],
                },
                ensure_ascii=False,
            ),
            victory_config_json=victory_config_json_for_template("mq_game_basic_v1"),
            is_active=1,
            sort_order=10,
        )
    )
    db_session.add(
        GameStarterTemplate(
            template_key="mq_plan_basic_v1",
            title="Plan: basic",
            difficulty_rank=1,
            base_monthly_lifestyle_expense=40000.0,
            blueprint_json=json.dumps(
                {
                    "period_duration_seconds": 300,
                    "cash_balance": 50000,
                    "monthly_salary": 80000,
                    "assets": [],
                    "liabilities": [],
                }
            ),
            victory_config_json="{}",
            is_active=1,
            sort_order=15,
            applies_to_save_kind="plan",
        )
    )
    db_session.commit()


@pytest.fixture()
def client(db_session, test_user, seed_basic_template):
    """Override DB и auth: sync get_current_user в thread pool не делит сессию SQLite."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
