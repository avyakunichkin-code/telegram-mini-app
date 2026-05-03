from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(200), nullable=False)  # Хранит "salt:hash"
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FinanceSalary(Base):
    __tablename__ = "finance_salaries"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, unique=True, index=True)
    monthly_amount = Column(Float, nullable=False, default=0)
    monthly_receipts_count = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FinanceLiability(Base):
    __tablename__ = "finance_liabilities"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False, default="Обязательство")
    total_debt = Column(Float, nullable=False)
    annual_rate_percent = Column(Float, nullable=False)
    monthly_payment = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class FinanceAsset(Base):
    __tablename__ = "finance_assets"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False, default="Актив")
    asset_value = Column(Float, nullable=False)
    monthly_maintenance_cost = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class PeriodSnapshot(Base):
    __tablename__ = "period_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    game_profile_id = Column(Integer, ForeignKey("game_profiles.id"), nullable=False, index=True)
    period_index = Column(Integer, nullable=False)

    # Действия периода
    salary_claimed = Column(Integer, nullable=False, default=0)  # 0 или 1
    salary_amount = Column(Float, nullable=False, default=0)
    safety_fund_contribution = Column(Float, nullable=False, default=0)
    safety_fund_total = Column(Float, nullable=False, default=0)  # Накопленная подушка
    total_expenses = Column(Float, nullable=False, default=0)  # Расходы за период

    # Статус
    is_completed = Column(Integer, nullable=False, default=0)  # 0 или 1
    completed_at = Column(DateTime, nullable=True)

    # Метрики периода
    net_savings = Column(Float, nullable=False, default=0)  # Чистые сбережения
    xp_earned = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)


class GameProfile(Base):
    __tablename__ = "game_profiles"

    # ... существующие поля ...

    # Добавить новые поля
    safety_fund_total = Column(Float, nullable=False, default=0)  # Общая накопленная подушка
    last_period_salary_claimed = Column(Integer, nullable=False, default=0)