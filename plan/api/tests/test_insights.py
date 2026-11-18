"""Блок insights (SPEC_plan-insights): инварианты денег, ручные расчёты, краевые случаи."""

from __future__ import annotations

import json
from decimal import Decimal

import pytest
from fincore.annuity import monthly_payment

from plan_api.analysis import config
from plan_api.analysis.report import build_report
from plan_api.demo import demo_data, demo_members
from plan_api.schemas import (
    Checkup, CheckupData, DecisionRow, ExpenseRow, GoalRow, IncomeRow, InvestmentRow, LiabilityRow, Member, Range, SavingsRow,
)

AS_OF = "2026-10"
ME = [Member(id="m_me", label="Я")]
TWO = ME + [Member(id="p", label="Партнёр")]


def R(lo, hi=None) -> Range:
    return Range(min=Decimal(lo), max=Decimal(hi if hi is not None else lo))


def data(income=100_000, must=60_000, want=0, cushion=0, **rows) -> CheckupData:
    expenses = [ExpenseRow(category_key="life", title="Жизнь", amount=R(must))]
    if want:
        expenses.append(ExpenseRow(category_key="fun", title="Кафе", tier="want", amount=R(want)))
    savings = [SavingsRow(amount=R(cushion), is_safety_fund=True)] if cushion else []
    return CheckupData(incomes=[IncomeRow(member_id="m_me", amount=R(income))], expenses=expenses, savings=rows.pop("savings", savings), **rows)


def insights(d: CheckupData, q="overview", members=None) -> dict:
    return build_report(Checkup(id="ck", entry_question=q, as_of=AS_OF, members=members or ME, data=d))["insights"]


def loan(balance=100_000, rate=24, payment=5_000, **kw) -> LiabilityRow:
    return LiabilityRow(id=kw.pop("id", "l1"), title=kw.pop("title", "Кредит"), balance=balance, annual_rate=rate, monthly_payment=payment, **kw)


def keys(checks) -> set[str]:
    return {c["key"] for c in checks}


# --- план остатка ----------------------------------------------------------------------------

@pytest.mark.parametrize("d", [
    data(cushion=10_000, liabilities=[loan()], goals=[GoalRow(id="g", title="Цель", target_amount=120_000, target_month="2027-10")]),
    data(cushion=500_000),
    data(income=100_003, must=33_333, cushion=7, liabilities=[loan(overdue_amount=Decimal("1234.56"))]),
    demo_data(AS_OF),
])
def test_cash_plan_allocations_sum_to_free_cashflow(d):
    plan = insights(d)["cash_plan"]
    assert plan["mode"] == "surplus"
    assert round(sum(a["amount"] for a in plan["allocations"]), 2) == plan["free_cashflow"]


def test_cash_plan_stops_double_promising_same_money():
    # остаток 35к: подушка 17,5к; долг 8,75к; на цель остаётся 8,75к при нужных 10к
    d = data(cushion=10_000, liabilities=[loan()], goals=[GoalRow(id="g", title="Цель", target_amount=120_000, target_month="2027-10")])
    report = build_report(Checkup(id="ck", entry_question="overview", as_of=AS_OF, members=ME, data=d))
    plan = report["insights"]["cash_plan"]
    assert report["goals"][0]["realistic"] is True  # прежний блок обещает цель целиком
    assert {a["key"]: a["amount"] for a in plan["allocations"]} == {"cushion": 17_500, "debts": 8_750, "goals": 8_750}
    assert plan["goals"][0] == {"id": "g", "title": "Цель", "needed": 10_000, "funded": 8_750, "shortfall": 1_250, "report_realistic": True}
    assert plan["overlap"] == 1_250


def test_cash_plan_caps_cushion_at_target():
    # цель 180к, есть 175к: в подушку нужно только 5к, остальное не теряется
    plan = insights(data(cushion=175_000))["cash_plan"]
    assert {a["key"]: a["amount"] for a in plan["allocations"]} == {"cushion": 5_000, "unassigned": 35_000}


def test_cash_plan_overdue_goes_first():
    plan = insights(data(cushion=500_000, liabilities=[loan(overdue_amount=3_000)]))["cash_plan"]
    assert plan["allocations"][0] == {"key": "overdue", "title": "Закрыть просрочку", "amount": 3_000}


