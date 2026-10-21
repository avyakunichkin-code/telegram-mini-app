# backend/app/game/period.py

import logging
import math
from dataclasses import dataclass, field

from sqlalchemy.orm import Session
import json

logger = logging.getLogger(__name__)

from ..models import (
    GameProfile,
    FinanceAsset,
    FinanceLiability,
    Transaction,
    InvestmentPosition,
    PeriodEconomyClosing,
    PeriodSnapshot,
    GameStarterTemplate,
    FinanceSalary,
)
from ..finance.balance_utils import adjust_balance, add_transaction, TRANSACTION_TYPES
from ..achievements.engine import process_achievement_unlocks
from ..achievements.seeds import ensure_achievement_catalog
from ..services.events.service import (
    ensure_period_events,
    expire_pending_events_for_closed_period,
    is_events_spawn_failed,
    _ensure_seed_events,
)
from ..services.insurance.service import charge_premiums_for_period
from ..finance.liability_kinds import PAYMENT_MODE_ANNUITY, effective_payment_mode
from ..finance.annuity import split_full_payment
from ..constants import EPSILON
from ..finance.expenses import compute_monthly_burn, expire_expense_lines_for_period, lifestyle_period_breakdown
from ..needs.set_point import MODEL_SET_POINT, build_set_point_snapshot
from ..needs.engine import (
    apply_decay,
    apply_wear_and_level,
    needs_values_from_profile,
    parse_needs_config,
    set_profile_needs,
)


def _apply_defeat_to_profile(profile: GameProfile) -> None:
    profile.is_active = 0
    profile.is_archived = 1
    profile.run_outcome = "defeat"


def _prev_period_closing(db: Session, profile_id: int, period_index: int) -> PeriodEconomyClosing | None:
    if int(period_index) <= 1:
        return None
    return (
        db.query(PeriodEconomyClosing)
        .filter(
            PeriodEconomyClosing.game_profile_id == profile_id,
            PeriodEconomyClosing.period_index == int(period_index) - 1,
        )
        .first()
    )


def _transactions_for_period(db: Session, profile_id: int, period_index: int) -> list[Transaction]:
    return (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile_id,
            Transaction.period_index == int(period_index),
        )
        .order_by(Transaction.id)
        .all()
    )


def _cash_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    return round(
        sum(float(t.amount) for t in _transactions_for_period(db, profile_id, period_index)),
        2,
    )


def _cash_delta(db: Session, profile_id: int, period_index: int, cash_end: float) -> float:
    """Изменение cash за весь период (зарплата, события, конец периода)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(cash_end) - float(prev.cash_balance), 2)
    return _cash_flow_from_transactions(db, profile_id, period_index)


def _safety_fund_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ == TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"]:
            delta += abs(float(t.amount))
        elif typ == TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"]:
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _safety_fund_delta(db: Session, profile_id: int, period_index: int, safety_end: float) -> float:
    """Чистое изменение подушки за период (взносы − снятия)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(safety_end) - float(prev.safety_fund_balance), 2)
    return _safety_fund_flow_from_transactions(db, profile_id, period_index)


