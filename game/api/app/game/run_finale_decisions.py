"""«Цена решений»: карточки финала партии по фактам журнала.

Spec: game/docs/specs/features/SPEC_run-finale-decision-cost.md. Только факты партии,
без оценок и советов (C-3). Описание транзакции не разбирается — связь с
кредитом идёт через `transactions.liability_id`.
"""
from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..constants import EPSILON
from ..models import (
    EventChoice,
    EventDefinition,
    EventInstance,
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InvestmentPosition,
    PeriodEconomyClosing,
    PeriodSnapshot,
    Transaction,
)

KIND_DEBT_OVERPAID = "debt_overpaid"
KIND_SALARY_MISSED = "salary_missed"
KIND_EVENT_COST = "event_cost"
KIND_INVESTMENT_GAIN = "investment_gain"

# Порядок при равной сумме (spec, «Отбор карточек», шаг 3).
KIND_ORDER = (KIND_DEBT_OVERPAID, KIND_SALARY_MISSED, KIND_EVENT_COST, KIND_INVESTMENT_GAIN)
MAX_DECISIONS = 3
MAX_DEBT_DECISIONS = 2

# Движения вложений в журнале: открытие/покупка — минус, закрытие/купон — плюс.
INVESTMENT_TRANSACTION_TYPES = ("deposit_open", "bond_buy", "invest_close", "bond_coupon")

DIRECTION_COST = "cost"
DIRECTION_GAIN = "gain"


@dataclass(frozen=True)
class DecisionCandidate:
    """Кандидат в карточку; отбор и контракт API — отдельно."""

    kind: str
    direction: str
    title: str
    detail: str
    amount: float
    period_index: int | None = None
    is_estimate: bool = False
    ref_id: int | None = None


def _turns_word(count: int) -> str:
    tail = count % 100
    if 11 <= tail <= 14:
        return "ходов"
    last = count % 10
    if last == 1:
        return "ход"
    if 2 <= last <= 4:
        return "хода"
    return "ходов"


def _sold_collateral_ids(db: Session, profile_id: int) -> set[int]:
    rows = (
        db.query(FinanceAsset.id)
        .filter(FinanceAsset.game_profile_id == profile_id, FinanceAsset.is_active == 0)
        .all()
    )
    return {int(r[0]) for r in rows}


def debt_overpaid_candidates(db: Session, profile: GameProfile) -> list[DecisionCandidate]:
    """Переплата по каждому кредиту: всё выплачено − погашенная часть долга.

    Пропускаем кредит без `original_principal` и кредит, чей залог продан:
    выручка гасит долг мимо журнала, честной суммы нет.
    """
    liabilities = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id)
        .order_by(FinanceLiability.id)
        .all()
    )
    if not liabilities:
        return []

    sold_assets = _sold_collateral_ids(db, profile.id)
    totals = {
        int(liability_id): (float(total or 0), int(turns or 0), first_period)
        for liability_id, total, turns, first_period in (
            db.query(
                Transaction.liability_id,
                func.sum(Transaction.amount),
                func.count(func.distinct(Transaction.period_index)),
                func.min(Transaction.period_index),
            )
            .filter(
                Transaction.game_profile_id == profile.id,
                Transaction.liability_id.isnot(None),
            )
            .group_by(Transaction.liability_id)
            .all()
        )
    }

    candidates: list[DecisionCandidate] = []
    for liability in liabilities:
        original = liability.original_principal
        if original is None:
            continue
        if liability.secured_asset_id is not None and int(liability.secured_asset_id) in sold_assets:
            continue
        total, turns, first_period = totals.get(int(liability.id), (0.0, 0, None))
        paid = -total  # к кредиту привязаны только списания
        remaining = float(liability.total_debt or 0) if int(liability.is_active or 0) == 1 else 0.0
        overpaid = round(paid - (float(original) - remaining), 2)
        if overpaid <= EPSILON:
            continue
        candidates.append(
            DecisionCandidate(
                kind=KIND_DEBT_OVERPAID,
                direction=DIRECTION_COST,
                title=f"Кредит «{liability.title}»",
                detail=f"Заплачено сверх взятой суммы за {turns} {_turns_word(turns)}",
                amount=overpaid,
                period_index=int(first_period) if first_period is not None else None,
                ref_id=int(liability.id),
            )
        )
    return candidates


def salary_missed_candidate(db: Session, profile: GameProfile) -> DecisionCandidate | None:
    """Зарплаты, не полученные в закрытых ходах. Сумма — оценка по ближайшей полученной."""
    closed = sorted(
        int(r[0])
        for r in db.query(PeriodEconomyClosing.period_index)
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .all()
    )
    if not closed:
        return None
    claimed = {
        int(period): float(amount or 0)
        for period, amount in db.query(PeriodSnapshot.period_index, PeriodSnapshot.salary_amount)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.salary_claimed == 1,
            PeriodSnapshot.salary_amount > 0,
        )
        .all()
    }
    missed = [p for p in closed if p not in claimed]
    if not missed:
        return None

    salary_row = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    fallback = float(salary_row.monthly_amount or 0) if salary_row else 0.0
    claimed_periods = sorted(claimed)

    def nearest(period: int) -> float:
        earlier = [p for p in claimed_periods if p < period]
        if earlier:
            return claimed[earlier[-1]]
        later = [p for p in claimed_periods if p > period]
        if later:
            return claimed[later[0]]
        return fallback

    amount = round(sum(nearest(p) for p in missed), 2)
    if amount <= EPSILON:
        return None
    count = len(missed)
    return DecisionCandidate(
        kind=KIND_SALARY_MISSED,
        direction=DIRECTION_COST,
        title="Пропущенные зарплаты",
        detail=f"Не получено за {count} {_turns_word(count)}",
        amount=amount,
        period_index=missed[0],
        is_estimate=True,
    )


