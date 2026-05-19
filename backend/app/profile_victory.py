"""Оценка победы для профиля (общая логика с finance overview)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import FinanceAsset, FinanceLiability, FinanceSalary, GameProfile, GameStarterTemplate
from .finance_analytics import avg_net_cashflow_last_closed_intervals
from .expenses import compute_monthly_burn
from .victory_engine import VictoryEvaluationInput, evaluate_victory, parse_victory_config
from .victory_seeds import DEFAULT_TEMPLATE_KEY


def profile_win_reached(db: Session, profile: GameProfile) -> bool:
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = float(salary.monthly_amount if salary else 0)

    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets_orm = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )

    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)
    total_liability_payment = sum(float(l.monthly_payment or 0) for l in liabilities_orm)
    total_asset_maintenance = sum(float(a.monthly_maintenance_cost or 0) for a in assets_orm)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    total_income = monthly_income + assets_income
    net_cashflow = total_income - total_monthly_obligations
    total_overdue_amount = sum(float(l.overdue_amount or 0) for l in liabilities_orm)

    avg_cf_6, avg_cf_n = avg_net_cashflow_last_closed_intervals(db, profile.id, max_intervals=6)

    template_key = getattr(profile, "starter_template_key", None) or DEFAULT_TEMPLATE_KEY
    template_row = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == template_key)
        .first()
    )
    if template_row:
        template_key = template_row.template_key
        raw_victory = template_row.victory_config_json
    else:
        raw_victory = None

    monthly_burn_total = float(compute_monthly_burn(db, profile).total)

    victory_cfg = parse_victory_config(raw_victory, template_key=template_key)
    victory_result = evaluate_victory(
        victory_cfg,
        VictoryEvaluationInput(
            period_index=int(profile.period_index),
            safety_fund_balance=float(profile.safety_fund_balance),
            cash_balance=float(profile.cash_balance),
            total_monthly_obligations=float(total_monthly_obligations),
            total_overdue_amount=float(total_overdue_amount),
            net_monthly_cashflow=float(net_cashflow),
            character_level=max(1, int(getattr(profile, "level", 1) or 1)),
            monthly_salary=float(salary.monthly_amount if salary else 0),
            monthly_burn_total=monthly_burn_total,
            avg_net_cashflow_6p=float(avg_cf_6),
            avg_net_cashflow_6p_n=int(avg_cf_n),
        ),
        template_key=template_key,
    )
    return bool(victory_result.win_reached)
