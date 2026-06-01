"""DL1-AC-6: полис с истёкшим сроком не списывает премию и деактивируется."""

from __future__ import annotations

from app.models import InsurancePolicy, Transaction
from app.services.insurance.service import (
    buy_policy,
    charge_premiums_for_period,
    expire_policies_for_period,
    list_policies,
)
from tests.fixtures.game import create_game_profile
from tests.test_insurance_events import INSURANCE_TEST_TEMPLATE_KEY, _ensure_insurance_test_template


def _policy(
    db,
    profile_id: int,
    *,
    started_period_index: int = 1,
    term_periods: int = 12,
    monthly_premium: float = 2400.0,
    expires_period_index: int | None = None,
):
    started = int(started_period_index)
    expires = (
        int(expires_period_index)
        if expires_period_index is not None
        else started + int(term_periods)
    )
    row = InsurancePolicy(
        game_profile_id=profile_id,
        product="health",
        insured_object="life",
        kind="health_life",
        title="Тест полис",
        monthly_premium=monthly_premium,
        payout_amount=200_000.0,
        coverage_limit=200_000.0,
        term_periods=int(term_periods),
        started_period_index=started,
        expires_period_index=expires,
        claimed_period_index=None,
        insured_asset_id=None,
        is_active=1,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


class TestExpirePoliciesForPeriod:
    def test_deactivates_when_period_reaches_expires(self, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id, period_index=12)
        pol = _policy(db_session, profile.id, started_period_index=1, term_periods=12)
        assert pol.expires_period_index == 13

        n = expire_policies_for_period(db_session, profile, 13)
        assert n == 1
        db_session.refresh(pol)
        assert pol.is_active == 0

    def test_stays_active_before_expiry(self, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id)
        pol = _policy(db_session, profile.id, started_period_index=1, term_periods=12)

        n = expire_policies_for_period(db_session, profile, 12)
        assert n == 0
        db_session.refresh(pol)
        assert pol.is_active == 1


class TestChargePremiumsRespectsExpiry:
    def test_no_premium_on_expiry_period(self, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            cash_balance=50_000.0,
            period_index=13,
        )
        _policy(
            db_session,
            profile.id,
            started_period_index=1,
            term_periods=12,
            monthly_premium=5000.0,
        )
        cash_before = float(profile.cash_balance)

        charged = charge_premiums_for_period(db_session, profile, 13)
        db_session.refresh(profile)

        assert charged == 0.0
        assert float(profile.cash_balance) == cash_before
        prem_tx = (
            db_session.query(Transaction)
            .filter(
                Transaction.game_profile_id == profile.id,
                Transaction.type == "insurance_premium",
            )
            .all()
        )
        assert prem_tx == []

    def test_premium_charged_while_active(self, db_session, test_user):
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            cash_balance=50_000.0,
            period_index=5,
        )
        _policy(
            db_session,
            profile.id,
            started_period_index=1,
            term_periods=12,
            monthly_premium=3000.0,
        )

        charged = charge_premiums_for_period(db_session, profile, 5)
        db_session.refresh(profile)

        assert charged == 3000.0
        assert float(profile.cash_balance) == 47_000.0

    def test_expired_policy_not_in_list(self, db_session, test_user):
        profile = create_game_profile(db_session, user_id=test_user.id)
        _policy(db_session, profile.id, started_period_index=1, term_periods=3)

        expire_policies_for_period(db_session, profile, 4)
        active = list_policies(db_session, profile)
        assert active == []


class TestBuyPolicyExpiryFields:
    def test_buy_sets_expires_from_term(self, db_session, test_user):
        _ensure_insurance_test_template(db_session)
        profile = create_game_profile(
            db_session,
            user_id=test_user.id,
            period_index=7,
            starter_template_key=INSURANCE_TEST_TEMPLATE_KEY,
        )
        result = buy_policy(
            db_session,
            profile,
            {"plan_key": "health_life_basic"},
        )
        pol = result["policy"]
        assert pol["started_period_index"] == 7
        assert pol["term_periods"] == 12
        assert pol["expires_period_index"] == 19

    def test_period_end_via_process_period_end(self, db_session, test_user):
        from app.game.period import process_period_end
        from tests.fixtures.game import create_profile_ready_for_period_close

        profile = create_profile_ready_for_period_close(
            db_session,
            user_id=test_user.id,
            cash_balance=100_000.0,
            period_index=12,
        )
        _policy(
            db_session,
            profile.id,
            started_period_index=1,
            term_periods=11,
            monthly_premium=1000.0,
        )
        cash_before = float(profile.cash_balance)

        process_period_end(db_session, profile)

        row = (
            db_session.query(InsurancePolicy)
            .filter(InsurancePolicy.game_profile_id == profile.id)
            .first()
        )
        assert row.is_active == 0
        db_session.refresh(profile)
        assert float(profile.cash_balance) == cash_before