def _invest_capital_flow(db: Session, profile_id: int, period_index: int) -> float:
    """Приток/отток капитала в инвестициях (открытие/покупка/закрытие), без капитализации %."""
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ in ("deposit_open", "bond_buy"):
            delta += abs(float(t.amount))
        elif typ == "invest_close":
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _debt_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ == "liability_disbursement":
            delta += abs(float(t.amount))
        elif typ == "liability_close":
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _debt_delta(db: Session, profile_id: int, period_index: int, debt_end: float) -> float:
    """Изменение суммы тел долгов за период (+ новый кредит, − закрытие)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(debt_end) - float(prev.total_debt_balance), 2)
    return _debt_flow_from_transactions(db, profile_id, period_index)


def _total_debt_balance(db: Session, profile_id: int) -> float:
    rows = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == profile_id,
            FinanceLiability.is_active == 1,
        )
        .order_by(FinanceLiability.id)
        .all()
    )
    return round(sum(float(row.total_debt or 0) for row in rows), 2)


def _period_income_rate(breakdown: list, snapshot: PeriodSnapshot | None) -> float:
    """Уровень дохода за период: зарплата (если забрана) + пассивные поступления."""
    income = 0.0
    if snapshot and int(snapshot.salary_claimed or 0) == 1:
        income += float(snapshot.salary_amount or 0)
    for item in breakdown or []:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "")
        if kind in ("asset_income", "invest", "bond_coupon"):
            income += float(item.get("amount") or 0)
    return round(income, 2)


def _build_period_highlights(
    *,
    expense_total: float,
    bond_coupons: float,
    deposit_interest: float,
) -> list[dict]:
    """Ключевые итоги периода для UI (без детализации расходов)."""
    highlights: list[dict] = []
    if expense_total > EPSILON:
        highlights.append(
            {
                "key": "expenses",
                "label": "Расходы списаны",
                "amount": round(expense_total, 2),
            }
        )
    if bond_coupons > EPSILON:
        highlights.append(
            {
                "key": "bond_coupons",
                "label": "Купоны по облигациям на счёт",
                "amount": round(bond_coupons, 2),
            }
        )
    if deposit_interest > EPSILON:
        highlights.append(
            {
                "key": "deposit_interest",
                "label": "Проценты на депозитах",
                "amount": round(deposit_interest, 2),
                "note": "капитализированы",
            }
        )
    return highlights


def _period_expense_total(breakdown: list) -> float:
    """Сумма расходов за период (списания с счёта по обязательствам жизни и активам)."""
    expense = 0.0
    has_category_lines = any(
        isinstance(item, dict) and str(item.get("type") or "") == "expense_category"
        for item in (breakdown or [])
    )
    for item in breakdown or []:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "")
        if kind == "liability":
            expense += float(item.get("paid") or 0)
        elif kind in ("expense_category", "insurance"):
            expense += abs(float(item.get("amount") or 0))
        elif kind == "lifestyle":
            if has_category_lines:
                continue
            expense += abs(float(item.get("amount") or 0))
        elif kind == "asset":
            expense += float(item.get("amount") or 0)
    return round(expense, 2)


def _period_compare_delta(current: float, previous: float | None) -> float:
    if previous is None:
        return 0.0
    return round(float(current) - float(previous), 2)


def _installments_outstanding(amount: float, monthly_due: float) -> int:
    """Сколько взносов (включая частично оплаченный) покрывает неоплаченная сумма."""
    if monthly_due <= EPSILON or amount <= EPSILON:
        return 0
    return int(math.ceil(round(amount / monthly_due, 6)))


@dataclass
class _PeriodClose:
    """Состояние одного закрытия месяца, которое этапы конвейера накапливают по очереди."""

    db: Session
    profile: GameProfile
    period_index: int
    breakdown: list = field(default_factory=list)
    total_spend: float = 0.0
    closed_burn_total: float = 0.0
    total_overdue_added: float = 0.0
    deposit_interest_total: float = 0.0
    bond_coupon_total: float = 0.0
    defeat_reason: str | None = None
    needs_result: dict | None = None
    liabilities: list = field(default_factory=list)


def _charge_assets(ctx: _PeriodClose) -> None:
    """1–2. Обслуживание активов (может увести в минус) и доход от активов (аренда)."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    assets = db.query(FinanceAsset).filter(
        FinanceAsset.game_profile_id == profile.id,
        FinanceAsset.is_active == 1
    ).order_by(FinanceAsset.id).all()
    for asset in assets:
        cost = float(asset.monthly_maintenance_cost)
        ctx.total_spend += cost
        ctx.breakdown.append({
            "type": "asset",
            "title": asset.title,
            "amount": cost
        })

    assets_spend = sum(float(a.monthly_maintenance_cost) for a in assets)
    if assets_spend > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-assets_spend,
            type=TRANSACTION_TYPES["ASSET_MAINTENANCE"],
            description=f"Обслуживание активов за период #{period_index}",
            period_index=period_index,
        )
        db.refresh(profile)

    assets_income = sum(float(getattr(a, "monthly_income", 0) or 0) for a in assets)
    if assets_income > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=assets_income,
            type="asset_income",
            description=f"Доход от активов за период #{period_index}",
            period_index=period_index,
        )
        db.refresh(profile)
        ctx.breakdown.append({"type": "asset_income", "title": "Доход от активов", "amount": round(assets_income, 2)})


