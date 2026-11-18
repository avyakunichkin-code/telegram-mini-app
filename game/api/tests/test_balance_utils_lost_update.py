"""adjust_balance перечитывает cash_balance из БД, а не из устаревшего identity map."""

from __future__ import annotations

from sqlalchemy.orm import sessionmaker

from app.finance.balance_utils import adjust_balance
from app.models import GameProfile


def _profile(db_session, user_id: int, cash: float) -> GameProfile:
    profile = GameProfile(
        user_id=user_id,
        name="Balance lock",
        save_kind="game",
        cash_balance=cash,
        safety_fund_balance=0,
        period_index=1,
        time_state="pause",
        period_duration_seconds=86400,
        is_active=1,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile


def test_concurrent_credit_is_not_lost(db_engine, db_session, test_user):
    profile = _profile(db_session, test_user.id, cash=1_000)

    # Запрос A загрузил профиль раньше, чем запрос B зачислил зарплату.
    other = sessionmaker(bind=db_engine, autoflush=False)()
    try:
        stale = other.get(GameProfile, profile.id)
        assert float(stale.cash_balance) == 1_000

        adjust_balance(db_session, profile.id, 500, "salary", "Зарплата", 1)
        db_session.commit()

        new_balance = adjust_balance(other, profile.id, -100, "event_choice", "Событие", 1)
        other.commit()
    finally:
        other.close()

    assert new_balance == 1_400
    db_session.refresh(profile)
    assert float(profile.cash_balance) == 1_400


def test_pending_profile_changes_survive_balance_reload(db_engine, db_session, test_user):
    profile = _profile(db_session, test_user.id, cash=1_000)

    session = sessionmaker(bind=db_engine, autoflush=False)()
    try:
        p = session.get(GameProfile, profile.id)
        p.negative_periods_count = 2  # ещё не flush-нуто
        adjust_balance(session, profile.id, -50, "lifestyle_expense", "Расходы", 1)
        session.commit()
    finally:
        session.close()

    db_session.refresh(profile)
    assert int(profile.negative_periods_count) == 2
    assert float(profile.cash_balance) == 950
