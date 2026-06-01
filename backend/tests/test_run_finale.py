"""GE1 — экран финала партии: bootstrap, архив при поражении, feedback."""
from __future__ import annotations

from app.finance.balance_utils import TRANSACTION_TYPES
from app.game.period import _apply_defeat_to_profile
from app.models import PlayerRunFeedback, Transaction
from tests.fixtures.game import create_game_profile


class TestDefeatArchivesProfile:
    def test_apply_defeat_sets_archived_and_outcome(self, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id, is_active=1)
        _apply_defeat_to_profile(profile)
        db_session.commit()
        db_session.refresh(profile)
        assert profile.is_active == 0
        assert profile.is_archived == 1
        assert profile.run_outcome == "defeat"


class TestBootstrapRunFinale:
    def test_bootstrap_includes_run_finale_when_defeated(
        self, client, auth_headers, db_session, test_user
    ):
        defeated = create_game_profile(
            db_session,
            user_id=test_user.id,
            is_active=0,
            is_archived=1,
            name="Archived defeat",
            period_index=4,
        )
        defeated.run_outcome = "defeat"
        db_session.add(
            Transaction(
                game_profile_id=defeated.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: 3 периода подряд с отрицательным балансом",
                period_index=4,
            )
        )
        db_session.commit()

        boot = client.get("/api/game/bootstrap", headers=auth_headers)
        assert boot.status_code == 200
        body = boot.json()
        assert body["game_session_status"] == "defeated"
        assert body["run_finale"] is not None
        assert body["run_finale"]["outcome"] == "defeat"
        assert body["run_finale"]["sections"]

    def test_resolve_finds_archived_defeated_profile(self, db_session, test_user):
        from app.game.time import resolve_game_session

        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            is_active=0,
            is_archived=1,
            period_index=2,
        )
        db_session.add(
            Transaction(
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: потребности на нуле 3 месяца подряд",
                period_index=2,
            )
        )
        db_session.commit()

        resolved, status, reason, _ = resolve_game_session(db_session, test_user.id)
        assert status == "defeated"
        assert resolved.id == profile.id
        assert reason == "needs_depletion"


class TestRunFeedback:
    def test_post_run_feedback(self, client, auth_headers, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            is_active=0,
            is_archived=1,
            period_index=1,
        )
        profile.run_outcome = "defeat"
        db_session.add(
            Transaction(
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: 3 периода подряд с отрицательным балансом",
                period_index=1,
            )
        )
        db_session.commit()

        r = client.post(
            "/api/game/run-feedback",
            headers=auth_headers,
            json={"text": "Интересный сценарий, но сложно"},
        )
        assert r.status_code == 200
        row = db_session.query(PlayerRunFeedback).filter(PlayerRunFeedback.user_id == test_user.id).first()
        assert row is not None
        assert "Интересный" in row.comment
