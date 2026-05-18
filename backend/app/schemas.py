from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# Auth
class UserRegister(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    password_confirm: str = Field(min_length=6, max_length=128)
    email: str = Field(min_length=5, max_length=100)
    full_name: Optional[str] = None
    telegram_id: Optional[int] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Valid email is required")
        return normalized

    @model_validator(mode="after")
    def passwords_must_match(self) -> "UserRegister":
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str


# User
class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    email: Optional[str]
    game_profiles_count: int
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


class VictoryGoalOverview(BaseModel):
    key: str
    type: str
    title: str
    required: bool = False
    enabled: bool = True
    met: bool = False
    progress: float = 0.0
    detail: dict = Field(default_factory=dict)


class CharacterUnlockOverview(BaseModel):
    feature: str
    min_level: int
    unlocked: bool
    label: str = ""


class VictoryOverview(BaseModel):
    schema_version: int = 1
    template_key: str = ""
    min_period_index: int = 7
    period_gate_open: bool = False
    goals_met: int = 0
    goals_required: int = 0
    goals_enabled: int = 0
    win_reached: bool = False
    goals: List[VictoryGoalOverview] = Field(default_factory=list)


class FinanceOverview(BaseModel):
    salary: SalaryProfileResponse
    liabilities: List[LiabilityResponse]
    assets: List[AssetResponse]
    total_monthly_income: float
    total_monthly_liabilities_payment: float
    total_monthly_assets_maintenance: float
    # Расходы «жизни» за период (base + delta); списываются в конце периода.
    monthly_lifestyle_expense: float = 0
    net_monthly_cashflow: float
    liabilities_to_income_ratio: float
    gamification_level: str
    score: int
    xp_to_next_level: int
    character_level: int = 1
    character_xp: int = 0
    character_xp_need_for_next: int = 100
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
    # Среднее изменение (наличные + подушка) между последовательными закрытиями;
    # до 6 последних интервалов по PeriodEconomyClosing (цель avg_liquid_delta_6p).
    avg_net_cashflow_6p: float = 0.0
    avg_net_cashflow_6p_n: int = 0
    victory: Optional[VictoryOverview] = None
    character_unlocks: List[CharacterUnlockOverview] = Field(default_factory=list)


class AnalyticsTimeseriesPoint(BaseModel):
    """Точка истории по закрытому периоду или текущему снимку."""

    period_index: int
    cash_balance: float
    safety_fund_balance: float
    total_overdue_amount: float
    is_projection: bool = False


class AchievementTierStatus(BaseModel):
    tier_key: str
    tier_index: int
    title: str
    description: str = ""
    xp_reward: int = 0
    unlocked: bool = False


class AchievementChainStatus(BaseModel):
    chain_key: str
    category: str
    title: str
    description: str = ""
    max_tier: int
    current_tier: int = 0
    tiers: List[AchievementTierStatus] = Field(default_factory=list)


class AchievementUnlockEvent(BaseModel):
    chain_key: str
    tier_key: str
    tier_index: int
    title: str
    xp_reward: int = 0
    xp_gained: int = 0
    level_up: bool = False
    new_level: Optional[int] = None


class AchievementsOverviewResponse(BaseModel):
    period_index: int
    character_level: int
    character_xp: int
    chains: List[AchievementChainStatus] = Field(default_factory=list)
    newly_unlocked: List[AchievementUnlockEvent] = Field(default_factory=list)


class FinanceAnalyticsTimeseriesResponse(BaseModel):
    """Ряд для графиков («фаза B» аналитики); закрытия пишутся при завершении периода."""

    current_period_index: int
    clean_period_streak: int
    points: List["AnalyticsTimeseriesPoint"]


class GameProfileCreate(BaseModel):
    name: str
    save_kind: str = "game"


class GameProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    save_kind: str
    starter_template_key: Optional[str] = None
    cash_balance: float = 0
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


class GameStarterTemplatePublic(BaseModel):
    template_key: str
    title: str
    difficulty_rank: int
    description: Optional[str] = None


class GameStartRequest(BaseModel):
    """Тело POST /api/game/start (новый и legacy-формат через model_validator)."""

    model_config = ConfigDict(extra="ignore")

    profile_name: str
    save_kind: str = "game"
    template_key: Optional[str] = None
    period_duration_seconds: int = 300
    cash_balance: float = 0
    monthly_receipts_count: int = 1
    monthly_salary: float = 0
    monthly_amount: Optional[float] = None
    assets: List[AssetCreate] = Field(default_factory=list)
    liabilities: List[LiabilityCreate] = Field(default_factory=list)

    @model_validator(mode="after")
    def normalize_game_start(self):
        sk = (self.save_kind or "game").strip().lower()
        if sk not in ("game", "plan"):
            raise ValueError("save_kind must be 'game' or 'plan'")
        updates: dict = {"save_kind": sk}
        if self.monthly_salary in (0, 0.0) and self.monthly_amount is not None:
            updates["monthly_salary"] = float(self.monthly_amount)
        return self.model_copy(update=updates)


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