from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import (
    FinanceSalary,
    FinanceLiability,
    FinanceAsset,
    Transaction,
    PeriodEconomyClosing,
    AssetTemplate,
    LiabilityTemplate,
    GameStarterTemplate,
)
from ..balance_utils import adjust_balance, adjust_safety_fund_balance
from ..finance_helpers import monthly_interest_payment
from ..game_time import get_active_game_profile, sync_time, get_seconds_until_next
from ..achievement_engine import process_achievement_unlocks
from ..achievement_seeds import ensure_achievement_catalog
from ..character_progression import character_xp_need_for_next_level
from ..victory_engine import VictoryEvaluationInput, evaluate_victory, parse_victory_config
from ..victory_seeds import DEFAULT_TEMPLATE_KEY
from ..schemas import (
    SalaryProfileUpdate,
    SalaryProfileResponse,
    LiabilityCreate,
    LiabilityResponse,
    AssetCreate,
    AssetResponse,
    FinanceOverview,
    VictoryOverview,
    VictoryGoalOverview,
    AnalyticsTimeseriesPoint,
    FinanceAnalyticsTimeseriesResponse,
)

router = APIRouter(prefix="/api/finance", tags=["finance"])

EPSILON = 1e-6


def _liquid_snapshot_total(row: PeriodEconomyClosing) -> float:
    return float(row.cash_balance or 0) + float(row.safety_fund_balance or 0)


def _avg_net_cashflow_last_closed_intervals(
    db: Session, game_profile_id: int, max_intervals: int = 6
) -> tuple[float, int]:
    """
    Среднее Δ(наличные + подушка) между соседними снимками закрытия периода.
    Берём до max_intervals последних интервалов (нужно ≥2 снимка в окне).
    """
    limit = max_intervals + 1
    rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == game_profile_id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(limit)
        .all()
    )
    if len(rows) < 2:
        return 0.0, 0
    ascending = list(reversed(rows))
    deltas: List[float] = []
    for i in range(1, len(ascending)):
        deltas.append(_liquid_snapshot_total(ascending[i]) - _liquid_snapshot_total(ascending[i - 1]))
    tail = deltas[-max_intervals:]
    if not tail:
        return 0.0, 0
    return round(sum(tail) / len(tail), 2), len(tail)


def _cash_required_to_close(liability: FinanceLiability) -> float:
    return float(liability.overdue_amount or 0) + float(liability.total_debt or 0)


def _get_or_create_salary_profile(db: Session, game_profile_id: int) -> FinanceSalary:
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == game_profile_id).first()
    if salary:
        return salary

    salary = FinanceSalary(game_profile_id=game_profile_id, monthly_amount=0, monthly_receipts_count=1)
    db.add(salary)
    db.commit()
    db.refresh(salary)
    return salary


