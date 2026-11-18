"""Хеширование паролей: argon2id для новых, legacy "salt:sha256" читается и перехешируется при входе."""

from __future__ import annotations

import hashlib

import pytest

from app.auth import get_password_hash, password_needs_rehash, verify_password
from app.models import User


def _legacy_hash(password: str, salt: str = "a1b2c3d4e5f60718293a4b5c6d7e8f90") -> str:
    """Старый формат до argon2: один проход sha256(password + salt), "salt:hexdigest"."""
    return f"{salt}:{hashlib.sha256((password + salt).encode()).hexdigest()}"


def test_new_hash_is_argon2id_with_random_salt():
    first = get_password_hash("secret12")
    second = get_password_hash("secret12")
    assert first.startswith("$argon2id$")
    assert first != second
    assert verify_password("secret12", first)
    assert not password_needs_rehash(first)


def test_wrong_password_rejected_for_argon2():
    assert not verify_password("secret13", get_password_hash("secret12"))


def test_legacy_hash_verifies_and_needs_rehash():
    legacy = _legacy_hash("secret12")
    assert verify_password("secret12", legacy)
    assert not verify_password("secret13", legacy)
    assert password_needs_rehash(legacy)


@pytest.mark.parametrize(
    "stored",
    [
        "",
        None,
        ":",
        "nocolon",
        "a:b:c",
        "salt:not-hex",
        "$argon2id$garbage",
        "$argon2id$v=19$m=65536,t=3,p=4$AAAA$BBBB",
        "x",
    ],
)
def test_broken_stored_hash_never_verifies(stored):
    assert verify_password("secret12", stored) is False
    assert verify_password("", stored) is False


def test_empty_password_does_not_match_nonempty():
    assert not verify_password("", get_password_hash("secret12"))
    assert not verify_password("", _legacy_hash("secret12"))


def test_non_str_password_rejected():
    assert verify_password(None, get_password_hash("secret12")) is False  # type: ignore[arg-type]


def test_legacy_verify_uses_constant_time_compare(monkeypatch):
    calls = []
    import hmac

    real = hmac.compare_digest

    def spy(a, b):
        calls.append((a, b))
        return real(a, b)

    monkeypatch.setattr("app.auth.hmac.compare_digest", spy)
    assert verify_password("secret12", _legacy_hash("secret12"))
    assert calls, "legacy hash must be compared with hmac.compare_digest"


def _add_user(db_session, username: str, hashed: str) -> User:
    user = User(username=username, email=f"{username}@example.com", hashed_password=hashed)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_login_with_legacy_hash_rehashes_to_argon2(client, db_session):
    user = _add_user(db_session, "legacy_user", _legacy_hash("secret12"))

    resp = client.post("/api/login", json={"username": "legacy_user", "password": "secret12"})
    assert resp.status_code == 200

    db_session.refresh(user)
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password("secret12", user.hashed_password)

    # Повторный вход по новому хешу тоже работает.
    again = client.post("/api/login", json={"username": "legacy_user", "password": "secret12"})
    assert again.status_code == 200


def test_login_wrong_password_keeps_legacy_hash(client, db_session):
    legacy = _legacy_hash("secret12")
    user = _add_user(db_session, "legacy_wrong", legacy)

    resp = client.post("/api/login", json={"username": "legacy_wrong", "password": "nope1234"})
    assert resp.status_code == 401

    db_session.refresh(user)
    assert user.hashed_password == legacy


def test_login_with_argon2_hash_does_not_rewrite(client, db_session):
    stored = get_password_hash("secret12")
    user = _add_user(db_session, "argon_user", stored)

    resp = client.post("/api/login", json={"username": "argon_user", "password": "secret12"})
    assert resp.status_code == 200

    db_session.refresh(user)
    assert user.hashed_password == stored
