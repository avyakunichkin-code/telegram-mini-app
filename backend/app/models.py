from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base
from .timeutil import utc_now_naive


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    telegram_id = Column(Integer, unique=True, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)


class ApiIdempotencyRecord(Base):
    """Сохранённый ответ для повторного POST с тем же Idempotency-Key."""

    __tablename__ = "api_idempotency_records"
    __table_args__ = (UniqueConstraint("user_id", "route_key", "idempotency_key", name="uq_idempotency_user_route_key"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    route_key = Column(String(128), nullable=False)
    idempotency_key = Column(String(128), nullable=False)
    status_code = Column(Integer, nullable=False, default=200)
    response_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=utc_now_naive)


# ==================== Игровые модели (партия = game_profile) ====================

class GameProfile(Base):
    __tablename__ = "game_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    save_kind = Column(String(16), nullable=False, default="game")  # game | plan (plan — MVP 2.0)
    starter_template_key = Column(String(80), nullable=True)
    starter_params_json = Column(Text, nullable=False, default="{}")
    base_monthly_lifestyle_expense = Column(Float, nullable=False, default=0)
    delta_monthly_lifestyle_expense = Column(Float, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=0)
    is_archived = Column(Integer, nullable=False, default=0)
    league = Column(String(50), nullable=False, default="Bronze")
    level = Column(Integer, nullable=False, default=1)
    xp = Column(Integer, nullable=False, default=0)
    streak = Column(Integer, nullable=False, default=0)
    time_state = Column(String(20), nullable=False, default="pause")
    period_index = Column(Integer, nullable=False, default=1)
    period_duration_seconds = Column(Integer, nullable=False, default=300)
    period_anchor_at = Column(DateTime, nullable=False, default=utc_now_naive)
    base_params_locked = Column(Integer, nullable=False, default=0)
    onboarding_state = Column(String(30), nullable=False, default="draft")
    onboarding_step = Column(String(40), nullable=False, default="period_timer")
    # НОВЫЕ ПОЛЯ:
    cash_balance = Column(Float, nullable=False, default=0)
    safety_fund_balance = Column(Float, nullable=False, default=0)
    negative_periods_count = Column(Integer, nullable=False, default=0)
    last_period_salary_claimed = Column(Integer, nullable=False, default=0)
    clean_period_streak = Column(Integer, nullable=False, default=0)
    progression_milestones_awarded = Column(Text, nullable=False, default="[]")

    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    user = relationship("User", backref="game_profiles")
    finance_salary = relationship("FinanceSalary", back_populates="game_profile", uselist=False, cascade="all, delete-orphan")
    finance_liabilities = relationship("FinanceLiability", back_populates="game_profile", cascade="all, delete-orphan")
    finance_assets = relationship("FinanceAsset", back_populates="game_profile", cascade="all, delete-orphan")
    period_snapshots = relationship("PeriodSnapshot", back_populates="game_profile", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="game_profile", cascade="all, delete-orphan")


class FinanceSalary(Base):
    __tablename__ = "finance_salaries"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, unique=True, index=True)
    monthly_amount = Column(Float, nullable=False, default=0)
    monthly_receipts_count = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)
    game_profile = relationship("GameProfile", back_populates="finance_salary")


class FinanceLiability(Base):
    __tablename__ = "finance_liabilities"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False, default="Обязательство")
    total_debt = Column(Float, nullable=False)
    annual_rate_percent = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    overdue_amount = Column(Float, nullable=False, default=0)  # сумма просрочки (неоплаченная часть)
    overdue_periods = Column(Integer, nullable=False, default=0)  # сколько периодов подряд есть просрочка
    is_active = Column(Integer, nullable=False, default=1)   # НОВОЕ
    created_at = Column(DateTime, default=utc_now_naive)
    game_profile = relationship("GameProfile", back_populates="finance_liabilities")


