"""
Поражение, bootstrap-сессия, превью закрытия месяца, safety_grant (без штрафа distressed).
"""
from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.finance.balance_utils import TRANSACTION_TYPES
from app.game.period import process_period_end
from app.game.time import get_active_game_profile, resolve_game_session
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, Transaction
from tests.fixtures.game import create_game_profile, create_profile_ready_for_period_close

_PERIOD_PATCHES = patch("app.game.period.ensure_period_events", return_value=None)


def _start_game(client, auth_headers, name: str = "Session test"):
    r = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={
            "profile_name": name,
            "save_kind": "game",
            "template_key": "mq_game_basic_v1",
        },
    )
    assert r.status_code == 200


class TestActiveProfileResolution:
    def test_get_active_raises_when_only_defeated_profile(self, db_session, test_user):
        create_game_profile(db_session, user_id=test_user.id, is_active=0, name="Проиграл")

        with pytest.raises(HTTPException) as exc:
            get_active_game_profile(db_session, test_user.id)
        assert exc.value.status_code == 404

    def test_resolve_game_session_returns_defeated_profile(self, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            is_active=0,
            name="Проиграл",
            period_index=5,
        )
        db_session.add(
            Transaction(
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: 3 периода подряд с отрицательным балансом (период #5)",
                period_index=5,
            )
        )
        db_session.commit()

        resolved, status, reason, period_idx = resolve_game_session(db_session, test_user.id)
        assert status == "defeated"
        assert resolved.id == profile.id
        assert reason == "cash_negative_streak"
        assert period_idx == 5


class TestBootstrapDefeatedSession:
    def test_bootstrap_reports_defeated_without_spawning_new_profile(
        self, client, auth_headers, db_session, test_user
    ):
        defeated = create_game_profile(
            db_session,
            user_id=test_user.id,
            is_active=0,
            name="Old run",
            cash_balance=123.0,
            period_index=3,
        )
        db_session.add(
            Transaction(
                game_profile_id=defeated.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: 3 периода подряд с отрицательным балансом",
                period_index=3,
            )
        )
        db_session.commit()
        count_before = db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).count()

        boot = client.get("/api/game/bootstrap", headers=auth_headers)
        assert boot.status_code == 200
        body = boot.json()
        assert body["game_session_status"] == "defeated"
        assert body["defeat_reason"] == "cash_negative_streak"
        assert body["defeat_period_index"] == 3
        assert body["events"]["events"] == []
        assert float(body["overview"]["cash_balance"]) == pytest.approx(123.0)

        count_after = db_session.query(GameProfile).filter(GameProfile.user_id == test_user.id).count()
        assert count_after == count_before


class TestOverviewPeriodClosePreview:
    def test_overview_includes_period_close_preview(self, client, auth_headers):
        _start_game(client, auth_headers, "Preview")
        ov = client.get("/api/finance/overview", headers=auth_headers)
        assert ov.status_code == 200
        preview = ov.json().get("period_close_preview")
        assert preview is not None
        assert "estimated_cash_after_close" in preview
        assert "defeat_if_close_negative" in preview
        assert preview["needs_distressed_penalty_estimate"] == 0


class TestCashDefeatFlow:
    def test_third_negative_period_sets_game_over(self, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=1_000.0,
            negative_periods_count=2,
            base_monthly_lifestyle_expense=37_500.0,
        )

        with _PERIOD_PATCHES:
            result = process_period_end(db_session, profile)

        db_session.refresh(profile)
        assert result["game_over"] is True
        assert result["defeat_reason"] == "cash_negative_streak"
        assert profile.is_active == 0

    def test_time_next_returns_game_over_instead_of_error(self, client, auth_headers, db_session, test_user):
        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=500.0,
            negative_periods_count=2,
            base_monthly_lifestyle_expense=37_500.0,
        )
        # Единственная активная партия для API
        db_session.query(GameProfile).filter(
            GameProfile.user_id == test_user.id, GameProfile.id != profile.id
        ).update({"is_active": 0})
        profile.is_active = 1
        db_session.commit()

        nxt = client.post("/api/game/time/next", headers=auth_headers)
        assert nxt.status_code == 200
        body = nxt.json()
        assert body["game_over"] is True
        assert body["defeat_reason"] == "cash_negative_streak"
        assert body.get("period_close") is not None

        boot = client.get("/api/game/bootstrap", headers=auth_headers)
        assert boot.json()["game_session_status"] == "defeated"


class TestSafetyGrantEvent:
    def test_choose_event_safety_grant_does_not_reduce_cash(
        self, client, auth_headers, db_session, test_user
    ):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            cash_balance=20_000.0,
            safety_fund_balance=2_000.0,
        )

        ed = EventDefinition(key="test_grant_evt", mode="any", title="Вычет", is_active=1, weight=100)
        db_session.add(ed)
        db_session.flush()
        choice = EventChoice(
            definition_id=ed.id,
            title="В подушку",
            effects_json=json.dumps({"safety_grant": 5000}, ensure_ascii=False),
        )
        db_session.add(choice)
        db_session.flush()
        inst = EventInstance(
            game_profile_id=profile.id,
            definition_id=ed.id,
            period_index=int(profile.period_index),
            status="pending",
        )
        db_session.add(inst)
        db_session.commit()
        db_session.refresh(choice)
        db_session.refresh(inst)

        res = client.post(
            f"/api/game/events/{inst.id}/choose",
            headers=auth_headers,
            json={"choice_id": choice.id},
        )
        assert res.status_code == 200

        db_session.refresh(profile)
        assert float(profile.cash_balance) == 20_000.0
        assert float(profile.safety_fund_balance) == 7_000.0


class TestNoDistressedCashPenalty:
    def test_period_end_skips_distressed_penalty_even_with_low_needs(
        self, db_session, test_user, seed_basic_template
    ):
        from app.models import GameStarterTemplate

        row = (
            db_session.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == "mq_game_basic_v1")
            .first()
        )
        bp = json.loads(row.blueprint_json or "{}")
        bp["needs"] = {
            "enabled": True,
            "initial": {"comfort": 5, "status": 5, "social": 5, "health": 5},
            "periods_to_empty_target": 12,
            "thresholds": {"low": 40, "distressed": 30},
            "consequences": {
                "distressed_cash_penalty_pct_salary": 0.5,
                "distressed_cash_penalty_min": 50_000,
            },
        }
        row.blueprint_json = json.dumps(bp, ensure_ascii=False)
        db_session.commit()

        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            starter_template_key="mq_game_basic_v1",
            cash_balance=100_000.0,
            need_comfort=5.0,
            need_status=5.0,
            need_social=5.0,
            need_health=5.0,
        )

        with _PERIOD_PATCHES:
            process_period_end(db_session, profile)

        penalties = (
            db_session.query(Transaction)
            .filter(
                Transaction.game_profile_id == profile.id,
                Transaction.type == TRANSACTION_TYPES["PERIOD_PENALTY"],
            )
            .all()
        )
        assert penalties == []
