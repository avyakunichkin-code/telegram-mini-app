"""Фабрики GameProfile / InsurancePolicy / FinanceLiability для тестов."""

from __future__ import annotations

from app.models import FinanceLiability, FinanceSalary, GameProfile, InsurancePolicy, PeriodSnapshot


def create_game_profile(db, *, user_id: int, **kwargs) -> GameProfile:
    defaults = {
        "name": "pytest_profile",
        "save_kind": "game",
        "is_active": 1,
        "cash_balance": 10_000.0,
        "period_index": 2,
    }
    defaults.update(kwargs)
    profile = GameProfile(user_id=user_id, **defaults)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def create_auto_liability_policy(
    db,
    profile_id: int,
    *,
    kind: str = "auto_liability",
    payout: float = 400_000.0,
) -> InsurancePolicy:
    pol = InsurancePolicy(
        game_profile_id=profile_id,
        product="auto",
        insured_object="liability",
        kind=kind,
        title="ОСАГО тест",
        monthly_premium=2400.0,
        payout_amount=payout,
        coverage_limit=payout,
        term_periods=12,
        started_period_index=1,
        is_active=1,
    )
    db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol


def create_finance_liability(
    db,
    profile_id: int,
    *,
    title: str = "Кредит тест",
    monthly_payment: float = 5_000.0,
    overdue_amount: float = 0.0,
    overdue_periods: int = 0,
    **kwargs,
) -> FinanceLiability:
    defaults = {
        "total_debt": 100_000.0,
        "annual_rate_percent": 12.0,
        "monthly_payment": monthly_payment,
        "overdue_amount": overdue_amount,
        "overdue_periods": overdue_periods,
        "is_active": 1,
    }
    defaults.update(kwargs)
    liability = FinanceLiability(
        game_profile_id=profile_id,
        title=title,
        **defaults,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


def create_profile_ready_for_period_close(
    db,
    *,
    user_id: int,
    salary_already_claimed: bool = True,
    **profile_kwargs,
) -> GameProfile:
    """Профиль в конце периода 1: snapshot для аналитики; зарплата по умолчанию «уже забрана»."""
    defaults = {
        "name": "period_close_pytest",
        "save_kind": "game",
        "starter_template_key": "mq_game_basic_v1",
        "base_monthly_lifestyle_expense": 0.0,
        "is_active": 1,
        "period_index": 1,
        "cash_balance": 50_000.0,
        "safety_fund_balance": 0.0,
        "last_period_salary_claimed": 1 if salary_already_claimed else 0,
    }
    defaults.update(profile_kwargs)
    profile = GameProfile(user_id=user_id, **defaults)
    db.add(profile)
    db.flush()

    db.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=50_000.0))
    db.add(
        PeriodSnapshot(
            game_profile_id=profile.id,
            period_index=1,
            salary_claimed=1 if salary_already_claimed else 0,
            salary_amount=50_000.0 if salary_already_claimed else 0.0,
            safety_fund_contribution=0.0,
            safety_fund_total=0.0,
            xp_earned=0,
        )
    )
    db.commit()
    db.refresh(profile)
    return profile
