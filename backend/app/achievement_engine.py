"""
Движок достижений: цепочки tier'ов, критерии criteria_json, разблокировка на game_profile.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
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
    Transaction,
)
from .timeutil import utc_now_naive

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
    monthly_passive_income: float
    estimated_deposit_monthly_interest: float
    estimated_deposit_accrued_interest: float
    liquid_total: float
    liabilities_closed_count: int
    max_liability_close_payment: float
    insurance_claims_count: int


def monthly_reference_expense(profile: GameProfile, liabilities: list, assets: list) -> float:
    """Опорные месячные расходы: обязательства + обслуживание активов + «жизнь»."""
    liab_pay = sum(float(getattr(l, "monthly_payment", 0) or 0) for l in liabilities)
    maint = sum(float(getattr(a, "monthly_maintenance_cost", 0) or 0) for a in assets)
    from .expenses import compute_monthly_burn

    lifestyle = float(compute_monthly_burn(db, profile).total)
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

    period_index = int(profile.period_index or 1)
    monthly_asset_income = sum(float(getattr(a, "monthly_income", 0) or 0) for a in assets)
    bonds = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
            InvestmentPosition.kind == "bond",
        )
        .all()
    )
    bond_monthly_coupon = sum(
        float(p.principal or 0) * float(p.annual_rate_percent or 0) / 100.0 / 12.0 for p in bonds
    )
    monthly_passive_income = monthly_asset_income + bond_monthly_coupon

    deposit_monthly_interest = 0.0
    deposit_accrued_interest = 0.0
    for pos in deposits:
        principal = float(pos.principal or 0)
        rate = float(pos.annual_rate_percent or 0) / 100.0
        periods_held = max(0, period_index - int(pos.started_period or period_index))
        monthly_int = principal * rate / 12.0
        deposit_monthly_interest += monthly_int
        deposit_accrued_interest += monthly_int * max(1, periods_held)

    close_rows = (
        db.query(Transaction.amount)
        .filter(
            Transaction.game_profile_id == profile.id,
            Transaction.type == "liability_close",
        )
        .all()
    )
    close_payments = [abs(float(r[0] or 0)) for r in close_rows]
    liabilities_closed_count = len(close_payments)
    max_close_payment = max(close_payments, default=0.0)

    insurance_claims_count = (
        db.query(InsurancePolicy)
        .filter(
            InsurancePolicy.game_profile_id == profile.id,
            InsurancePolicy.claimed_period_index.isnot(None),
        )
        .count()
    )

    cash = float(profile.cash_balance or 0)
    safety = float(profile.safety_fund_balance or 0)

    return AchievementEvaluationContext(
        safety_fund_balance=safety,
        cash_balance=cash,
        monthly_reference_expense=monthly_reference_expense(profile, liabilities, assets),
        monthly_salary=monthly_salary,
        active_insurance_count=int(insurance_count),
        max_deposit_principal=max_dep,
        active_bond_count=int(bonds_count),
        total_overdue_amount=sum(float(getattr(l, "overdue_amount", 0) or 0) for l in liabilities),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        period_index=period_index,
        monthly_passive_income=monthly_passive_income,
        estimated_deposit_monthly_interest=deposit_monthly_interest,
        estimated_deposit_accrued_interest=deposit_accrued_interest,
        liquid_total=cash + safety,
        liabilities_closed_count=liabilities_closed_count,
        max_liability_close_payment=max_close_payment,
        insurance_claims_count=int(insurance_claims_count),
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

    if ctype == "deposit_principal_vs_salary":
        mult = float(criteria.get("salary_multiplier", 2) or 2)
        if ctx.monthly_salary <= 0:
            return False
        return ctx.max_deposit_principal >= ctx.monthly_salary * mult - 1e-6

    if ctype == "deposit_accrued_interest":
        minimum = float(criteria.get("min_interest", 0) or 0)
        return ctx.estimated_deposit_accrued_interest >= minimum - 1e-6

    if ctype == "deposit_monthly_income_ratio":
        ratio = float(criteria.get("min_ratio", 0.1) or 0.1)
        ref = float(ctx.monthly_reference_expense)
        if ref <= 0:
            return False
        return ctx.estimated_deposit_monthly_interest >= ref * ratio - 1e-6

    if ctype == "passive_income_ratio":
        ratio = float(criteria.get("min_ratio", 0.05) or 0.05)
        ref = float(ctx.monthly_reference_expense)
        if ref <= 0:
            return False
        return ctx.monthly_passive_income >= ref * ratio - 1e-6

    if ctype == "liquid_vs_salary_months":
        months = float(criteria.get("min_months", 6) or 6)
        if ctx.monthly_salary <= 0:
            return False
        return ctx.liquid_total >= ctx.monthly_salary * months - 1e-6

    if ctype == "liabilities_closed_count":
        minimum = int(criteria.get("min_count", 1) or 1)
        return ctx.liabilities_closed_count >= minimum

    if ctype == "liability_close_payment":
        minimum = float(criteria.get("min_amount", 0) or 0)
        return ctx.max_liability_close_payment >= minimum - 1e-6

    if ctype == "insurance_claimed_count":
        minimum = int(criteria.get("min_count", 1) or 1)
        return ctx.insurance_claims_count >= minimum

    if ctype == "insured_clean_streak":
        min_periods = int(criteria.get("min_periods", 24) or 24)
        return (
            ctx.clean_period_streak >= min_periods
            and (ctx.active_insurance_count >= 1 or ctx.insurance_claims_count >= 1)
        )

    if ctype == "no_overdue":
        return ctx.total_overdue_amount <= 0

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
                    unlocked_at=utc_now_naive(),
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
