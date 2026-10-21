"""SPL-101: characterization-тесты закрытия периода до переноса расчёта в fincore (ADR-016).

Golden-файлы в `tests/golden/` фиксируют текущее поведение `process_period_end`,
`estimate_period_close_preview` и `compute_monthly_burn` на фикстурах без событий.
Gate срезов SPL-204…206: golden = 0, то есть эти файлы не меняются.

Перегенерация (только при осознанном изменении поведения, с записью в DOC_SYNC_LOG):
    UPDATE_GOLDEN=1 py -3 -m pytest tests/unit/game/test_period_close_golden.py -q
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from pathlib import Path
from unittest.mock import patch

import pytest

from app.finance.annuity import monthly_payment
from app.finance.expenses import burn_breakdown_for_api, compute_monthly_burn, ensure_expense_category_catalog
from app.finance.period_close_preview import estimate_period_close_preview
from app.game.period import process_period_end
from app.models import (
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    InsurancePolicy,
    InvestmentPosition,
    PeriodEconomyClosing,
    ProfileExpenseLine,
    Transaction,
)
from app.services.period.salary import claim_salary

GOLDEN_DIR = Path(__file__).resolve().parents[2] / "golden"
UPDATE = os.environ.get("UPDATE_GOLDEN") == "1"

# Шаблона с таким ключом нет: needs-конфиг не грузится (закрытие без потребностей),
# backfill статей идёт по долям по умолчанию, а не по балансу конкретного шаблона.
TEMPLATE_KEY = "spl101_golden_fixture"

# Ключи результата закрытия, которые не про деньги: достижения, guidance, пул событий.
_GAME_ONLY_RESULT_KEYS = ("achievement_unlocks", "events_spawn_failed", "needs")

# 4 знака: ловит дрейф меньше копейки, но не шум float порядка 1e-10.
_PRECISION = 4


def _norm(value):
    if isinstance(value, float):
        rounded = round(value, _PRECISION)
        return 0.0 if rounded == 0 else rounded
    if isinstance(value, dict):
        return {k: _norm(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_norm(v) for v in value]
    return value


def _profile(db, user_id: int, **kwargs) -> GameProfile:
    defaults = {
        "name": "spl101_golden",
        "save_kind": "game",
        "starter_template_key": TEMPLATE_KEY,
        "is_active": 1,
        "period_index": 1,
        "cash_balance": 0.0,
        "safety_fund_balance": 0.0,
    }
    defaults.update(kwargs)
    profile = GameProfile(user_id=user_id, **defaults)
    db.add(profile)
    db.flush()
    db.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=60_000.0))
    db.commit()
    db.refresh(profile)
    ensure_expense_category_catalog(db)
    db.commit()
    return profile


def _annuity(profile_id: int, title: str, *, principal: float, rate: float, term: int, **kw) -> FinanceLiability:
    return FinanceLiability(
        game_profile_id=profile_id,
        title=title,
        total_debt=principal,
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=monthly_payment(principal, rate, term),
        term_periods=term,
        payment_mode="annuity",
        liability_kind=kw.pop("liability_kind", "consumer_loan"),
        **kw,
    )


def _interest_only(profile_id: int, title: str, *, debt: float, rate: float, payment: float) -> FinanceLiability:
    return FinanceLiability(
        game_profile_id=profile_id,
        title=title,
        total_debt=debt,
        annual_rate_percent=rate,
        monthly_payment=payment,
        payment_mode="interest_only",
        liability_kind="credit_card",
    )


def _line(profile_id: int, category: str, amount: float, **kw) -> ProfileExpenseLine:
    return ProfileExpenseLine(
        game_profile_id=profile_id,
        category_key=category,
        amount_monthly=amount,
        created_period_index=1,
        **kw,
    )


# --- Сценарии -----------------------------------------------------------------


def _scenario_full_house(db, user_id: int) -> tuple[GameProfile, int, Callable]:
    """Все виды списаний и начислений; аннуитет гасится досрочно сроком, полис и статья истекают."""
    profile = _profile(db, user_id, cash_balance=20_000.0, safety_fund_balance=10_000.0,
                       delta_monthly_lifestyle_expense=1_500.0)
    pid = profile.id
    db.add_all(
        [
            _annuity(pid, "Потребкредит", principal=60_000.0, rate=18.0, term=4),
            _interest_only(pid, "Кредитка", debt=40_000.0, rate=24.0, payment=800.0),
            FinanceAsset(game_profile_id=pid, title="Машина", kind="car", asset_value=500_000.0,
                         monthly_maintenance_cost=4_000.0, monthly_income=0.0),
            FinanceAsset(game_profile_id=pid, title="Квартира в аренду", kind="rental_home",
                         asset_value=3_000_000.0, monthly_maintenance_cost=2_500.0, monthly_income=15_000.0),
            _line(pid, "food", 14_000.0),
            _line(pid, "transport", 4_500.0),
            _line(pid, "leisure", 3_000.0, title_override="Абонемент", tier="discretionary",
                  expires_period_index=3),
            InsurancePolicy(game_profile_id=pid, product="auto", insured_object="liability",
                            kind="auto_liability", title="ОСАГО", monthly_premium=1_200.0,
                            payout_amount=400_000.0, coverage_limit=400_000.0, term_periods=4,
                            started_period_index=1, expires_period_index=5),
            InvestmentPosition(game_profile_id=pid, kind="deposit", title="Вклад", principal=30_000.0,
                               annual_rate_percent=14.0, started_period=1, last_accrued_period=0),
            InvestmentPosition(game_profile_id=pid, kind="bond", title="ОФЗ", principal=20_000.0,
                               annual_rate_percent=12.0, started_period=1, last_accrued_period=1),
        ]
    )
    db.commit()
    return profile, 7, lambda period_index: True


def _scenario_shortfall_defeat(db, user_id: int) -> tuple[GameProfile, int, Callable]:
    """Зарплату не забирают: просрочка по двум долгам растёт, backfill статей из base, поражение по минусу."""
    profile = _profile(db, user_id, cash_balance=9_000.0, base_monthly_lifestyle_expense=20_000.0)
    pid = profile.id
    db.add_all(
        [
            _annuity(pid, "Автокредит", principal=300_000.0, rate=15.0, term=36, liability_kind="auto_loan"),
            _interest_only(pid, "Кредитка", debt=50_000.0, rate=30.0, payment=1_500.0),
            InsurancePolicy(game_profile_id=pid, product="health", insured_object="self",
                            kind="health", title="ДМС", monthly_premium=900.0,
                            payout_amount=100_000.0, coverage_limit=100_000.0, term_periods=12,
                            started_period_index=1, expires_period_index=13),
        ]
    )
    db.commit()
    return profile, 4, lambda period_index: False


def _scenario_partial_recovery(db, user_id: int) -> tuple[GameProfile, int, Callable]:
    """Без зарплаты в периоде 1 — частичная оплата аннуитета и минус; со 2-го зарплата гасит просрочку.

    Отрицательная delta уменьшает burn (статьи 17 000 − 10 000).
    """
    profile = _profile(db, user_id, cash_balance=3_000.0, delta_monthly_lifestyle_expense=-10_000.0)
    pid = profile.id
    db.add_all(
        [
            _annuity(pid, "Рассрочка", principal=48_000.0, rate=12.0, term=6),
            _line(pid, "food", 15_000.0),
            _line(pid, "communications", 2_000.0),
            InvestmentPosition(game_profile_id=pid, kind="deposit", title="Копилка", principal=5_000.0,
                               annual_rate_percent=10.0, started_period=1, last_accrued_period=1),
        ]
    )
    db.commit()
    return profile, 5, lambda period_index: period_index >= 2


SCENARIOS = {
    "full_house": _scenario_full_house,
    "shortfall_defeat": _scenario_shortfall_defeat,
    "partial_recovery": _scenario_partial_recovery,
}


# --- Сбор наблюдаемого состояния ----------------------------------------------


def _burn(db, profile) -> dict:
    data = burn_breakdown_for_api(compute_monthly_burn(db, profile))
    data["total"] = compute_monthly_burn(db, profile).total
    for line in data["lines"]:
        line.pop("id")
    return data


def _state(db, profile) -> dict:
    pid = profile.id
    db.refresh(profile)
    by_id = lambda q: q.order_by("id").all()  # noqa: E731
    return {
        "profile": {
            "period_index": profile.period_index,
            "cash_balance": float(profile.cash_balance),
            "safety_fund_balance": float(profile.safety_fund_balance),
            "negative_periods_count": profile.negative_periods_count,
            "clean_period_streak": profile.clean_period_streak,
            "is_active": profile.is_active,
            "run_outcome": profile.run_outcome,
        },
        "liabilities": [
            {
                "title": li.title,
                "total_debt": float(li.total_debt),
                "overdue_amount": float(li.overdue_amount or 0),
                "overdue_periods": li.overdue_periods,
                "periods_paid": li.periods_paid,
                "is_active": li.is_active,
            }
            for li in by_id(db.query(FinanceLiability).filter(FinanceLiability.game_profile_id == pid))
        ],
        "investments": [
            {"title": p.title, "principal": float(p.principal), "last_accrued_period": p.last_accrued_period}
            for p in by_id(db.query(InvestmentPosition).filter(InvestmentPosition.game_profile_id == pid))
        ],
        "policies": [
            {"title": p.title, "is_active": p.is_active}
            for p in by_id(db.query(InsurancePolicy).filter(InsurancePolicy.game_profile_id == pid))
        ],
        "expense_lines": [
            {"category_key": ln.category_key, "amount_monthly": float(ln.amount_monthly),
             "is_active": ln.is_active, "source_kind": ln.source_kind}
            for ln in by_id(db.query(ProfileExpenseLine).filter(ProfileExpenseLine.game_profile_id == pid))
        ],
    }


def _transactions(db, profile_id: int, period_index: int) -> list[dict]:
    rows = (
        db.query(Transaction)
        .filter(Transaction.game_profile_id == profile_id, Transaction.period_index == period_index)
        .order_by(Transaction.id)
        .all()
    )
    return [{"type": r.type, "amount": float(r.amount), "description": r.description} for r in rows]


def _closing(db, profile_id: int, period_index: int) -> dict:
    row = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile_id,
                PeriodEconomyClosing.period_index == period_index)
        .one()
    )
    fields = ("cash_balance", "safety_fund_balance", "total_overdue_amount", "monthly_burn_total",
              "period_income_rate", "period_expense_total", "total_debt_balance")
    return {f: float(getattr(row, f)) for f in fields}


def _run(db, user_id: int, name: str) -> dict:
    profile, periods, claims_salary = SCENARIOS[name](db, user_id)
    trace = {"scenario": name, "initial": _state(db, profile), "periods": []}
    with patch("app.game.period.ensure_period_events", return_value=None):
        for _ in range(periods):
            period_index = int(profile.period_index)
            if claims_salary(period_index):
                claim_salary(db, profile)
                db.refresh(profile)
            step = {
                "period_index": period_index,
                "burn": _burn(db, profile),
                "preview": estimate_period_close_preview(db, profile),
            }
            result = process_period_end(db, profile)
            for key in _GAME_ONLY_RESULT_KEYS:
                result.pop(key)
            step["close"] = result
            step["transactions"] = _transactions(db, profile.id, period_index)
            step["closing"] = _closing(db, profile.id, period_index)
            step["state"] = _state(db, profile)
            trace["periods"].append(step)
            if result["game_over"]:
                break
    return _norm(trace)


@pytest.mark.parametrize("name", sorted(SCENARIOS))
def test_period_close_matches_golden(db_session, test_user, name):
    actual = _run(db_session, test_user.id, name)
    path = GOLDEN_DIR / f"period_close_{name}.json"
    if UPDATE:
        GOLDEN_DIR.mkdir(exist_ok=True)
        path.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        pytest.skip(f"golden обновлён: {path.name}")
    assert path.exists(), f"нет {path.name}: сгенерируйте с UPDATE_GOLDEN=1"
    expected = json.loads(path.read_text(encoding="utf-8"))
    assert actual == expected
