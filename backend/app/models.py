from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100))
    telegram_id = Column(Integer, unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    salary_profile = relationship("SalaryProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    liabilities = relationship("Liability", back_populates="user", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="user", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="messages")


class SalaryProfile(Base):
    __tablename__ = "salary_profiles"
    id = Column(Integer, primary_key=True, index=True)
    monthly_amount = Column(Float, nullable=False, default=0)
    monthly_receipts_count = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    user = relationship("User", back_populates="salary_profile")


class Liability(Base):
    __tablename__ = "liabilities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False, default="Обязательство")
    total_debt = Column(Float, nullable=False)
    annual_rate_percent = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="liabilities")


class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False, default="Актив")
    asset_value = Column(Float, nullable=False)
    monthly_maintenance_cost = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="assets")


# ==================== НОВЫЕ ИГРОВЫЕ МОДЕЛИ ====================

class GameProfile(Base):
    __tablename__ = "game_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    mode = Column(String(20), nullable=False, default="light")
    is_active = Column(Integer, nullable=False, default=0)
    is_archived = Column(Integer, nullable=False, default=0)
    league = Column(String(50), nullable=False, default="Bronze")
    level = Column(Integer, nullable=False, default=1)
    xp = Column(Integer, nullable=False, default=0)
    streak = Column(Integer, nullable=False, default=0)
    time_state = Column(String(20), nullable=False, default="pause")
    period_index = Column(Integer, nullable=False, default=1)
    period_duration_seconds = Column(Integer, nullable=False, default=300)
    period_anchor_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    base_params_locked = Column(Integer, nullable=False, default=0)
    onboarding_state = Column(String(30), nullable=False, default="draft")
    # НОВЫЕ ПОЛЯ:
    cash_balance = Column(Float, nullable=False, default=0)
    safety_fund_balance = Column(Float, nullable=False, default=0)
    negative_periods_count = Column(Integer, nullable=False, default=0)
    last_period_salary_claimed = Column(Integer, nullable=False, default=0)
    clean_period_streak = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    is_active = Column(Integer, nullable=False, default=1)   # НОВОЕ
    created_at = Column(DateTime, default=datetime.utcnow)
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
    is_active = Column(Integer, nullable=False, default=1)
    sort_order = Column(Integer, nullable=False, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)


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
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== СОБЫТИЯ (MVP) ====================

class EventDefinition(Base):
    __tablename__ = "event_definitions"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False, index=True)
    mode = Column(String(20), nullable=False, default="light")  # light/hardcore/any (пока light)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    weight = Column(Integer, nullable=False, default=100)
    is_active = Column(Integer, nullable=False, default=1)
    # mandatory=1 зарезервировано под будущие обязательные сценарии (логику пока не включаем)
    mandatory = Column(Integer, nullable=False, default=0)
    category = Column(String(80), nullable=True)
    metadata_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    choices = relationship("EventChoice", back_populates="definition", cascade="all, delete-orphan")


class EventChoice(Base):
    __tablename__ = "event_choices"

    id = Column(Integer, primary_key=True, index=True)
    definition_id = Column(Integer, ForeignKey("event_definitions.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False, default="")
    effects_json = Column(Text, nullable=False, default="{}")  # JSON: {cash_delta, safety_delta, ...}

    definition = relationship("EventDefinition", back_populates="choices")


class EventInstance(Base):
    __tablename__ = "event_instances"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    period_index = Column(Integer, nullable=False, index=True)
    definition_id = Column(Integer, ForeignKey("event_definitions.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")  # pending/selected/expired
    selected_choice_id = Column(Integer, ForeignKey("event_choices.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


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
    created_at = Column(DateTime, default=datetime.utcnow)


# ==================== СТРАХОВКИ (EASY MVP) ====================

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    kind = Column(String(30), nullable=False)  # health | property | car
    title = Column(String(160), nullable=False)
    monthly_premium = Column(Float, nullable=False, default=0)
    coverage_limit = Column(Float, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)



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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    closed_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    period_index = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    game_profile = relationship("GameProfile", back_populates="transactions")