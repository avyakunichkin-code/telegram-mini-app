from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.session import get_active_game_profile
from ..schemas import (
    ExpenseCategoryPublic,
    ExpenseLineCreate,
    ExpenseLineResponse,
    ExpenseLineUpdate,
    ExpensesSnapshotResponse,
)
from ..services.expenses.service import (
    expenses_snapshot as service_expenses_snapshot,
    list_expense_categories as service_list_expense_categories,
    list_expense_lines as service_list_expense_lines,
)

router = APIRouter(prefix="/api/game/expenses", tags=["expenses"])


@router.get("/categories", response_model=list[ExpenseCategoryPublic])
def list_expense_categories(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Справочник категорий расходов игры."""
    del current_user
    return service_list_expense_categories(db)


@router.get("", response_model=ExpensesSnapshotResponse)
def get_expenses_snapshot(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Снимок burn rate и разбивка по категориям для активной партии."""
    profile = get_active_game_profile(db, current_user.id)
    return service_expenses_snapshot(db, profile)


@router.get("/lines", response_model=list[ExpenseLineResponse])
def list_expense_lines(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    return service_list_expense_lines(db, profile)


@router.post("/lines", response_model=ExpenseLineResponse)
def create_expense_line(
    payload: ExpenseLineCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=410, detail="Статьи расходов в игре задаёт шаблон, их нельзя менять вручную.")


@router.patch("/lines/{line_id}", response_model=ExpenseLineResponse)
def patch_expense_line(
    line_id: int,
    payload: ExpenseLineUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=410, detail="Статьи расходов в игре задаёт шаблон, их нельзя менять вручную.")


@router.delete("/lines/{line_id}", status_code=204)
def delete_expense_line(
    line_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raise HTTPException(status_code=410, detail="Статьи расходов в игре задаёт шаблон, их нельзя менять вручную.")
