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
            "username": "valid_reg_user",
            "password": "secret12",
            "password_confirm": "secret12",
            "email": "valid@example.com",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "valid_reg_user"
