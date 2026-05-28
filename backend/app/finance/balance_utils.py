# backend/app/balance_utils.py

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from sqlalchemy.orm import Session

from ..models import GameProfile, Transaction


# Константы типов транзакций (можно вынести в отдельный файл)
TRANSACTION_TYPES = {
    "INITIAL_BALANCE": "initial_balance",
    "SALARY": "salary",
    "SAFETY_FUND_CONTRIBUTION": "safety_fund_contribution",
    "SAFETY_FUND_WITHDRAWAL": "safety_fund_withdrawal",
    "LIABILITY_PAYMENT": "liability_payment",
    "ASSET_MAINTENANCE": "asset_maintenance",
    "LIFESTYLE_EXPENSE": "lifestyle_expense",
    "PERIOD_PENALTY": "period_penalty",
    "GAME_OVER": "game_over",
}


def add_transaction(
        db: Session,
        game_profile_id: int,
        amount: float,
        type: str,
        description: str,
        period_index: int,
) -> Transaction:
    """
    Создаёт запись транзакции в таблице `transactions`.

    Args:
        db: сессия БД
        game_profile_id: ID игрового профиля
        amount: сумма (может быть отрицательной для списаний)
        type: тип транзакции (один из TRANSACTION_TYPES)
        description: описание
        period_index: номер периода

    Returns:
        созданный объект Transaction
    """
    transaction = Transaction(
        game_profile_id=game_profile_id,
        amount=amount,
        type=type,
        description=description,
        period_index=period_index,
    )
    db.add(transaction)
    db.flush()  # не commit, чтобы можно было использовать в транзакциях
    return transaction


def adjust_balance(
        db: Session,
        game_profile_id: int,
        amount: float,
        type: str,
        description: str,
        period_index: int,
) -> float:
    """
    Изменяет cash_balance игрового профиля на указанную сумму
    и записывает транзакцию.

    Args:
        db: сессия БД
        game_profile_id: ID игрового профиля
        amount: изменение баланса (положительное – зачисление, отрицательное – списание)
        type: тип транзакции
        description: описание
        period_index: номер периода

    Returns:
        новый баланс после изменения

    Raises:
        ValueError: если профиль не найден или неактивен (опционально)
    """
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        raise ValueError(f"GameProfile with id {game_profile_id} not found")

    # Применяем изменение баланса
    new_balance = profile.cash_balance + amount
    # Используем Decimal для избежания проблем с плавающей точкой (опционально)
    new_balance = float(Decimal(str(new_balance)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    profile.cash_balance = new_balance

    # Создаём транзакцию
    add_transaction(
        db=db,
        game_profile_id=game_profile_id,
        amount=amount,
        type=type,
        description=description,
        period_index=period_index,
    )

    db.flush()
    return new_balance


def get_cash_balance(db: Session, game_profile_id: int) -> float:
    """Возвращает текущий cash_balance профиля"""
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        raise ValueError(f"GameProfile with id {game_profile_id} not found")
    return profile.cash_balance


def adjust_safety_fund_balance(
        db: Session,
        game_profile_id: int,
        amount: float,
        type: str,
        description: str,
        period_index: int,
) -> float:
    """
    Изменяет safety_fund_balance и cash_balance одновременно
    (перевод между счетами).
    Для пополнения подушки: amount > 0, списывается с cash_balance.
    Для снятия: amount < 0, зачисляется на cash_balance.

    Args:
        db: сессия БД
        game_profile_id: ID игрового профиля
        amount: сумма перевода (положительная – в подушку, отрицательная – из подушки)
        type: тип транзакции (обычно SAFETY_FUND_CONTRIBUTION или WITHDRAWAL)
        description: описание
        period_index: номер периода

    Returns:
        новый баланс подушки

    Raises:
        ValueError: если недостаточно средств на источнике
    """
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        raise ValueError(f"GameProfile with id {game_profile_id} not found")

    if amount > 0:
        if profile.cash_balance < amount:
            raise ValueError("Недостаточно средств на счёте для перевода в подушку безопасности")
        profile.cash_balance -= amount
        profile.safety_fund_balance += amount
        # Одна транзакция на списание
        add_transaction(
            db=db,
            game_profile_id=game_profile_id,
            amount=-amount,
            type=type,
            description=f"В подушку: {description}",
            period_index=period_index,
        )
    elif amount < 0:
        withdrawal = -amount
        if profile.safety_fund_balance < withdrawal:
            raise ValueError("Недостаточно средств в подушке безопасности")
        profile.cash_balance += withdrawal
        profile.safety_fund_balance -= withdrawal
        add_transaction(
            db=db,
            game_profile_id=game_profile_id,
            amount=withdrawal,
            type=type,
            description=f"Из подушки: {description}",
            period_index=period_index,
        )
    db.flush()
    return profile.safety_fund_balance