def _pay_liabilities(ctx: _PeriodClose) -> None:
    """3. Обязательства: платим сколько есть, остаток уходит в просрочку (без штрафов на MVP)."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    ctx.liabilities = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1
    ).order_by(FinanceLiability.id).all()

    for liability in ctx.liabilities:
        monthly_due = float(liability.monthly_payment)
        previous_overdue = float(getattr(liability, "overdue_amount", 0) or 0)
        due_total = monthly_due + previous_overdue

        available = max(0.0, float(profile.cash_balance))
        paid = min(available, due_total)
        unpaid = round(due_total - paid, 2)

        if paid > 0:
            adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=-paid,
                type=TRANSACTION_TYPES["LIABILITY_PAYMENT"],
                description=f"Платёж по обязательству: {liability.title} (период #{period_index})",
                period_index=period_index,
            )
            db.refresh(profile)

        if effective_payment_mode(liability) == PAYMENT_MODE_ANNUITY:
            # Платёж гасит самые старые взносы первыми: каждый полностью закрытый взнос
            # (в т.ч. просроченный) уменьшает тело долга по графику аннуитета.
            completed = _installments_outstanding(previous_overdue, monthly_due) + 1 - _installments_outstanding(
                unpaid, monthly_due
            )
            for _ in range(max(0, completed)):
                if int(liability.is_active or 0) != 1:
                    break
                _interest, _principal, new_debt = split_full_payment(
                    float(liability.total_debt),
                    float(liability.annual_rate_percent),
                    monthly_due,
                )
                liability.total_debt = new_debt
                liability.periods_paid = int(getattr(liability, "periods_paid", 0) or 0) + 1
                term = int(getattr(liability, "term_periods", 0) or 0)
                if new_debt <= EPSILON or (term > 0 and liability.periods_paid >= term):
                    liability.is_active = 0
                    liability.total_debt = 0.0

        full_payment = unpaid <= EPSILON and paid + EPSILON >= due_total
        if full_payment:
            liability.overdue_amount = 0.0
            liability.overdue_periods = 0
        else:
            liability.overdue_amount = float(unpaid)
            if unpaid > EPSILON:
                liability.overdue_periods = int(getattr(liability, "overdue_periods", 0) or 0) + 1
                ctx.total_overdue_added += unpaid
            else:
                liability.overdue_periods = 0

        ctx.breakdown.append({
            "type": "liability",
            "title": liability.title,
            "due": due_total,
            "paid": paid,
            "unpaid": unpaid,
        })


def _charge_lifestyle(ctx: _PeriodClose) -> None:
    """3.4. Расходы на жизнь (статьи бюджета + legacy delta)."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    expire_expense_lines_for_period(db, profile, period_index)
    burn_snapshot = compute_monthly_burn(db, profile)
    lifestyle_total = float(burn_snapshot.total)
    ctx.closed_burn_total = round(lifestyle_total, 2)
    if lifestyle_total <= 0:
        return
    adjust_balance(
        db=db,
        game_profile_id=profile.id,
        amount=-lifestyle_total,
        type=TRANSACTION_TYPES["LIFESTYLE_EXPENSE"],
        description=f"Расходы на жизнь за период #{period_index}",
        period_index=period_index,
    )
    db.refresh(profile)
    cat_lines = lifestyle_period_breakdown(burn_snapshot)
    if cat_lines:
        ctx.breakdown.extend(cat_lines)
        ctx.breakdown.append(
            {
                "type": "lifestyle",
                "title": "Итого расходы на жизнь",
                "amount": round(lifestyle_total, 2),
            }
        )
    else:
        ctx.breakdown.append({"type": "lifestyle", "title": "Расходы «жизни»", "amount": round(lifestyle_total, 2)})


