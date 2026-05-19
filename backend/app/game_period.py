# backend/app/game_period.py

from sqlalchemy.orm import Session

from .models import (
    GameProfile,
    FinanceAsset,
    FinanceLiability,
    Transaction,
    InvestmentPosition,
    PeriodEconomyClosing,
    PeriodSnapshot,
)
from .balance_utils import adjust_balance, add_transaction, TRANSACTION_TYPES
from .achievement_engine import process_achievement_unlocks
from .achievement_seeds import ensure_achievement_catalog
from .character_progression import apply_character_xp
from .progression_xp import (
    compute_period_close_xp,
    milestone_title_for_period,
    milestone_xp_for_closed_period,
    save_milestones_awarded,
)
from .routers.events import ensure_period_events, expire_pending_events_for_closed_period, _ensure_seed_events
from .routers.insurance import charge_premiums_for_period
from .expenses import compute_monthly_burn, expire_expense_lines_for_period, lifestyle_period_breakdown
from .timeutil import utc_now_naive


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
    closed_burn_total = 0.0
    total_overdue_added = 0.0
    invest_income = 0.0

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

    # 2.1 Доход от активов (аренда и т.п.) — начисляется автоматически в конце периода
    assets_income = sum(float(getattr(a, "monthly_income", 0) or 0) for a in assets)
    if assets_income > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=assets_income,
            type="asset_income",
            description=f"Доход от активов за период #{period_index}",
            period_index=period_index,
        )
        db.refresh(profile)
        breakdown.append({"type": "asset_income", "title": "Доход от активов", "amount": round(assets_income, 2)})

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

    # 3.4 Расходы на жизнеобеспечение (статьи бюджета + legacy delta)
    expire_expense_lines_for_period(db, profile, period_index)
    burn_snapshot = compute_monthly_burn(db, profile)
    lifestyle_total = float(burn_snapshot.total)
    closed_burn_total = round(lifestyle_total, 2)
    if lifestyle_total > 0:
        adjust_balance(
            db=db,
            game_profile_id=profile.id,
            amount=-lifestyle_total,
            type=TRANSACTION_TYPES["LIFESTYLE_EXPENSE"],
            description=f"Расходы на жизнь за период #{period_index}",
            period_index=period_index,
        )
        db.refresh(profile)
        cat_lines = lifestyle_period_breakdown(burn_snapshot)
        if cat_lines:
            breakdown.extend(cat_lines)
            breakdown.append(
                {
                    "type": "lifestyle",
                    "title": "Итого расходы на жизнь",
                    "amount": round(lifestyle_total, 2),
                }
            )
        else:
            breakdown.append({"type": "lifestyle", "title": "Расходы «жизни»", "amount": round(lifestyle_total, 2)})

    # 3.5 Страховки: списываем премии (на MVP без просрочек — может уйти в минус)
    insurance_spend = 0.0
    try:
        insurance_spend = float(charge_premiums_for_period(db, profile, period_index) or 0)
        if insurance_spend > 0:
            breakdown.append({"type": "insurance", "title": "Премии", "amount": insurance_spend})
    except Exception:
        pass

    # 3.6 Инвестиции: начисления (депозит — капитализация, облигации — купон на баланс)
    positions = (
        db.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.is_active == 1)
        .all()
    )
    for pos in positions:
        # начисляем только если прошёл период
        if int(pos.last_accrued_period) >= int(period_index):
            continue
        periods_to_accrue = int(period_index) - int(pos.last_accrued_period)
        if periods_to_accrue <= 0:
            continue

        monthly_rate = float(pos.annual_rate_percent) / 100.0 / 12.0
        if pos.kind == "deposit":
            # капитализация на principal
            interest = float(pos.principal) * monthly_rate * periods_to_accrue
            pos.principal = float(pos.principal) + interest
            invest_income += interest
        elif pos.kind == "bond":
            # купон на баланс
            coupon = float(pos.principal) * monthly_rate * periods_to_accrue
            if coupon != 0:
                adjust_balance(db, profile.id, +coupon, "bond_coupon", f"Купон: {pos.title}", period_index)
                db.refresh(profile)
                invest_income += coupon
        pos.last_accrued_period = int(period_index)
    if invest_income != 0:
        breakdown.append({"type": "invest", "title": "Доход от инвестиций", "amount": round(invest_income, 2)})

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

    # 5. XP за закрытие периода (единый пакет + milestone + достижения)
    level_before_xp = int(profile.level)
    snapshot = (
        db.query(PeriodSnapshot)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.period_index == period_index,
        )
        .first()
    )
    salary_claimed = bool(
        (snapshot and int(snapshot.salary_claimed or 0) == 1)
        or int(getattr(profile, "last_period_salary_claimed", 0) or 0) == int(period_index)
    )
    safety_contrib = float(snapshot.safety_fund_contribution or 0) if snapshot else 0.0
    period_xp = compute_period_close_xp(
        salary_claimed=salary_claimed,
        safety_fund_contribution=safety_contrib,
    )
    milestone_xp, milestones_list = milestone_xp_for_closed_period(profile, period_index)
    milestone_title = milestone_title_for_period(period_index) if milestone_xp > 0 else None
    if milestone_xp > 0:
        save_milestones_awarded(profile, milestones_list)

    rhythm_xp = period_xp + milestone_xp
    if snapshot is not None:
        snapshot.xp_earned = int(rhythm_xp)

    apply_character_xp(profile, rhythm_xp, db)

    # 6. Сбрасываем флаг получения зарплаты (если он хранится в профиле)
    # Важно: НЕ сбрасываем в 0. Поле хранит номер периода, в котором брали зарплату.
    # После увеличения period_index сравнение перестанет совпадать само.

    # 6.5 Снимок на конец периода для аналитики + счётчик «чистых» месяцев без просрочек
    total_overdue_now = round(sum(float(li.overdue_amount or 0) for li in liabilities), 2)
    if total_overdue_now <= 1e-8:
        profile.clean_period_streak = int(getattr(profile, "clean_period_streak", 0) or 0) + 1
    else:
        profile.clean_period_streak = 0

    db.add(
        PeriodEconomyClosing(
            game_profile_id=int(profile.id),
            period_index=int(period_index),
            cash_balance=float(profile.cash_balance),
            safety_fund_balance=float(profile.safety_fund_balance),
            total_overdue_amount=float(total_overdue_now),
            monthly_burn_total=float(closed_burn_total),
        )
    )

    expire_pending_events_for_closed_period(db, profile.id, int(period_index))

    achievement_unlocks: list = []
    try:
        ensure_achievement_catalog(db)
        achievement_unlocks = process_achievement_unlocks(db, profile)
    except Exception:
        achievement_unlocks = []

    xp_from_achievements = sum(int(item.get("xp_reward") or 0) for item in achievement_unlocks)
    total_xp_earned = int(rhythm_xp) + int(xp_from_achievements)
    level_up = int(profile.level) > level_before_xp
    new_level = int(profile.level) if level_up else None

    # 7. Увеличиваем номер периода
    closed_period_index = int(period_index)
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()

    db.commit()
    db.refresh(profile)

    try:
        from .admin_notify import process_period_admin_alerts

        process_period_admin_alerts(db, profile, closed_period_index=closed_period_index)
    except Exception:
        import logging

        logging.getLogger(__name__).warning(
            "Admin notify failed after period end profile_id=%s",
            profile.id,
            exc_info=True,
        )

    # 8. Событие на новый период (easy)
    try:
        _ensure_seed_events(db)
        ensure_period_events(db, profile.id, profile.period_index, profile.save_kind)
    except Exception:
        # События не должны ломать завершение периода
        pass

    return {
        "total_spent": total_spend,
        "breakdown": breakdown,
        "new_balance": profile.cash_balance,
        "negative_streak": profile.negative_periods_count,
        "game_over": profile.is_active == 0,
        "overdue_added": round(total_overdue_added, 2),
        "xp_earned": total_xp_earned,
        "xp_period_close": int(period_xp),
        "xp_milestone": int(milestone_xp),
        "milestone_title": milestone_title,
        "xp_from_achievements": int(xp_from_achievements),
        "level_up": level_up,
        "new_level": new_level,
        "character_level": int(profile.level),
        "achievement_unlocks": achievement_unlocks,
    }