def event_cost_candidate(db: Session, profile: GameProfile) -> DecisionCandidate | None:
    """Самое дорогое списание по выбору события — фактическая сумма из журнала.

    Сумма в `effects_json` может зависеть от зарплаты на момент выбора, поэтому
    берётся проводка `event_cash`, привязанная к экземпляру события.
    """
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile.id,
            Transaction.type == "event_cash",
            Transaction.event_instance_id.isnot(None),
            Transaction.amount < 0,
        )
        .order_by(Transaction.amount.asc(), Transaction.id.asc())
        .first()
    )
    if tx is None:
        return None
    inst = db.get(EventInstance, int(tx.event_instance_id))
    if inst is None:
        return None
    definition = db.get(EventDefinition, int(inst.definition_id))
    choice = db.get(EventChoice, int(inst.selected_choice_id)) if inst.selected_choice_id else None
    event_title = definition.title if definition else "Событие"
    detail = f"Выбор: «{choice.title}»" if choice else "Выбор в событии"
    return DecisionCandidate(
        kind=KIND_EVENT_COST,
        direction=DIRECTION_COST,
        title=f"Событие «{event_title}»",
        detail=detail,
        amount=round(-float(tx.amount), 2),
        period_index=int(inst.period_index),
        ref_id=int(inst.id),
    )


def investment_gain_candidate(db: Session, profile: GameProfile) -> DecisionCandidate | None:
    """Заработок на вкладах и облигациях: закрытые и текущие вложения − внесённое."""
    journal = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.game_profile_id == profile.id,
            Transaction.type.in_(INVESTMENT_TRANSACTION_TYPES),
        )
        .scalar()
    )
    if journal is None:
        return None
    open_principal = (
        db.query(func.sum(InvestmentPosition.principal))
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.is_active == 1)
        .scalar()
    )
    gain = round(float(journal) + float(open_principal or 0), 2)
    if gain <= EPSILON:
        return None
    return DecisionCandidate(
        kind=KIND_INVESTMENT_GAIN,
        direction=DIRECTION_GAIN,
        title="Вклады и облигации",
        detail="Заработано на вложениях за партию",
        amount=gain,
    )


def select_decisions(candidates: list[DecisionCandidate], *, threshold: float) -> list[DecisionCandidate]:
    """Отбор по spec: порог → сортировка → три лучших (кредитов ≤ 2) → гарантия заработка."""
    floor = max(0.0, float(threshold))
    passed = [c for c in candidates if (c.amount >= floor if floor > 0 else c.amount > EPSILON)]
    passed.sort(key=lambda c: (-c.amount, KIND_ORDER.index(c.kind)))

    picked: list[DecisionCandidate] = []
    debts = 0
    for candidate in passed:
        if len(picked) == MAX_DECISIONS:
            break
        if candidate.kind == KIND_DEBT_OVERPAID:
            if debts == MAX_DEBT_DECISIONS:
                continue
            debts += 1
        picked.append(candidate)

    gain = next((c for c in passed if c.kind == KIND_INVESTMENT_GAIN), None)
    if gain is not None and gain not in picked and len(picked) == MAX_DECISIONS:
        picked[-1] = gain
    return picked


def average_available_income(
    db: Session, profile: GameProfile, *, missed_salary_amount: float | None = None,
) -> float:
    """Средний регулярный доход закрытых ходов, включая оценку пропущенной зарплаты.

    period_income_rate — полученная зарплата и регулярные пассивные поступления.
    Пропуск выплаты не должен уменьшать порог значимости решений.
    """
    total, count = (
        db.query(func.sum(PeriodEconomyClosing.period_income_rate), func.count(PeriodEconomyClosing.id))
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .one()
    )
    if not count:
        return 0.0
    if missed_salary_amount is None:
        missed = salary_missed_candidate(db, profile)
        missed_salary_amount = missed.amount if missed else 0.0
    return round(max(0.0, (float(total or 0) + missed_salary_amount) / count), 2)


def build_decisions(db: Session, profile: GameProfile) -> list[DecisionCandidate]:
    """Все кандидаты партии → отбор с порогом 1× среднего доступного дохода (PO 2026-11-11)."""
    if not db.query(PeriodEconomyClosing.id).filter(PeriodEconomyClosing.game_profile_id == profile.id).first():
        return []
    missed = salary_missed_candidate(db, profile)
    candidates: list[DecisionCandidate] = list(debt_overpaid_candidates(db, profile))
    for single in (
        missed,
        event_cost_candidate(db, profile),
        investment_gain_candidate(db, profile),
    ):
        if single is not None:
            candidates.append(single)
    threshold = average_available_income(db, profile, missed_salary_amount=missed.amount if missed else 0.0)
    return select_decisions(candidates, threshold=threshold)
