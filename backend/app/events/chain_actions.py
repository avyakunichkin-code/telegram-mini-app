"""
Действия цепочек над капиталом игрока (эффект `chain_action`): перестройка активов и долгов.

Цепочки A1–A3 (brief chains-proposals-2026-10-21): продать актив, погасить долги досрочно,
переложить в подушку, рефинансировать, оформить полис, оплатить из подушки, взять в кредитку.
Суммы задаются долей зарплаты (`amount_pct_salary`) или берутся из контекста цепочки
(`amount: sale_proceeds`) — что положил предыдущий шаг. `preview_chain_action` считает то же,
что применит `apply_chain_action`, для чипов до выбора (event-balance-rules §6.1).
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from fincore.annuity import monthly_interest_payment, monthly_payment, prepay_waterfall

from ..constants import EPSILON
from ..finance.balance_utils import adjust_balance, adjust_safety_fund_balance
from ..finance.liability_kinds import (
    ASSET_KIND_FOR_AUTO,
    LIABILITY_KIND_CONSUMER,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
    effective_payment_mode,
    remaining_periods,
)
from ..models import FinanceAsset, FinanceLiability, FinanceSalary, GameProfile, InsurancePolicy

ACTION_SELL_ASSET = "sell_asset"
ACTION_PREPAY_DEBTS = "prepay_debts"
ACTION_TO_SAFETY = "to_safety"
ACTION_REFINANCE = "refinance"
ACTION_BUY_POLICY = "buy_policy"
ACTION_PAY_FROM_SAFETY = "pay_from_safety"
ACTION_OPEN_CARD_DEBT = "open_card_debt"

CHAIN_ACTIONS = frozenset(
    {
        ACTION_SELL_ASSET,
        ACTION_PREPAY_DEBTS,
        ACTION_TO_SAFETY,
        ACTION_REFINANCE,
        ACTION_BUY_POLICY,
        ACTION_PAY_FROM_SAFETY,
        ACTION_OPEN_CARD_DEBT,
    }
)

# Ключи контекста, которые шаг цепочки передаёт следующему (результаты действий).
CHAIN_ACTION_CONTEXT_KEYS = ("sale_proceeds", "sold_maintenance", "liability_id", "old_payment", "new_payment")


def _rub(value: float) -> str:
    return f"{int(round(value)):,}".replace(",", " ")


def _salary(db: Session, profile: GameProfile) -> float:
    row = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    return float(row.monthly_amount) if row else 0.0


def _amount(db: Session, profile: GameProfile, spec: dict[str, Any], ctx: dict[str, Any]) -> float:
    if str(spec.get("amount") or "") == "sale_proceeds":
        return max(0.0, float(ctx.get("sale_proceeds") or 0))
    pct = spec.get("amount_pct_salary")
    if pct is not None:
        return round(_salary(db, profile) * float(pct), -1)
    return max(0.0, float(spec.get("amount") or 0))


def _active_liabilities(db: Session, profile: GameProfile) -> list[FinanceLiability]:
    return (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .order_by(FinanceLiability.annual_rate_percent.desc(), FinanceLiability.id.asc())
        .all()
    )


def _secured_asset_ids(db: Session, profile: GameProfile) -> set[int]:
    return {int(li.secured_asset_id) for li in _active_liabilities(db, profile) if li.secured_asset_id}


def _asset_to_sell(db: Session, profile: GameProfile, kind: str) -> FinanceAsset | None:
    """Актив без залога: продаём тот, что дороже всего в обслуживании (вторая машина)."""
    secured = _secured_asset_ids(db, profile)
    rows = (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.game_profile_id == profile.id,
            FinanceAsset.is_active == 1,
            FinanceAsset.kind == kind,
        )
        .order_by(FinanceAsset.monthly_maintenance_cost.desc(), FinanceAsset.id.desc())
        .all()
    )
    for row in rows:
        if int(row.id) not in secured:
            return row
    return None


def _refinance_target(db: Session, profile: GameProfile, ctx: dict[str, Any]) -> FinanceLiability | None:
    """Самый дорогой аннуитетный долг (или тот, что цепочка уже выбрала)."""
    liability_id = ctx.get("liability_id")
    if liability_id:
        row = db.get(FinanceLiability, int(liability_id))
        if row is not None and int(row.is_active or 0) == 1 and int(row.game_profile_id) == int(profile.id):
            return row
    for row in _active_liabilities(db, profile):
        if effective_payment_mode(row) == PAYMENT_MODE_ANNUITY and remaining_periods(row) > 0:
            return row
    return None


def _from_safety(profile: GameProfile, spec: dict[str, Any], amount: float) -> float:
    """Сколько из суммы закрывает подушка (use_safety: false — только со счёта)."""
    if spec.get("use_safety") is False:
        return 0.0
    return min(amount, max(0.0, float(profile.safety_fund_balance or 0)))


def _first_car(db: Session, profile: GameProfile) -> FinanceAsset | None:
    return (
        db.query(FinanceAsset)
        .filter(
            FinanceAsset.game_profile_id == profile.id,
            FinanceAsset.is_active == 1,
            FinanceAsset.kind.in_(tuple(ASSET_KIND_FOR_AUTO)),
        )
        .order_by(FinanceAsset.id.asc())
        .first()
    )


def _plan_prepay(
    db: Session, profile: GameProfile, budget: float, *, only_id: int | None = None
) -> list[tuple[FinanceLiability, float]]:
    """Раскладка досрочки: сначала самая высокая ставка. Карту (только проценты) — только целиком."""
    plan: list[tuple[FinanceLiability, float]] = []
    left = min(budget, max(0.0, float(profile.cash_balance)))
    for row in _active_liabilities(db, profile):
        if left <= EPSILON:
            break
        if only_id is not None and int(row.id) != only_id:
            continue
        to_close = float(row.overdue_amount or 0) + float(row.total_debt or 0)
        if effective_payment_mode(row) == PAYMENT_MODE_INTEREST_ONLY:
            if left + EPSILON >= to_close:
                plan.append((row, to_close))
                left -= to_close
            continue
        part = min(left, to_close)
        plan.append((row, part))
        left -= part
    return plan


def _recompute_payment(row: FinanceLiability) -> float:
    debt = float(row.total_debt or 0)
    if effective_payment_mode(row) == PAYMENT_MODE_ANNUITY:
        n_rem = remaining_periods(row)
        return monthly_payment(debt, float(row.annual_rate_percent), n_rem) if n_rem > 0 and debt > EPSILON else 0.0
    return monthly_interest_payment(debt, float(row.annual_rate_percent))


def _refinance_numbers(row: FinanceLiability, spec: dict[str, Any]) -> tuple[float, int, float, float]:
    """(новая ставка, новый остаток срока, новый платёж, комиссия)."""
    rate = max(0.0, float(row.annual_rate_percent) + float(spec.get("rate_delta_pp") or 0))
    n_rem = remaining_periods(row) + int(spec.get("extend_periods") or 0)
    debt = float(row.total_debt or 0)
    pay = monthly_payment(debt, rate, n_rem) if n_rem > 0 and debt > EPSILON else 0.0
    fee = round(debt * float(spec.get("fee_pct_debt") or 0), -1)
    return rate, n_rem, pay, fee


def _pay(db: Session, profile: GameProfile, amount: float, kind: str, title: str) -> None:
    if amount <= EPSILON:
        return
    if float(profile.cash_balance) + EPSILON < amount:
        raise ValueError("Недостаточно средств на счёте для этого выбора")
    adjust_balance(db, profile.id, -amount, kind, title, int(profile.period_index))


def apply_chain_action(
    db: Session, profile: GameProfile, spec: object, ctx: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Применяет действие; возвращает значения для контекста следующего шага цепочки."""
    if not isinstance(spec, dict):
        raise ValueError("chain_action must be an object")
    action = str(spec.get("action") or "").strip()
    if action not in CHAIN_ACTIONS:
        raise ValueError(f"Unknown chain_action: {action}")
    ctx = ctx or {}
    period = int(profile.period_index)

    if action == ACTION_SELL_ASSET:
        asset = _asset_to_sell(db, profile, str(spec.get("kind") or ""))
        if asset is None:
            raise ValueError("Нет подходящего актива для продажи")
        proceeds = round(float(asset.asset_value) * float(spec.get("price_factor", 1.0)), -2)
        adjust_balance(db, profile.id, proceeds, "asset_sale", f"Продажа актива: {asset.title}", period)
        for pol in (
            db.query(InsurancePolicy)
            .filter(InsurancePolicy.insured_asset_id == asset.id, InsurancePolicy.is_active == 1)
            .all()
        ):
            pol.is_active = 0
        asset.is_active = 0
        return {"sale_proceeds": proceeds, "sold_maintenance": float(asset.monthly_maintenance_cost or 0)}

    if action == ACTION_PREPAY_DEBTS:
        only = None
        if spec.get("target") == "chain_liability" and ctx.get("liability_id"):
            only = int(ctx["liability_id"])
        for row, part in _plan_prepay(db, profile, _amount(db, profile, spec, ctx), only_id=only):
            new_overdue, new_debt, to_od, to_body = prepay_waterfall(
                part, float(row.overdue_amount or 0), float(row.total_debt or 0)
            )
            _pay(db, profile, to_od + to_body, "liability_prepay", f"Досрочное погашение: {row.title}")
            row.overdue_amount = new_overdue
            row.total_debt = new_debt
            if new_debt <= EPSILON:
                row.total_debt = 0.0
                row.is_active = 0
            else:
                row.monthly_payment = _recompute_payment(row)
        return {}

    if action == ACTION_TO_SAFETY:
        amount = min(_amount(db, profile, spec, ctx), max(0.0, float(profile.cash_balance)))
        if amount > EPSILON:
            adjust_safety_fund_balance(db, profile.id, amount, "safety_fund_contribution", "событие", period)
        return {}

    if action == ACTION_REFINANCE:
        row = _refinance_target(db, profile, ctx)
        if row is None:
            raise ValueError("Нет кредита для рефинансирования")
        rate, n_rem, pay, fee = _refinance_numbers(row, spec)
        _pay(db, profile, fee, "liability_fee", f"Комиссия за рефинансирование: {row.title}")
        old_payment = float(row.monthly_payment or 0)
        row.annual_rate_percent = rate
        row.term_periods = int(row.periods_paid or 0) + n_rem
        row.monthly_payment = pay
        return {"liability_id": int(row.id), "old_payment": old_payment, "new_payment": pay}

    if action == ACTION_BUY_POLICY:
        car = _first_car(db, profile)
        if car is None:
            raise ValueError("Нет машины для полиса")
        salary = _salary(db, profile)
        premium = round(salary * float(spec.get("premium_pct_salary") or 0), -1)
        payout = round(salary * float(spec.get("payout_pct_salary") or 0), -1)
        term = int(spec.get("term_periods") or 12)
        product = str(spec.get("product") or "auto")
        insured = str(spec.get("insured_object") or "property")
        _pay(db, profile, premium, "insurance_premium", f"Оформление полиса: {spec.get('title') or 'КАСКО'}")
        db.add(
            InsurancePolicy(
                game_profile_id=profile.id,
                product=product,
                insured_object=insured,
                kind=f"{product}_{insured}",
                title=str(spec.get("title") or "КАСКО"),
                monthly_premium=premium,
                payout_amount=payout,
                coverage_limit=payout,
                term_periods=term,
                started_period_index=period,
                expires_period_index=period + term,
                insured_asset_id=car.id,
                is_active=1,
            )
        )
        db.flush()
        return {}

    if action == ACTION_PAY_FROM_SAFETY:
        amount = _amount(db, profile, spec, ctx)
        from_safety = _from_safety(profile, spec, amount)
        if from_safety > EPSILON:
            adjust_safety_fund_balance(db, profile.id, -from_safety, "safety_fund_withdrawal", "событие", period)
        _pay(db, profile, amount, "event_cash", str(spec.get("title") or "Событие"))
        return {}

    # ACTION_OPEN_CARD_DEBT: расход оплачен кредиткой — со счёта ничего, долг под проценты.
    debt = _amount(db, profile, spec, ctx)
    rate = float(spec.get("annual_rate_percent") or 22)
    db.add(
        FinanceLiability(
            game_profile_id=profile.id,
            title=str(spec.get("title") or "Кредитная карта"),
            total_debt=debt,
            original_principal=debt,
            annual_rate_percent=rate,
            monthly_payment=monthly_interest_payment(debt, rate),
            liability_kind=LIABILITY_KIND_CONSUMER,
            payment_mode=PAYMENT_MODE_INTEREST_ONLY,
            overdue_amount=0,
            overdue_periods=0,
            is_active=1,
        )
    )
    db.flush()
    return {}


