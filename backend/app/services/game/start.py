import json
import logging
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.expense_defaults import default_plan_expense_budget, expense_budget_for_template
from ...finance.expenses import ensure_expense_category_catalog, seed_expense_lines_from_budget
from ...finance.helpers import monthly_interest_payment
from ...game.start_validation import validate_game_start_request
from ...models import (
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    GameStarterTemplate,
    Transaction,
    User,
)
from ...needs.engine import parse_needs_config, set_profile_needs
from ...schemas import AssetCreate, GameStartRequest, GameStartResponse, LiabilityCreate
from ...timeutil import utc_now_naive
from .templates import validate_save_kind

logger = logging.getLogger(__name__)


def start_new_game(db: Session, user_id: int, payload: GameStartRequest) -> GameStartResponse:
    """
    Новый профиль:
    - **game** — только из каталога (`template_key` обязателен);
    - **plan** — мастер BaseParamsScreen без `template_key` (ручной бюджет) или опционально
      префилл из каталога plan-шаблонов.
    """
    validate_game_start_request(payload, db)
    save_kind = validate_save_kind(payload.save_kind)

    user = db.query(User).filter(User.id == user_id).first()
    guidance_done = user is not None and int(getattr(user, "guidance_completed", 0) or 0) == 1

    starter_template_key = None
    base_monthly_lifestyle = 0.0
    blueprint: dict = {}
    period_duration_seconds = int(payload.period_duration_seconds)
    cash_balance = float(payload.cash_balance)
    monthly_salary = float(payload.monthly_salary)
    assets_list: List[AssetCreate] = []
    liabilities_list: List[LiabilityCreate] = []
    seeded_budget: dict[str, float] | None = None
    starter_params_json = "{}"

    tk = (payload.template_key or "").strip()
    if tk:
        tmpl = (
            db.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == tk, GameStarterTemplate.is_active == 1)
            .first()
        )
        if not tmpl:
            raise HTTPException(status_code=404, detail="starter template not found")
        try:
            blueprint = json.loads(tmpl.blueprint_json or "{}")
        except json.JSONDecodeError:
            blueprint = {}
        period_duration_seconds = int(blueprint.get("period_duration_seconds") or period_duration_seconds)
        cash_balance = float(blueprint.get("cash_balance", cash_balance))
        monthly_salary = float(blueprint.get("monthly_salary", monthly_salary))
        starter_template_key = tk
        base_monthly_lifestyle = float(tmpl.base_monthly_lifestyle_expense or 0)

        for a in blueprint.get("assets") or []:
            if isinstance(a, dict):
                assets_list.append(
                    AssetCreate(
                        title=a.get("title") or "Актив",
                        kind=a.get("kind") or "generic",
                        asset_value=float(a.get("asset_value") or 0),
                        monthly_maintenance_cost=float(a.get("monthly_maintenance_cost") or 0),
                        monthly_income=float(a.get("monthly_income") or 0),
                    )
                )
        for li in blueprint.get("liabilities") or []:
            if isinstance(li, dict):
                liabilities_list.append(
                    LiabilityCreate(
                        title=li.get("title") or "Обязательство",
                        total_debt=float(li.get("total_debt") or 0),
                        annual_rate_percent=float(li.get("annual_rate_percent") or 0),
                    )
                )

        if base_monthly_lifestyle > 0:
            seeded_budget = expense_budget_for_template(
                starter_template_key,
                base_monthly_lifestyle,
                blueprint,
                db,
            )

        if save_kind == "plan" and seeded_budget is not None:
            starter_params_json = json.dumps(
                {
                    "template_key": starter_template_key,
                    "expense_budget": seeded_budget,
                    "cash_balance": cash_balance,
                    "monthly_salary": monthly_salary,
                },
                ensure_ascii=False,
            )
    else:
        assets_list = list(payload.assets)
        liabilities_list = list(payload.liabilities)

    db.query(GameProfile).filter(
        GameProfile.user_id == user_id,
        GameProfile.is_active == 1,
    ).update({"is_active": 0})

    new_profile = GameProfile(
        user_id=user_id,
        name=payload.profile_name.strip(),
        save_kind=save_kind,
        starter_template_key=starter_template_key,
        starter_params_json=starter_params_json,
        base_monthly_lifestyle_expense=base_monthly_lifestyle,
        delta_monthly_lifestyle_expense=0,
        is_active=1,
        period_duration_seconds=period_duration_seconds,
        cash_balance=cash_balance,
        safety_fund_balance=0,
        negative_periods_count=0,
        period_index=1,
        time_state="pause",
        period_anchor_at=utc_now_naive(),
        base_params_locked=1,
        onboarding_state="brief_done" if guidance_done else "draft",
        onboarding_step="farewell" if guidance_done else "period_timer",
    )
    try:
        if save_kind == "game":
            needs_cfg = parse_needs_config(blueprint)
            if needs_cfg:
                set_profile_needs(new_profile, needs_cfg.get("initial") or {})
    except Exception:
        pass
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    salary = FinanceSalary(
        game_profile_id=new_profile.id,
        monthly_amount=monthly_salary,
        monthly_receipts_count=1,
    )
    db.add(salary)

    for asset_data in assets_list:
        asset = FinanceAsset(
            game_profile_id=new_profile.id,
            title=asset_data.title,
            kind=getattr(asset_data, "kind", None) or "generic",
            asset_value=asset_data.asset_value,
            monthly_maintenance_cost=asset_data.monthly_maintenance_cost,
            monthly_income=float(getattr(asset_data, "monthly_income", 0) or 0),
            has_tenants=int(getattr(asset_data, "has_tenants", 0) or 0),
            is_active=1,
        )
        db.add(asset)

    for liability_data in liabilities_list:
        liability = FinanceLiability(
            game_profile_id=new_profile.id,
            title=liability_data.title,
            total_debt=liability_data.total_debt,
            annual_rate_percent=liability_data.annual_rate_percent,
            monthly_payment=monthly_interest_payment(
                liability_data.total_debt, liability_data.annual_rate_percent
            ),
            is_active=1,
        )
        db.add(liability)

    start_transaction = Transaction(
        game_profile_id=new_profile.id,
        amount=cash_balance,
        type="initial_balance",
        description=f"Стартовый баланс при создании профиля '{new_profile.name}'",
        period_index=1,
    )
    db.add(start_transaction)

    if save_kind == "plan" and not tk:
        raw_budget = payload.expense_budget or {}
        budget = {
            str(k): max(0.0, float(v))
            for k, v in raw_budget.items()
            if max(0.0, float(v or 0)) > 0
        }
        if not budget and monthly_salary > 0:
            budget = default_plan_expense_budget(monthly_salary)
        budget_total = round(sum(budget.values()), 2)
        if budget_total > 0:
            new_profile.base_monthly_lifestyle_expense = budget_total
        starter_params = {
            "expense_budget": budget,
            "cash_balance": cash_balance,
            "monthly_salary": monthly_salary,
        }
        new_profile.starter_params_json = json.dumps(starter_params, ensure_ascii=False)
        if budget:
            ensure_expense_category_catalog(db)
            seed_expense_lines_from_budget(
                db,
                new_profile,
                budget,
                period_index=1,
                source_kind="plan",
                source_ref="wizard",
            )
    elif base_monthly_lifestyle > 0 and seeded_budget:
        ensure_expense_category_catalog(db)
        line_source = "plan" if save_kind == "plan" else "template"
        seed_expense_lines_from_budget(
            db,
            new_profile,
            seeded_budget,
            period_index=1,
            source_kind=line_source,
            source_ref=starter_template_key,
        )

    db.commit()

    try:
        from ...admin.notify import notify_game_started

        notify_game_started(db, new_profile)
    except Exception:
        logger.warning("Admin notify failed for game_started", exc_info=True)

    return GameStartResponse(
        profile_id=new_profile.id,
        message=f"Игра '{new_profile.name}' успешно запущена. Баланс: {cash_balance} ₽",
    )
