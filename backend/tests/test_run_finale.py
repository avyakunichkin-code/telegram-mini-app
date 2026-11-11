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

    def test_defeat_payload_bg2_fields(self, db_session, test_user):
        """★ BG-2: факт риска по defeat_reason, два совета, «на счёте» числом, лексикон «ход»."""
        from app.game.run_finale import build_run_finale_payload

        profile = create_game_profile(db_session, user_id=test_user.id, period_index=5)
        profile.cash_balance = -8200
        db_session.commit()

        for reason in ("cash_negative_streak", "needs_depletion"):
            payload = build_run_finale_payload(
                db_session, profile, outcome="defeat", defeat_reason=reason
            )
            assert payload.cash_balance == -8200
            assert payload.fact is not None
            assert len(payload.fact.tips) == 2
            assert "−8 200 ₽" in payload.fact.text
            copy = f"{payload.fact.title} {payload.fact.text} {' '.join(payload.fact.tips)}"
            assert "месяц" not in copy.lower()
            assert "cash" not in copy.lower()

    def test_finale_counts_only_completed_turns(self, db_session, test_user):
        """Регресс 2026-11-09: победа после закрытия 15-го хода показывала «16 ходов»."""
        from app.game.run_finale import build_run_finale_payload

        profile = create_game_profile(db_session, user_id=test_user.id, period_index=16)
        payload = build_run_finale_payload(db_session, profile, outcome="victory")

        assert payload.period_index == 16
        assert payload.turns_completed == 15
        term = next(m for m in payload.sections[0].metrics if m.headline == "Ходов сыграно")
        assert term.value == "15"

    def test_resolve_finds_archived_defeated_profile(self, db_session, test_user):
        from app.game.session import resolve_game_session

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


class TestRunFinaleDecisions:
    """CS-7 «Цена решений»: блок decisions в финале при обоих исходах."""

    @staticmethod
    def _profile_with_missed_salary(db_session, user_id: int):
        from app.models import PeriodEconomyClosing
        from tests.fixtures.game import create_profile_ready_for_period_close

        profile = create_profile_ready_for_period_close(
            db_session, user_id=user_id, salary_already_claimed=False, period_index=2
        )
        db_session.add(PeriodEconomyClosing(game_profile_id=profile.id, period_index=1))
        db_session.commit()
        return profile

    def test_both_outcomes_include_decisions(self, db_session, test_user):
        from app.game.run_finale import build_run_finale_payload

        profile = self._profile_with_missed_salary(db_session, test_user.id)

        for outcome in ("victory", "defeat"):
            payload = build_run_finale_payload(db_session, profile, outcome=outcome, defeat_reason=None)
            assert [d.kind for d in payload.decisions] == ["salary_missed"]
            decision = payload.decisions[0]
            assert decision.direction == "cost"
            assert decision.amount == 50_000.0
            assert decision.is_estimate is True
            assert decision.period_index == 1

    def test_decisions_empty_without_facts(self, db_session, test_user):
        from app.game.run_finale import build_run_finale_payload

        profile = create_game_profile(db_session, user_id=test_user.id, period_index=3)
        payload = build_run_finale_payload(db_session, profile, outcome="victory")

        assert payload.decisions == []

    def test_decision_copy_has_no_verdicts(self, db_session, test_user):
        from app.game.run_finale import build_run_finale_payload

        profile = self._profile_with_missed_salary(db_session, test_user.id)
        payload = build_run_finale_payload(db_session, profile, outcome="defeat", defeat_reason=None)

        copy = " ".join(f"{d.title} {d.detail}" for d in payload.decisions).lower()
        for word in ("ошибк", "зря", "надо было", "следовало"):
            assert word not in copy

    def test_bootstrap_serializes_decisions(self, client, auth_headers, db_session, test_user):
        profile = self._profile_with_missed_salary(db_session, test_user.id)
        profile.is_active = 0
        profile.is_archived = 1
        profile.run_outcome = "defeat"
        db_session.add(
            Transaction(
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description="Поражение: 3 периода подряд с отрицательным балансом",
                period_index=2,
            )
        )
        db_session.commit()

        body = client.get("/api/game/bootstrap", headers=auth_headers).json()

        decisions = body["run_finale"]["decisions"]
        from app.finance.expenses import compute_monthly_burn
        assert body["run_finale"]["monthly_burn"] == round(compute_monthly_burn(db_session, profile).total, 2)
        assert decisions == [
            {
                "kind": "salary_missed",
                "direction": "cost",
                "title": "Пропущенные зарплаты",
                "detail": "Не получено за 1 ход",
                "amount": 50_000.0,
                "period_index": 1,
                "is_estimate": True,
            }
        ]

    def test_dismissed_victory_has_no_finale(self, db_session, test_user):
        from app.game.run_finale import should_show_run_finale
        from app.timeutil import utc_now_naive

        profile = create_game_profile(db_session, user_id=test_user.id, period_index=10)
        assert should_show_run_finale(profile, win_reached=True, game_session_status="active") is True

        profile.victory_finale_shown_at = utc_now_naive()
        assert should_show_run_finale(profile, win_reached=True, game_session_status="active") is False


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


class TestWatchtowerRunFeedback:
    def test_watchtower_includes_run_feedback(
        self, client, admin_env, auth_headers, db_session, test_user
    ):
        profile = create_game_profile(db_session, user_id=test_user.id, is_active=0, name="FB test")
        db_session.add(
            PlayerRunFeedback(
                user_id=test_user.id,
                game_profile_id=profile.id,
                outcome="defeat",
                template_key="mq_game_basic_v1",
                period_index=3,
                defeat_reason="cash_negative_streak",
                comment="Сложно, но понятно",
            )
        )
        db_session.commit()

        r = client.get("/api/admin/watchtower", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert "run_feedback" in body
        assert any("Сложно" in (row.get("comment") or "") for row in body["run_feedback"])
