"""DC-03/DC-04 «Цена решений» (SPEC_run-finale-decision-cost): расчёт карточек финала."""

from __future__ import annotations

import json

import pytest

from app.game.period import process_period_end
from app.game.run_finale_decisions import (
    KIND_DEBT_OVERPAID,
    KIND_EVENT_COST,
    KIND_INVESTMENT_GAIN,
    KIND_SALARY_MISSED,
    DecisionCandidate,
    average_available_income,
    build_decisions,
    debt_overpaid_candidates,
    event_cost_candidate,
    investment_gain_candidate,
    salary_missed_candidate,
    select_decisions,
)
from app.models import (
    EventChoice,
    EventDefinition,
    EventInstance,
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    InvestmentPosition,
    PeriodEconomyClosing,
    PeriodSnapshot,
    Transaction,
)
from app.services.events.choose import choose_event
from app.services.finance.liabilities import delete_liability
from app.services.invest.service import buy_bond, open_deposit
from tests.fixtures.game import create_finance_liability, create_profile_ready_for_period_close


def _profile(db_session, user_id: int):
    return create_profile_ready_for_period_close(db_session, user_id=user_id, cash_balance=500_000.0)


def _linked_payment(db_session, profile_id: int, liability_id: int, amount: float, period_index: int) -> None:
    db_session.add(
        Transaction(
            game_profile_id=profile_id,
            amount=-amount,
            type="liability_payment",
            description="тест",
            period_index=period_index,
            liability_id=liability_id,
        )
    )
    db_session.commit()


def _by_liability(candidates: list[DecisionCandidate]) -> dict[int | None, DecisionCandidate]:
    return {c.ref_id: c for c in candidates}


@pytest.mark.parametrize("gain, selected", [(59_999.99, False), (60_000, True)])
def test_income_threshold_uses_average_of_closed_turns(db_session, test_user, gain, selected):
    profile = _profile(db_session, test_user.id)
    profile.period_index = 3
    db_session.add_all([
        PeriodEconomyClosing(game_profile_id=profile.id, period_index=1, period_income_rate=40_000),
        PeriodEconomyClosing(game_profile_id=profile.id, period_index=2, period_income_rate=80_000),
        PeriodSnapshot(game_profile_id=profile.id, period_index=2, salary_claimed=1, salary_amount=80_000),
        Transaction(game_profile_id=profile.id, period_index=2, type="bond_coupon", amount=gain),
    ])
    db_session.commit()
    assert average_available_income(db_session, profile) == 60_000
    assert [c.kind for c in build_decisions(db_session, profile)] == ([KIND_INVESTMENT_GAIN] if selected else [])


def test_missed_salary_does_not_reduce_income_threshold(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id,
                                                  salary_already_claimed=False, period_index=2)
    db_session.add(PeriodEconomyClosing(game_profile_id=profile.id, period_index=1, period_income_rate=5_000))
    db_session.commit()
    assert average_available_income(db_session, profile) == 55_000  # received passive + available salary
    assert build_decisions(db_session, profile) == []  # missed 50k is below 55k