def _charge_insurance(ctx: _PeriodClose) -> None:
    """3.5. Страховые премии (без просрочек — может уйти в минус); сбой откатывается savepoint'ом."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    try:
        with db.begin_nested():
            insurance_spend = float(charge_premiums_for_period(db, profile, period_index) or 0)
        if insurance_spend > 0:
            ctx.breakdown.append({"type": "insurance", "title": "Премии", "amount": insurance_spend})
    except Exception:
        # Savepoint откатил частично списанные премии; закрытие месяца продолжается.
        logger.exception(
            "Insurance premiums failed profile_id=%s period_index=%s", profile.id, period_index
        )
        db.refresh(profile)


def _accrue_investments(ctx: _PeriodClose, invest_positions: list) -> None:
    """3.6. Депозит — капитализация, облигации — купон на баланс."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    for pos in invest_positions:
        last_accrued = int(pos.last_accrued_period or 0)
        if last_accrued >= int(period_index):
            continue
        periods_to_accrue = int(period_index) - last_accrued
        if periods_to_accrue <= 0:
            continue

        monthly_rate = float(pos.annual_rate_percent) / 100.0 / 12.0
        if pos.kind == "deposit":
            interest = float(pos.principal) * monthly_rate * periods_to_accrue
            pos.principal = float(pos.principal) + interest
            ctx.deposit_interest_total += interest
        elif pos.kind == "bond":
            coupon = float(pos.principal) * monthly_rate * periods_to_accrue
            if coupon != 0:
                adjust_balance(db, profile.id, +coupon, "bond_coupon", f"Купон: {pos.title}", period_index)
                db.refresh(profile)
                ctx.bond_coupon_total += coupon
        pos.last_accrued_period = int(period_index)
    if ctx.deposit_interest_total > EPSILON:
        ctx.breakdown.append(
            {
                "type": "deposit_interest",
                "title": "Проценты на депозитах",
                "amount": round(ctx.deposit_interest_total, 2),
            }
        )
    if ctx.bond_coupon_total > EPSILON:
        ctx.breakdown.append(
            {
                "type": "bond_coupon",
                "title": "Купоны по облигациям",
                "amount": round(ctx.bond_coupon_total, 2),
            }
        )


def _apply_cash_streak(ctx: _PeriodClose) -> None:
    """4. Отрицательный баланс: 3 месяца подряд → поражение `cash_negative_streak`."""
    profile, period_index = ctx.profile, ctx.period_index
    if profile.cash_balance >= 0:
        profile.negative_periods_count = 0
        return
    profile.negative_periods_count += 1
    if profile.negative_periods_count >= 3:
        _apply_defeat_to_profile(profile)
        ctx.defeat_reason = "cash_negative_streak"
        add_transaction(
            db=ctx.db,
            game_profile_id=profile.id,
            amount=0,
            type=TRANSACTION_TYPES["GAME_OVER"],
            description=f"Поражение: 3 периода подряд с отрицательным балансом (период #{period_index})",
            period_index=period_index,
        )


