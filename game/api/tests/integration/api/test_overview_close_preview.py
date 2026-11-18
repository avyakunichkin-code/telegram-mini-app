"""GET /api/finance/overview — превью закрытия (SPL-206): есть в ответе; сбой превью не роняет экран."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from tests.integration.api.test_overview_victory_contract import _start_basic_game

pytestmark = pytest.mark.integration


def test_overview_has_close_preview(client, auth_headers, seed_basic_template):
    _start_basic_game(client, auth_headers)
    body = client.get("/api/finance/overview", headers=auth_headers).json()
    preview = body["period_close_preview"]
    assert preview is not None
    assert preview["estimated_charges_total"] > 0


def test_overview_survives_preview_failure(client, auth_headers, seed_basic_template):
    _start_basic_game(client, auth_headers)
    with patch("app.finance.overview_build.estimate_period_close_preview", side_effect=RuntimeError("broken snapshot")):
        r = client.get("/api/finance/overview", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["period_close_preview"] is None
