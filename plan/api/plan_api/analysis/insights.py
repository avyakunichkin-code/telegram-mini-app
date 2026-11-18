"""
Блок `insights` итогового отчёта (SPEC_plan-insights): план остатка, запас хода, цена долгов,
пределы решения и проверка данных. Только дополняет отчёт: пороги и прежние поля не меняет.
Движение денег считает ядро (`run` → `month_step`).
"""

from __future__ import annotations

import dataclasses
import re

from fincore.annuity import monthly_interest_payment, monthly_payment
from fincore.household import HouseholdSnapshot

from . import config
from .adapter import build_snapshot, month_index, month_label
from .debts import simulate
from .scenarios import main_earner, run, s1_income_loss, verdict, with_decision

IRREGULAR = re.compile(r"отпуск|подар|страхов|ремонт|налог|обучен|лечен|техобслуж|irregular|annual", re.IGNORECASE)
_LOAN_UNIT = 1_000_000  # платёж считаем на круглую сумму, чтобы округление копеек не исказило обратный расчёт


def _money(value: float) -> float:
    return round(value, 2)


def _cash_plan(ctx) -> dict:
    free = ctx.free_cf
    pess = _money(ctx.metrics_p.income_steady - ctx.metrics_p.total_monthly_outflow - ctx.premiums)
    head = {"free_cashflow": free, "pessimistic_free_cashflow": pess, "range_risk": free >= 0 > pess}
    if free < 0:
        wants = sorted((e for e in ctx.base.expense_lines if e.tier == "want"), key=lambda e: -e.amount_monthly)
        want_total = _money(sum(e.amount_monthly for e in wants))
        gap = -free
        covered = min(gap, want_total)
        return {
            **head,
            "mode": "deficit",
            "gap": gap,
            "want_total": want_total,
            "covered_by_wants": covered,
            "remaining_gap": _money(gap - covered),
            "top_wants": [{"title": e.title, "amount": e.amount_monthly} for e in wants[:3]],
            "debt_payments": _money(ctx.metrics.liability_payments),
        }

    left = free
    overdue = min(left, _money(ctx.metrics.total_overdue))
    left = _money(left - overdue)
    need_reserve = max(0.0, ctx.cushion_target_months * ctx.outflow - ctx.cushion)
    cushion = min(_money(need_reserve), _money(left * config.CUSHION_SHARE_OF_FREE_CASHFLOW))
    debts = ctx.base.liabilities
    extra = _money((left - cushion) * config.EXTRA_SHARE_OF_FREE_CASHFLOW) if debts else 0.0
    rest = _money(left - cushion - extra)

    goals, to_goals = [], 0.0
    for g in ctx.goals:
        if g["saved_amount"] >= g["target_amount"]:
            continue
        need = g["monthly_needed"]
        funded = min(need, rest) if need is not None else 0.0
        rest = _money(rest - funded)
        to_goals = _money(to_goals + funded)
        goals.append({
            "id": g["id"],
            "title": g["title"],
            "needed": need,
            "funded": funded,
            "shortfall": _money(need - funded) if need is not None else None,
            "report_realistic": g["realistic"],
        })

    target = max(debts, key=lambda li: li.annual_rate_percent).title if debts else None
    lines = [
        {"key": "overdue", "title": "Закрыть просрочку", "amount": overdue},
        {"key": "cushion", "title": "Пополнить подушку", "amount": cushion},
        {"key": "debts", "title": "Досрочно гасить долг", "amount": extra, "target": target},
        {"key": "goals", "title": "Откладывать на цели", "amount": to_goals},
        {"key": "unassigned", "title": "Остаётся без назначения", "amount": rest},
    ]
    promised = ctx.cushion_contrib + (ctx.extra if debts else 0.0) + sum(g["monthly_needed"] for g in ctx.goals if g["realistic"] and g["monthly_needed"])
    return {
        **head,
        "mode": "surplus",
        "allocations": [line for line in lines if line["amount"] > 0],
        "goals": goals,
        "overlap": _money(max(0.0, promised - free)),
    }


def _runway_value(start: HouseholdSnapshot) -> dict:
    n = run(start, months=config.RUNWAY_MAX_MONTHS).months_until_negative
    return {"months": n - 1 if n else config.RUNWAY_MAX_MONTHS, "capped": n is None}


