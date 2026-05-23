"""Семантика метрик итога периода (period_close)."""

from __future__ import annotations

from unittest.mock import MagicMock

from app.game_period import (
    _cash_delta,
    _debt_delta,
    _invest_capital_flow,
    _period_expense_total,
    _period_income_rate,
    _safety_fund_delta,
    _safety_fund_flow_from_transactions,
)
from app.models import PeriodEconomyClosing, PeriodSnapshot


class TestPeriodExpenseTotal:
    def test_skips_lifestyle_total_when_categories_present(self):
        breakdown = [
            {"type": "expense_category", "title": "Еда", "amount": 12_000},
            {"type": "expense_category", "title": "Жильё", "amount": 18_000},
            {"type": "lifestyle", "title": "Итого расходы на жизнь", "amount": 30_000},
            {"type": "insurance", "title": "Премии", "amount": 2_000},
        ]
        assert _period_expense_total(breakdown) == 32_000

    def test_uses_lifestyle_line_without_categories(self):
        breakdown = [{"type": "lifestyle", "title": "Жизнь", "amount": 25_000}]
        assert _period_expense_total(breakdown) == 25_000


class TestPeriodIncomeRate:
    def test_salary_only_when_claimed(self):
        snapshot = PeriodSnapshot(salary_claimed=1, salary_amount=50_000)
        breakdown = [{"type": "asset_income", "amount": 5_000}]
        assert _period_income_rate(breakdown, snapshot) == 55_000

    def test_no_salary_when_not_claimed(self):
        snapshot = PeriodSnapshot(salary_claimed=0, salary_amount=50_000)
        breakdown = [{"type": "invest", "amount": 1_200}]
        assert _period_income_rate(breakdown, snapshot) == 1_200


class TestCashDelta:
    def test_uses_previous_closing_balance(self):
        db = MagicMock()
        prev = PeriodEconomyClosing(cash_balance=100_000)
        db.query.return_value.filter.return_value.first.return_value = prev
        assert _cash_delta(db, 1, 2, 115_000) == 15_000

    def test_first_period_uses_transaction_sum(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        tx_salary = MagicMock(amount=50_000)
        tx_life = MagicMock(amount=-30_000)
        db.query.return_value.filter.return_value.all.return_value = [tx_salary, tx_life]
        assert _cash_delta(db, 1, 1, 120_000) == 20_000


class TestSafetyFundDelta:
    def test_first_period_from_safety_transactions(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        contrib = MagicMock(type="safety_fund_contribution", amount=-10_000)
        withdraw = MagicMock(type="safety_fund_withdrawal", amount=2_500)
        db.query.return_value.filter.return_value.all.return_value = [contrib, withdraw]
        assert _safety_fund_flow_from_transactions(db, 1, 1) == 7_500
        assert _safety_fund_delta(db, 1, 1, 7_500) == 7_500


class TestInvestCapitalFlow:
    def test_open_minus_close(self):
        db = MagicMock()
        open_tx = MagicMock(type="deposit_open", amount=-20_000)
        close_tx = MagicMock(type="invest_close", amount=21_500)
        db.query.return_value.filter.return_value.all.return_value = [open_tx, close_tx]
        assert _invest_capital_flow(db, 1, 1) == -1_500


class TestDebtDelta:
    def test_uses_previous_closing_debt(self):
        db = MagicMock()
        prev = PeriodEconomyClosing(total_debt_balance=200_000)
        db.query.return_value.filter.return_value.first.return_value = prev
        assert _debt_delta(db, 1, 2, 350_000) == 150_000

    def test_first_period_from_disbursement_transactions(self):
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        loan = MagicMock(type="liability_disbursement", amount=100_000)
        db.query.return_value.filter.return_value.all.return_value = [loan]
        assert _debt_delta(db, 1, 1, 100_000) == 100_000
