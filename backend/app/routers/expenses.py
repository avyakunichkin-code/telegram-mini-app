from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.time import get_active_game_profile
from ..schemas import (
    ExpenseCategoryPublic,
    ExpenseLineCreate,
    ExpenseLineResponse,
    ExpenseLineUpdate,
    ExpensesSnapshotResponse,
)
from ..services.expenses.service import (
    create_expense_line as service_create_expense_line,
    delete_expense_line as service_delete_expense_line,
    expenses_snapshot as service_expenses_snapshot,
    list_expense_categories as service_list_expense_categories,
    list_expense_lines as service_list_expense_lines,
    patch_expense_line as service_patch_expense_line,
)

router = APIRouter(prefix="/api/game/expenses", tags=["expenses"])


@router.get("/categories", response_model=list[ExpenseCategoryPublic])
async def list_expense_categories(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Справочник категорий расходов (для редактора Plan)."""
    del current_user
    return service_list_expense_categories(db)


@router.get("", response_model=ExpensesSnapshotResponse)
async def get_expenses_snapshot(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Снимок burn rate и разбивка по категориям для активной партии."""
    profile = get_active_game_profile(db, current_user.id)
    return service_expenses_snapshot(db, profile)


@router.get("/lines", response_model=list[ExpenseLineResponse])
async def list_expense_lines(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    return service_list_expense_lines(db, profile)


@router.post("/lines", response_model=ExpenseLineResponse)
async def create_expense_line(
    payload: ExpenseLineCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    return service_create_expense_line(db, profile, payload)


@router.patch("/lines/{line_id}", response_model=ExpenseLineResponse)
async def patch_expense_line(
    line_id: int,
    payload: ExpenseLineUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    return service_patch_expense_line(db, profile, line_id, payload)


@router.delete("/lines/{line_id}", status_code=204)
async def delete_expense_line(
    line_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    service_delete_expense_line(db, profile, line_id)
