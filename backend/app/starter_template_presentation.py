"""Публичное представление game_starter_templates для UI выбора сценария."""

from __future__ import annotations

import json
from typing import Any, Optional


def _fmt_rub(value: float) -> str:
    n = int(round(float(value)))
    return f"{n:,}".replace(",", " ")


def _income_line(monthly_salary: float) -> str:
    s = float(monthly_salary or 0)
    if s <= 0:
        return ""
    return f"Доход ~{_fmt_rub(s)} ₽/мес"


def _expense_line(base_expense: float) -> str:
    e = float(base_expense or 0)
    if e <= 0:
        return ""
    return f"Расходы на жизнь ~{_fmt_rub(e)} ₽/мес"


def highlights_from_blueprint(
    blueprint: dict[str, Any],
    *,
    base_monthly_lifestyle_expense: float = 0,
) -> list[str]:
    raw = blueprint.get("highlights")
    if isinstance(raw, list):
        out = [str(x).strip() for x in raw if str(x).strip()]
        if out:
            return out[:6]

    lines: list[str] = []
    salary = float(blueprint.get("monthly_salary") or 0)
    income = _income_line(salary)
    if income:
        lines.append(income)
    expense_base = base_monthly_lifestyle_expense
    if expense_base <= 0 and blueprint.get("base_monthly_lifestyle_expense"):
        expense_base = float(blueprint["base_monthly_lifestyle_expense"])
    expense = _expense_line(expense_base)
    if expense:
        lines.append(expense)

    assets = blueprint.get("assets") or []
    liabilities = blueprint.get("liabilities") or []
    if not assets and not liabilities:
        lines.append("Нет имущества и долгов на старте")
    else:
        if not assets:
            lines.append("Без активов на старте")
        for a in assets:
            if isinstance(a, dict):
                title = (a.get("title") or "Актив").strip()
                maint = float(a.get("monthly_maintenance_cost") or 0)
                if maint > 0:
                    lines.append(f"{title}: обслуживание ~{_fmt_rub(maint)} ₽/мес")
                else:
                    lines.append(title)
        for li in liabilities:
            if isinstance(li, dict):
                title = (li.get("title") or "Долг").strip()
                lines.append(f"{title} с первого периода")

    cash = blueprint.get("cash_balance")
    if cash is not None:
        lines.append(f"На счёте ~{_fmt_rub(float(cash))} ₽")

    return lines[:6]


def scenario_icon_from_blueprint(blueprint: dict[str, Any], template_key: str) -> str:
    raw = blueprint.get("scenario_icon")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    key = (template_key or "").strip()
    if key == "mq_game_basic_v1":
        return "fresh_start"
    if key == "mq_game_tight_budget_v1":
        return "car_loan"
    if key == "mq_game_mortgage_stress_v1":
        return "home_mortgage"
    if key == "mq_game_debt_stack_v1":
        return "debt_stack"
    if liabilities := blueprint.get("liabilities") or []:
        if len(liabilities) >= 2:
            return "debt_stack"
        if any(isinstance(x, dict) and "ипотек" in str(x.get("title", "")).lower() for x in liabilities):
            return "home_mortgage"
    if blueprint.get("assets"):
        return "car_loan"
    return "fresh_start"


def compare_note_from_blueprint(blueprint: dict[str, Any], template_key: str) -> Optional[str]:
    raw = blueprint.get("compare_note")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    notes = {
        "mq_game_basic_v1": "Идеальный вход: почувствовать контроль над деньгами без спешки.",
        "mq_game_tight_budget_v1": "Уже интереснее: машина и кредит — тренируешь баланс каждого периода.",
        "mq_game_mortgage_stress_v1": "Ипотека и авто — для тех, кто любит вести несколько потоков платежей.",
        "mq_game_debt_stack_v1": "Максимум решений за период — твой драйв, если любишь плотный ритм.",
    }
    return notes.get((template_key or "").strip())


def parse_blueprint_json(raw: str | None) -> dict[str, Any]:
    try:
        bp = json.loads(raw or "{}")
        return bp if isinstance(bp, dict) else {}
    except json.JSONDecodeError:
        return {}