def test_deficit_says_when_wants_cannot_close_gap():
    plan = insights(data(income=50_000, must=60_000, want=5_000))["cash_plan"]
    assert (plan["mode"], plan["gap"], plan["covered_by_wants"], plan["remaining_gap"]) == ("deficit", 15_000, 5_000, 10_000)
    assert plan["top_wants"] == [{"title": "Кафе", "amount": 5_000}]


def test_range_risk_when_lower_bound_is_negative():
    d = data(must=60_000)
    d.incomes = [IncomeRow(member_id="m_me", amount=R(40_000, 120_000))]
    plan = insights(d)["cash_plan"]
    assert plan["range_risk"] is True and plan["pessimistic_free_cashflow"] == -20_000


# --- запас хода --------------------------------------------------------------------------------

def test_runway_counts_deposits_and_liquid_investments_only():
    d = data(must=50_000, want=10_000, cushion=120_000)
    d.savings.append(SavingsRow(kind="deposit", amount=R(60_000), annual_rate=Decimal(14)))
    d.investments = [InvestmentRow(asset_class="funds", amount=30_000, liquidity="days"), InvestmentRow(asset_class="other", amount=900_000, liquidity="years")]
    r = insights(d)["runway"]
    assert r["available"] == 210_000
    assert r["layers"] == {"accounts": 120_000, "deposits": 60_000, "liquid_investments": 30_000, "slow_investments": 900_000}
    assert r["no_income"]["full"] == {"months": 3, "capped": False}  # 210 / 60
    assert r["no_income"]["essential"] == {"months": 4, "capped": False}  # 210 / 50
    assert r["main_earner_lost"] is None


def test_runway_pessimistic_uses_lower_savings_and_higher_expenses():
    d = data(must=50_000)
    d.expenses[0].amount = R(40_000, 60_000)
    d.savings = [SavingsRow(amount=R(100_000, 200_000), is_safety_fund=True)]
    r = insights(d)["runway"]["no_income"]
    assert r["full"]["months"] == 3  # 150 / 50
    assert r["full_pessimistic"]["months"] == 1  # 100 / 60


def test_runway_main_earner_keeps_partner_income():
    d = data(must=70_000, cushion=100_000)
    d.incomes = [IncomeRow(member_id="m_me", amount=R(100_000)), IncomeRow(member_id="p", amount=R(50_000))]
    r = insights(d, members=TWO)["runway"]
    assert r["main_earner_lost"]["full"] == {"months": 5, "capped": False}  # −20к в месяц
    assert r["no_income"]["full"]["months"] == 1


def test_runway_capped_and_empty():
    assert insights(data(income=0, must=1_000, cushion=10_000_000))["runway"]["no_income"]["full"] == {"months": config.RUNWAY_MAX_MONTHS, "capped": True}
    assert insights(data(income=0, must=0))["runway"] is None


# --- цена долгов --------------------------------------------------------------------------------

def test_debt_costs_sorted_with_interest_share():
    d = data(liabilities=[loan(id="low", title="Авто", rate=12, balance=300_000, payment=10_000), loan(id="hi", title="Карта", rate=30, balance=100_000, payment=5_000)])
    costs = insights(d)["debt_costs"]
    assert [i["id"] for i in costs["items"]] == ["hi", "low"]
    assert costs["items"][0]["monthly_interest"] == 2_500 and costs["items"][0]["interest_share"] == 0.5
    assert costs["totals"]["monthly_interest"] == 5_500 and costs["totals"]["remaining_interest"] > 0


def test_payment_below_interest_is_not_amortizing():
    # SPEC_plan-v1 Rules: платёж меньше процентов
    d = data(liabilities=[loan(rate=36, payment=1_000)])  # проценты 3 000
    out = insights(d)
    item = out["debt_costs"]["items"][0]
    assert (item["not_amortizing"], item["months"], item["remaining_interest"], item["payment_gap"]) == (True, None, None, 2_000)
    assert out["debt_costs"]["totals"]["remaining_interest"] is None
    assert "payment_not_reducing" in keys(out["data_checks"])


def test_no_debts_gives_null():
    assert insights(data())["debt_costs"] is None


# --- пределы решения -----------------------------------------------------------------------------

def decision(price=3_000_000, down=500_000, rate=12, term=240) -> list[DecisionRow]:
    return [DecisionRow(price=price, down_payment=down, annual_rate=rate, term_months=term)]


