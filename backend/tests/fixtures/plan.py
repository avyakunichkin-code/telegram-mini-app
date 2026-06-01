"""Хелперы старта Plan mode в API-тестах."""

from __future__ import annotations


def start_plan(
    client,
    auth_headers,
    *,
    profile_name: str = "Plan budget",
    template_key: str | None = "mq_plan_basic_v1",
    budget: dict[str, float] | None = None,
):
    payload = {
        "profile_name": profile_name,
        "save_kind": "plan",
    }
    if template_key:
        payload["template_key"] = template_key
    if budget is not None:
        payload["expense_budget"] = budget
    return client.post("/api/game/start", headers=auth_headers, json=payload)
