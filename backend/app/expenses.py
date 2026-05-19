"""
Домен «Расходы на жизнеобеспечение» (E1): статьи бюджета, burn rate, конец периода.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from .expense_template_defaults import expense_budget_for_template
from .models import ExpenseCategoryDefinition, GameProfile, GameStarterTemplate, ProfileExpenseLine


@dataclass(frozen=True)
class ExpenseLineView:
    id: int
    category_key: str
    category_title: str
    title: str
    amount_monthly: float
    tier: str
    source_kind: str
    expires_period_index: int | None


@dataclass(frozen=True)
class CategoryBurnView:
    category_key: str
    title: str
    amount: float
    tier: str


@dataclass
class BurnSnapshot:
    total: float
    lines_sum: float
    legacy_delta: float
    lines: list[ExpenseLineView] = field(default_factory=list)
    by_category: list[CategoryBurnView] = field(default_factory=list)


def ensure_expense_category_catalog(db: Session) -> None:
    """Идемпотентно заполняет справочник категорий (если миграция не применялась)."""
    seeds = [
        ("housing", "Жильё", "must", 10, "housing"),
        ("food", "Еда", "must", 20, "food"),
        ("transport", "Транспорт", "must", 30, "transport"),
        ("health", "Здоровье", "must", 40, "health"),
        ("clothing", "Одежда и быт", "must", 50, "clothing"),
        ("communications", "Связь и подписки", "must", 60, "communications"),
        ("leisure", "Досуг", "discretionary", 70, "leisure"),
        ("other", "Прочее", "discretionary", 80, "other"),
    ]
    for key, title, tier, sort_order, icon_key in seeds:
        row = db.query(ExpenseCategoryDefinition).filter(ExpenseCategoryDefinition.category_key == key).first()
        if row is None:
            db.add(
                ExpenseCategoryDefinition(
                    category_key=key,
                    title=title,
                    default_tier=tier,
                    sort_order=sort_order,
                    icon_key=icon_key,
                    is_active=1,
                )
            )
    db.flush()


def _category_titles(db: Session) -> dict[str, str]:
    rows = db.query(ExpenseCategoryDefinition).filter(ExpenseCategoryDefinition.is_active == 1).all()
    return {r.category_key: r.title for r in rows}


def _active_lines_query(db: Session, profile_id: int, period_index: int):
    q = db.query(ProfileExpenseLine).filter(
        ProfileExpenseLine.game_profile_id == profile_id,
        ProfileExpenseLine.is_active == 1,
        ProfileExpenseLine.revoked_at.is_(None),
    )
    return q.filter(
        (ProfileExpenseLine.expires_period_index.is_(None))
        | (ProfileExpenseLine.expires_period_index > period_index)
    )


def ensure_profile_expense_lines(db: Session, profile: GameProfile) -> None:
    """Backfill: если статей нет, создать из шаблона / base."""
    period_index = max(1, int(profile.period_index or 1))
    existing = (
        db.query(ProfileExpenseLine)
        .filter(ProfileExpenseLine.game_profile_id == profile.id, ProfileExpenseLine.is_active == 1)
        .count()
    )
    if existing > 0:
        return

    base = float(getattr(profile, "base_monthly_lifestyle_expense", 0) or 0)
    if base <= 0:
        return

    blueprint: dict[str, Any] = {}
    template_key = getattr(profile, "starter_template_key", None)
    if template_key:
        tmpl = (
            db.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == template_key)
            .first()
        )
        if tmpl:
            try:
                blueprint = json.loads(tmpl.blueprint_json or "{}")
            except json.JSONDecodeError:
                blueprint = {}

    budget = expense_budget_for_template(template_key, base, blueprint, db)
    seed_expense_lines_from_budget(
        db,
        profile,
        budget,
        period_index=period_index,
        source_kind="legacy_import",
        source_ref=template_key or "backfill",
    )


def seed_expense_lines_from_budget(
    db: Session,
    profile: GameProfile,
    budget: dict[str, float],
    *,
    period_index: int = 1,
    source_kind: str = "template",
    source_ref: str | None = None,
) -> list[ProfileExpenseLine]:
    ensure_expense_category_catalog(db)
    titles = _category_titles(db)
    created: list[ProfileExpenseLine] = []
    for category_key, amount in budget.items():
        amt = max(0.0, float(amount or 0))
        if amt <= 0:
            continue
        if category_key not in titles:
            continue
        tier_row = (
            db.query(ExpenseCategoryDefinition)
            .filter(ExpenseCategoryDefinition.category_key == category_key)
            .first()
        )
        tier = tier_row.default_tier if tier_row else "must"
        line = ProfileExpenseLine(
            game_profile_id=profile.id,
            category_key=category_key,
            amount_monthly=round(amt, 2),
            title_override=None,
            source_kind=source_kind,
            source_ref=source_ref,
            tier=tier,
            created_period_index=int(period_index),
            expires_period_index=None,
            is_active=1,
        )
        db.add(line)
        created.append(line)
    db.flush()
    return created


def compute_monthly_burn(db: Session, profile: GameProfile) -> BurnSnapshot:
    ensure_expense_category_catalog(db)
    ensure_profile_expense_lines(db, profile)

    period_index = max(1, int(profile.period_index or 1))
    legacy_delta = float(getattr(profile, "delta_monthly_lifestyle_expense", 0) or 0)
    titles = _category_titles(db)

    rows = _active_lines_query(db, profile.id, period_index).all()
    lines: list[ExpenseLineView] = []
    by_cat: dict[str, float] = {}

    for row in rows:
        cat_title = titles.get(row.category_key, row.category_key)
        display = (row.title_override or "").strip() or cat_title
        amt = max(0.0, float(row.amount_monthly or 0))
        lines.append(
            ExpenseLineView(
                id=int(row.id),
                category_key=row.category_key,
                category_title=cat_title,
                title=display,
                amount_monthly=round(amt, 2),
                tier=str(row.tier or "must"),
                source_kind=str(row.source_kind or "template"),
                expires_period_index=int(row.expires_period_index)
                if row.expires_period_index is not None
                else None,
            )
        )
        by_cat[row.category_key] = by_cat.get(row.category_key, 0.0) + amt

    lines_sum = sum(l.amount_monthly for l in lines)

    if not lines and legacy_delta == 0:
        base = float(getattr(profile, "base_monthly_lifestyle_expense", 0) or 0)
        total = max(0.0, base + legacy_delta)
    else:
        total = max(0.0, lines_sum + legacy_delta)

    tier_by_key = {
        r.category_key: r.default_tier
        for r in db.query(ExpenseCategoryDefinition).filter(ExpenseCategoryDefinition.is_active == 1).all()
    }
    by_category = [
        CategoryBurnView(
            category_key=k,
            title=titles.get(k, k),
            amount=round(v, 2),
            tier=tier_by_key.get(k, "must"),
        )
        for k, v in sorted(by_cat.items(), key=lambda x: -x[1])
    ]

    return BurnSnapshot(
        total=round(total, 2),
        lines_sum=round(lines_sum, 2),
        legacy_delta=round(legacy_delta, 2),
        lines=lines,
        by_category=by_category,
    )


def expire_expense_lines_for_period(db: Session, profile: GameProfile, period_index: int) -> int:
    """Деактивирует статьи с expires_period_index <= period_index."""
    rows = (
        db.query(ProfileExpenseLine)
        .filter(
            ProfileExpenseLine.game_profile_id == profile.id,
            ProfileExpenseLine.is_active == 1,
            ProfileExpenseLine.expires_period_index.isnot(None),
            ProfileExpenseLine.expires_period_index <= int(period_index),
        )
        .all()
    )
    for row in rows:
        row.is_active = 0
        row.revoked_at = datetime.utcnow()
    if rows:
        db.flush()
    return len(rows)


def add_expense_line_from_event(
    db: Session,
    profile: GameProfile,
    *,
    category_key: str,
    amount_monthly: float,
    title: str | None = None,
    expires_after_periods: int | None = None,
    source_ref: str | None = None,
) -> ProfileExpenseLine:
    ensure_expense_category_catalog(db)
    period_index = max(1, int(profile.period_index or 1))
    expires = None
    if expires_after_periods is not None and int(expires_after_periods) > 0:
        expires = period_index + int(expires_after_periods)

    tier_row = (
        db.query(ExpenseCategoryDefinition)
        .filter(ExpenseCategoryDefinition.category_key == category_key)
        .first()
    )
    if not tier_row:
        category_key = "other"
        tier_row = (
            db.query(ExpenseCategoryDefinition)
            .filter(ExpenseCategoryDefinition.category_key == "other")
            .first()
        )

    line = ProfileExpenseLine(
        game_profile_id=profile.id,
        category_key=category_key,
        amount_monthly=round(max(0.0, float(amount_monthly)), 2),
        title_override=title,
        source_kind="event",
        source_ref=source_ref,
        tier=tier_row.default_tier if tier_row else "discretionary",
        created_period_index=period_index,
        expires_period_index=expires,
        is_active=1,
    )
    db.add(line)
    db.flush()
    return line


def burn_breakdown_for_api(snapshot: BurnSnapshot) -> dict[str, Any]:
    return {
        "baseline": round(snapshot.lines_sum, 2),
        "legacy_delta": snapshot.legacy_delta,
        "lines": [
            {
                "id": ln.id,
                "category_key": ln.category_key,
                "category_title": ln.category_title,
                "title": ln.title,
                "amount": ln.amount_monthly,
                "tier": ln.tier,
                "source_kind": ln.source_kind,
                "expires_period_index": ln.expires_period_index,
            }
            for ln in snapshot.lines
        ],
        "by_category": [
            {
                "category_key": c.category_key,
                "title": c.title,
                "amount": c.amount,
                "tier": c.tier,
            }
            for c in snapshot.by_category
        ],
    }


def assert_plan_profile(profile: GameProfile) -> None:
    from fastapi import HTTPException

    if str(getattr(profile, "save_kind", "game") or "game").lower() != "plan":
        raise HTTPException(
            status_code=403,
            detail="Expense line editing is only available in Plan mode",
        )


def sync_profile_lifestyle_base_from_lines(db: Session, profile: GameProfile) -> float:
    """Пересчитывает base_monthly_lifestyle_expense из суммы активных статей (без legacy delta)."""
    period_index = max(1, int(profile.period_index or 1))
    rows = _active_lines_query(db, profile.id, period_index).all()
    total = round(sum(max(0.0, float(r.amount_monthly or 0)) for r in rows), 2)
    profile.base_monthly_lifestyle_expense = total
    db.flush()
    return total


def line_to_overview_item(row: ProfileExpenseLine, titles: dict[str, str]) -> ExpenseLineView:
    cat_title = titles.get(row.category_key, row.category_key)
    display = (row.title_override or "").strip() or cat_title
    return ExpenseLineView(
        id=int(row.id),
        category_key=row.category_key,
        category_title=cat_title,
        title=display,
        amount_monthly=round(max(0.0, float(row.amount_monthly or 0)), 2),
        tier=str(row.tier or "must"),
        source_kind=str(row.source_kind or "template"),
        expires_period_index=int(row.expires_period_index)
        if row.expires_period_index is not None
        else None,
    )


def create_plan_expense_line(
    db: Session,
    profile: GameProfile,
    *,
    category_key: str,
    amount_monthly: float,
    title: str | None = None,
) -> ProfileExpenseLine:
    assert_plan_profile(profile)
    ensure_expense_category_catalog(db)
    period_index = max(1, int(profile.period_index or 1))
    tier_row = (
        db.query(ExpenseCategoryDefinition)
        .filter(ExpenseCategoryDefinition.category_key == category_key)
        .first()
    )
    if not tier_row:
        category_key = "other"
        tier_row = (
            db.query(ExpenseCategoryDefinition)
            .filter(ExpenseCategoryDefinition.category_key == "other")
            .first()
        )
    line = ProfileExpenseLine(
        game_profile_id=profile.id,
        category_key=category_key,
        amount_monthly=round(max(0.0, float(amount_monthly)), 2),
        title_override=(title or "").strip() or None,
        source_kind="plan",
        source_ref="manual",
        tier=tier_row.default_tier if tier_row else "must",
        created_period_index=period_index,
        expires_period_index=None,
        is_active=1,
    )
    db.add(line)
    db.flush()
    sync_profile_lifestyle_base_from_lines(db, profile)
    return line


def update_plan_expense_line(
    db: Session,
    profile: GameProfile,
    line: ProfileExpenseLine,
    *,
    category_key: str | None = None,
    amount_monthly: float | None = None,
    title: str | None = None,
) -> ProfileExpenseLine:
    assert_plan_profile(profile)
    if line.game_profile_id != profile.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Expense line not found")
    if line.source_kind not in ("plan", "manual"):
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Only plan-owned lines can be edited")
    if category_key is not None:
        ensure_expense_category_catalog(db)
        ck = category_key.strip() or "other"
        if not db.query(ExpenseCategoryDefinition).filter(ExpenseCategoryDefinition.category_key == ck).first():
            ck = "other"
        line.category_key = ck
    if amount_monthly is not None:
        line.amount_monthly = round(max(0.0, float(amount_monthly)), 2)
    if title is not None:
        line.title_override = title.strip() or None
    db.flush()
    sync_profile_lifestyle_base_from_lines(db, profile)
    return line


def revoke_plan_expense_line(db: Session, profile: GameProfile, line: ProfileExpenseLine) -> None:
    assert_plan_profile(profile)
    if line.game_profile_id != profile.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Expense line not found")
    if line.source_kind not in ("plan", "manual"):
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Only plan-owned lines can be removed")
    line.is_active = 0
    line.revoked_at = datetime.utcnow()
    db.flush()
    sync_profile_lifestyle_base_from_lines(db, profile)


def lifestyle_period_breakdown(snapshot: BurnSnapshot) -> list[dict[str, Any]]:
    """Строки для game_period breakdown."""
    if snapshot.by_category:
        return [
            {
                "type": "expense_category",
                "category_key": c.category_key,
                "title": c.title,
                "amount": c.amount,
            }
            for c in snapshot.by_category
            if c.amount > 0
        ]
    if snapshot.total > 0:
        return [{"type": "lifestyle", "title": "Расходы «жизни»", "amount": snapshot.total}]
    return []