def test_no_closed_turns_has_no_decisions_even_with_coupon(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    db_session.add(Transaction(game_profile_id=profile.id, period_index=1, type="bond_coupon", amount=100_000))
    db_session.commit()
    assert average_available_income(db_session, profile) == 0
    assert build_decisions(db_session, profile) == []


# CS-1
def test_paid_off_annuity_overpayment_is_payments_minus_principal(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    liability = create_finance_liability(
        db_session,
        profile.id,
        title="Авто",
        total_debt=0.0,
        original_principal=30_000.0,
        payment_mode="annuity",
        term_periods=3,
        periods_paid=3,
        is_active=0,
    )
    for period in (1, 2, 3):
        _linked_payment(db_session, profile.id, liability.id, 10_400.0, period)

    candidate = _by_liability(debt_overpaid_candidates(db_session, profile))[liability.id]

    assert candidate.kind == KIND_DEBT_OVERPAID
    assert candidate.direction == "cost"
    assert candidate.amount == pytest.approx(1_200.0, abs=0.01)
    assert candidate.period_index == 1
    assert candidate.is_estimate is False
    assert "Авто" in candidate.title
    assert "3 хода" in candidate.detail


# CS-2
def test_closed_early_with_nonzero_debt_counts_remaining_as_zero(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    principal, rate = 120_000.0, 12.0
    liability = create_finance_liability(
        db_session,
        profile.id,
        total_debt=principal,
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=10_661.85,
        payment_mode="annuity",
        term_periods=12,
        periods_paid=0,
    )
    process_period_end(db_session, profile)
    db_session.refresh(profile)
    delete_liability(db_session, profile, liability.id)

    row = db_session.get(FinanceLiability, liability.id)
    assert int(row.is_active) == 0 and float(row.total_debt) > 0  # поле при закрытии не обнуляется

    candidate = _by_liability(debt_overpaid_candidates(db_session, profile))[liability.id]
    first_month_interest = principal * rate / 100 / 12
    assert candidate.amount == pytest.approx(first_month_interest, abs=0.01)


# CS-3
def test_active_interest_only_overpayment_equals_payments(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    liability = create_finance_liability(
        db_session,
        profile.id,
        total_debt=100_000.0,
        original_principal=100_000.0,
        monthly_payment=2_000.0,
        payment_mode="interest_only",
    )
    process_period_end(db_session, profile)

    candidate = _by_liability(debt_overpaid_candidates(db_session, profile))[liability.id]
    assert candidate.amount == pytest.approx(2_000.0, abs=0.01)


# CS-4
def test_loan_with_sold_collateral_gets_no_card(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    asset = FinanceAsset(game_profile_id=profile.id, title="Квартира", kind="home", asset_value=5_000_000.0, is_active=0)
    db_session.add(asset)
    db_session.commit()
    liability = create_finance_liability(
        db_session,
        profile.id,
        total_debt=0.0,
        original_principal=4_000_000.0,
        secured_asset_id=asset.id,
        is_active=0,
    )
    _linked_payment(db_session, profile.id, liability.id, 300_000.0, 1)

    assert liability.id not in _by_liability(debt_overpaid_candidates(db_session, profile))


def test_loan_without_original_principal_gets_no_card(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    liability = create_finance_liability(db_session, profile.id, total_debt=50_000.0, monthly_payment=1_000.0)
    process_period_end(db_session, profile)

    assert liability.id not in _by_liability(debt_overpaid_candidates(db_session, profile))


def test_loan_without_linked_payments_gets_no_card(db_session, test_user):
    """Партия до миграции: платежей с liability_id нет, переплата не положительна."""
    profile = _profile(db_session, test_user.id)
    create_finance_liability(db_session, profile.id, total_debt=50_000.0, original_principal=50_000.0)

    assert debt_overpaid_candidates(db_session, profile) == []


def test_other_profiles_payments_are_ignored(db_session, test_user):
    mine = _profile(db_session, test_user.id)
    other = _profile(db_session, test_user.id)
    liability = create_finance_liability(
        db_session, mine.id, total_debt=50_000.0, original_principal=50_000.0, monthly_payment=1_000.0
    )
    _linked_payment(db_session, other.id, liability.id, 9_999.0, 1)

    assert debt_overpaid_candidates(db_session, mine) == []


# --- DC-04 --------------------------------------------------------------------------


def _closing(db_session, profile_id: int, *periods: int) -> None:
    for period in periods:
        db_session.add(PeriodEconomyClosing(game_profile_id=profile_id, period_index=period))
    db_session.commit()


def _snapshot(db_session, profile_id: int, period: int, amount: float) -> None:
    db_session.add(
        PeriodSnapshot(game_profile_id=profile_id, period_index=period, salary_claimed=1, salary_amount=amount)
    )
    db_session.commit()


# CS-5
def test_missed_salaries_use_nearest_claimed_amount(db_session, test_user):
    profile = _profile(db_session, test_user.id)  # ход 1: зарплата 50 000 получена
    _snapshot(db_session, profile.id, 3, 60_000.0)
    _closing(db_session, profile.id, 1, 2, 3, 4)

    candidate = salary_missed_candidate(db_session, profile)

    assert candidate is not None
    assert candidate.kind == KIND_SALARY_MISSED
    assert candidate.amount == pytest.approx(50_000.0 + 60_000.0)
    assert candidate.period_index == 2
    assert candidate.is_estimate is True
    assert "2 хода" in candidate.detail


def test_missed_salary_before_first_claim_uses_later_amount(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, salary_already_claimed=False)
    _snapshot(db_session, profile.id, 2, 70_000.0)
    _closing(db_session, profile.id, 1, 2)

    candidate = salary_missed_candidate(db_session, profile)

    assert candidate is not None
    assert candidate.amount == pytest.approx(70_000.0)


def test_missed_salary_falls_back_to_current_salary(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id, salary_already_claimed=False)
    _closing(db_session, profile.id, 1)

    candidate = salary_missed_candidate(db_session, profile)

    assert candidate is not None
    assert candidate.amount == pytest.approx(50_000.0)


def test_no_missed_salary_no_card(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    _closing(db_session, profile.id, 1)

    assert salary_missed_candidate(db_session, profile) is None


def _choose(db_session, profile, *, key: str, title: str, choice_title: str, effects: dict) -> EventInstance:
    definition = EventDefinition(key=key, title=title)
    db_session.add(definition)
    db_session.flush()
    choice = EventChoice(definition_id=definition.id, title=choice_title, effects_json=json.dumps(effects))
    db_session.add(choice)
    db_session.flush()
    inst = EventInstance(
        game_profile_id=profile.id,
        period_index=int(profile.period_index),
        definition_id=definition.id,
        status="pending",
    )
    db_session.add(inst)
    db_session.commit()
    choose_event(db_session, profile, inst.id, choice.id)
    db_session.refresh(profile)
    return inst


def test_event_cash_is_linked_to_its_instance(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    inst = _choose(db_session, profile, key="t_dinner", title="Ужин", choice_title="Ресторан", effects={"cash_delta": -3_000})

    tx = db_session.query(Transaction).filter(
        Transaction.game_profile_id == profile.id, Transaction.type == "event_cash"
    ).one()
    assert tx.event_instance_id == inst.id
    assert tx.liability_id is None


def test_most_expensive_event_uses_actual_charge(db_session, test_user):
    profile = _profile(db_session, test_user.id)  # зарплата 50 000
    _choose(db_session, profile, key="t_dinner", title="Ужин", choice_title="Ресторан", effects={"cash_delta": -3_000})
    repair = _choose(
        db_session,
        profile,
        key="t_repair",
        title="Ремонт",
        choice_title="Сделать сразу",
        effects={"cash_pct_salary": 0.4},
    )
    _choose(db_session, profile, key="t_bonus", title="Премия", choice_title="Взять", effects={"cash_delta": 40_000})
    salary = db_session.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).one()
    salary.monthly_amount = 90_000.0  # после выбора зарплата выросла — сумма карточки не меняется
    db_session.commit()

    candidate = event_cost_candidate(db_session, profile)

    assert candidate is not None
    assert candidate.kind == KIND_EVENT_COST
    assert candidate.direction == "cost"
    assert candidate.amount == pytest.approx(20_000.0)
    assert candidate.period_index == repair.period_index
    assert candidate.ref_id == repair.id
    assert "Ремонт" in candidate.title
    assert "Сделать сразу" in candidate.detail


def test_event_charge_without_instance_link_is_ignored(db_session, test_user):
    """Партия до миграции: списание события без event_instance_id карточку не даёт."""
    profile = _profile(db_session, test_user.id)
    db_session.add(
        Transaction(
            game_profile_id=profile.id, amount=-80_000.0, type="event_cash", description="Событие: X", period_index=1
        )
    )
    db_session.commit()

    assert event_cost_candidate(db_session, profile) is None


def test_no_costly_event_no_card(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    _choose(db_session, profile, key="t_bonus", title="Премия", choice_title="Взять", effects={"cash_delta": 40_000})

    assert event_cost_candidate(db_session, profile) is None


def test_investment_gain_from_journal_and_open_positions(db_session, test_user):
    profile = _profile(db_session, test_user.id)
    open_deposit(db_session, profile, amount=50_000)
    buy_bond(db_session, profile, amount=100_000, title="ОФЗ тест")
    db_session.refresh(profile)
    process_period_end(db_session, profile)

    coupons = sum(
        float(tx.amount)
        for tx in db_session.query(Transaction).filter(
            Transaction.game_profile_id == profile.id, Transaction.type == "bond_coupon"
        )
    )
    deposit = (
        db_session.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.kind == "deposit")
        .one()
    )
    expected = coupons + (float(deposit.principal) - 50_000.0)

    candidate = investment_gain_candidate(db_session, profile)

    assert expected > 0
    assert candidate is not None
    assert candidate.kind == KIND_INVESTMENT_GAIN
    assert candidate.direction == "gain"
    assert candidate.amount == pytest.approx(expected, abs=0.01)


def test_no_investments_no_card(db_session, test_user):
    profile = _profile(db_session, test_user.id)

    assert investment_gain_candidate(db_session, profile) is None


# CS-6
def _c(kind: str, amount: float, ref: int | None = None) -> DecisionCandidate:
    direction = "gain" if kind == KIND_INVESTMENT_GAIN else "cost"
    return DecisionCandidate(kind=kind, direction=direction, title=kind, detail="", amount=amount, ref_id=ref)


def test_selection_threshold_drops_small_amounts():
    picked = select_decisions([_c(KIND_EVENT_COST, 9_999), _c(KIND_SALARY_MISSED, 10_000)], threshold=10_000)
    assert [c.kind for c in picked] == [KIND_SALARY_MISSED]


def test_selection_zero_threshold_keeps_positive_only():
    picked = select_decisions([_c(KIND_EVENT_COST, 0), _c(KIND_SALARY_MISSED, 1)], threshold=0)
    assert [c.kind for c in picked] == [KIND_SALARY_MISSED]


def test_selection_top_three_with_at_most_two_debts():
    picked = select_decisions(
        [
            _c(KIND_DEBT_OVERPAID, 300, 1),
            _c(KIND_DEBT_OVERPAID, 250, 2),
            _c(KIND_DEBT_OVERPAID, 200, 3),
            _c(KIND_EVENT_COST, 100),
            _c(KIND_SALARY_MISSED, 50),
        ],
        threshold=10,
    )
    assert [(c.kind, c.ref_id) for c in picked] == [
        (KIND_DEBT_OVERPAID, 1),
        (KIND_DEBT_OVERPAID, 2),
        (KIND_EVENT_COST, None),
    ]


def test_selection_ties_follow_kind_order():
    picked = select_decisions(
        [
            _c(KIND_INVESTMENT_GAIN, 100),
            _c(KIND_EVENT_COST, 100),
            _c(KIND_SALARY_MISSED, 100),
            _c(KIND_DEBT_OVERPAID, 100),
        ],
        threshold=10,
    )
    assert [c.kind for c in picked] == [KIND_DEBT_OVERPAID, KIND_SALARY_MISSED, KIND_INVESTMENT_GAIN]


def test_selection_investment_gain_replaces_third():
    picked = select_decisions(
        [
            _c(KIND_DEBT_OVERPAID, 300, 1),
            _c(KIND_SALARY_MISSED, 200),
            _c(KIND_EVENT_COST, 150),
            _c(KIND_INVESTMENT_GAIN, 20),
        ],
        threshold=10,
    )
    assert [c.kind for c in picked] == [KIND_DEBT_OVERPAID, KIND_SALARY_MISSED, KIND_INVESTMENT_GAIN]


def test_selection_investment_gain_below_threshold_is_not_forced():
    picked = select_decisions(
        [
            _c(KIND_DEBT_OVERPAID, 300, 1),
            _c(KIND_SALARY_MISSED, 200),
            _c(KIND_EVENT_COST, 150),
            _c(KIND_INVESTMENT_GAIN, 5),
        ],
        threshold=10,
    )
    assert KIND_INVESTMENT_GAIN not in [c.kind for c in picked]


def test_selection_empty():
    assert select_decisions([], threshold=10) == []
