from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..auth import get_current_user
from ..database import get_db
from ..game_period import process_period_end
from .events import pending_mandatory_blocking_event_titles
from ..models import GameProfile, FinanceSalary, FinanceAsset, FinanceLiability, Transaction, GameStarterTemplate
from ..finance_helpers import monthly_interest_payment
from ..schemas import (
    GameProfileCreate,
    GameProfileResponse,
    TimeConfigUpdate,
    TimeStatusResponse,
    GameStartRequest,
    GameStartResponse,
    AssetCreate,
    LiabilityCreate,
    GameStarterTemplatePublic,
    OnboardingPatchRequest,
    OnboardingPatchResponse,
    PeriodCloseBreakdownItem,
    PeriodCloseSummary,
    AchievementUnlockEvent,
)
from ..expense_template_defaults import default_plan_expense_budget, expense_budget_for_template
from ..expenses import ensure_expense_category_catalog, seed_expense_lines_from_budget
from ..game_start_validation import validate_game_start_request
from ..timeutil import utc_now_naive
from ..game_time import (
    get_active_game_profile,
    sync_time,
    set_time_state,
    next_period,
    set_period_duration,
    get_seconds_until_next,
)

router = APIRouter(prefix="/api/game", tags=["game"])


def _validate_save_kind(save_kind: str) -> str:
    normalized = (save_kind or "").strip().lower()
    if normalized not in ("game", "plan"):
        raise HTTPException(status_code=400, detail="save_kind must be 'game' or 'plan'")
    return normalized


def _starter_template_public(row: GameStarterTemplate) -> GameStarterTemplatePublic:
    from ..starter_template_presentation import (
        compare_note_from_blueprint,
        highlights_from_blueprint,
        parse_blueprint_json,
        scenario_icon_from_blueprint,
    )

    bp = parse_blueprint_json(row.blueprint_json)
    desc: Optional[str] = None
    raw = bp.get("description")
    if isinstance(raw, str) and raw.strip():
        desc = raw.strip()
    tk = row.template_key
    return GameStarterTemplatePublic(
        template_key=tk,
        title=row.title,
        difficulty_rank=int(row.difficulty_rank or 1),
        description=desc,
        highlights=highlights_from_blueprint(
            bp,
            base_monthly_lifestyle_expense=float(row.base_monthly_lifestyle_expense or 0),
        ),
        scenario_icon=scenario_icon_from_blueprint(bp, tk),
        compare_note=compare_note_from_blueprint(bp, tk),
    )


@router.get("/templates", response_model=list[GameStarterTemplatePublic])
async def list_game_templates(
    for_save_kind: Optional[str] = Query(
        None,
        description="Фильтр каталога: game | plan. Без параметра — только шаблоны Game.",
    ),
    db: Session = Depends(get_db),
):
    q = db.query(GameStarterTemplate).filter(GameStarterTemplate.is_active == 1)
    if for_save_kind:
        sk = for_save_kind.strip().lower()
        if sk not in ("game", "plan"):
            raise HTTPException(status_code=400, detail="for_save_kind must be 'game' or 'plan'")
        q = q.filter(
            or_(
                GameStarterTemplate.applies_to_save_kind == sk,
                GameStarterTemplate.applies_to_save_kind == "any",
            )
        )
    else:
        q = q.filter(
            or_(
                GameStarterTemplate.applies_to_save_kind == "game",
                GameStarterTemplate.applies_to_save_kind == "any",
            )
        )
    rows = q.order_by(GameStarterTemplate.sort_order.asc(), GameStarterTemplate.id.asc()).all()
    return [_starter_template_public(r) for r in rows]


@router.get("/profiles", response_model=list[GameProfileResponse])
async def list_game_profiles(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(GameProfile)
        .filter(GameProfile.user_id == current_user.id, GameProfile.is_archived == 0)
        .order_by(GameProfile.created_at.desc())
        .all()
    )


