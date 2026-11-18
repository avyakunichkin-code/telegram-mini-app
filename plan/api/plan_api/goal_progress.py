"""Compare saved goal snapshots by ID; never infer identity or recalculate a parent."""
from decimal import Decimal, ROUND_CEILING

from .analysis.adapter import month_index, month_label


def add_goal_progress(repo, user, checkup, report):
    parent = repo.checkup(user, checkup.parent_checkup_id) if checkup.parent_checkup_id else None
    saved = repo.report(parent.id) if parent and parent.status == "completed" else None
    previous = {g["id"]: g for g in (saved or {}).get("goals", []) if g.get("id")}
    elapsed = month_index(checkup.as_of) - month_index(saved["as_of"]) if saved else None
    for goal in report["goals"]:
        old = previous.get(goal.get("id"))
        before = old.get("saved_amount") if old else None
        delta = float(Decimal(str(goal["saved_amount"])) - Decimal(str(before))) if before is not None else None
        pace = round(delta / elapsed, 2) if delta is not None and elapsed > 0 else None
        left = max(Decimal(0), Decimal(str(goal["target_amount"])) - Decimal(str(goal["saved_amount"])))
        months = int((left * elapsed / Decimal(str(delta))).to_integral_value(rounding=ROUND_CEILING)) if left and delta is not None and delta > 0 and elapsed > 0 else None
        index = month_index(checkup.as_of) + months if months is not None else None
        # Month schema supports only four-digit years. Huge or tiny amounts yield unknown.
        estimate = month_label(index) if index is not None and -23988 <= index < 96000 else None
        goal["progress"] = {
            "status": "compared" if before is not None else "new" if not checkup.parent_checkup_id else "unavailable",
            "before": before, "delta": delta, "months": elapsed if old else None,
            "before_as_of": saved.get("as_of") if old else None,
            "observed_monthly": pace, "estimated_month": estimate,
            "previous_estimated_month": (old.get("progress", {}).get("estimated_month") or old.get("realistic_month")) if old else None,
            "previous_target_amount": old.get("target_amount") if old else None,
            "target_changed": old is not None and old.get("target_amount") != goal["target_amount"],
            "achieved": left == 0,
        }
