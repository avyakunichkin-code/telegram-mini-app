"""Сборка FinanceOverview — переиспользуется /finance/overview и /game/bootstrap."""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from .achievement_engine import process_achievement_unlocks
from .achievement_seeds import ensure_achievement_catalog
from .expenses import burn_breakdown_for_api, compute_monthly_burn
from .finance_analytics import avg_net_cashflow_last_closed_intervals as _avg_net_cashflow_last_closed_intervals
from .game_time import get_seconds_until_next
from .models import FinanceAsset, FinanceLiability, FinanceSalary, GameProfile, GameStarterTemplate
import json

from .needs_engine import (
    needs_values_from_profile,
    normalize_treat_self_options,
    parse_needs_config,
    treat_self_availability,
)
from .schemas import (
    AchievementUnlockEvent,
    AssetResponse,
    FinanceOverview,
    LiabilityResponse,
    MonthlyBurnBreakdown,
    SalaryProfileResponse,
    GameMechanicsPermissions,
    NeedsMetaOverview,
    NeedsOverview,
    TreatSelfOverview,
    TreatSelfOptionOverview,
    VictoryGoalOverview,
    VictoryOverview,
)
from .game_rules import MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER
from .mechanics_progression import capital_flags_for_api, resolve_template_and_unlock
from .starter_mechanics import resolve_profile_mechanics
from .victory_engine import evaluate_victory, parse_victory_config
from .victory_goals_store import override_config_goals_from_db
from .victory_seeds import DEFAULT_TEMPLATE_KEY
from .victory_snap import build_victory_evaluation_input

logger = logging.getLogger(__name__)


