"""Регистрация: email обязателен, пароли совпадают."""

from __future__ import annotations


def test_register_requires_email(client):
    resp = client.post(
        "/api/register",
        json={
            "username": "no_email_user",
            "password": "secret12",
            "password_confirm": "secret12",
        },
    )
    assert resp.status_code == 422


def test_register_password_mismatch_422(client):
    resp = client.post(
        "/api/register",
        json={
            "username": "mismatch_user",
            "password": "secret12",
            "password_confirm": "secret99",
            "email": "mismatch@example.com",
        },
    )
    assert resp.status_code == 422


def test_register_ok_with_email_and_matching_passwords(client):
    resp = client.post(
        "/api/register",
        json={
            "password": "secret12",
            "password_confirm": "secret12",
            "email": "valid@example.com",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "valid_example_com"


def test_register_same_local_part_different_domains(client):
    """Локальная часть email не должна блокировать другой домен (старый баг с username)."""
    first = client.post(
        "/api/register",
        json={
            "password": "secret12",
            "password_confirm": "secret12",
            "email": "player@yandex.ru",
        },
    )
    second = client.post(
        "/api/register",
        json={
            "password": "secret12",
            "password_confirm": "secret12",
            "email": "player@gmail.com",
        },
    )
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["username"] == "player_yandex_ru"
    assert second.json()["username"] == "player_gmail_com"


def test_register_duplicate_email_400(client):
    payload = {
        "password": "secret12",
        "password_confirm": "secret12",
        "email": "dup@example.com",
    }
    assert client.post("/api/register", json=payload).status_code == 200
    resp = client.post(
        "/api/register",
        json={**payload, "email": "dup@example.com"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Email already registered"


def test_login_with_email(client):
    email = "login_by_email@example.com"
    client.post(
        "/api/register",
        json={
            "password": "secret12",
            "password_confirm": "secret12",
            "email": email,
        },
    )
    resp = client.post(
        "/api/login",
        json={"username": email, "password": "secret12"},
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "login_by_email_example_com"