class FinanceAsset(Base):
    __tablename__ = "finance_assets"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False, default="Актив")
    kind = Column(String(50), nullable=False, default="generic")  # например: home, rental_home, car, rental_car, deposit, bond
    asset_value = Column(Float, nullable=False)
    monthly_maintenance_cost = Column(Float, nullable=False, default=0)
    monthly_income = Column(Float, nullable=False, default=0)  # доход от аренды/купоны/проценты
    has_tenants = Column(Integer, nullable=False, default=0)  # 1 = доходная с арендаторами (задел под события)
    is_active = Column(Integer, nullable=False, default=1)   # НОВОЕ
    created_at = Column(DateTime, default=utc_now_naive)
    game_profile = relationship("GameProfile", back_populates="finance_assets")


class AssetTemplate(Base):
    """Типовой актив для каталога (используется при добавлении в игре)."""

    __tablename__ = "asset_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(String(80), unique=True, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    kind = Column(String(50), nullable=False, default="generic")
    asset_value = Column(Float, nullable=False)
    monthly_maintenance_cost = Column(Float, nullable=False, default=0)
    monthly_income = Column(Float, nullable=False, default=0)
    estate_role = Column(String(20), nullable=False, default="owned")  # owned | income | leased
    monthly_rent_cost = Column(Float, nullable=False, default=0)
    monthly_utilities_cost = Column(Float, nullable=False, default=0)
    income_yield_annual = Column(Float, nullable=True)
    has_tenants_default = Column(Integer, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1)
    sort_order = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=utc_now_naive)


class LiabilityTemplate(Base):
    """Типовое обязательство (выдача суммы на баланс при оформлении в игре)."""

    __tablename__ = "liability_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(String(80), unique=True, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    total_debt = Column(Float, nullable=False)
    annual_rate_percent = Column(Float, nullable=False)
    is_active = Column(Integer, nullable=False, default=1)
    sort_order = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=utc_now_naive)


class ExpenseCategoryDefinition(Base):
    """Каталог категорий расходов на жизнеобеспечение (E1)."""

    __tablename__ = "expense_category_definitions"

    category_key = Column(String(40), primary_key=True)
    title = Column(String(120), nullable=False)
    default_tier = Column(String(20), nullable=False, default="must")
    sort_order = Column(Integer, nullable=False, default=100)
    icon_key = Column(String(40), nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=utc_now_naive)


class ProfileExpenseLine(Base):
    """Статья месячного бюджета жизнеобеспечения на профиле."""

    __tablename__ = "profile_expense_lines"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    category_key = Column(String(40), ForeignKey("expense_category_definitions.category_key"), nullable=False)
    amount_monthly = Column(Float, nullable=False, default=0)
    title_override = Column(String(160), nullable=True)
    source_kind = Column(String(20), nullable=False, default="template")
    source_ref = Column(String(120), nullable=True)
    tier = Column(String(20), nullable=False, default="must")
    created_period_index = Column(Integer, nullable=False, default=1)
    expires_period_index = Column(Integer, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=utc_now_naive)

    game_profile = relationship("GameProfile", backref="expense_lines")
    category = relationship("ExpenseCategoryDefinition")


class GameStarterTemplate(Base):
    """Стартовый шаблон Game Mode (blueprint JSON + базовые расходы «жизни»)."""

    __tablename__ = "game_starter_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(String(80), unique=True, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    difficulty_rank = Column(Integer, nullable=False, default=1)
    base_monthly_lifestyle_expense = Column(Float, nullable=False, default=0)
    blueprint_json = Column(Text, nullable=False, default="{}")
    victory_config_json = Column(Text, nullable=False, default="{}")
    is_active = Column(Integer, nullable=False, default=1)
    sort_order = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=utc_now_naive)
    # game — только каталог Game; plan — только Plan; any — оба (редко)
    applies_to_save_kind = Column(String(20), nullable=False, default="game")