def _reserve_start(ctx, mode: str) -> tuple[HouseholdSnapshot, dict]:
    data = ctx.checkup.data
    snap = build_snapshot(data, ctx.checkup.as_of, mode, merge_cushion=True)
    deposits = sum(p.principal for p in snap.investments)
    liquid = sum(float(i.amount) for i in data.investments if i.liquidity == "days")
    slow = sum(float(i.amount) for i in data.investments if i.liquidity != "days")
    layers = {"accounts": _money(snap.cash), "deposits": _money(deposits), "liquid_investments": _money(liquid), "slow_investments": _money(slow)}
    return dataclasses.replace(snap, cash=_money(snap.cash + deposits + liquid), investments=()), layers


def _essential(snap: HouseholdSnapshot) -> HouseholdSnapshot:
    return dataclasses.replace(snap, expense_lines=tuple(e for e in snap.expense_lines if e.tier == "must"))


def _no_income(snap: HouseholdSnapshot) -> HouseholdSnapshot:
    return dataclasses.replace(snap, incomes=tuple(dataclasses.replace(i, monthly_amount=0.0) for i in snap.incomes))


def _runway(ctx) -> dict | None:
    if ctx.outflow + ctx.premiums <= 0:
        return None
    start, layers = _reserve_start(ctx, "base")
    pess, _ = _reserve_start(ctx, "pessimistic")
    gone = _no_income(start)
    no_income = {
        "full": _runway_value(gone),
        "essential": _runway_value(_essential(gone)),
        "full_pessimistic": _runway_value(_no_income(pess)),
        "essential_pessimistic": _runway_value(_essential(_no_income(pess))),
    }
    lost = None
    if len({i.member_id for i in start.incomes}) > 1:
        earner = main_earner(start)
        partial = dataclasses.replace(start, incomes=tuple(dataclasses.replace(i, monthly_amount=0.0) if i.member_id == earner else i for i in start.incomes))
        lost = {"full": _runway_value(partial), "essential": _runway_value(_essential(partial))}
    return {
        "layers": layers,
        "available": _money(start.cash),
        "no_income": no_income,
        "main_earner_lost": lost,
        "assumptions": "Вклады забираются без процентов, вложения — по введённой стоимости. Режим экономии оставляет обязательные статьи, платежи по долгам и страховки.",
    }


def _debt_costs(ctx) -> dict | None:
    rows = ctx.checkup.data.liabilities
    if not rows:
        return None
    as_of = month_index(ctx.checkup.as_of)
    items = []
    for row, li in zip(rows, ctx.base.liabilities):
        balance, rate, entered = float(row.balance), float(row.annual_rate), float(row.monthly_payment)
        interest = monthly_interest_payment(balance, rate)
        payoff = simulate((li,))
        stuck = payoff.months is None
        items.append({
            "id": li.id,
            "title": row.title,
            "annual_rate": rate,
            "balance": balance,
            "monthly_interest": interest,
            "payment": entered,
            "interest_share": round(min(interest / entered, 1.0), 4) if entered > 0 else None,
            "months": payoff.months,
            "payoff_month": month_label(as_of + payoff.months) if payoff.months else None,
            "remaining_interest": None if stuck else payoff.total_interest,
            "not_amortizing": stuck,
            "payment_gap": _money(max(0.0, interest - entered)) if stuck else 0.0,
            "estimated": row.estimated,
        })
    items.sort(key=lambda x: -x["annual_rate"])
    interest, payments = sum(i["monthly_interest"] for i in items), sum(i["payment"] for i in items)
    return {
        "items": items,
        "totals": {
            "monthly_interest": _money(interest),
            "monthly_payments": _money(payments),
            "interest_share": round(min(interest / payments, 1.0), 4) if payments > 0 else None,
            "remaining_interest": None if any(i["not_amortizing"] for i in items) else _money(sum(i["remaining_interest"] for i in items)),
        },
    }


def _limit(payment: float, unit: float, down: float) -> dict:
    payment = _money(max(0.0, payment))
    loan = float(int(payment / unit)) if unit > 0 else 0.0
    return {"payment": payment, "loan": loan, "price": _money(loan + down) if loan > 0 else 0.0}