def _compute_gamification(net_cashflow: float, liabilities_ratio: float, assets_count: int) -> tuple[int, str, int]:
    score = 0
    if net_cashflow > 0:
        score += min(50, int(net_cashflow // 1000) * 5)
    if liabilities_ratio <= 20:
        score += 30
    elif liabilities_ratio <= 35:
        score += 20
    elif liabilities_ratio <= 50:
        score += 10
    score += min(20, assets_count * 5)
    score = max(0, min(100, score))

    if score >= 80:
        level = "Финансовый стратег"
    elif score >= 55:
        level = "Уверенный планировщик"
    elif score >= 30:
        level = "Начинающий инвестор"
    else:
        level = "Финансовый новичок"

    xp_to_next = 0 if score >= 100 else 100 - score
    return score, level, xp_to_next


@router.put("/salary", response_model=SalaryProfileResponse)
async def upsert_salary_profile(
    payload: SalaryProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.monthly_amount < 0:
        raise HTTPException(status_code=400, detail="monthly_amount must be >= 0")
    if payload.monthly_receipts_count <= 0:
        raise HTTPException(status_code=400, detail="monthly_receipts_count must be > 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    if game_profile.base_params_locked == 1:
        raise HTTPException(status_code=400, detail="Base parameters are locked after game start")
    profile = _get_or_create_salary_profile(db, game_profile.id)
    profile.monthly_amount = payload.monthly_amount
    profile.monthly_receipts_count = payload.monthly_receipts_count
    db.commit()
    db.refresh(profile)

    return SalaryProfileResponse(
        monthly_amount=profile.monthly_amount,
        monthly_receipts_count=profile.monthly_receipts_count,
    )


@router.post("/liabilities", response_model=LiabilityResponse)
async def create_liability(
    payload: LiabilityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.total_debt < 0 or payload.annual_rate_percent < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    mp = monthly_interest_payment(payload.total_debt, payload.annual_rate_percent)
    liability = FinanceLiability(
        title=(payload.title or "Обязательство").strip() or "Обязательство",
        total_debt=payload.total_debt,
        annual_rate_percent=payload.annual_rate_percent,
        monthly_payment=mp,
        game_profile_id=game_profile.id,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


@router.get("/liabilities", response_model=list[LiabilityResponse])
async def list_liabilities(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == game_profile.id)
        .order_by(FinanceLiability.created_at.desc())
        .all()
    )


@router.get("/transactions")
async def get_transactions(
        limit: int = 50,
        offset: int = 0,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = get_active_game_profile(db, current_user.id)
    transactions = db.query(Transaction).filter(
        Transaction.game_profile_id == profile.id
    ).order_by(Transaction.timestamp.desc()).offset(offset).limit(limit).all()

    return [
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "description": t.description,
            "period_index": t.period_index,
            "timestamp": t.timestamp.isoformat()
        }
        for t in transactions
    ]


@router.delete("/liabilities/{liability_id}")
async def delete_liability(
    liability_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    liability = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.id == liability_id,
            FinanceLiability.game_profile_id == game_profile.id,
        )
        .first()
    )
    if not liability:
        raise HTTPException(status_code=404, detail="Liability not found")

    due = round(_cash_required_to_close(liability), 2)
    if due > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < due:
            raise HTTPException(
                status_code=400,
                detail="Недостаточно средств на счёте, чтобы вернуть тело долга и погасить просрочку",
            )
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-due,
            type="liability_close",
            description=f"Закрытие обязательства: {liability.title}",
            period_index=int(game_profile.period_index),
        )
    db.delete(liability)
    db.commit()
    return {"status": "success", "deleted_id": liability_id}


@router.post("/liabilities/from-template", response_model=LiabilityResponse)
async def create_liability_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = (payload.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == key, LiabilityTemplate.is_active == 1)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found or inactive")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    principal = float(tpl.total_debt)
    rate = float(tpl.annual_rate_percent)
    mp = monthly_interest_payment(principal, rate)

    adjust_balance(
        db=db,
        game_profile_id=game_profile.id,
        amount=principal,
        type="liability_disbursement",
        description=f"Получение кредита: {tpl.title}",
        period_index=int(game_profile.period_index),
    )

    liability = FinanceLiability(
        game_profile_id=game_profile.id,
        title=tpl.title,
        total_debt=principal,
        annual_rate_percent=rate,
        monthly_payment=mp,
        overdue_amount=0,
        overdue_periods=0,
        is_active=1,
    )
    db.add(liability)
    db.commit()
    db.refresh(liability)
    return liability


@router.post("/assets", response_model=AssetResponse)
async def create_asset(
    payload: AssetCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.asset_value < 0 or payload.monthly_maintenance_cost < 0 or payload.monthly_income < 0:
        raise HTTPException(status_code=400, detail="Numeric values must be >= 0")

    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    if int(game_profile.base_params_locked) == 1 and payload.asset_value > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < float(payload.asset_value):
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-float(payload.asset_value),
            type="asset_purchase",
            description=f"Покупка актива: {(payload.title or 'Актив').strip()}",
            period_index=int(game_profile.period_index),
        )

    asset = FinanceAsset(
        title=(payload.title or "Актив").strip() or "Актив",
        kind=(payload.kind or "generic").strip() or "generic",
        asset_value=payload.asset_value,
        monthly_maintenance_cost=payload.monthly_maintenance_cost,
        monthly_income=payload.monthly_income,
        game_profile_id=game_profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/assets", response_model=list[AssetResponse])
async def list_assets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == game_profile.id)
        .order_by(FinanceAsset.created_at.desc())
        .all()
    )


def _templates_db_session(db: Session):
    rows = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.is_active == 1)
        .order_by(AssetTemplate.sort_order.asc(), AssetTemplate.id.asc())
        .all()
    )
    return [
        {
            "key": t.template_key,
            "title": t.title,
            "kind": t.kind,
            "asset_value": float(t.asset_value),
            "monthly_maintenance_cost": float(t.monthly_maintenance_cost),
            "monthly_income": float(t.monthly_income or 0),
        }
        for t in rows
    ]


