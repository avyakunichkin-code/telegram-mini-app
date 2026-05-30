"""Фабрики GameProfile / InsurancePolicy для тестов событий и финансов."""

from __future__ import annotations

from app.models import GameProfile, InsurancePolicy


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
