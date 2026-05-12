from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, model_validator


# Auth
class UserRegister(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    telegram_id: Optional[int] = None


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str


# Messages
class MessageCreate(BaseModel):
    text: str


class MessageResponse(BaseModel):
    id: int
    text: str
    timestamp: datetime
    username: str


# User
class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    messages_count: int
    created_at: datetime


class SalaryProfileUpdate(BaseModel):
    monthly_amount: float
    monthly_receipts_count: int


class SalaryProfileResponse(BaseModel):
    monthly_amount: float
    monthly_receipts_count: int


class LiabilityCreate(BaseModel):
    title: Optional[str] = "Обязательство"
    total_debt: float
    annual_rate_percent: float
    monthly_payment: Optional[float] = None  # не используется: платёж считается как тело × %/100 / 12


class LiabilityResponse(BaseModel):
    id: int
    title: str
    total_debt: float
    annual_rate_percent: float
    monthly_payment: float
    overdue_amount: float = 0
    overdue_periods: int = 0
    created_at: datetime


class AssetCreate(BaseModel):
    title: Optional[str] = "Актив"
    kind: Optional[str] = "generic"
    asset_value: float
    monthly_maintenance_cost: float
    monthly_income: float = 0


class AssetResponse(BaseModel):
    id: int
    title: str
    kind: str
    asset_value: float
    monthly_maintenance_cost: float
    monthly_income: float
    created_at: datetime


class FinanceOverview(BaseModel):
    salary: SalaryProfileResponse
    liabilities: List[LiabilityResponse]
    assets: List[AssetResponse]
    total_monthly_income: float
    total_monthly_liabilities_payment: float
    total_monthly_assets_maintenance: float
    net_monthly_cashflow: float
    liabilities_to_income_ratio: float
    gamification_level: str
    score: int
    xp_to_next_level: int
    time_state: str
    period_index: int
    period_duration_seconds: int
    seconds_until_next_period: int
    cash_balance: float
    safety_fund_balance: float
    total_monthly_obligations: float
    total_overdue_amount: float = 0
    overdue_liabilities_count: int = 0
    win_target_safety_fund: float = 0
    win_progress_safety_fund: float = 0
    win_ready: bool = False
    win_reached: bool = False
    clean_period_streak: int = 0


class AnalyticsTimeseriesPoint(BaseModel):
    """Точка истории по закрытому периоду или текущему снимку."""

    period_index: int
    cash_balance: float
    safety_fund_balance: float
    total_overdue_amount: float
    is_projection: bool = False


class FinanceAnalyticsTimeseriesResponse(BaseModel):
    """Ряд для графиков («фаза B» аналитики); закрытия пишутся при завершении периода."""

    current_period_index: int
    clean_period_streak: int
    points: List["AnalyticsTimeseriesPoint"]


class GameProfileCreate(BaseModel):
    name: str
    mode: str


class GameProfileResponse(BaseModel):
    id: int
    name: str
    mode: str
    is_active: int
    is_archived: int
    league: str
    level: int
    xp: int
    streak: int
    time_state: str
    period_index: int
    period_duration_seconds: int
    base_params_locked: int
    onboarding_state: str


class TimeConfigUpdate(BaseModel):
    period_duration_seconds: int


class TimeStatusResponse(BaseModel):
    time_state: str
    period_index: int
    period_duration_seconds: int
    seconds_until_next_period: int


class GameStartRequest(BaseModel):
    """Тело POST /api/game/start (новый и legacy-формат через model_validator)."""

    model_config = ConfigDict(extra="ignore")

    profile_name: str
    mode: str
    period_duration_seconds: int
    cash_balance: float = 0
    monthly_receipts_count: int = 1
    monthly_salary: float = 0
    monthly_amount: Optional[float] = None
    assets: List[AssetCreate] = Field(default_factory=list)
    liabilities: List[LiabilityCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def coalesce_monthly_salary(self):
        if self.monthly_salary in (0, 0.0) and self.monthly_amount is not None:
            return self.model_copy(update={"monthly_salary": float(self.monthly_amount)})
        return self


class GameStartResponse(BaseModel):
    profile_id: int
    message: str


# ==================== ДЕЙСТВИЯ ПЕРИОДА ====================

class SafetyFundContribution(BaseModel):
    amount: float


class PeriodStatusResponse(BaseModel):
    period_index: int
    salary_claimed: bool
    salary_amount: float
    safety_fund_total: float
    safety_fund_contribution: float
    can_claim_salary: bool
    can_contribute_to_fund: bool
    required_actions_completed: bool
    total_expenses: float
    net_income_available: float


class PeriodSummaryResponse(BaseModel):
    period_index: int
    salary_claimed: bool
    salary_amount: float
    safety_fund_contribution: float
    safety_fund_total: float
    net_savings: float
    xp_earned: int
    required_actions_completed: bool