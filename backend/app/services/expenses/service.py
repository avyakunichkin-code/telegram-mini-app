from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.expenses import (
    burn_breakdown_for_api,
    compute_monthly_burn,
    create_plan_expense_line,
    ensure_expense_category_catalog,
    line_to_overview_item,
    revoke_plan_expense_line,
    update_plan_expense_line,
    _category_titles,
)
from ...game.time import sync_time
from ...models import (
    ExpenseCategoryDefinition,
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    ProfileExpenseLine,
)
from ...schemas import (
    ExpenseCategoryPublic,
    ExpenseLineCreate,
    ExpenseLineResponse,
    ExpenseLineUpdate,
    ExpensesSnapshotResponse,
    MonthlyBurnBreakdown,
)


def line_response(db: Session, row: ProfileExpenseLine) -> ExpenseLineResponse:
    titles = _category_titles(db)
    view = line_to_overview_item(row, titles)
    return ExpenseLineResponse(
        id=view.id,
        category_key=view.category_key,
        category_title=view.category_title,
        title=view.title,
        amount_monthly=view.amount_monthly,
        tier=view.tier,
        source_kind=view.source_kind,
        expires_period_index=view.expires_period_index,
    )


def expenses_snapshot(db: Session, profile: GameProfile) -> ExpensesSnapshotResponse:
    sync_time(profile)
    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = float(salary.monthly_amount if salary else 0)

    assets_orm = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )
    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)
    total_liability_payment = sum(float(l.monthly_payment or 0) for l in liabilities_orm)
    total_asset_maintenance = sum(float(a.monthly_maintenance_cost or 0) for a in assets_orm)
    total_monthly_obligations = total_liability_payment + total_asset_maintenance
    total_income = monthly_income + assets_income

    burn_snapshot = compute_monthly_burn(db, profile)
    monthly_burn_total = float(burn_snapshot.total)
    total_monthly_outflow = total_monthly_obligations + monthly_burn_total
    expense_to_income_ratio = (
        round(monthly_burn_total / total_income, 4) if total_income > 0 else 0.0
    )

    return ExpensesSnapshotResponse(
        period_index=int(profile.period_index),
        total=round(monthly_burn_total, 2),
        monthly_lifestyle_expense=round(monthly_burn_total, 2),
        breakdown=MonthlyBurnBreakdown(**burn_breakdown_for_api(burn_snapshot)),
        total_monthly_outflow=round(total_monthly_outflow, 2),
        expense_to_income_ratio=expense_to_income_ratio,
    )


def list_expense_categories(db: Session) -> list[ExpenseCategoryPublic]:
    ensure_expense_category_catalog(db)
    rows = (
        db.query(ExpenseCategoryDefinition)
        .filter(ExpenseCategoryDefinition.is_active == 1)
        .order_by(ExpenseCategoryDefinition.sort_order.asc())
        .all()
    )
    return [
        ExpenseCategoryPublic(
            category_key=r.category_key,
            title=r.title,
            default_tier=str(r.default_tier or "must"),
            sort_order=int(r.sort_order or 100),
        )
        for r in rows
    ]


def list_expense_lines(db: Session, profile: GameProfile) -> list[ExpenseLineResponse]:
    sync_time(profile)
    burn = compute_monthly_burn(db, profile)
    return [
        ExpenseLineResponse(
            id=ln.id,
            category_key=ln.category_key,
            category_title=ln.category_title,
            title=ln.title,
            amount_monthly=ln.amount_monthly,
            tier=ln.tier,
            source_kind=ln.source_kind,
            expires_period_index=ln.expires_period_index,
        )
        for ln in burn.lines
    ]


def create_expense_line(db: Session, profile: GameProfile, payload: ExpenseLineCreate) -> ExpenseLineResponse:
    sync_time(profile)
    line = create_plan_expense_line(
        db,
        profile,
        category_key=payload.category_key.strip(),
        amount_monthly=payload.amount_monthly,
        title=payload.title,
    )
    db.commit()
    db.refresh(line)
    return line_response(db, line)


def patch_expense_line(
    db: Session,
    profile: GameProfile,
    line_id: int,
    payload: ExpenseLineUpdate,
) -> ExpenseLineResponse:
    sync_time(profile)
    line = (
        db.query(ProfileExpenseLine)
        .filter(
            ProfileExpenseLine.id == line_id,
            ProfileExpenseLine.game_profile_id == profile.id,
            ProfileExpenseLine.is_active == 1,
        )
        .first()
    )
    if not line:
        raise HTTPException(status_code=404, detail="Expense line not found")
    update_plan_expense_line(
        db,
        profile,
        line,
        category_key=payload.category_key,
        amount_monthly=payload.amount_monthly,
        title=payload.title,
    )
    db.commit()
    db.refresh(line)
    return line_response(db, line)


def delete_expense_line(db: Session, profile: GameProfile, line_id: int) -> None:
    line = (
        db.query(ProfileExpenseLine)
        .filter(
            ProfileExpenseLine.id == line_id,
            ProfileExpenseLine.game_profile_id == profile.id,
            ProfileExpenseLine.is_active == 1,
        )
        .first()
    )
    if not line:
        raise HTTPException(status_code=404, detail="Expense line not found")
    revoke_plan_expense_line(db, profile, line)
    db.commit()