@router.get("/asset-templates")
async def list_asset_templates(db: Session = Depends(get_db)):
    return _templates_db_session(db)


@router.get("/liability-templates")
async def list_liability_templates(db: Session = Depends(get_db)):
    rows = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.is_active == 1)
        .order_by(LiabilityTemplate.sort_order.asc(), LiabilityTemplate.id.asc())
        .all()
    )
    out = []
    for t in rows:
        td = float(t.total_debt)
        ar = float(t.annual_rate_percent)
        mp = monthly_interest_payment(td, ar)
        out.append({
            "key": t.template_key,
            "title": t.title,
            "total_debt": td,
            "annual_rate_percent": ar,
            "monthly_payment": mp,
        })
    return out


@router.post("/assets/from-template", response_model=AssetResponse)
async def create_asset_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key = (payload.get("key") or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    tpl_row = db.query(AssetTemplate).filter(AssetTemplate.template_key == key, AssetTemplate.is_active == 1).first()
    if not tpl_row:
        raise HTTPException(status_code=404, detail="Template not found")
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)

    cost = float(tpl_row.asset_value)
    if cost > EPSILON:
        if float(game_profile.cash_balance) + EPSILON < cost:
            raise HTTPException(status_code=400, detail="Недостаточно средств на счёте для покупки актива")
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=-cost,
            type="asset_purchase",
            description=f"Покупка актива из каталога: {tpl_row.title}",
            period_index=int(game_profile.period_index),
        )

    asset = FinanceAsset(
        title=tpl_row.title,
        kind=tpl_row.kind,
        asset_value=cost,
        monthly_maintenance_cost=float(tpl_row.monthly_maintenance_cost),
        monthly_income=float(tpl_row.monthly_income or 0),
        game_profile_id=game_profile.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return AssetResponse(
        id=asset.id,
        title=asset.title,
        kind=asset.kind,
        asset_value=asset.asset_value,
        monthly_maintenance_cost=asset.monthly_maintenance_cost,
        monthly_income=asset.monthly_income,
        created_at=asset.created_at,
    )


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    asset = (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.id == asset_id,
            FinanceAsset.game_profile_id == game_profile.id,
        )
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    sale = float(asset.asset_value or 0)
    if sale > EPSILON:
        adjust_balance(
            db=db,
            game_profile_id=game_profile.id,
            amount=sale,
            type="asset_sale",
            description=f"Продажа актива: {asset.title}",
            period_index=int(game_profile.period_index),
        )
    db.delete(asset)
    db.commit()
    return {"status": "success", "deleted_id": asset_id}


@router.get("/overview", response_model=FinanceOverview)
async def finance_overview(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    try:
        ensure_achievement_catalog(db)
        process_achievement_unlocks(db, profile)
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = salary.monthly_amount if salary else 0

    # Преобразуем обязательства в Pydantic-схемы
    liabilities_orm = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1
    ).all()
    liabilities = [
        LiabilityResponse(
            id=l.id,
            title=l.title,
            total_debt=l.total_debt,
            annual_rate_percent=l.annual_rate_percent,
            monthly_payment=l.monthly_payment,
            overdue_amount=float(getattr(l, "overdue_amount", 0) or 0),
            overdue_periods=int(getattr(l, "overdue_periods", 0) or 0),
            created_at=l.created_at
        ) for l in liabilities_orm
    ]

    # Преобразуем активы в Pydantic-схемы
    assets_orm = db.query(FinanceAsset).filter(
        FinanceAsset.game_profile_id == profile.id,
        FinanceAsset.is_active == 1
    ).all()
    assets = [
        AssetResponse(
            id=a.id,
            title=a.title,
            kind=getattr(a, "kind", "generic") or "generic",
            asset_value=a.asset_value,
            monthly_maintenance_cost=a.monthly_maintenance_cost,
            monthly_income=float(getattr(a, "monthly_income", 0) or 0),
            created_at=a.created_at
        ) for a in assets_orm
    ]

    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)

    total_liability_payment = sum(l.monthly_payment for l in liabilities)
    total_asset_maintenance = sum(a.monthly_maintenance_cost for a in assets)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    total_income = monthly_income + assets_income
    net_cashflow = total_income - total_monthly_obligations
    liabilities_ratio = (total_liability_payment / total_income * 100) if total_income > 0 else 0
    total_overdue_amount = sum(float(l.overdue_amount or 0) for l in liabilities_orm)
    overdue_liabilities_count = sum(1 for l in liabilities_orm if float(getattr(l, "overdue_amount", 0) or 0) > 0)

    score, level, xp_to_next = _compute_gamification(net_cashflow, liabilities_ratio, len(assets))

    avg_cf_6, avg_cf_n = _avg_net_cashflow_last_closed_intervals(db, profile.id, max_intervals=6)

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
            avg_net_cashflow_6p=float(avg_cf_6),
            avg_net_cashflow_6p_n=int(avg_cf_n),
        ),
        template_key=template_key,
    )
    win_target_safety_fund = victory_result.win_target_safety_fund
    win_progress_safety_fund = victory_result.win_progress_safety_fund
    win_ready = victory_result.win_ready
    win_reached = victory_result.win_reached

    victory_overview = VictoryOverview(
        schema_version=victory_result.schema_version,
        template_key=victory_result.template_key,
        min_period_index=victory_result.min_period_index,
        period_gate_open=victory_result.period_gate_open,
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
            )
            for g in victory_result.goals
        ],
    )

    return FinanceOverview(
        salary=SalaryProfileResponse(
            monthly_amount=salary.monthly_amount if salary else 0,
            monthly_receipts_count=salary.monthly_receipts_count if salary else 1
        ),
        liabilities=liabilities,
        assets=assets,
        total_monthly_income=round(total_income, 2),
        total_monthly_liabilities_payment=round(total_liability_payment, 2),
        total_monthly_assets_maintenance=round(total_asset_maintenance, 2),
        net_monthly_cashflow=round(net_cashflow, 2),
        liabilities_to_income_ratio=round(liabilities_ratio, 2),
        gamification_level=level,
        score=score,
        xp_to_next_level=xp_to_next,
        character_level=max(1, int(getattr(profile, "level", 1) or 1)),
        character_xp=max(0, int(getattr(profile, "xp", 0) or 0)),
        character_xp_need_for_next=character_xp_need_for_next_level(profile.level),
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        cash_balance=round(profile.cash_balance, 2),
        safety_fund_balance=round(profile.safety_fund_balance, 2),
        total_monthly_obligations=round(total_monthly_obligations, 2),
        total_overdue_amount=round(total_overdue_amount, 2),
        overdue_liabilities_count=overdue_liabilities_count,
        win_target_safety_fund=round(win_target_safety_fund, 2),
        win_progress_safety_fund=round(win_progress_safety_fund, 4),
        win_ready=bool(win_ready),
        win_reached=bool(win_reached),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        avg_net_cashflow_6p=avg_cf_6,
        avg_net_cashflow_6p_n=avg_cf_n,
        victory=victory_overview,
    )


