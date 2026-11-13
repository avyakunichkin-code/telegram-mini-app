"""Read models over saved reports only. Never invokes the analysis engine."""
import math

METRICS = [
    ("free_cashflow", "Свободный остаток в месяц", "rub", ("free_cashflow",)),
    ("safety_fund_months", "Подушка в месяцах расходов", "months", ("metrics_base", "safety_fund_months")),
    ("dti_percent", "Платежи от дохода", "percent", ("metrics_base", "dti_percent")),
    ("total_debt", "Общий долг", "rub", ("metrics_base", "total_debt")),
    ("net_worth", "Капитал семьи", "rub", ("net_worth",)),
]


def areas(report: dict | None) -> list[dict] | None:
    if report is None:
        return None
    return [{"key": a["key"], "title": a["title"], "light": a["light"]} for a in report.get("areas", [])]


def snapshot(checkup, report: dict) -> dict:
    return {
        "checkup_id": checkup.id, "entry_question": checkup.entry_question,
        "question": report.get("entry_answer", {}).get("question"),
        "as_of": report.get("as_of", checkup.as_of), "completed_at": checkup.completed_at,
        "rules_version": report.get("rules_version"), "fincore_version": report.get("fincore_version"),
        "areas": areas(report),
    }


def value(report: dict, path: tuple) -> float | int | None:
    result = report
    for key in path:
        if not isinstance(result, dict):
            return None
        result = result.get(key)
    return result if type(result) in (int, float) and math.isfinite(result) else None


def compare(before_checkup, before: dict, after_checkup, after: dict) -> dict:
    return {
        "before": snapshot(before_checkup, before), "after": snapshot(after_checkup, after),
        "versions_differ": any(before.get(k) != after.get(k) for k in ("rules_version", "fincore_version")),
        "metrics": [
            {"key": key, "title": title, "unit": unit, "before": (x := value(before, path)),
             "after": (y := value(after, path)), "delta": None if x is None or y is None else round(y - x, 6)}
            for key, title, unit, path in METRICS
        ],
    }