def test_decision_limits_reverse_to_threshold_payment():
    # доход 200к, расходы 80к: 30 % = 60к и остаток 120к → комфортный платёж 60к
    lim = insights(data(income=200_000, must=80_000, cushion=1_000_000, decision=decision()), q="mortgage")["decision_limits"]
    assert lim["comfortable"]["payment"] == 60_000 and lim["ceiling"]["payment"] == 100_000
    assert monthly_payment(lim["comfortable"]["loan"], 12, 240) == pytest.approx(60_000, abs=1)
    assert lim["comfortable"]["price"] == lim["comfortable"]["loan"] + 500_000
    assert lim["status"] == "comfortable"


def test_decision_limits_bounded_by_free_cashflow_and_existing_debt():
    lim = insights(data(income=100_000, must=90_000, cushion=1_000_000, decision=decision()), q="mortgage")["decision_limits"]
    assert lim["ceiling"]["payment"] == 10_000 and lim["status"] == "over"
    loaded = insights(data(income=100_000, must=10_000, cushion=1_000_000, liabilities=[loan(balance=2_000_000, rate=10, payment=60_000)], decision=decision()), q="mortgage")["decision_limits"]
    assert loaded["comfortable"] == {"payment": 0, "loan": 0, "price": 0}


def test_decision_stress_combines_income_loss_and_reserve_after_down_payment():
    pay = monthly_payment(2_500_000, 12, 240)
    lim = insights(data(income=200_000, must=80_000, cushion=1_000_000, decision=decision()), q="mortgage")["decision_limits"]
    assert lim["payment"] == pay and lim["cash_after_down_payment"] == 500_000
    assert lim["reserve_months_after"] == pytest.approx(500_000 / (80_000 + pay), abs=0.06)
    # доход пропал, расход 80к + платёж ≈27,5к: после 4 мес. остаётся ≈70к, минус на 5-м
    assert lim["income_loss"]["months_until_negative"] == 5


def test_decision_limits_only_for_mortgage_question():
    assert insights(data(decision=decision()))["decision_limits"] is None
    assert insights(data(), q="mortgage")["decision_limits"] is None


def test_decision_zero_rate_and_no_loan_are_finite():
    out = insights(data(cushion=100_000, decision=decision(rate=0)), q="mortgage")
    assert out["decision_limits"]["payment"] > 0
    out = insights(data(cushion=100_000, decision=decision(price=100, down=100)), q="mortgage")
    assert out["decision_limits"]["payment"] == 0 and "decision_invalid" in keys(out["data_checks"])


# --- проверка данных ------------------------------------------------------------------------------

def test_checks_catch_forgotten_cushion_and_past_goal():
    d = data(savings=[SavingsRow(amount=R(300_000))], goals=[GoalRow(title="Старая", target_amount=100, target_month="2026-09")])
    checks = insights(d)["data_checks"]
    assert {"savings_without_cushion", "goal_past"} <= keys(checks)
    assert [c["severity"] for c in checks] == sorted((c["severity"] for c in checks), key=lambda s: s != "fix")


def test_checks_term_rate_and_irregular():
    checks = insights(data(liabilities=[loan(balance=100_000, rate=0, payment=1_000, term_months_left=10)]))["data_checks"]
    assert {"term_too_short", "zero_rate", "irregular_missing"} <= keys(checks)


def test_private_zero_rate_and_irregular_listed_are_quiet():
    d = data(liabilities=[loan(rate=0, payment=5_000, kind="private")])
    d.expenses.append(ExpenseRow(category_key="x", title="Отпуск, в год / 12", tier="want", amount=R(5_000)))
    assert not keys(insights(d)["data_checks"]) & {"zero_rate", "irregular_missing"}


def test_goal_saved_more_than_held():
    d = data(cushion=10, goals=[GoalRow(title="Цель", target_amount=100_000, saved_amount=50_000, target_month="2027-10")])
    assert "goal_saved_over_savings" in keys(insights(d)["data_checks"])


def test_report_is_json_safe_and_deterministic_for_demo():
    for q in ("mortgage", "debts", "resilience", "goal", "overview"):
        ck = Checkup(id="ck", entry_question=q, as_of=AS_OF, members=demo_members(), data=demo_data(AS_OF))
        first = build_report(ck)
        json.dumps(first["insights"], allow_nan=False)
        assert first == build_report(ck)