class GameStarterTemplateExpenseAllocation(Base):
    """Доли категорий для шаблона: сумма weight по template_key = 1 → суммы = base_monthly × weight."""

    __tablename__ = "game_starter_template_expense_allocations"
    __table_args__ = (UniqueConstraint("template_key", "category_key", name="uq_gst_exp_alloc_cat"),)

    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(
        String(80),
        ForeignKey("game_starter_templates.template_key", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category_key = Column(String(64), nullable=False)
    weight = Column(Float, nullable=False)


# ==================== СОБЫТИЯ (MVP) ====================

class EventDefinition(Base):
    __tablename__ = "event_definitions"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False, index=True)
    # Совместимость с профилем: game | plan | any (legacy light/hardcore → game в миграции)
    mode = Column(String(20), nullable=False, default="game")
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    weight = Column(Integer, nullable=False, default=100)
    is_active = Column(Integer, nullable=False, default=1)
    # legacy: 0/1; предпочтительно mandatory_gate
    mandatory = Column(Integer, nullable=False, default=0)
    mandatory_gate = Column(String(32), nullable=False, default="none")  # none | blocks_period_end
    category = Column(String(80), nullable=True)
    metadata_json = Column(Text, nullable=False, default="{}")
    prerequisites_json = Column(Text, nullable=False, default="{}")
    event_tier = Column(Integer, nullable=False, default=1)
    repeat_policy = Column(String(32), nullable=False, default="repeatable")  # repeatable | once_per_profile | max_per_profile
    repeat_max = Column(Integer, nullable=True)
    cooldown_periods = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utc_now_naive)

    choices = relationship("EventChoice", back_populates="definition", cascade="all, delete-orphan")
    profile_counters = relationship("EventProfileCounter", back_populates="definition", cascade="all, delete-orphan")


class EventChoice(Base):
    __tablename__ = "event_choices"

    id = Column(Integer, primary_key=True, index=True)
    definition_id = Column(Integer, ForeignKey("event_definitions.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    effects_json = Column(Text, nullable=False, default="{}")  # JSON: {cash_delta, safety_delta, ...}

    definition = relationship("EventDefinition", back_populates="choices")


class EventProfileCounter(Base):
    """Сколько раз событие уже выбирали в партии + период последнего выбора (cooldown / repeat)."""

    __tablename__ = "event_profile_counters"

    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), primary_key=True, nullable=False)
    definition_id = Column(Integer, ForeignKey("event_definitions.id"), primary_key=True, nullable=False)
    times_selected = Column(Integer, nullable=False, default=0)
    last_selected_period_index = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    definition = relationship("EventDefinition", back_populates="profile_counters")


class EventInstance(Base):
    __tablename__ = "event_instances"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    period_index = Column(Integer, nullable=False, index=True)
    definition_id = Column(Integer, ForeignKey("event_definitions.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending/selected/expired
    selected_choice_id = Column(Integer, ForeignKey("event_choices.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    resolved_at = Column(DateTime, nullable=True)


class EventProfileChain(Base):
    """Отложенное продолжение сюжета (enqueue_event → follow-up в due_period_index)."""

    __tablename__ = "event_profile_chains"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    chain_key = Column(String(80), nullable=False, index=True)
    status = Column(String(24), nullable=False, default="scheduled")  # scheduled | surfaced | completed | cancelled
    followup_definition_key = Column(String(80), nullable=False)
    after_periods = Column(Integer, nullable=False, default=2)
    due_period_index = Column(Integer, nullable=False, index=True)
    context_json = Column(Text, nullable=False, default="{}")
    surfaced_instance_id = Column(Integer, ForeignKey("event_instances.id"), nullable=True)
    created_period_index = Column(Integer, nullable=False)
    completed_period_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)


# ==================== ИНВЕСТИЦИИ (EASY MVP) ====================

class InvestmentPosition(Base):
    __tablename__ = "investment_positions"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    kind = Column(String(30), nullable=False)  # deposit | bond
    title = Column(String(160), nullable=False)
    principal = Column(Float, nullable=False, default=0)
    annual_rate_percent = Column(Float, nullable=False, default=0)
    started_period = Column(Integer, nullable=False)
    last_accrued_period = Column(Integer, nullable=False)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=utc_now_naive)


# ==================== СТРАХОВКИ (EASY MVP) ====================

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    product = Column(String(30), nullable=True)
    insured_object = Column(String(30), nullable=True)
    kind = Column(String(40), nullable=False)
    title = Column(String(160), nullable=False)
    monthly_premium = Column(Float, nullable=False, default=0)
    payout_amount = Column(Float, nullable=True)
    coverage_limit = Column(Float, nullable=False, default=0)
    term_periods = Column(Integer, nullable=False, default=12)
    started_period_index = Column(Integer, nullable=True)
    expires_period_index = Column(Integer, nullable=True)
    claimed_period_index = Column(Integer, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=utc_now_naive)



class PeriodSnapshot(Base):
    __tablename__ = "period_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    period_index = Column(Integer, nullable=False)
    salary_claimed = Column(Integer, nullable=False, default=0)
    salary_amount = Column(Float, nullable=False, default=0)
    safety_fund_contribution = Column(Float, nullable=False, default=0)
    safety_fund_total = Column(Float, nullable=False, default=0)
    total_expenses = Column(Float, nullable=False, default=0)
    is_completed = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime, nullable=True)
    net_savings = Column(Float, nullable=False, default=0)
    xp_earned = Column(Integer, nullable=False, default=0)
    safety_contribute_xp_grants = Column(Integer, nullable=False, default=0)
    safety_withdraw_xp_grants = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utc_now_naive)
    game_profile = relationship("GameProfile", back_populates="period_snapshots")