def _apply_needs_decay(ctx: _PeriodClose) -> None:
    """4.2. Потребности: decay + streak нулей; 3 месяца подряд → поражение `needs_depletion` (ADR-005)."""
    db, profile, period_index = ctx.db, ctx.profile, ctx.period_index
    try:
        if str(getattr(profile, "save_kind", "game") or "game") != "game" or int(profile.is_active or 0) != 1:
            return
        tk = str(getattr(profile, "starter_template_key", "") or "")
        tmpl = (
            db.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == tk).first()
            if tk
            else None
        )
        blueprint = {}
        if tmpl is not None:
            try:
                blueprint = json.loads(tmpl.blueprint_json or "{}")
            except Exception:
                blueprint = {}
        cfg = parse_needs_config(blueprint)
        if not cfg:
            return
        before = needs_values_from_profile(profile)
        sp_snap = None
        if cfg.get("model") == MODEL_SET_POINT:
            # ADR-015: износ рутиной + притяжение к уровню жизни (статьи после списания и истечения).
            salary_row = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
            sp_snap = build_set_point_snapshot(
                db,
                profile,
                cfg,
                blueprint,
                salary=float(salary_row.monthly_amount if salary_row else 0),
                needs_now=before,
            )
            sp = cfg["set_point"]
            dec = apply_wear_and_level(
                before,
                level=sp_snap.level,
                wear=sp_snap.wear,
                rate=float(sp["adaptation_rate"]),
                zero_threshold=float(sp["zero_threshold"]),
                distressed=int(cfg.get("thresholds", {}).get("distressed") or 30),
            )
        else:
            dec = apply_decay(cfg, before)
        set_profile_needs(profile, dec.after)

        if dec.has_zero_after:
            profile.needs_zero_periods_streak = int(getattr(profile, "needs_zero_periods_streak", 0) or 0) + 1
        else:
            profile.needs_zero_periods_streak = 0

        if int(getattr(profile, "needs_zero_periods_streak", 0) or 0) >= 3:
            _apply_defeat_to_profile(profile)
            ctx.defeat_reason = "needs_depletion"
            add_transaction(
                db=db,
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description=f"Поражение: потребности на нуле 3 месяца подряд (период #{period_index})",
                period_index=period_index,
            )

        ctx.needs_result = {
            "before": before,
            "after": dec.after,
            "decay": dec.decay,
            "min_axis": dec.min_axis,
            "has_zero": dec.has_zero_after,
            "streak": int(getattr(profile, "needs_zero_periods_streak", 0) or 0),
            "model": cfg.get("model") or "linear",
        }
        if sp_snap is not None:
            ctx.needs_result["level"] = sp_snap.level
            ctx.needs_result["wear"] = sp_snap.wear
    except Exception:
        logger.exception("Needs processing failed profile_id=%s period_index=%s", profile.id, period_index)
        db.refresh(profile)


def _spawn_next_period_events(db: Session, profile: GameProfile) -> bool:
    """8. Пул событий нового периода. Возвращает True, если спавн сломался (не ломает закрытие)."""
    try:
        _ensure_seed_events(db)
        spawn_status = ensure_period_events(
            db, profile.id, profile.period_index, profile.save_kind
        )
        return is_events_spawn_failed(spawn_status)
    except Exception:
        # События не должны ломать завершение периода, но молчаливый pass прячет поломку пула.
        logger.exception(
            "Period event pool failed after close profile_id=%s period_index=%s",
            profile.id,
            profile.period_index,
        )
        return True


