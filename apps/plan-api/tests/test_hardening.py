"""Защита перед реальными пользователями: настройки, IP за прокси, версии документа, гонки."""
import logging
import random
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from plan_api import documents, settings as settings_module
from plan_api.analytics import CONSENT_VERSION
from plan_api.main import create_app
from plan_api.mailer import LogMailer
from plan_api.repo import CheckupChanged, Repo
from plan_api.schemas import Checkup, IncomeRow, Range
from plan_api.settings import Settings

POSTGRES = "postgresql://u:p@db/plan"


def configure(monkeypatch, **env):
    for key in ("PLAN_ENV", "PLAN_DATABASE_URL", "PLAN_SECRET_KEY", "PLAN_TRUSTED_PROXIES"):
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)


def test_forgotten_env_on_postgres_refuses_to_start(monkeypatch):
    configure(monkeypatch, PLAN_DATABASE_URL=POSTGRES)
    with pytest.raises(RuntimeError, match="только с SQLite"):
        Settings.from_env()


def test_unknown_env_refuses_to_start(monkeypatch):
    configure(monkeypatch, PLAN_ENV="prod")
    with pytest.raises(RuntimeError, match="неизвестное"):
        Settings.from_env()


def test_dev_code_only_on_local_sqlite():
    assert Settings(database_url="sqlite://").expose_dev_code
    assert not Settings(database_url=POSTGRES).expose_dev_code


@pytest.fixture()
def production_env(monkeypatch):
    configure(monkeypatch, PLAN_ENV="production", PLAN_DATABASE_URL=POSTGRES, PLAN_SECRET_KEY="s" * 40)
    monkeypatch.setattr(settings_module, "CONSENT_VERSION", "2026-11-approved")


def test_production_requires_explicit_proxy_count(production_env):
    with pytest.raises(RuntimeError, match="PLAN_TRUSTED_PROXIES"):
        Settings.from_env()


def test_production_accepts_zero_proxies(production_env, monkeypatch):
    monkeypatch.setenv("PLAN_TRUSTED_PROXIES", "0")
    assert Settings.from_env().trusted_proxies == 0


def test_production_blocked_until_consent_text_approved(production_env, monkeypatch):
    monkeypatch.setenv("PLAN_TRUSTED_PROXIES", "1")
    monkeypatch.setattr(settings_module, "CONSENT_VERSION", "2026-10-proto")
    with pytest.raises(RuntimeError, match="согласия"):
        Settings.from_env()


def test_production_mailer_never_logs_code(caplog):
    with caplog.at_level(logging.INFO, logger="plan_api.mail"):
        LogMailer(log_code=False).send_code("user@example.com", "123456")
    assert "123456" not in caplog.text


def test_ip_limit_uses_client_behind_proxy():
    settings = Settings(database_url="sqlite://", trusted_proxies=1, codes_per_ip=1)
    client = TestClient(create_app(settings))

    def ask(email, forwarded):
        return client.post("/api/auth/email/request-code", json={"email": email}, headers={"X-Forwarded-For": forwarded}).status_code

    assert ask("a@example.com", "1.1.1.1") == 200
    assert ask("b@example.com", "2.2.2.2") == 200  # другой клиент за тем же прокси
    assert ask("c@example.com", "9.9.9.9, 1.1.1.1") == 429  # подделанная левая часть не помогает


@pytest.fixture()
def app():
    return create_app(Settings(database_url="sqlite://"))


@pytest.fixture()
def owner(app):
    with app.state.db.session() as s:
        return Repo(s).create_user("owner@example.com", CONSENT_VERSION, "ip")


def draft(checkup_id="ck_1"):
    return Checkup(id=checkup_id, entry_question="overview", as_of="2026-11")


def test_stale_save_does_not_overwrite_newer_draft(app, owner):
    with app.state.db.session() as s:
        Repo(s).insert_checkup(owner, draft())
    with app.state.db.session() as s:
        repo = Repo(s)
        first, stale = repo.checkup(owner, "ck_1"), repo.checkup(owner, "ck_1")
        first.data.incomes = [IncomeRow(member_id="m_me", kind="salary", amount=Range.exact(1000))]
        repo.save_draft(owner, first)
        with pytest.raises(CheckupChanged):
            repo.save_draft(owner, stale)
        assert len(repo.checkup(owner, "ck_1").data.incomes) == 1


def test_second_draft_is_rejected(app, owner):
    with pytest.raises(CheckupChanged):
        with app.state.db.session() as s:
            repo = Repo(s)
            repo.insert_checkup(owner, draft("ck_1"))
            repo.insert_checkup(owner, draft("ck_2"))


def test_conflict_reaches_client_as_409(app, monkeypatch):
    client = TestClient(app)
    code = client.post("/api/auth/email/request-code", json={"email": "h@example.com"}).json()["dev_code"]
    token = client.post("/api/auth/email/verify", json={"email": "h@example.com", "code": code, "consent_version": CONSENT_VERSION}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    checkup = client.post("/api/checkups", json={"entry_question": "overview"}, headers=headers).json()
    assert "revision" not in checkup

    def conflict(*_args):
        raise CheckupChanged

    monkeypatch.setattr(Repo, "save_draft", conflict)
    response = client.put(f"/api/checkups/{checkup['id']}/sections/goals", json=[], headers=headers)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "checkup_changed"


def test_old_document_is_upcast_on_read(monkeypatch):
    monkeypatch.setattr(documents, "CURRENT_SCHEMA_VERSION", 2)
    monkeypatch.setattr(documents, "UPCASTERS", {1: lambda doc: {**doc, "goals": []}})
    assert documents.load_checkup_data('{"goals": null}', 1).goals == []


def test_document_from_newer_code_is_rejected():
    with pytest.raises(ValueError, match="новее"):
        documents.load_checkup_data("{}", documents.CURRENT_SCHEMA_VERSION + 1)


def test_money_survives_json_float_to_the_kopeck():
    rng = random.Random(42)
    values = [Decimal("0.01"), Decimal("0.10"), Decimal("999999999999.99")]
    values += [Decimal(rng.randrange(1, 10**14)) / 100 for _ in range(20_000)]
    for value in values:
        assert Decimal(repr(float(value))).quantize(Decimal("0.01")) == value
