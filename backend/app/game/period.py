# backend/app/game/period.py

import logging

from sqlalchemy.orm import Session
import json

logger = logging.getLogger(__name__)

from ..models import (
    GameProfile,
    FinanceAsset,
    FinanceLiability,
    Transaction,
    InvestmentPosition,
    PeriodEconomyClosing,
    PeriodSnapshot,
    FinanceSalary,
    GameStarterTemplate,
)
from ..finance.balance_utils import adjust_balance, add_transaction, TRANSACTION_TYPES
from ..achievements.engine import process_achievement_unlocks
from ..achievements.seeds import ensure_achievement_catalog
from ..services.events.service import (
    ensure_period_events,
    expire_pending_events_for_closed_period,
    _ensure_seed_events,
)
from ..services.insurance.service import charge_premiums_for_period
from ..finance.expenses import compute_monthly_burn, expire_expense_lines_for_period, lifestyle_period_breakdown
from ..timeutil import utc_now_naive
from ..needs.engine import (
    apply_decay,
    needs_values_from_profile,
    parse_needs_config,
    set_profile_needs,
)


def _apply_defeat_to_profile(profile: GameProfile) -> None:
    profile.is_active = 0
    profile.is_archived = 1
    profile.run_outcome = "defeat"


def _prev_period_closing(db: Session, profile_id: int, period_index: int) -> PeriodEconomyClosing | None:
    if int(period_index) <= 1:
        return None
    return (
        db.query(PeriodEconomyClosing)
        .filter(
            PeriodEconomyClosing.game_profile_id == profile_id,
            PeriodEconomyClosing.period_index == int(period_index) - 1,
        )
        .first()
    )


def _transactions_for_period(db: Session, profile_id: int, period_index: int) -> list[Transaction]:
    return (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile_id,
            Transaction.period_index == int(period_index),
        )
        .all()
    )


def _cash_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    return round(
        sum(float(t.amount) for t in _transactions_for_period(db, profile_id, period_index)),
        2,
    )


def _cash_delta(db: Session, profile_id: int, period_index: int, cash_end: float) -> float:
    """Изменение cash за весь период (зарплата, события, конец периода)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(cash_end) - float(prev.cash_balance), 2)
    return _cash_flow_from_transactions(db, profile_id, period_index)


def _safety_fund_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ == TRANSACTION_TYPES["SAFETY_FUND_CONTRIBUTION"]:
            delta += abs(float(t.amount))
        elif typ == TRANSACTION_TYPES["SAFETY_FUND_WITHDRAWAL"]:
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _safety_fund_delta(db: Session, profile_id: int, period_index: int, safety_end: float) -> float:
    """Чистое изменение подушки за период (взносы − снятия)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(safety_end) - float(prev.safety_fund_balance), 2)
    return _safety_fund_flow_from_transactions(db, profile_id, period_index)


def _invest_capital_flow(db: Session, profile_id: int, period_index: int) -> float:
    """Приток/отток капитала в инвестициях (открытие/покупка/закрытие), без капитализации %."""
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ in ("deposit_open", "bond_buy"):
            delta += abs(float(t.amount))
        elif typ == "invest_close":
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _debt_flow_from_transactions(db: Session, profile_id: int, period_index: int) -> float:
    delta = 0.0
    for t in _transactions_for_period(db, profile_id, period_index):
        typ = str(t.type or "")
        if typ == "liability_disbursement":
            delta += abs(float(t.amount))
        elif typ == "liability_close":
            delta -= abs(float(t.amount))
    return round(delta, 2)


def _debt_delta(db: Session, profile_id: int, period_index: int, debt_end: float) -> float:
    """Изменение суммы тел долгов за период (+ новый кредит, − закрытие)."""
    prev = _prev_period_closing(db, profile_id, period_index)
    if prev is not None:
        return round(float(debt_end) - float(prev.total_debt_balance), 2)
    return _debt_flow_from_transactions(db, profile_id, period_index)


def _total_debt_balance(db: Session, profile_id: int) -> float:
    rows = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == profile_id,
            FinanceLiability.is_active == 1,
        )
        .all()
    )
    return round(sum(float(row.total_debt or 0) for row in rows), 2)


