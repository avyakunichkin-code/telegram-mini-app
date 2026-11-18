"""Parent-step context, projected once into a new final report. No parent recalculation."""
from .history import value

RULE_METRICS = {
    "first_cushion": ("safety_fund_months", "Подушка в месяцах расходов", "months", ("metrics_base", "safety_fund_months")),
    "cushion_target": ("safety_fund_months", "Подушка в месяцах расходов", "months", ("metrics_base", "safety_fund_months")),
    "stress_fail": ("safety_fund_months", "Подушка в месяцах расходов", "months", ("metrics_base", "safety_fund_months")),
    "stop_deficit": ("free_cashflow", "Свободный остаток в месяц", "rub", ("free_cashflow",)),
    "direct_surplus": ("free_cashflow", "Свободный остаток в месяц", "rub", ("free_cashflow",)),
    "avalanche": ("dti_percent", "Платежи от дохода", "percent", ("metrics_base", "dti_percent")),
}


def parent_context(repo, user, checkup, report: dict) -> dict:
    if not checkup.parent_checkup_id:
        return {"status": "none", "steps": []}
    parent = repo.checkup(user, checkup.parent_checkup_id)
    if parent is None or parent.status != "completed":
        return {"status": "unavailable", "steps": []}
    saved = repo.report_with_step_status(parent.id)
    if saved is None:
        return {"status": "unavailable", "steps": []}
    steps = []
    for step in saved.get("steps", []):
        actions = step.get("actions")
        metric = None
        config = RULE_METRICS.get(step["rule_key"])
        if config:
            key, title, unit, path = config
            before, after = value(saved, path), value(report, path)
            metric = {"key": key, "title": title, "unit": unit, "before": before, "after": after,
                      "delta": None if before is None or after is None else round(after - before, 6)}
        steps.append({"id": step.get("id"), "rule_key": step["rule_key"], "title": step["title"],
                      "status": step.get("status", "suggested"), "rank": step.get("rank", 0),
                      "actions_total": len(actions) if actions else None,
                      "actions_done": sum(a.get("done") is True for a in actions) if actions else None,
                      "metric": metric})
    # An explicitly marked step is context before an unaccepted suggestion; original rank breaks ties.
    steps.sort(key=lambda s: (0 if s["status"] == "done" else 1 if s["actions_done"] else 2 if s["status"] == "suggested" else 3, s["rank"]))
    return {"status": "ready", "parent_checkup_id": parent.id, "as_of": saved.get("as_of", parent.as_of),
            "completed_at": parent.completed_at,
            "versions_differ": any(saved.get(k) != report.get(k) for k in ("rules_version", "fincore_version")),
            "steps": steps}
