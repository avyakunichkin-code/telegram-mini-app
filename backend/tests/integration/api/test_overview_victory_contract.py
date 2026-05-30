"""
CS: GET /api/finance/overview — контракт victory для FE (chain mode prod).

Gate: G3 поля progression_mode, current_goal_key, goals[]; G1 старт tutorial chain.
"""

from __future__ import annotations

import pytest

from app.game.rules import MIN_PERIOD_INDEX_FOR_WIN


pytestmark = pytest.mark.integration

VICTORY_OVERVIEW_KEYS = (
    "schema_version",
    "template_key",
    "min_period_index",
    "period_gate_open",
    "progression_mode",
    "current_goal_key",
    "goals_met",
    "goals_required",
    "goals_enabled",
    "win_reached",
    "goals",
)

GOAL_ITEM_KEYS = ("key", "type", "title", "met", "enabled", "available")


def _start_basic_game(client, auth_headers, profile_name: str = "Victory contract"):
    assert (
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": profile_name,
                "save_kind": "game",
                "template_key": "mq_game_basic_v1",
            },
        ).status_code
        == 200
    )


class TestOverviewVictoryContract:
    def test_fresh_game_exposes_chain_victory_fields(self, client, auth_headers):
        _start_basic_game(client, auth_headers)
        ov = client.get("/api/finance/overview", headers=auth_headers).json()
        victory = ov["victory"]

        for key in VICTORY_OVERVIEW_KEYS:
            assert key in victory, f"missing victory.{key}"

        assert victory["template_key"] == "mq_game_basic_v1"
        assert victory["progression_mode"] == "chain"
        assert victory["current_goal_key"] == "tutorial_salary"
        assert victory["win_reached"] is False
        assert victory["period_gate_open"] is False
        assert victory["min_period_index"] == MIN_PERIOD_INDEX_FOR_WIN
        assert victory["goals_enabled"] == len(victory["goals"]) == 5
        assert victory["goals_required"] == 5
        assert victory["goals_met"] == 0

        for goal in victory["goals"]:
            for key in GOAL_ITEM_KEYS:
                assert key in goal, f"goal {goal.get('key')} missing {key}"

        salary = next(g for g in victory["goals"] if g["key"] == "tutorial_salary")
        assert salary["type"] == "action_once"
        assert salary["met"] is False

    def test_after_salary_claim_chain_advances_current_goal(self, client, auth_headers):
        _start_basic_game(client, auth_headers, "Victory after salary")
        assert client.post("/api/game/period/claim-salary", headers=auth_headers).status_code == 200

        victory = client.get("/api/finance/overview", headers=auth_headers).json()["victory"]
        assert victory["progression_mode"] == "chain"
        assert victory["current_goal_key"] == "tutorial_cushion"
        assert victory["goals_met"] >= 1

        salary = next(g for g in victory["goals"] if g["key"] == "tutorial_salary")
        assert salary["met"] is True
        cushion = next(g for g in victory["goals"] if g["key"] == "tutorial_cushion")
        assert cushion["met"] is False
