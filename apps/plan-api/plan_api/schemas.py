"""
Контракт API «ТВОЙ ПЛАН» (SPEC_plan-v1 §Data & API).

Суммы на входе — `Decimal` с копейками; в JSON уходят числом. Диапазон «примерно от–до» —
`Range(min, max)`; точное значение — `min == max`.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field, PlainSerializer, model_validator

Money = Annotated[
    Decimal,
    Field(ge=0, max_digits=14, decimal_places=2),
    PlainSerializer(float, return_type=float, when_used="json"),
]
Rate = Annotated[Decimal, Field(ge=0, le=200, decimal_places=2), PlainSerializer(float, return_type=float, when_used="json")]
Month = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")]

EntryQuestion = Literal["mortgage", "debts", "resilience", "goal", "overview"]
Section = Literal[
    "incomes", "expenses", "liabilities", "savings", "assets", "investments", "pension", "insurance", "goals", "decision"
]


class Range(BaseModel):
    min: Money
    max: Money

    @model_validator(mode="after")
    def _ordered(self) -> "Range":
        if self.min > self.max:
            raise ValueError("min must be <= max")
        return self

    @classmethod
    def exact(cls, value: float | int | Decimal) -> "Range":
        v = Decimal(str(value))
        return cls(min=v, max=v)


# --- аккаунт и семья ---------------------------------------------------------------------


class RequestCodeIn(BaseModel):
    email: Annotated[str, Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)]


class RequestCodeOut(BaseModel):
    sent: bool = True
    dev_code: str | None = None  # заглушка прототипа: письма не отправляем, код возвращаем


class VerifyIn(RequestCodeIn):
    code: Annotated[str, Field(pattern=r"^\d{6}$")]
    consent_version: str | None = None


class Member(BaseModel):
    id: str | None = None
    label: Annotated[str, Field(min_length=1, max_length=40)]
    role: Literal["adult", "child"] = "adult"
    birth_year: Annotated[int, Field(ge=1920, le=2030)] | None = None


# --- разделы чекапа ----------------------------------------------------------------------


class IncomeRow(BaseModel):
    member_id: str
    kind: Literal["salary", "self_employed", "pension", "benefit", "rent", "other"] = "salary"
    amount: Range


class ExpenseRow(BaseModel):
    category_key: str
    title: str = ""
    tier: Literal["must", "want"] = "must"
    amount: Range


class LiabilityRow(BaseModel):
    id: str | None = None
    member_id: str | None = None
    kind: Literal["mortgage", "consumer", "card", "car", "microloan", "private"] = "consumer"
    title: Annotated[str, Field(max_length=60)] = "Кредит"
    balance: Money
    annual_rate: Rate
    monthly_payment: Money
    term_months_left: Annotated[int, Field(ge=1, le=480)] | None = None
    overdue_amount: Money = Decimal("0")
    estimated: bool = False  # строка из быстрого старта: остаток оценён по платежу


class SavingsRow(BaseModel):
    member_id: str | None = None
    kind: Literal["cash", "account", "deposit"] = "account"
    amount: Range
    annual_rate: Rate = Decimal("0")
    is_safety_fund: bool = False


class AssetRow(BaseModel):
    kind: Literal["home", "car", "land", "other"] = "home"
    title: Annotated[str, Field(max_length=60)] = ""
    value: Money
    monthly_maintenance: Money = Decimal("0")
    monthly_income: Money = Decimal("0")


class InvestmentRow(BaseModel):
    member_id: str | None = None
    asset_class: Literal["bonds", "stocks", "funds", "deposits_long", "real_estate_invest", "crypto", "other"]
    amount: Money
    liquidity: Literal["days", "months", "years"] = "days"


class PensionRow(BaseModel):
    member_id: str
    savings_amount: Money = Decimal("0")
    has_voluntary_program: bool = False


class InsuranceRow(BaseModel):
    member_id: str | None = None
    kind: Literal["life", "health", "property", "mortgage_title", "car"]
    monthly_premium: Money = Decimal("0")
    coverage: Money = Decimal("0")


class GoalRow(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=60)]
    target_amount: Money
    target_month: Month
    saved_amount: Money = Decimal("0")
    priority: Annotated[int, Field(ge=1, le=9)] = 1


class DecisionRow(BaseModel):
    """Решение со входа «ипотека / крупный кредит»."""

    price: Money
    down_payment: Money = Decimal("0")
    annual_rate: Rate
    term_months: Annotated[int, Field(ge=1, le=480)]


SECTION_ROW = {
    "incomes": IncomeRow,
    "expenses": ExpenseRow,
    "liabilities": LiabilityRow,
    "savings": SavingsRow,
    "assets": AssetRow,
    "investments": InvestmentRow,
    "pension": PensionRow,
    "insurance": InsuranceRow,
    "goals": GoalRow,
    "decision": DecisionRow,
}


class CheckupData(BaseModel):
    incomes: list[IncomeRow] = []
    expenses: list[ExpenseRow] = []
    liabilities: list[LiabilityRow] = []
    savings: list[SavingsRow] = []
    assets: list[AssetRow] = []
    investments: list[InvestmentRow] = []
    pension: list[PensionRow] = []
    insurance: list[InsuranceRow] = []
    goals: list[GoalRow] = []
    decision: list[DecisionRow] = []


class Checkup(BaseModel):
    id: str
    entry_question: EntryQuestion
    status: Literal["draft", "completed"] = "draft"
    as_of: Month
    parent_checkup_id: str | None = None
    completed_at: str | None = None
    members: list[Member] = []
    data: CheckupData = CheckupData()


class CheckupCreate(BaseModel):
    entry_question: EntryQuestion


class QuickIn(BaseModel):
    """Быстрый старт: 5 вопросов, ответы диапазонами."""

    income: Range
    must_expenses: Range
    debt_payments: Range
    savings: Range
    children: Annotated[int, Field(ge=0, le=6)] = 0


class StepPatch(BaseModel):
    status: Literal["suggested", "done", "dismissed"]


class EventIn(BaseModel):
    name: Literal[
        "checkup_started", "quick_done", "section_done", "report_viewed", "checkup_completed", "step_done", "step_dismissed"
    ]
    props: dict[str, str | int | bool] = {}
