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


class ExpenseCategoryBurnItem(BaseModel):
    category_key: str
    title: str
    amount: float
    tier: str = "must"


class ExpenseLineOverviewItem(BaseModel):
    id: int
    category_key: str
    category_title: str
    title: str
    amount: float
    tier: str = "must"
    source_kind: str = "template"
    expires_period_index: Optional[int] = None


class MonthlyBurnBreakdown(BaseModel):
    baseline: float = 0
    legacy_delta: float = 0
    lines: List[ExpenseLineOverviewItem] = Field(default_factory=list)
    by_category: List[ExpenseCategoryBurnItem] = Field(default_factory=list)


class ExpenseCategoryPublic(BaseModel):
    category_key: str
    title: str
    default_tier: str = "must"
    sort_order: int = 100


class ExpenseLineCreate(BaseModel):
    category_key: str
    amount_monthly: float = Field(ge=0)
    title: Optional[str] = None


class ExpenseLineUpdate(BaseModel):
    category_key: Optional[str] = None
    amount_monthly: Optional[float] = Field(default=None, ge=0)
    title: Optional[str] = None


class ExpenseLineResponse(BaseModel):
    id: int
    category_key: str
    category_title: str
    title: str
    amount_monthly: float
    tier: str = "must"
    source_kind: str = "plan"
    expires_period_index: Optional[int] = None


class ExpensesSnapshotResponse(BaseModel):
    period_index: int
    total: float
    monthly_lifestyle_expense: float
    breakdown: MonthlyBurnBreakdown
    total_monthly_outflow: float = 0
    expense_to_income_ratio: float = 0


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
    # Расходы на жизнеобеспечение (burn); списываются в конце периода.
    monthly_lifestyle_expense: float = 0
    monthly_burn_total: float = 0
    monthly_burn_breakdown: Optional[MonthlyBurnBreakdown] = None
    total_monthly_outflow: float = 0
    expense_to_income_ratio: float = 0
    net_monthly_cashflow: float
    liabilities_to_income_ratio: float
    gamification_level: str
    score: int
    xp_to_next_level: int
    character_level: int = 1
    character_xp: int = 0
    character_xp_need_for_next: int = 30
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
    newly_unlocked: List["AchievementUnlockEvent"] = Field(default_factory=list)
    save_kind: str = "game"
    onboarding_state: str = "brief_done"
    onboarding_step: str = "farewell"


class AnalyticsTimeseriesPoint(BaseModel):
    """Точка истории по закрытому периоду или текущему снимку."""

    period_index: int
    cash_balance: float
    safety_fund_balance: float
    total_overdue_amount: float
    monthly_burn_total: float = 0
    is_projection: bool = False


class PeriodCloseBreakdownItem(BaseModel):
    type: str
    title: str
    amount: float
    category_key: Optional[str] = None


class PeriodCloseSummary(BaseModel):
    closed_period_index: int = 0
    cash_delta: float = 0
    income_delta: float = 0
    expense_delta: float = 0
    safety_fund_delta: float = 0
    invest_capital_delta: float = 0
    debt_delta: float = 0
    total_spent: float = 0
    new_balance: float = 0
    breakdown: List[PeriodCloseBreakdownItem] = Field(default_factory=list)
    xp_earned: int = 0
    xp_period_close: int = 0
    xp_milestone: int = 0
    milestone_title: Optional[str] = None
    xp_from_achievements: int = 0
    achievement_unlocks: List["AchievementUnlockEvent"] = Field(default_factory=list)
    level_up: bool = False
    new_level: Optional[int] = None
    character_level: int = 1


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
    onboarding_step: str = "period_timer"


class OnboardingPatchRequest(BaseModel):
    onboarding_state: Optional[str] = None
    onboarding_step: Optional[str] = None
    """1 = пропуск шага; 2 = пропуск всего онбординга (ops-лог)."""
    onboarding_skip_count: Optional[int] = None


class OnboardingPatchResponse(BaseModel):
    onboarding_state: str
    onboarding_step: str


class TimeConfigUpdate(BaseModel):
    period_duration_seconds: int


class TimeStatusResponse(BaseModel):
    time_state: str
    period_index: int
    period_duration_seconds: int
    seconds_until_next_period: int
    period_close: Optional[PeriodCloseSummary] = None


class GameStarterTemplatePublic(BaseModel):
    template_key: str
    title: str
    difficulty_rank: int
    description: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)
    scenario_icon: Optional[str] = None
    compare_note: Optional[str] = None


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
    expense_budget: dict[str, float] = Field(default_factory=dict)

    @model_validator(mode="after")
    def normalize_game_start(self):
        sk = (self.save_kind or "game").strip().lower()
        if sk not in ("game", "plan"):
            raise ValueError("save_kind must be 'game' or 'plan'")
        self.save_kind = sk
        if self.monthly_salary in (0, 0.0) and self.monthly_amount is not None:
            self.monthly_salary = float(self.monthly_amount)
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


class PendingEventsPayload(BaseModel):
    events: List[dict] = Field(default_factory=list)
    event: Optional[dict] = None


class GameBootstrapResponse(BaseModel):
    overview: FinanceOverview
    time: TimeStatusResponse
    period: PeriodStatusResponse
    events: PendingEventsPayload


class PeriodSummaryResponse(BaseModel):
    period_index: int
    salary_claimed: bool
    salary_amount: float
    safety_fund_contribution: float
    safety_fund_total: float
    net_savings: float
    xp_earned: int
    required_actions_completed: bool