class PeriodEconomyClosing(Base):
    """Снимок финансов в конце периода — для графиков и аналитики по месяцам."""

    __tablename__ = "period_economy_closings"
    __table_args__ = (
        UniqueConstraint("game_profile_id", "period_index", name="uq_period_economy_closing_pi"),
    )

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    period_index = Column(Integer, nullable=False)
    cash_balance = Column(Float, nullable=False, default=0)
    safety_fund_balance = Column(Float, nullable=False, default=0)
    total_overdue_amount = Column(Float, nullable=False, default=0)
    monthly_burn_total = Column(Float, nullable=False, default=0)
    period_income_rate = Column(Float, nullable=False, default=0)
    period_expense_total = Column(Float, nullable=False, default=0)
    total_debt_balance = Column(Float, nullable=False, default=0)
    closed_at = Column(DateTime, default=utc_now_naive)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    period_index = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=utc_now_naive)

    game_profile = relationship("GameProfile", back_populates="transactions")


# ==================== ДОСТИЖЕНИЯ (цепочки + ступени) ====================


class AchievementChain(Base):
    __tablename__ = "achievement_chains"

    id = Column(Integer, primary_key=True, index=True)
    chain_key = Column(String(80), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    max_tier = Column(Integer, nullable=False, default=1)
    is_active = Column(Integer, nullable=False, default=1)
    sort_order = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=utc_now_naive)

    tiers = relationship(
        "AchievementTierDefinition",
        back_populates="chain",
        cascade="all, delete-orphan",
        order_by="AchievementTierDefinition.tier_index",
    )


class AchievementTierDefinition(Base):
    __tablename__ = "achievement_tier_definitions"
    __table_args__ = (UniqueConstraint("chain_key", "tier_index", name="uq_achievement_tier_chain_index"),)

    id = Column(Integer, primary_key=True, index=True)
    chain_key = Column(String(80), ForeignKey("achievement_chains.chain_key"), nullable=False, index=True)
    tier_index = Column(Integer, nullable=False)
    tier_key = Column(String(80), unique=True, nullable=False, index=True)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    criteria_json = Column(Text, nullable=False, default="{}")
    xp_reward = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=100)

    chain = relationship("AchievementChain", back_populates="tiers")
    unlocks = relationship("ProfileAchievementUnlock", back_populates="tier_definition", cascade="all, delete-orphan")


class ProfileAchievementUnlock(Base):
    __tablename__ = "profile_achievement_unlocks"

    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), primary_key=True, nullable=False)
    tier_definition_id = Column(
        Integer, ForeignKey("achievement_tier_definitions.id"), primary_key=True, nullable=False
    )
    unlocked_at = Column(DateTime, default=utc_now_naive)
    period_index = Column(Integer, nullable=False, default=1)

    tier_definition = relationship("AchievementTierDefinition", back_populates="unlocks")


class NotificationLog(Base):
    """Журнал уведомлений (MVP 1.2 A0: audience admin → Telegram ops)."""

    __tablename__ = "notification_log"

    id = Column(Integer, primary_key=True, index=True)
    audience = Column(String(16), nullable=False, default="admin", index=True)
    kind = Column(String(64), nullable=False, index=True)
    dedupe_key = Column(String(160), nullable=True, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=True, index=True)
    payload_json = Column(Text, nullable=False, default="{}")
    telegram_sent = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utc_now_naive, index=True)