@router.post("/profiles", response_model=GameProfileResponse)
async def create_game_profile(
    payload: GameProfileCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    save_kind = _validate_save_kind(payload.save_kind)
    profile_name = (payload.name or "").strip()
    if not profile_name:
        raise HTTPException(status_code=400, detail="name is required")

    has_any = db.query(GameProfile).filter(GameProfile.user_id == current_user.id).count() > 0
    if not has_any:
        db.query(GameProfile).filter(GameProfile.user_id == current_user.id).update({"is_active": 0})

    profile = GameProfile(
        user_id=current_user.id,
        name=profile_name,
        save_kind=save_kind,
        is_active=0 if has_any else 1,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    try:
        from ..admin_notify import notify_profile_created

        notify_profile_created(db, profile)
    except Exception:
        import logging

        logging.getLogger(__name__).warning(
            "Admin notify failed for profile_created", exc_info=True
        )

    return profile


_ONBOARDING_STATES = frozenset({"draft", "brief_done"})
_ONBOARDING_STEPS = frozenset(
    {"period_timer", "salary", "next_period", "safety_fund", "farewell"}
)


@router.patch("/profile/onboarding", response_model=OnboardingPatchResponse)
async def patch_profile_onboarding(
    payload: OnboardingPatchRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from ..admin_notify import (
        notify_onboarding_brief_done,
        notify_onboarding_skipped,
        notify_onboarding_step_reached,
    )

    profile = get_active_game_profile(db, current_user.id)
    prev_step = str(getattr(profile, "onboarding_step", "period_timer") or "period_timer")
    prev_state = str(profile.onboarding_state or "draft")

    if payload.onboarding_skip_count is not None:
        skip = int(payload.onboarding_skip_count)
        if skip not in (1, 2):
            raise HTTPException(status_code=400, detail="onboarding_skip_count must be 1 or 2")
        notify_onboarding_skipped(
            db,
            profile,
            skip_count=skip,
            step=prev_step,
        )

    if payload.onboarding_state is not None:
        state = payload.onboarding_state.strip()
        if state not in _ONBOARDING_STATES:
            raise HTTPException(status_code=400, detail="Invalid onboarding_state")
        profile.onboarding_state = state

    if payload.onboarding_step is not None:
        step = payload.onboarding_step.strip()
        if step not in _ONBOARDING_STEPS:
            raise HTTPException(status_code=400, detail="Invalid onboarding_step")
        profile.onboarding_step = step

    db.commit()
    db.refresh(profile)

    new_step = str(getattr(profile, "onboarding_step", "period_timer") or "period_timer")
    new_state = str(profile.onboarding_state or "draft")

    if payload.onboarding_step is not None and new_step != prev_step:
        notify_onboarding_step_reached(
            db,
            profile,
            step=new_step,
            period_index=int(profile.period_index),
        )

    if new_state == "brief_done" and prev_state != "brief_done":
        notify_onboarding_brief_done(db, profile)

    return OnboardingPatchResponse(
        onboarding_state=new_state,
        onboarding_step=new_step,
    )


@router.post("/profiles/{profile_id}/activate")
async def activate_game_profile(
    profile_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(GameProfile)
        .filter(
            GameProfile.id == profile_id,
            GameProfile.user_id == current_user.id,
            GameProfile.is_archived == 0,
        )
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Game profile not found")

    db.query(GameProfile).filter(GameProfile.user_id == current_user.id).update({"is_active": 0})
    profile.is_active = 1
    db.commit()
    return {"status": "success", "active_profile_id": profile_id}


@router.post("/start", response_model=GameStartResponse)
async def start_new_game(
    payload: GameStartRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Новый профиль:
    - **game** — только из каталога (`template_key` обязателен);
    - **plan** — мастер BaseParamsScreen без `template_key` (ручной бюджет) или опционально
      префилл из каталога plan-шаблонов.
    """
    validate_game_start_request(payload, db)
    save_kind = _validate_save_kind(payload.save_kind)

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
        GameProfile.user_id == current_user.id,
        GameProfile.is_active == 1
    ).update({"is_active": 0})

    new_profile = GameProfile(
        user_id=current_user.id,
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
        onboarding_state="draft",
        onboarding_step="period_timer",
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    salary = FinanceSalary(
        game_profile_id=new_profile.id,
        monthly_amount=monthly_salary,
        monthly_receipts_count=1
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
            is_active=1
        )
        db.add(asset)

    for liability_data in liabilities_list:
        liability = FinanceLiability(
            game_profile_id=new_profile.id,
            title=liability_data.title,
            total_debt=liability_data.total_debt,
            annual_rate_percent=liability_data.annual_rate_percent,
            monthly_payment=monthly_interest_payment(liability_data.total_debt, liability_data.annual_rate_percent),
            is_active=1
        )
        db.add(liability)

    start_transaction = Transaction(
        game_profile_id=new_profile.id,
        amount=cash_balance,
        type="initial_balance",
        description=f"Стартовый баланс при создании профиля '{new_profile.name}'",
        period_index=1
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
        from ..admin_notify import notify_game_started

        notify_game_started(db, new_profile)
    except Exception:
        import logging

        logging.getLogger(__name__).warning(
            "Admin notify failed for game_started", exc_info=True
        )

    return GameStartResponse(
        profile_id=new_profile.id,
        message=f"Игра '{new_profile.name}' успешно запущена. Баланс: {cash_balance} ₽"
    )


@router.get("/time", response_model=TimeStatusResponse)
async def get_time_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)  # Важно: синхронизируем перед возвратом
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.post("/time/play", response_model=TimeStatusResponse)
async def set_play_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    set_time_state(profile, "play")
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


@router.post("/time/pause", response_model=TimeStatusResponse)
async def set_pause_mode(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )


def _period_close_summary(period_result: dict) -> PeriodCloseSummary:
    breakdown = [
        PeriodCloseBreakdownItem(
            type=str(item.get("type") or "other"),
            title=str(item.get("title") or ""),
            amount=round(float(item.get("amount") or 0), 2),
            category_key=item.get("category_key"),
        )
        for item in (period_result.get("breakdown") or [])
        if isinstance(item, dict)
    ]
    new_level = period_result.get("new_level")
    achievement_unlocks = [
        AchievementUnlockEvent(**item)
        for item in (period_result.get("achievement_unlocks") or [])
        if isinstance(item, dict)
    ]
    return PeriodCloseSummary(
        closed_period_index=int(period_result.get("closed_period_index") or 0),
        cash_delta=round(float(period_result.get("cash_delta") or 0), 2),
        income_total=round(float(period_result.get("income_total") or 0), 2),
        expense_total=round(float(period_result.get("expense_total") or 0), 2),
        safety_fund_delta=round(float(period_result.get("safety_fund_delta") or 0), 2),
        invest_capital_delta=round(float(period_result.get("invest_capital_delta") or 0), 2),
        total_spent=round(float(period_result.get("total_spent") or 0), 2),
        new_balance=round(float(period_result.get("new_balance") or 0), 2),
        breakdown=breakdown,
        xp_earned=int(period_result.get("xp_earned") or 0),
        xp_period_close=int(period_result.get("xp_period_close") or 0),
        xp_milestone=int(period_result.get("xp_milestone") or 0),
        milestone_title=period_result.get("milestone_title"),
        xp_from_achievements=int(period_result.get("xp_from_achievements") or 0),
        achievement_unlocks=achievement_unlocks,
        level_up=bool(period_result.get("level_up")),
        new_level=int(new_level) if new_level is not None else None,
        character_level=int(period_result.get("character_level") or 1),
    )


@router.post("/time/next", response_model=TimeStatusResponse)
async def go_to_next_period(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")

    blocking = pending_mandatory_blocking_event_titles(
        db, profile.id, int(profile.period_index)
    )
    if blocking:
        titles = "», «".join(blocking[:3])
        raise HTTPException(
            status_code=400,
            detail=f"Сначала примите решение по обязательным событиям: «{titles}».",
        )

    # Завершаем текущий период
    period_result = process_period_end(db, profile)

    if period_result["game_over"]:
        raise HTTPException(
            status_code=400,
            detail="Игра окончена. Вы трижды подряд имели отрицательный баланс. Начните новую игру."
        )

    # Обновляем состояние времени
    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)

    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        period_close=_period_close_summary(period_result),
    )


@router.put("/time/config", response_model=TimeStatusResponse)
async def update_time_config(
    payload: TimeConfigUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    set_period_duration(profile, payload.period_duration_seconds)
    db.commit()
    db.refresh(profile)
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
    )
