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
    total_overdue_added = 0.0

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

    # 2. Списание обслуживания активов (неизбежные расходы).
    # На MVP допускаем уход в минус из-за обслуживания (как "неизбежные" траты).
    assets_spend = sum(float(a.monthly_maintenance_cost) for a in assets)
    if assets_spend > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-assets_spend,
            type=TRANSACTION_TYPES["ASSET_MAINTENANCE"],
            description=f"Обслуживание активов за период #{period_index}",
            period_index=period_index,
        )
        db.refresh(profile)

    # 3. Обязательства: игрок может забыть/не хватить денег → уходит в просрочку (без штрафов на MVP).
    liabilities = db.query(FinanceLiability).filter(
        FinanceLiability.game_profile_id == profile.id,
        FinanceLiability.is_active == 1
    ).all()

    for liability in liabilities:
        monthly_due = float(liability.monthly_payment)
        previous_overdue = float(getattr(liability, "overdue_amount", 0) or 0)
        due_total = monthly_due + previous_overdue

        # Платим сколько можем, но не уходим в минус из-за обязательств
        available = max(0.0, float(profile.cash_balance))
        paid = min(available, due_total)
        unpaid = due_total - paid

        if paid > 0:
            adjust_balance(
                db=db,
                game_profile_id=profile.id,
                amount=-paid,
                type=TRANSACTION_TYPES["LIABILITY_PAYMENT"],
                description=f"Платёж по обязательству: {liability.title} (период #{period_index})",
                period_index=period_index,
            )
            db.refresh(profile)

        liability.overdue_amount = float(unpaid)
        if unpaid > 0:
            liability.overdue_periods = int(getattr(liability, "overdue_periods", 0) or 0) + 1
            total_overdue_added += unpaid
        else:
            liability.overdue_periods = 0

        breakdown.append({
            "type": "liability",
            "title": liability.title,
            "due": due_total,
            "paid": paid,
            "unpaid": unpaid,
        })

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
    # Важно: НЕ сбрасываем в 0. Поле хранит номер периода, в котором брали зарплату.
    # После увеличения period_index сравнение перестанет совпадать само.

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
        "overdue_added": round(total_overdue_added, 2),
        "xp_earned": xp_earned,
        "level_up": level_up,
        "new_level": profile.level if level_up else None
    }