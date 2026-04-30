from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


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
    monthly_payment: float


class LiabilityResponse(BaseModel):
    id: int
    title: str
    total_debt: float
    annual_rate_percent: float
    monthly_payment: float
    created_at: datetime


class AssetCreate(BaseModel):
    title: Optional[str] = "Актив"
    asset_value: float
    monthly_maintenance_cost: float


class AssetResponse(BaseModel):
    id: int
    title: str
    asset_value: float
    monthly_maintenance_cost: float
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


class TimeConfigUpdate(BaseModel):
    period_duration_seconds: int


class TimeStatusResponse(BaseModel):
    time_state: str
    period_index: int
    period_duration_seconds: int
    seconds_until_next_period: int