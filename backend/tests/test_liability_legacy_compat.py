"""DL1 legacy liabilities without new fields behave as interest-only."""

from app.finance.liability_kinds import (
    LIABILITY_KIND_UNSECURED,
    PAYMENT_MODE_INTEREST_ONLY,
    effective_liability_kind,
    effective_payment_mode,
)
from tests.fixtures.game import create_finance_liability, create_game_profile


def test_legacy_defaults(db_session, test_user):
    profile = create_game_profile(db_session, user_id=test_user.id)
    liab = create_finance_liability(
        db_session,
        profile.id,
        liability_kind=LIABILITY_KIND_UNSECURED,
        payment_mode=PAYMENT_MODE_INTEREST_ONLY,
    )
    assert effective_liability_kind(liab) == LIABILITY_KIND_UNSECURED
    assert effective_payment_mode(liab) == PAYMENT_MODE_INTEREST_ONLY
    assert liab.secured_asset_id is None