@router.get("/analytics/timeseries", response_model=FinanceAnalyticsTimeseriesResponse)
async def finance_analytics_timeseries(
    limit: int = 48,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    limit = max(4, min(120, limit))

    closings_rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(limit)
        .all()
    )
    closings_rows = list(reversed(closings_rows))

    liabilities_orm = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1,
    ).all()
    total_overdue_now = round(sum(float(l.overdue_amount or 0) for l in liabilities_orm), 2)

    points: List[AnalyticsTimeseriesPoint] = [
        AnalyticsTimeseriesPoint(
            period_index=int(r.period_index),
            cash_balance=round(float(r.cash_balance), 2),
            safety_fund_balance=round(float(r.safety_fund_balance), 2),
            total_overdue_amount=round(float(r.total_overdue_amount), 2),
            is_projection=False,
        )
        for r in closings_rows
    ]

    points.append(
        AnalyticsTimeseriesPoint(
            period_index=int(profile.period_index),
            cash_balance=round(float(profile.cash_balance), 2),
            safety_fund_balance=round(float(profile.safety_fund_balance), 2),
            total_overdue_amount=total_overdue_now,
            is_projection=True,
        )
    )

    return FinanceAnalyticsTimeseriesResponse(
        current_period_index=int(profile.period_index),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        points=points,
    )