def build_finance_overview(db: Session, profile: GameProfile) -> FinanceOverview:
    newly_unlocked_raw: list = []
    try:
        ensure_achievement_catalog(db)
        newly_unlocked_raw = process_achievement_unlocks(db, profile) or []
        db.commit()
        db.refresh(profile)
    except Exception:
        logger.exception(
            "Achievement unlock failed in finance overview profile_id=%s",
            profile.id,
        )
        db.rollback()
        db.refresh(profile)
        newly_unlocked_raw = []

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == profile.id,
            FinanceLiability.is_active == 1,
        )
        .all()
    )
    liabilities = [
        LiabilityResponse(
            id=l.id,
            title=l.title,
            total_debt=l.total_debt,
            annual_rate_percent=l.annual_rate_percent,
            monthly_payment=l.monthly_payment,
            overdue_amount=float(getattr(l, "overdue_amount", 0) or 0),
            overdue_periods=int(getattr(l, "overdue_periods", 0) or 0),
            created_at=l.created_at,
        )
        for l in liabilities_orm
    ]

    assets_orm = (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.game_profile_id == profile.id,
            FinanceAsset.is_active == 1,
        )
        .all()
    )
    assets = [
        AssetResponse(
            id=a.id,
            title=a.title,
            kind=getattr(a, "kind", "generic") or "generic",
            asset_value=a.asset_value,
            monthly_maintenance_cost=a.monthly_maintenance_cost,
            monthly_income=float(getattr(a, "monthly_income", 0) or 0),
            created_at=a.created_at,
        )
        for a in assets_orm
    ]

    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)

    total_liability_payment = sum(l.monthly_payment for l in liabilities)
    total_asset_maintenance = sum(a.monthly_maintenance_cost for a in assets)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    burn_snapshot = compute_monthly_burn(db, profile)
    monthly_burn_total = float(burn_snapshot.total)
    monthly_lifestyle_expense = monthly_burn_total
    burn_breakdown = MonthlyBurnBreakdown(**burn_breakdown_for_api(burn_snapshot))
    total_income = monthly_income + assets_income
    total_monthly_outflow = total_monthly_obligations + monthly_burn_total
    expense_to_income_ratio = (
        round(monthly_burn_total / total_income, 4) if total_income > 0 else 0.0
    )
    net_cashflow = total_income - total_monthly_obligations
    liabilities_ratio = (total_liability_payment / total_income * 100) if total_income > 0 else 0
    total_overdue_amount = sum(float(l.overdue_amount or 0) for l in liabilities_orm)
    overdue_liabilities_count = sum(
        1 for l in liabilities_orm if float(getattr(l, "overdue_amount", 0) or 0) > 0
    )

    avg_cf_6, avg_cf_n = _avg_net_cashflow_last_closed_intervals(db, profile.id, max_intervals=6)

    template_key = getattr(profile, "starter_template_key", None) or DEFAULT_TEMPLATE_KEY
    template_row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    blueprint: dict = {}
    if template_row:
        template_key = template_row.template_key
        raw_victory = template_row.victory_config_json
        try:
            blueprint = json.loads(template_row.blueprint_json or "{}")
        except Exception:
            blueprint = {}
    else:
        raw_victory = None

    victory_cfg = parse_victory_config(raw_victory, template_key=template_key)
    victory_cfg = override_config_goals_from_db(db, template_key=template_key, victory_cfg=victory_cfg)
    victory_snap = build_victory_evaluation_input(db, profile)
    template_cap, mechanics_unlock, template_key = resolve_template_and_unlock(db, profile)
    victory_result = evaluate_victory(
        victory_cfg,
        victory_snap,
        template_key=template_key,
        template_cap=template_cap,
        mechanics_unlock=mechanics_unlock,
    )

    # Норма подушки: ×3 всех текущих расходов за период (обязательства + burn).
    pressure_monthly = total_monthly_outflow
    safety_baseline_target = 0.0
    if pressure_monthly > 0:
        safety_baseline_target = round(
            pressure_monthly * float(MVP_SAFETY_FUND_OBLIGATIONS_MULTIPLIER),
            2,
        )

    mech = resolve_profile_mechanics(db, profile)
    mechanics_permissions = GameMechanicsPermissions(
        capital_invest=mech["capital_invest"],
        capital_insurance=mech["capital_insurance"],
        capital_property=mech["capital_property"],
        capital_liabilities=mech["capital_liabilities"],
    )
    eff_cap = capital_flags_for_api(victory_result.mechanics_effective)
    mechanics_effective_permissions = GameMechanicsPermissions(
        capital_invest=eff_cap["capital_invest"],
        capital_insurance=eff_cap["capital_insurance"],
        capital_property=eff_cap["capital_property"],
        capital_liabilities=eff_cap["capital_liabilities"],
    )

    victory_overview = VictoryOverview(
        schema_version=victory_result.schema_version,
        template_key=victory_result.template_key,
        min_period_index=victory_result.min_period_index,
        period_gate_open=victory_result.period_gate_open,
        progression_mode=victory_result.progression_mode,
        current_goal_key=victory_result.current_goal_key,
        goals_met=victory_result.goals_met,
        goals_required=victory_result.goals_required,
        goals_enabled=victory_result.goals_enabled,
        win_reached=victory_result.win_reached,
        goals=[
            VictoryGoalOverview(
                key=g.key,
                type=g.type,
                title=g.title,
                required=g.required,
                enabled=g.enabled,
                met=g.met,
                progress=g.progress,
                detail=g.detail,
                available=g.available,
                blocked_reason=g.blocked_reason,
            )
            for g in victory_result.goals
        ],
    )

    # ---- Character needs (Z-NEEDS) ----
    needs_cfg = None
    if str(getattr(profile, "save_kind", "game") or "game") == "game":
        needs_cfg = parse_needs_config(blueprint)

    needs = None
    needs_meta = None
    treat_self = None
    if needs_cfg:
        nv = needs_values_from_profile(profile)
        needs = NeedsOverview(**nv)
        needs_meta = NeedsMetaOverview(
            character_label=needs_cfg.get("character_label"),
            consequence_profile=str(needs_cfg.get("consequence_profile") or "standard"),
            thresholds=dict(needs_cfg.get("thresholds") or {}),
            player_support=dict(needs_cfg.get("player_support") or {}),
        )
        ts_av = treat_self_availability(
            needs_cfg,
            period_index=int(profile.period_index or 0),
            last_period_index=int(getattr(profile, "treat_self_last_period_index", 0) or 0),
        )
        options_norm = normalize_treat_self_options(
            needs_cfg,
            monthly_salary=float(monthly_income or 0),
        )
        treat_self = TreatSelfOverview(
            available=bool(ts_av.get("available")),
            cooldown_periods_remaining=int(ts_av.get("cooldown_periods_remaining") or 0),
            options=[
                TreatSelfOptionOverview(
                    id=str(o.get("id") or ""),
                    title=str(o.get("title") or ""),
                    subtitle=o.get("subtitle"),
                    cost=float(o.get("cost") or 0),
                    needs_delta=NeedsOverview(**(o.get("needs_delta") or {})),
                )
                for o in options_norm
                if isinstance(o, dict)
            ],
        )

    return FinanceOverview(
        salary=SalaryProfileResponse(
            monthly_amount=salary.monthly_amount if salary else 0,
            monthly_receipts_count=salary.monthly_receipts_count if salary else 1,
        ),
        liabilities=liabilities,
        assets=assets,
        total_monthly_income=round(total_income, 2),
        total_monthly_liabilities_payment=round(total_liability_payment, 2),
        total_monthly_assets_maintenance=round(total_asset_maintenance, 2),
        monthly_lifestyle_expense=round(max(0.0, monthly_lifestyle_expense), 2),
        monthly_burn_total=round(max(0.0, monthly_burn_total), 2),
        monthly_burn_breakdown=burn_breakdown,
        total_monthly_outflow=round(total_monthly_outflow, 2),
        expense_to_income_ratio=expense_to_income_ratio,
        net_monthly_cashflow=round(net_cashflow, 2),
        liabilities_to_income_ratio=round(liabilities_ratio, 2),
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        cash_balance=round(profile.cash_balance, 2),
        safety_fund_balance=round(profile.safety_fund_balance, 2),
        total_monthly_obligations=round(total_monthly_obligations, 2),
        total_overdue_amount=round(total_overdue_amount, 2),
        overdue_liabilities_count=overdue_liabilities_count,
        win_target_safety_fund=round(victory_result.win_target_safety_fund, 2),
        win_progress_safety_fund=round(victory_result.win_progress_safety_fund, 4),
        safety_fund_baseline_target=safety_baseline_target,
        win_ready=bool(victory_result.win_ready),
        win_reached=bool(victory_result.win_reached),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        avg_net_cashflow_6p=avg_cf_6,
        avg_net_cashflow_6p_n=avg_cf_n,
        victory=victory_overview,
        newly_unlocked=[
            AchievementUnlockEvent(**item)
            for item in newly_unlocked_raw
            if isinstance(item, dict)
        ],
        needs=needs,
        needs_meta=needs_meta,
        treat_self=treat_self,
        needs_zero_periods_streak=int(getattr(profile, "needs_zero_periods_streak", 0) or 0),
        save_kind=str(getattr(profile, "save_kind", "game") or "game"),
        onboarding_state=str(getattr(profile, "onboarding_state", "brief_done") or "brief_done"),
        onboarding_step=str(getattr(profile, "onboarding_step", "farewell") or "farewell"),
        mechanics=mechanics_permissions,
        mechanics_effective=mechanics_effective_permissions,
    )