def _period_income_rate(breakdown: list, snapshot: PeriodSnapshot | None) -> float:
    """Уровень дохода за период: зарплата (если забрана) + пассивные поступления."""
    income = 0.0
    if snapshot and int(snapshot.salary_claimed or 0) == 1:
        income += float(snapshot.salary_amount or 0)
    for item in breakdown or []:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "")
        if kind in ("asset_income", "invest"):
            income += float(item.get("amount") or 0)
    return round(income, 2)


def _period_expense_total(breakdown: list) -> float:
    """Сумма расходов за период (списания с счёта по обязательствам жизни и активам)."""
    expense = 0.0
    has_category_lines = any(
        isinstance(item, dict) and str(item.get("type") or "") == "expense_category"
        for item in (breakdown or [])
    )
    for item in breakdown or []:
        if not isinstance(item, dict):
            continue
        kind = str(item.get("type") or "")
        if kind == "liability":
            expense += float(item.get("paid") or 0)
        elif kind in ("expense_category", "insurance"):
            expense += abs(float(item.get("amount") or 0))
        elif kind == "lifestyle":
            if has_category_lines:
                continue
            expense += abs(float(item.get("amount") or 0))
        elif kind == "asset":
            expense += float(item.get("amount") or 0)
    return round(expense, 2)


