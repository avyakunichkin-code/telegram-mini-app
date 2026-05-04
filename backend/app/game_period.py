# backend/app/game_period.py

from sqlalchemy.orm import Session
from datetime import datetime

from .models import GameProfile, FinanceAsset, FinanceLiability, Transaction
from .balance_utils import adjust_balance, add_transaction, TRANSACTION_TYPES


def process_period_end(db: Session, profile: GameProfile) -> dict:
    """
    Выполняет завершение текущего периода:
    - собирает активные активы и обязательства
    - списывает обслуживание активов и платежи по обязательствам
    - при отрицательном балансе увеличивает счётчик negative_periods_count
    - начисляет XP за завершение периода
    - сбрасывает флаг получения зарплаты
    - увеличивает period_index
    - проверяет поражение (3 отрицательных периода подряд)

    Возвращает словарь со статистикой списаний.
    """
    period_index = profile.period_index
    total_spend = 0.0
    breakdown = []

    # 1. Собираем активные активы
    assets = db.query(FinanceAsset).filter(
        FinanceAsset.game_profile_id == profile.id,
        FinanceAsset.is_active == 1
    ).all()
    for asset in assets:
        cost = float(asset.monthly_maintenance_cost)
        total_spend += cost
        breakdown.append({
            "type": "asset",
            "title": asset.title,
            "amount": cost
        })

    # 2. Собираем активные обязательства
    liabilities = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1
    ).all()
    for liability in liabilities:
        payment = float(liability.monthly_payment)
        total_spend += payment
        breakdown.append({
            "type": "liability",
            "title": liability.title,
            "amount": payment
        })

    # 3. Применяем списание
    if total_spend > 0:
        try:
            new_balance = adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=-total_spend,
                type=TRANSACTION_TYPES["PERIOD_PENALTY"],
                description=f"Автоматические списания за период #{period_index}",
                period_index=period_index,
            )
        except ValueError as e:
            # Если не хватает средств, adjust_balance всё равно применит отрицательный баланс
            # (так как мы не запрещаем уходить в минус)
            # Но нужно дополнительно обработать: просто продолжаем
            new_balance = profile.cash_balance - total_spend
            profile.cash_balance = new_balance
            add_transaction(
                db=db,
                game_profile_id=profile.id,
                amount=-total_spend,
                type=TRANSACTION_TYPES["PERIOD_PENALTY"],
                description=f"Списания (недостаточно средств) за период #{period_index}",
                period_index=period_index,
            )
        db.refresh(profile)

    # 4. Проверка отрицательного баланса
    if profile.cash_balance < 0:
        profile.negative_periods_count += 1
        # Можно добавить транзакцию-предупреждение
        if profile.negative_periods_count >= 3:
            # Поражение: блокируем профиль
            profile.is_active = 0
            add_transaction(
                db=db,
                game_profile_id=profile.id,
                amount=0,
                type=TRANSACTION_TYPES["GAME_OVER"],
                description=f"Поражение: 3 периода подряд с отрицательным балансом (период #{period_index})",
                period_index=period_index,
            )
    else:
        # Если баланс неотрицательный – сбрасываем счётчик
        profile.negative_periods_count = 0

    # 5. Начисляем XP за завершение периода
    xp_earned = 5
    profile.xp += xp_earned

    # Обработка повышения уровня
    level_up = False
    xp_for_next = 100
    while profile.xp >= xp_for_next:
        profile.level += 1
        profile.xp -= xp_for_next
        level_up = True
        xp_for_next = 100 + (profile.level - 1) * 50

    # 6. Сбрасываем флаг получения зарплаты (если он хранится в профиле)
    profile.last_period_salary_claimed = 0

    # 7. Увеличиваем номер периода
    profile.period_index += 1
    profile.period_anchor_at = datetime.utcnow()

    db.commit()
    db.refresh(profile)

    return {
        "total_spent": total_spend,
        "breakdown": breakdown,
        "new_balance": profile.cash_balance,
        "negative_streak": profile.negative_periods_count,
        "game_over": profile.is_active == 0,
        "xp_earned": xp_earned,
        "level_up": level_up,
        "new_level": profile.level if level_up else None
    }