def preview_chain_action(
    db: Session, profile: GameProfile, spec: object, ctx: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    """Чипы до выбора: те же суммы, что посчитает apply_chain_action (kinds — как build_choice_impacts)."""
    if not isinstance(spec, dict):
        return []
    action = str(spec.get("action") or "").strip()
    ctx = ctx or {}
    out: list[dict[str, Any]] = []

    if action == ACTION_SELL_ASSET:
        asset = _asset_to_sell(db, profile, str(spec.get("kind") or ""))
        if asset is not None:
            proceeds = round(float(asset.asset_value) * float(spec.get("price_factor", 1.0)), -2)
            out.append({"kind": "cash", "delta": proceeds, "tip": f"Продажа: {asset.title}"})
            out.append(
                {
                    "kind": "term",
                    "delta": 0,
                    "tip": f"Без «{asset.title}»: обслуживание −{_rub(asset.monthly_maintenance_cost)} ₽/пер.",
                }
            )
    elif action == ACTION_PREPAY_DEBTS:
        only = int(ctx["liability_id"]) if spec.get("target") == "chain_liability" and ctx.get("liability_id") else None
        plan = _plan_prepay(db, profile, _amount(db, profile, spec, ctx), only_id=only)
        total = sum(part for _row, part in plan)
        if total > EPSILON:
            out.append({"kind": "cash", "delta": -round(total, 2), "tip": "Досрочно в долги"})
            names = ", ".join(row.title for row, _part in plan)
            out.append({"kind": "term", "delta": 0, "tip": f"Досрочно: {names}"})
    elif action == ACTION_TO_SAFETY:
        amount = min(_amount(db, profile, spec, ctx), max(0.0, float(profile.cash_balance)))
        if amount > EPSILON:
            out.append({"kind": "safety", "delta": round(amount, 2), "tip": "Подушка (со счёта)"})
    elif action == ACTION_REFINANCE:
        row = _refinance_target(db, profile, ctx)
        if row is not None:
            rate, n_rem, pay, fee = _refinance_numbers(row, spec)
            if fee > EPSILON:
                out.append({"kind": "cash", "delta": -fee, "tip": "Комиссия банка"})
            out.append(
                {
                    "kind": "term",
                    "delta": n_rem,
                    "tip": (
                        f"{row.title}: {float(row.annual_rate_percent):g}% → {rate:g}%, "
                        f"платёж {_rub(row.monthly_payment)} → {_rub(pay)} ₽/пер., осталось {n_rem} пер."
                    ),
                }
            )
    elif action == ACTION_BUY_POLICY:
        salary = _salary(db, profile)
        premium = round(salary * float(spec.get("premium_pct_salary") or 0), -1)
        payout = round(salary * float(spec.get("payout_pct_salary") or 0), -1)
        out.append({"kind": "cash", "delta": -premium, "tip": "Первая премия"})
        out.append(
            {
                "kind": "term",
                "delta": int(spec.get("term_periods") or 12),
                "tip": f"{spec.get('title') or 'КАСКО'}: выплата {_rub(payout)} ₽, премия {_rub(premium)} ₽/пер.",
            }
        )
    elif action == ACTION_PAY_FROM_SAFETY:
        amount = _amount(db, profile, spec, ctx)
        from_safety = _from_safety(profile, spec, amount)
        if from_safety > EPSILON:
            out.append({"kind": "safety", "delta": -round(from_safety, 2), "tip": "Из подушки"})
        if amount - from_safety > EPSILON:
            out.append({"kind": "cash", "delta": -round(amount - from_safety, 2), "tip": "Счёт сейчас"})
    elif action == ACTION_OPEN_CARD_DEBT:
        debt = _amount(db, profile, spec, ctx)
        rate = float(spec.get("annual_rate_percent") or 22)
        out.append(
            {
                "kind": "term",
                "delta": 0,
                "tip": (
                    f"{spec.get('title') or 'Кредитная карта'}: долг {_rub(debt)} ₽ под {rate:g}%, "
                    f"проценты {_rub(monthly_interest_payment(debt, rate))} ₽/пер."
                ),
            }
        )
    return out
