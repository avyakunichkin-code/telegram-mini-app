"""Публичное представление game_starter_templates для UI выбора сценария."""

from __future__ import annotations

import json
from typing import Any, FrozenSet, Optional

from ..victory.mechanics_progression import (
    CAPITAL_MECHANIC_KEYS,
    MECHANIC_CAPITAL_INSURANCE,
    MECHANIC_CAPITAL_INVEST,
    MECHANIC_CAPITAL_LIABILITIES,
    MECHANIC_CAPITAL_PROPERTY,
    mechanics_unlock_from_blueprint,
)


def _fmt_rub(value: float) -> str:
    n = int(round(float(value)))
    return f"{n:,}".replace(",", " ")


def _salary_line(monthly_salary: float) -> str:
    s = float(monthly_salary or 0)
    if s <= 0:
        return ""
    return f"Зарплата ~{_fmt_rub(s)} ₽/мес"


def _income_line(monthly_salary: float) -> str:
    """Legacy alias для старых тестов/копирайта."""
    return _salary_line(monthly_salary)


_CAPITAL_LABELS_ORDERED: tuple[tuple[str, str], ...] = (
    (MECHANIC_CAPITAL_INVEST, "депозиты и облигации"),
    (MECHANIC_CAPITAL_LIABILITIES, "кредиты и обязательства"),
    (MECHANIC_CAPITAL_INSURANCE, "страховки"),
    (MECHANIC_CAPITAL_PROPERTY, "имущество и жильё"),
)

_SCENARIO_SITUATION_FALLBACK: dict[str, str] = {
    "mq_game_basic_v1": "Чистый старт — без долгов и активов",
    "mq_game_tight_budget_v1": "Аренда, авто и автокредит с первого периода",
    "mq_game_mortgage_stress_v1": "Своё жильё, ипотека и два автомобиля",
    "mq_game_debt_stack_v1": "Ипотека, два авто и кредитная карта",
}


def _join_ru_list(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} и {items[1]}"
    return ", ".join(items[:-1]) + f" и {items[-1]}"


def granted_capital_mechanics_from_blueprint(
    blueprint: dict[str, Any], template_key: str
) -> FrozenSet[str]:
    """Все разделы капитала, которые откроются по цепочке целей шаблона."""
    granted: set[str] = set()
    for step in mechanics_unlock_from_blueprint(blueprint, template_key):
        for key in step.get("grant") or []:
            if isinstance(key, str) and key in CAPITAL_MECHANIC_KEYS:
                granted.add(key)
    mech = blueprint.get("mechanics")
    if isinstance(mech, dict):
        for key, enabled in mech.items():
            if enabled and key in CAPITAL_MECHANIC_KEYS:
                granted.add(key)
    return frozenset(granted)


def _features_line(
    blueprint: dict[str, Any],
    template_key: str,
    *,
    previous_granted: FrozenSet[str] | None = None,
) -> str:
    raw = blueprint.get("picker_features_line")
    if isinstance(raw, str) and raw.strip():
        return raw.strip()

    granted = granted_capital_mechanics_from_blueprint(blueprint, template_key)
    prev = previous_granted or frozenset()
    delta = granted - prev
    labels = [lbl for key, lbl in _CAPITAL_LABELS_ORDERED if key in delta]
    if labels:
        joined = _join_ru_list(labels)
        if not prev:
            return f"Только {joined}"
        return f"Ещё: {joined}"

    tk = (template_key or "").strip()
    if tk in _SCENARIO_SITUATION_FALLBACK:
        return _SCENARIO_SITUATION_FALLBACK[tk]
    if blueprint.get("liabilities"):
        return "Сложный старт с долгами и активами"
    return "Базовые доходы и расходы"


def scenario_picker_highlights(
    blueprint: dict[str, Any],
    template_key: str,
    *,
    base_monthly_lifestyle_expense: float = 0,
    previous_granted: FrozenSet[str] | None = None,
) -> list[str]:
    """Две строки для карточки сценария: зарплата + механики/ситуация."""
    raw = blueprint.get("picker_highlights")
    if isinstance(raw, list):
        out = [str(x).strip() for x in raw if str(x).strip()]
        if out:
            return out[:2]

    lines: list[str] = []
    salary = _salary_line(float(blueprint.get("monthly_salary") or 0))
    if salary:
        lines.append(salary)
    features = _features_line(blueprint, template_key, previous_granted=previous_granted)
    if features:
        lines.append(features)
    return lines[:2]


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
    income = _salary_line(salary)
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
        return "factory"
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