def _period_compare_delta(current: float, previous: float | None) -> float:
    if previous is None:
        return 0.0
    return round(float(current) - float(previous), 2)


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
    closed_period_index = int(period_index)
    invest_positions = (
        db.query(InvestmentPosition)
        .filter(
            InvestmentPosition.game_profile_id == profile.id,
            InvestmentPosition.is_active == 1,
        )
        .all()
    )

    total_spend = 0.0
    breakdown = []
    closed_burn_total = 0.0
    total_overdue_added = 0.0
    invest_income = 0.0
    defeat_reason = None
    needs_result = None

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
    positions = invest_positions
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
            _apply_defeat_to_profile(profile)
            defeat_reason = "cash_negative_streak"
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

    # 4.2 Character needs: decay + defeat streak (ADR-005); cash-штраф за distressed — отключён
    try:
        if str(getattr(profile, "save_kind", "game") or "game") == "game" and int(profile.is_active or 0) == 1:
            tk = str(getattr(profile, "starter_template_key", "") or "")
            if tk:
                tmpl = (
                    db.query(GameStarterTemplate)
                    .filter(GameStarterTemplate.template_key == tk)
                    .first()
                )
            else:
                tmpl = None

            blueprint = {}
            if tmpl is not None:
                try:
                    blueprint = json.loads(tmpl.blueprint_json or "{}")
                except Exception:
                    blueprint = {}
            cfg = parse_needs_config(blueprint)
            if cfg:
                before = needs_values_from_profile(profile)
                dec = apply_decay(cfg, before)
                set_profile_needs(profile, dec.after)

                # streak: any axis == 0 after decay
                if dec.has_zero_after:
                    profile.needs_zero_periods_streak = int(getattr(profile, "needs_zero_periods_streak", 0) or 0) + 1
                else:
                    profile.needs_zero_periods_streak = 0

                # defeat: streak >= 3
                if int(getattr(profile, "needs_zero_periods_streak", 0) or 0) >= 3:
                    _apply_defeat_to_profile(profile)
                    defeat_reason = "needs_depletion"
                    add_transaction(
                        db=db,
                        game_profile_id=profile.id,
                        amount=0,
                        type=TRANSACTION_TYPES["GAME_OVER"],
                        description=f"Поражение: потребности на нуле 3 месяца подряд (период #{period_index})",
                        period_index=period_index,
                    )

                needs_result = {
                    "before": before,
                    "after": dec.after,
                    "decay": dec.decay,
                    "min_axis": dec.min_axis,
                    "has_zero": dec.has_zero_after,
                    "streak": int(getattr(profile, "needs_zero_periods_streak", 0) or 0),
                }
    except Exception:
        logger.exception("Needs processing failed profile_id=%s period_index=%s", profile.id, period_index)
        db.refresh(profile)

    # 5. Снимок на конец периода для аналитики + счётчик «чистых» месяцев без просрочек
    snapshot = (
        db.query(PeriodSnapshot)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.period_index == period_index,
        )
        .first()
    )
    current_income_rate = _period_income_rate(breakdown, snapshot)
    current_expense_total = _period_expense_total(breakdown)
    debt_after = _total_debt_balance(db, profile.id)
    cash_end = float(profile.cash_balance)
    safety_end = float(profile.safety_fund_balance)

    prev_closing = _prev_period_closing(db, profile.id, period_index)
    prev_income = float(prev_closing.period_income_rate) if prev_closing else None
    prev_expense = float(prev_closing.period_expense_total) if prev_closing else None

    income_delta = _period_compare_delta(current_income_rate, prev_income)
    expense_delta = _period_compare_delta(current_expense_total, prev_expense)
    cash_delta = _cash_delta(db, profile.id, period_index, cash_end)
    safety_fund_delta = _safety_fund_delta(db, profile.id, period_index, safety_end)
    invest_capital_delta = _invest_capital_flow(db, profile.id, period_index)
    debt_delta = _debt_delta(db, profile.id, period_index, debt_after)

    total_overdue_now = round(sum(float(li.overdue_amount or 0) for li in liabilities), 2)
    if total_overdue_now <= 1e-8:
        profile.clean_period_streak = int(getattr(profile, "clean_period_streak", 0) or 0) + 1
    else:
        profile.clean_period_streak = 0

    salary_claimed = snapshot is not None and int(snapshot.salary_claimed or 0) == 1
    try:
        from ..guidance.engine import on_period_closed_guidance, update_nudge_streaks_on_period_close

        update_nudge_streaks_on_period_close(
            profile,
            salary_claimed=salary_claimed,
            cash_end=cash_end,
        )
        on_period_closed_guidance(db, profile.user_id, profile, closed_period_index)
    except Exception:
        logger.warning("guidance period close hook failed profile_id=%s", profile.id, exc_info=True)

    db.add(
        PeriodEconomyClosing(
            game_profile_id=int(profile.id),
            period_index=int(period_index),
            cash_balance=float(profile.cash_balance),
            safety_fund_balance=float(profile.safety_fund_balance),
            total_overdue_amount=float(total_overdue_now),
            monthly_burn_total=float(closed_burn_total),
            period_income_rate=float(current_income_rate),
            period_expense_total=float(current_expense_total),
            total_debt_balance=float(debt_after),
        )
    )

    expire_pending_events_for_closed_period(db, profile.id, int(period_index))

    achievement_unlocks: list = []
    try:
        ensure_achievement_catalog(db)
        with db.begin_nested():
            achievement_unlocks = process_achievement_unlocks(db, profile)
    except Exception:
        logger.exception(
            "Achievement unlock failed after period end profile_id=%s period_index=%s",
            profile.id,
            period_index,
        )
        db.refresh(profile)
        achievement_unlocks = []

    # 7. Увеличиваем номер периода
    closed_period_index = int(period_index)
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()

    db.commit()
    db.refresh(profile)

    try:
        from ..admin.notify import process_period_admin_alerts

        net_cashflow = round(float(current_income_rate) - float(current_expense_total), 2)
        process_period_admin_alerts(
            db,
            profile,
            closed_period_index=closed_period_index,
            economy={
                "cash_balance": round(cash_end, 2),
                "safety_fund_balance": round(safety_end, 2),
                "total_overdue_amount": total_overdue_now,
                "net_monthly_cashflow": net_cashflow,
                "salary_claimed": salary_claimed,
            },
        )
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
        "closed_period_index": closed_period_index,
        "cash_delta": cash_delta,
        "income_delta": income_delta,
        "expense_delta": expense_delta,
        "safety_fund_delta": safety_fund_delta,
        "invest_capital_delta": invest_capital_delta,
        "debt_delta": debt_delta,
        "total_spent": total_spend,
        "breakdown": breakdown,
        "new_balance": profile.cash_balance,
        "negative_streak": profile.negative_periods_count,
        "game_over": profile.is_active == 0,
        "defeat_reason": defeat_reason,
        "needs": needs_result,
        "overdue_added": round(total_overdue_added, 2),
        "achievement_unlocks": achievement_unlocks,
    }