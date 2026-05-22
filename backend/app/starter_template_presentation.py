"""Публичное представление game_starter_templates для UI выбора сценария."""

from __future__ import annotations

import json
from typing import Any, Optional


def _fmt_rub(value: float) -> str:
    n = int(round(float(value)))
    return f"{n:,}".replace(",", " ")


def _salary_label(monthly_salary: float) -> str:
    s = float(monthly_salary or 0)
    if s < 46000:
        return "Скромная зарплата"
    if s < 50000:
        return "Средняя зарплата"
    return "Зарплата выше среднего"


def _expense_label(base_expense: float) -> str:
    e = float(base_expense or 0)
    if e < 12000:
        return "Небольшие расходы на жизнь"
    if e < 17000:
        return "Умеренные расходы на жизнь"
    if e < 19000:
        return "Расходы заметно выше базовых"
    return "Высокие расходы на жизнь"


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
    if salary > 0:
        lines.append(f"{_salary_label(salary)} (~{_fmt_rub(salary)} ₽/мес)")
    if base_monthly_lifestyle_expense > 0:
        lines.append(_expense_label(base_monthly_lifestyle_expense))
    elif blueprint.get("base_monthly_lifestyle_expense"):
        lines.append(_expense_label(float(blueprint["base_monthly_lifestyle_expense"])))

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
        "mq_game_basic_v1": "Самый мягкий вход — освоить период без давления обязательств.",
        "mq_game_tight_budget_v1": "Сложнее «Базового старта»: кредит и авто съедают подушку.",
        "mq_game_mortgage_stress_v1": "После «Зарплаты до зарплаты»: ипотека давит сильнее.",
        "mq_game_debt_stack_v1": "Максимум давления: два долга и почти пустой счёт.",
    }
    return notes.get((template_key or "").strip())


def parse_blueprint_json(raw: str | None) -> dict[str, Any]:
    try:
        bp = json.loads(raw or "{}")
        return bp if isinstance(bp, dict) else {}
    except json.JSONDecodeError:
        return {}
