from datetime import datetime, timedelta, timezone

import jwt
import pytest

from tvoy_platform.tokens import ALGORITHM, InvalidToken, TokenIssuer, secret_from_env

SECRET = "s" * 32
PLAN = TokenIssuer(secret=SECRET, issuer="plan", audience="plan-web")


def test_round_trip_keeps_sub_and_claims():
    claims = PLAN.verify(PLAN.issue("u_1", sid="abc"))
    assert claims["sub"] == "u_1" and claims["iss"] == "plan" and claims["aud"] == "plan-web" and claims["sid"] == "abc"


def test_other_issuer_rejected_even_with_same_secret():
    game = TokenIssuer(secret=SECRET, issuer="game", audience="game-web")
    with pytest.raises(InvalidToken):
        PLAN.verify(game.issue("1"))


def test_token_without_iss_rejected():
    """Токен игры сейчас — без iss/aud (backend/app/auth.py): Plan его не примет."""
    legacy = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(days=1)}, SECRET, algorithm=ALGORITHM)
    with pytest.raises(InvalidToken):
        PLAN.verify(legacy)


def test_expired_and_foreign_signature_rejected():
    old = PLAN.issue("u_1", now=datetime.now(timezone.utc) - timedelta(days=30))
    with pytest.raises(InvalidToken):
        PLAN.verify(old)
    other = TokenIssuer(secret="x" * 32, issuer="plan", audience="plan-web")
    with pytest.raises(InvalidToken):
        PLAN.verify(other.issue("u_1"))


def test_alg_none_rejected():
    forged = jwt.encode({"sub": "u_1", "iss": "plan", "aud": "plan-web", "exp": 2_000_000_000}, None, algorithm="none")
    with pytest.raises(InvalidToken):
        PLAN.verify(forged)


def test_short_secret_and_missing_iss_fail_fast():
    with pytest.raises(ValueError):
        TokenIssuer(secret="short", issuer="plan", audience="plan-web")
    with pytest.raises(ValueError):
        TokenIssuer(secret=SECRET, issuer="", audience="plan-web")


def test_secret_from_env(monkeypatch):
    monkeypatch.delenv("X_SECRET", raising=False)
    assert secret_from_env("X_SECRET", production=False, dev_fallback="dev") == "dev"
    with pytest.raises(RuntimeError):
        secret_from_env("X_SECRET", production=True, dev_fallback="dev")
    monkeypatch.setenv("X_SECRET", "change-me")
    with pytest.raises(RuntimeError):
        secret_from_env("X_SECRET", production=True, dev_fallback="dev")
    monkeypatch.setenv("X_SECRET", "real-secret")
    assert secret_from_env("X_SECRET", production=True, dev_fallback="dev") == "real-secret"
