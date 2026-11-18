"""CORS env для Pre-Alpha / prod домена."""
import os

import pytest

from app.cors_settings import (
    origin_from_public_url,
    resolve_cors_allow_origin_regex,
    resolve_cors_allow_origins,
)


def test_origin_from_public_url():
    assert origin_from_public_url("https://app.example.com/game/#/x") == "https://app.example.com"
    assert origin_from_public_url("https://avyakunichkin-code.github.io/telegram-mini-app/#") == (
        "https://avyakunichkin-code.github.io"
    )


def test_resolve_cors_includes_public_app_origin(monkeypatch):
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)
    monkeypatch.setenv("PUBLIC_APP_URL", "https://app.example.com/#")
    origins = resolve_cors_allow_origins()
    assert "https://app.example.com" in origins
    assert "http://localhost:5173" in origins


def test_resolve_cors_extra_origins(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://staging.example.com,https://app.example.com")
    origins = resolve_cors_allow_origins()
    assert "https://staging.example.com" in origins
    assert "https://app.example.com" in origins


def test_resolve_cors_regex_default():
    assert resolve_cors_allow_origin_regex() == r"^https://[\w-]+\.github\.io$"


def test_resolve_cors_regex_disabled(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGIN_REGEX", "none")
    assert resolve_cors_allow_origin_regex() is None


def test_resolve_cors_regex_invalid(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGIN_REGEX", "[invalid")
    with pytest.raises(ValueError, match="Invalid CORS_ALLOW_ORIGIN_REGEX"):
        resolve_cors_allow_origin_regex()
