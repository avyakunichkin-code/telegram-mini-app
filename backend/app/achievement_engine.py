"""
Движок достижений: цепочки tier'ов, критерии criteria_json, разблокировка на game_profile.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from .character_progression import apply_character_xp
from .models import (
    AchievementChain,
    AchievementTierDefinition,
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InsurancePolicy,
    InvestmentPosition,
    ProfileAchievementUnlock,
)

logger = logging.getLogger(__name__)

CRITERIA_SCHEMA_VERSION = 1


@dataclass(frozen=True)
class AchievementEvaluationContext:
    safety_fund_balance: float
    cash_balance: float
    monthly_reference_expense: float
    monthly_salary: float
    active_insurance_count: int
    max_deposit_principal: float
    active_bond_count: int
    total_overdue_amount: float
    clean_period_streak: int
    period_index: int


def monthly_reference_expense(profile: GameProfile, liabilities: list, assets: list) -> float:
    """Опорные месячные расходы: обязательства + обслуживание активов + «жизнь»."""
    liab_pay = sum(float(getattr(l, "monthly_payment", 0) or 0) for l in liabilities)
    maint = sum(float(getattr(a, "monthly_maintenance_cost", 0) or 0) for a in assets)
    lifestyle = float(getattr(profile, "base_monthly_lifestyle_expense", 0) or 0) + float(
        getattr(profile, "delta_monthly_lifestyle_expense", 0) or 0
    )
    return liab_pay + maint + lifestyle


def build_achievement_context(db: Session, profile: GameProfile) -> AchievementEvaluationContext:
    liabilities = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_salary = float(salary.monthly_amount or 0) if salary else 0.0

    insurance_count = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .count()
    )

    deposits = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == "deposit",
        )
        .all()
    )
    max_dep = max((float(p.principal or 0) for p in deposits), default=0.0)

    bonds_count = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == "bond",
        )
        .count()
    )

    return AchievementEvaluationContext(
        safety_fund_balance=float(profile.safety_fund_balance or 0),
        cash_balance=float(profile.cash_balance or 0),
        monthly_reference_expense=monthly_reference_expense(profile, liabilities, assets),
        monthly_salary=monthly_salary,
        active_insurance_count=int(insurance_count),
        max_deposit_principal=max_dep,
        active_bond_count=int(bonds_count),
        total_overdue_amount=sum(float(getattr(l, "overdue_amount", 0) or 0) for l in liabilities),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        period_index=int(profile.period_index or 1),
    )


def _criteria_type(criteria: dict) -> str:
    return str(criteria.get("type") or "").strip()


def evaluate_achievement_criteria(criteria: dict, ctx: AchievementEvaluationContext) -> bool:
    """Проверка одного tier criteria_json (schema_version 1)."""
    if not isinstance(criteria, dict):
        return False

    ctype = _criteria_type(criteria)
    if not ctype or ctype == "stub":
        return False

    if ctype == "safety_fund_months":
        mult = float(criteria.get("months_multiplier", 0) or 0)
        ref = float(ctx.monthly_reference_expense)
        if ref <= 0:
            return False
        return ctx.safety_fund_balance >= ref * mult - 1e-6

    if ctype == "liquid_net_worth":
        minimum = float(criteria.get("min_amount", 0) or 0)
        return (ctx.cash_balance + ctx.safety_fund_balance) >= minimum - 1e-6

    if ctype == "deposit_opened":
        minimum = float(criteria.get("min_principal", 0) or 0)
        return ctx.max_deposit_principal >= minimum - 1e-6

    if ctype == "insurance_active_count":
        minimum = int(criteria.get("min_count", 1) or 1)
        return ctx.active_insurance_count >= minimum

    if ctype == "bond_count":
        minimum = int(criteria.get("min_count", 1) or 1)
        return ctx.active_bond_count >= minimum

    if ctype == "clean_period_streak":
        minimum = int(criteria.get("min_periods", 1) or 1)
        return ctx.clean_period_streak >= minimum

    logger.debug("achievement criteria type not implemented: %s", ctype)
    return False


def _unlocked_tier_ids(db: Session, game_profile_id: int) -> set[int]:
    rows = (
        db.query(ProfileAchievementUnlock.tier_definition_id)
        .filter(ProfileAchievementUnlock.game_profile_id == game_profile_id)
        .all()
    )
    return {int(r[0]) for r in rows}


def _max_unlocked_tier_index(db: Session, game_profile_id: int, chain_key: str) -> int:
    row = (
        db.query(AchievementTierDefinition.tier_index)
        .join(
            ProfileAchievementUnlock,
            ProfileAchievementUnlock.tier_definition_id == AchievementTierDefinition.id,
        )
        .filter(
            ProfileAchievementUnlock.game_profile_id == game_profile_id,
            AchievementTierDefinition.chain_key == chain_key,
        )
        .order_by(AchievementTierDefinition.tier_index.desc())
        .first()
    )
    return int(row[0]) if row else 0


def _next_tier_definition(
    db: Session, game_profile_id: int, chain_key: str
) -> AchievementTierDefinition | None:
    next_index = _max_unlocked_tier_index(db, game_profile_id, chain_key) + 1
    return (
        db.query(AchievementTierDefinition)
        .filter(
            AchievementTierDefinition.chain_key == chain_key,
            AchievementTierDefinition.tier_index == next_index,
        )
        .first()
    )


def process_achievement_unlocks(db: Session, profile: GameProfile) -> list[dict[str, Any]]:
    """
    Последовательно проверяет следующую ступень в каждой цепочке; при выполнении — unlock + XP.
    Возвращает список только что разблокированных tier'ов.
    """
    ctx = build_achievement_context(db, profile)
    unlocked_ids = _unlocked_tier_ids(db, profile.id)
    newly_unlocked: list[dict[str, Any]] = []

    chains = (
        db.query(AchievementChain)
        .filter(AchievementChain.is_active == 1)
        .order_by(AchievementChain.sort_order.asc(), AchievementChain.id.asc())
        .all()
    )

    progress = True
    while progress:
        progress = False
        for chain in chains:
            tier_def = _next_tier_definition(db, profile.id, chain.chain_key)
            if not tier_def or int(tier_def.id) in unlocked_ids:
                continue
            try:
                criteria = json.loads(tier_def.criteria_json or "{}")
            except json.JSONDecodeError:
                criteria = {}

            if not evaluate_achievement_criteria(criteria, ctx):
                continue

            db.add(
                ProfileAchievementUnlock(
                    game_profile_id=profile.id,
                    tier_definition_id=int(tier_def.id),
                    unlocked_at=datetime.utcnow(),
                    period_index=int(profile.period_index),
                )
            )
            xp_info = apply_character_xp(profile, int(tier_def.xp_reward or 0), db)
            unlocked_ids.add(int(tier_def.id))
            newly_unlocked.append(
                {
                    "chain_key": chain.chain_key,
                    "tier_key": tier_def.tier_key,
                    "tier_index": int(tier_def.tier_index),
                    "title": tier_def.title,
                    "xp_reward": int(tier_def.xp_reward or 0),
                    "xp_gained": int(xp_info.get("xp_gained", 0) or 0),
                    "level_up": bool(xp_info.get("level_up")),
                    "new_level": xp_info.get("new_level"),
                }
            )
            progress = True

    if newly_unlocked:
        db.flush()

    return newly_unlocked


def serialize_achievements_for_profile(db: Session, game_profile_id: int) -> list[dict[str, Any]]:
    """Состояние всех активных цепочек для UI."""
    unlocked_rows = (
        db.query(ProfileAchievementUnlock.tier_definition_id)
        .filter(ProfileAchievementUnlock.game_profile_id == game_profile_id)
        .all()
    )
    unlocked_set = {int(r[0]) for r in unlocked_rows}

    chains = (
        db.query(AchievementChain)
        .filter(AchievementChain.is_active == 1)
        .order_by(AchievementChain.sort_order.asc(), AchievementChain.id.asc())
        .all()
    )

    out: list[dict[str, Any]] = []
    for chain in chains:
        tiers = (
            db.query(AchievementTierDefinition)
            .filter(AchievementTierDefinition.chain_key == chain.chain_key)
            .order_by(AchievementTierDefinition.tier_index.asc())
            .all()
        )
        current_tier = 0
        tier_payload = []
        for t in tiers:
            is_unlocked = int(t.id) in unlocked_set
            if is_unlocked:
                current_tier = max(current_tier, int(t.tier_index))
            tier_payload.append(
                {
                    "tier_key": t.tier_key,
                    "tier_index": int(t.tier_index),
                    "title": t.title,
                    "description": t.description,
                    "xp_reward": int(t.xp_reward or 0),
                    "unlocked": is_unlocked,
                }
            )
        out.append(
            {
                "chain_key": chain.chain_key,
                "category": chain.category,
                "title": chain.title,
                "description": chain.description,
                "max_tier": int(chain.max_tier),
                "current_tier": current_tier,
                "tiers": tier_payload,
            }
        )
    return out