def process_period_end(db: Session, profile: GameProfile) -> dict:
    """
    «Завершить ход» (TB1): экономика периода одним конвейером этапов, затем commit и side effects.

    Порядок этапов — часть контракта (баланс на момент платежа зависит от предыдущих списаний):
    активы → обязательства → расходы на жизнь → страховки → инвестиции → streak минуса →
    потребности → снимок PeriodEconomyClosing / guidance / достижения → period_index += 1 → commit →
    admin alerts → события нового периода.

    Возвращает словарь для `period_close_summary` (services/period/close.py).
    """
    period_index = int(profile.period_index)
    # Позиции читаем до списаний: начисление идёт по состоянию на начало закрытия.
    invest_positions = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
        )
        .order_by(InvestmentPosition.id)
        .all()
    )
    ctx = _PeriodClose(db=db, profile=profile, period_index=period_index)

    _charge_assets(ctx)
    _pay_liabilities(ctx)
    _charge_lifestyle(ctx)
    _charge_insurance(ctx)
    _accrue_investments(ctx, invest_positions)
    _apply_cash_streak(ctx)
    _apply_needs_decay(ctx)

    # 5. Снимок на конец периода для аналитики + счётчик «чистых» месяцев без просрочек
    breakdown = ctx.breakdown
    snapshot = (
        db.query(PeriodSnapshot)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.period_index == period_index,
        )
        .first()
    )
    current_income_rate = _period_income_rate(breakdown, snapshot)
    current_expense_total = _period_expense_total(breakdown)
    debt_after = _total_debt_balance(db, profile.id)
    cash_end = float(profile.cash_balance)
    safety_end = float(profile.safety_fund_balance)

    prev_closing = _prev_period_closing(db, profile.id, period_index)
    prev_income = float(prev_closing.period_income_rate) if prev_closing else None
    prev_expense = float(prev_closing.period_expense_total) if prev_closing else None

    income_delta = _period_compare_delta(current_income_rate, prev_income)
    expense_delta = _period_compare_delta(current_expense_total, prev_expense)
    cash_delta = _cash_delta(db, profile.id, period_index, cash_end)
    safety_fund_delta = _safety_fund_delta(db, profile.id, period_index, safety_end)
    invest_capital_delta = _invest_capital_flow(db, profile.id, period_index)
    debt_delta = _debt_delta(db, profile.id, period_index, debt_after)

    total_overdue_now = round(sum(float(li.overdue_amount or 0) for li in ctx.liabilities), 2)
    if total_overdue_now <= 1e-8:
        profile.clean_period_streak = int(getattr(profile, "clean_period_streak", 0) or 0) + 1
    else:
        profile.clean_period_streak = 0

    salary_claimed = snapshot is not None and int(snapshot.salary_claimed or 0) == 1
    try:
        from ..guidance.engine import on_period_closed_guidance, update_nudge_streaks_on_period_close

        # Savepoint, как у достижений: DB-ошибка хука не должна ломать транзакцию закрытия периода.
        with db.begin_nested():
            update_nudge_streaks_on_period_close(
                profile,
                salary_claimed=salary_claimed,
                cash_end=cash_end,
            )
            on_period_closed_guidance(db, profile.user_id, profile, period_index)
    except Exception:
        logger.warning("guidance period close hook failed profile_id=%s", profile.id, exc_info=True)
        db.refresh(profile)

    db.add(
        PeriodEconomyClosing(
            game_profile_id=int(profile.id),
            period_index=period_index,
            cash_balance=float(profile.cash_balance),
            safety_fund_balance=float(profile.safety_fund_balance),
            total_overdue_amount=float(total_overdue_now),
            monthly_burn_total=float(ctx.closed_burn_total),
            period_income_rate=float(current_income_rate),
            period_expense_total=float(current_expense_total),
            total_debt_balance=float(debt_after),
        )
    )

    expire_pending_events_for_closed_period(db, profile.id, period_index)

    achievement_unlocks: list = []
    try:
        ensure_achievement_catalog(db)
        with db.begin_nested():
            achievement_unlocks = process_achievement_unlocks(db, profile)
    except Exception:
        logger.exception(
            "Achievement unlock failed after period end profile_id=%s period_index=%s",
            profile.id,
            period_index,
        )
        db.refresh(profile)
        achievement_unlocks = []

    # 7. Новый период + commit экономики одной транзакцией
    profile.period_index += 1
    db.commit()
    db.refresh(profile)

    try:
        from ..admin.notify import process_period_admin_alerts

        net_cashflow = round(float(current_income_rate) - float(current_expense_total), 2)
        process_period_admin_alerts(
            db,
            profile,
            closed_period_index=period_index,
            economy={
                "cash_balance": round(cash_end, 2),
                "safety_fund_balance": round(safety_end, 2),
                "total_overdue_amount": total_overdue_now,
                "net_monthly_cashflow": net_cashflow,
                "salary_claimed": salary_claimed,
            },
        )
    except Exception:
        logger.warning("Admin notify failed after period end profile_id=%s", profile.id, exc_info=True)

    events_spawn_failed = _spawn_next_period_events(db, profile)

    return {
        "closed_period_index": period_index,
        "cash_delta": cash_delta,
        "income_delta": income_delta,
        "expense_delta": expense_delta,
        "safety_fund_delta": safety_fund_delta,
        "invest_capital_delta": invest_capital_delta,
        "debt_delta": debt_delta,
        "total_spent": ctx.total_spend,
        "breakdown": breakdown,
        "new_balance": profile.cash_balance,
        "negative_streak": profile.negative_periods_count,
        "game_over": profile.is_active == 0,
        "defeat_reason": ctx.defeat_reason,
        "needs": ctx.needs_result,
        "overdue_added": round(ctx.total_overdue_added, 2),
        "achievement_unlocks": achievement_unlocks,
        "period_highlights": _build_period_highlights(
            expense_total=current_expense_total,
            bond_coupons=ctx.bond_coupon_total,
            deposit_interest=ctx.deposit_interest_total,
        ),
        "events_spawn_failed": bool(events_spawn_failed),
    }
