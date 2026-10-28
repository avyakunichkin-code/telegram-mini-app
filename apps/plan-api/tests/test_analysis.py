"""Анализ чекапа: диапазоны, сценарии, правила шагов, тексты (SPEC_plan-v1 CS-3…CS-6)."""

from __future__ import annotations

import re
from decimal import Decimal
from pathlib import Path

from fincore.household import Liability
from fincore.liabilities import PAYMENT_MODE_ANNUITY

from plan_api.analysis.adapter import build_snapshot, month_index, month_label, remaining_term
from plan_api.analysis.debts import simulate
from plan_api.analysis.report import build_report
from plan_api.analysis.scenarios import run, s1_income_loss
from plan_api.demo import demo_data, demo_members
from plan_api.schemas import Checkup, CheckupData, DecisionRow, ExpenseRow, IncomeRow, LiabilityRow, Member, Range, SavingsRow

AS_OF = "2026-10"


def R(lo, hi=None) -> Range:
    return Range(min=Decimal(lo), max=Decimal(hi if hi is not None else lo))


def checkup(data: CheckupData, members=None, q="overview") -> Checkup:
    return Checkup(id="ck", entry_question=q, as_of=AS_OF, members=members or [Member(id="m_me", label="Я")], data=data)


def simple(income=100_000, expenses=70_000, cushion=50_000, liabilities=()) -> CheckupData:
    return CheckupData(
        incomes=[IncomeRow(member_id="m_me", amount=R(income))],
        expenses=[ExpenseRow(category_key="life", amount=R(expenses))],
        savings=[SavingsRow(amount=R(cushion), is_safety_fund=True)],
        liabilities=list(liabilities),
    )


def test_month_index_roundtrip():
    assert month_label(month_index("2026-10")) == "2026-10"
    assert month_index("2027-01") - month_index("2026-12") == 1


def test_cs3_pessimistic_never_above_base():
    data = CheckupData(
        incomes=[IncomeRow(member_id="m_me", amount=R(90_000, 130_000))],
        expenses=[ExpenseRow(category_key="life", amount=R(60_000, 80_000))],
        savings=[SavingsRow(amount=R(20_000, 40_000))],
    )
    base = run(build_snapshot(data, AS_OF, "base", merge_cushion=True))
    pess = run(build_snapshot(data, AS_OF, "pessimistic", merge_cushion=True))
    assert all(p <= b for p, b in zip(pess.liquid, base.liquid))


def test_cs3_exact_values_base_equals_pessimistic():
    data = simple()
    base = run(build_snapshot(data, AS_OF, "base", merge_cushion=True))
    pess = run(build_snapshot(data, AS_OF, "pessimistic", merge_cushion=True))
    assert base.liquid == pess.liquid


def test_cs4_income_loss_months_until_negative_by_hand():
    # доход 100к, расходы 70к, запас 50к: без дохода −70к/мес → минус на 1-м месяце (50 − 70 < 0)
    snap = build_snapshot(simple(cushion=50_000), AS_OF, "base", merge_cushion=True)
    r = run(snap, modifier=s1_income_loss(snap))
    assert r.liquid[0] == -20_000.0
    assert r.months_until_negative == 1
    # запас 150к: 150 − 70 = 80, 80 − 70 = 10, 10 − 70 < 0 → на 3-м месяце
    snap = build_snapshot(simple(cushion=150_000), AS_OF, "base", merge_cushion=True)
    assert run(snap, modifier=s1_income_loss(snap)).months_until_negative == 3


def test_cs4_mortgage_decision_without_down_payment_fails():
    data = simple(cushion=100_000)
    data.decision = [DecisionRow(price=5_000_000, down_payment=1_000_000, annual_rate=12, term_months=240)]
    report = build_report(checkup(data, q="mortgage"))
    assert report["entry_answer"]["verdict"] == "fail"
    assert "не хватает" in report["entry_answer"]["text"]


def test_cs5_overdue_is_first_step():
    li = LiabilityRow(title="Карта", kind="card", balance=50_000, annual_rate=30, monthly_payment=5_000, overdue_amount=10_000)
    report = build_report(checkup(simple(liabilities=[li])))
    assert report["steps"][0]["rule_key"] == "close_overdue"
    assert next(a for a in report["areas"] if a["key"] == "debts")["light"] == "red"


def test_cs5_deficit_leads_to_stop_deficit():
    report = build_report(checkup(simple(income=60_000, expenses=80_000, cushion=200_000)))
    keys = [s["rule_key"] for s in report["steps"]]
    assert "stop_deficit" in keys
    assert next(a for a in report["areas"] if a["key"] == "budget")["light"] == "red"


def test_cs5_report_is_deterministic():
    ck = checkup(demo_data(AS_OF), demo_members(), q="mortgage")
    assert build_report(ck) == build_report(ck)


def test_three_steps_unique_rules():
    report = build_report(checkup(demo_data(AS_OF), demo_members(), q="debts"))
    keys = [s["rule_key"] for s in report["steps"]]
    assert len(keys) == 3 and len(set(keys)) == 3
    assert [s["rank"] for s in report["steps"]] == [1, 2, 3]
    assert all(s["why"] for s in report["steps"])


def test_cushion_target_fires_without_lower_bound():
    # SPEC §7 правило 7: «подушка < цели» — без нижней границы; при нулевой подушке рядом с first_cushion
    report = build_report(checkup(simple(income=100_000, expenses=70_000, cushion=0)))
    keys = [s["rule_key"] for s in report["steps"]]
    assert keys.index("first_cushion") < keys.index("cushion_target")
    assert len(keys) == 3


def test_all_green_suggests_surplus():
    report = build_report(checkup(simple(income=200_000, expenses=80_000, cushion=600_000)))
    assert all(a["light"] == "green" for a in report["areas"])
    assert report["steps"][0]["rule_key"] == "direct_surplus"


def test_card_without_term_gets_payoff_term():
    assert remaining_term(100_000, 24, 5_000) == 26  # 2 %/мес: n = −ln(1 − 0.4) / ln(1.02) ≈ 25.8
    assert remaining_term(100_000, 24, 2_000) is None  # платёж = проценты: не гасится


def test_avalanche_beats_current():
    lis = (
        Liability(id="a", title="Карта", total_debt=100_000, annual_rate_percent=30, monthly_payment=5_000,
                  payment_mode=PAYMENT_MODE_ANNUITY, term_months=27),
        Liability(id="b", title="Авто", total_debt=300_000, annual_rate_percent=12, monthly_payment=10_000,
                  payment_mode=PAYMENT_MODE_ANNUITY, term_months=35),
    )
    current = simulate(lis)
    avalanche = simulate(lis, extra=5_000, strategy="avalanche")
    assert avalanche.months < current.months
    assert avalanche.total_interest < current.total_interest
    assert avalanche.order[0] == "Карта"


def test_cs6_no_trading_advice_in_texts():
    banned = re.compile(r"купите|продайте|покупайте|продавайте|акции\s+[A-ZА-Я]{2,}|ОФЗ\s*\d", re.IGNORECASE)
    src = "\n".join(p.read_text(encoding="utf-8") for p in Path("plan_api/analysis").glob("*.py"))
    assert not banned.search(src)
    for q in ("mortgage", "debts", "resilience", "goal", "overview"):
        report = build_report(checkup(demo_data(AS_OF), demo_members(), q=q))
        text = " ".join([report["entry_answer"]["text"]] + [s["title"] + s["why"] for s in report["steps"]])
        assert not banned.search(text)
        assert "не индивидуальная инвестиционная рекомендация" in report["disclaimer"]