def _decision_limits(ctx) -> dict | None:
    ck, data = ctx.checkup, ctx.checkup.data
    if ck.entry_question != "mortgage" or not data.decision:
        return None
    d = data.decision[0]
    start = build_snapshot(data, ck.as_of, "base", merge_cushion=True)
    snap, payment = with_decision(start, data)
    down = float(d.down_payment)
    unit = monthly_payment(_LOAN_UNIT, float(d.annual_rate), d.term_months) / _LOAN_UNIT
    income, current = ctx.metrics.income_steady, ctx.metrics.liability_payments
    room = max(0.0, ctx.free_cf)
    comfortable = _limit(min(income * config.DTI_GREEN / 100 - current, room), unit, down)
    ceiling = _limit(min(income * config.DTI_RED / 100 - current, room), unit, down)
    status = "comfortable" if payment <= comfortable["payment"] else "stretch" if payment <= ceiling["payment"] else "over"
    outflow_after = ctx.outflow + ctx.premiums + payment
    reserve_after = snap.cash
    stress = run(snap, modifier=s1_income_loss(start))
    target = ctx.cushion_target_months
    return {
        "payment": payment,
        "status": status,
        "comfortable": comfortable,
        "ceiling": ceiling,
        "cash_after_down_payment": _money(reserve_after),
        "reserve_months_after": round(max(reserve_after, 0.0) / outflow_after, 1) if outflow_after > 0 else None,
        "reserve_target_months": target,
        "down_payment_keeping_reserve": _money(max(0.0, start.cash - target * outflow_after)),
        "income_loss": {"months_until_negative": stress.months_until_negative, "min_liquid": stress.min_liquid, "verdict": verdict(stress, outflow_after)},
        "assumptions": "Пределы по порогам долговой нагрузки Plan и свободному остатку, это не решение банка. Если покупка заменит аренду, платёж аренды не вычтен.",
    }


def _data_checks(ctx) -> list[dict]:
    ck, data = ctx.checkup, ctx.checkup.data
    out: list[dict] = []

    def add(key: str, severity: str, section: str, text: str) -> None:
        out.append({"key": key, "severity": severity, "section": section, "text": text})

    if sum(float(i.amount.max) for i in data.incomes) <= 0:
        add("income_missing", "fix", "incomes", "Доход не указан: выводы отчёта будут считать, что денег не поступает.")
    for row in data.liabilities:
        balance, rate, pay = float(row.balance), float(row.annual_rate), float(row.monthly_payment)
        if balance <= 0:
            continue
        if pay <= monthly_interest_payment(balance, rate) and (rate > 0 or pay == 0):
            add("payment_not_reducing", "fix", "liabilities", f"«{row.title}»: платёж не покрывает проценты, долг не уменьшается. Проверьте ставку и платёж.")
        elif row.term_months_left and pay * row.term_months_left < balance:
            add("term_too_short", "fix", "liabilities", f"«{row.title}»: платежа за указанный срок не хватит, чтобы погасить остаток. Проверьте срок и платёж.")
        if rate == 0 and row.kind != "private":
            add("zero_rate", "check", "liabilities", f"«{row.title}»: ставка 0 %. Если это не рассрочка, укажите ставку из договора.")
        if row.estimated:
            add("debt_estimated", "check", "liabilities", f"«{row.title}»: остаток и ставка оценены по платежу. Точные данные изменят срок и переплату.")
    if sum(float(s.amount.max) for s in data.savings) > 0 and not any(s.is_safety_fund for s in data.savings):
        add("savings_without_cushion", "fix", "savings", "Накопления есть, но ни одна строка не отмечена как подушка: отчёт считает подушку нулевой.")
    as_of = month_index(ck.as_of)
    for g in data.goals:
        if g.target_month and month_index(g.target_month) <= as_of and g.saved_amount < g.target_amount:
            add("goal_past", "fix", "goals", f"«{g.title}»: срок уже наступил, поэтому нужный взнос завышен. Укажите новый месяц.")
    saved = sum(float(g.saved_amount) for g in data.goals)
    held = sum(float(s.amount.max) for s in data.savings) + sum(float(i.amount) for i in data.investments)
    if saved > held:
        add("goal_saved_over_savings", "check", "savings", "На целях отложено больше, чем указано в накоплениях и вложениях. Проверьте, все ли счета внесены.")
    if any(e.category_key == "quick_must" for e in data.expenses):
        add("expenses_summary", "check", "expenses", "Расходы указаны одной суммой: отчёт не видит, что можно сократить.")
    elif data.expenses and not any(IRREGULAR.search(f"{e.category_key} {e.title}") for e in data.expenses):
        add("irregular_missing", "check", "expenses", "Не видно редких трат: отпуска, подарков, ремонта, налогов, страховок. Разделите годовую сумму на 12.")
    if data.decision and data.decision[0].down_payment >= data.decision[0].price:
        add("decision_invalid", "fix", "decision", "Первый взнос не меньше стоимости покупки: кредит в расчёте не возникает.")
    out.sort(key=lambda c: c["severity"] != "fix")
    return out


def build_insights(ctx) -> dict:
    return {
        "cash_plan": _cash_plan(ctx),
        "runway": _runway(ctx),
        "debt_costs": _debt_costs(ctx),
        "decision_limits": _decision_limits(ctx),
        "data_checks": _data_checks(ctx),
    }
