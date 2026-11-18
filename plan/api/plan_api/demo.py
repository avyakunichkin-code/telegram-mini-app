"""Демо-семья для прототипа: «заполнить за меня», чтобы сразу увидеть отчёт."""

from __future__ import annotations

from decimal import Decimal

from .schemas import (
    AssetRow,
    CheckupData,
    DecisionRow,
    ExpenseRow,
    GoalRow,
    IncomeRow,
    InsuranceRow,
    InvestmentRow,
    LiabilityRow,
    Member,
    PensionRow,
    Range,
    SavingsRow,
)


def R(lo: int, hi: int | None = None) -> Range:
    return Range(min=Decimal(lo), max=Decimal(hi if hi is not None else lo))


def demo_members() -> list[Member]:
    return [
        Member(id="m_me", label="Я", role="adult", birth_year=1989),
        Member(id="m_partner", label="Партнёр", role="adult", birth_year=1991),
        Member(id="m_kid", label="Ребёнок", role="child", birth_year=2019),
    ]


def demo_data(as_of: str) -> CheckupData:
    year = int(as_of[:4])
    return CheckupData(
        incomes=[
            IncomeRow(member_id="m_me", kind="salary", amount=R(120_000)),
            IncomeRow(member_id="m_partner", kind="salary", amount=R(55_000, 65_000)),
        ],
        expenses=[
            ExpenseRow(category_key="food", title="Продукты", tier="must", amount=R(38_000, 45_000)),
            ExpenseRow(category_key="utilities", title="Коммуналка и связь", tier="must", amount=R(9_000)),
            ExpenseRow(category_key="transport", title="Транспорт", tier="must", amount=R(8_000, 10_000)),
            ExpenseRow(category_key="kids", title="Ребёнок: сад, кружки", tier="must", amount=R(15_000)),
            ExpenseRow(category_key="cafe", title="Кафе и доставка", tier="want", amount=R(10_000, 15_000)),
            ExpenseRow(category_key="shopping", title="Покупки", tier="want", amount=R(8_000, 12_000)),
            ExpenseRow(category_key="subscriptions", title="Подписки", tier="want", amount=R(2_500)),
        ],
        liabilities=[
            LiabilityRow(id="li_mortgage", kind="mortgage", title="Ипотека", balance=Decimal(4_200_000), annual_rate=Decimal("9.5"),
                         monthly_payment=Decimal(41_000), term_months_left=210),
            LiabilityRow(id="li_card", member_id="m_me", kind="card", title="Кредитная карта", balance=Decimal(140_000),
                         annual_rate=Decimal("29.9"), monthly_payment=Decimal(9_000)),
            LiabilityRow(id="li_car", member_id="m_partner", kind="car", title="Автокредит", balance=Decimal(380_000),
                         annual_rate=Decimal(16), monthly_payment=Decimal(14_500), term_months_left=30),
        ],
        savings=[
            SavingsRow(kind="account", amount=R(25_000, 35_000)),
            SavingsRow(kind="account", amount=R(90_000), annual_rate=Decimal(14), is_safety_fund=True),
        ],
        assets=[AssetRow(kind="home", title="Квартира", value=Decimal(7_500_000)), AssetRow(kind="car", title="Машина", value=Decimal(900_000))],
        investments=[InvestmentRow(member_id="m_me", asset_class="stocks", amount=Decimal(150_000), liquidity="days")],
        pension=[PensionRow(member_id="m_partner", savings_amount=Decimal(0))],
        insurance=[InsuranceRow(kind="property", monthly_premium=Decimal(900), coverage=Decimal(3_000_000))],
        goals=[GoalRow(title="Отпуск на море", target_amount=Decimal(250_000), target_month=f"{year + 1}-07", saved_amount=Decimal(20_000))],
        decision=[DecisionRow(price=Decimal(1_500_000), down_payment=Decimal(100_000), annual_rate=Decimal(18), term_months=60)],
    )
