"""Read-only conditional chain cash preview, v1. Never schedules or applies effects."""
from __future__ import annotations

import json
from sqlalchemy.orm import Session

from ..models import EventChoice, EventDefinition
from .chains import choice_allowed_for_chain_branch, resolve_cash_pct_salary
from .chain_actions import CHAIN_ACTION_CONTEXT_KEYS


def preview_future_payments(db: Session, profile, effects: dict, *, chain_context: dict | None = None) -> dict:
    """Bounded traversal; alternatives are conditional, never additive obligations.

    Unknown/dynamic chain actions are explicitly incomplete. Salary-dependent
    amounts use today's salary and must be labelled estimates by the consumer.
    """
    rows = []
    incomplete = False
    visited_nodes = 0

    def visit(effect, period, path, seen, context):
        nonlocal incomplete, visited_nodes
        enqueue = effect.get('enqueue_event')
        if not isinstance(enqueue, dict):
            return
        key = str(enqueue.get('followup_definition_key') or '')
        if not key or key in seen or len(seen) >= 4 or len(rows) >= 24 or visited_nodes >= 32:
            incomplete = True
            return
        visited_nodes += 1
        definition = db.query(EventDefinition).filter_by(key=key).first()
        if definition is None or not definition.is_active:
            incomplete = True
            return
        due = period + max(1, int(enqueue.get('after_periods', 2) or 2))
        explicit = enqueue.get('context') if isinstance(enqueue.get('context'), dict) else {}
        ctx = {**{k: context[k] for k in CHAIN_ACTION_CONTEXT_KEYS if k in context}, **explicit}
        choices = db.query(EventChoice).filter_by(definition_id=definition.id).order_by(EventChoice.id).all()
        for choice in choices:
            try:
                raw = json.loads(choice.effects_json or '{}')
            except (ValueError, TypeError):
                incomplete = True
                continue
            if not isinstance(raw, dict):
                incomplete = True
                continue
            if not choice_allowed_for_chain_branch(raw, ctx):
                continue
            branch = [*path, choice.title]
            if raw.get('chain_action') or raw.get('used_car_action') or raw.get('insurance_claim'):
                incomplete = True
            elif 'cash_delta' in raw or 'cash_pct_salary' in raw:
                resolved = resolve_cash_pct_salary(db, profile, raw)
                delta = float(resolved.get('cash_delta') or 0)
                if delta:
                    if len(rows) >= 24:
                        incomplete = True
                        return
                    rows.append({'period_index': due, 'choice_path': branch,
                                 'cash_delta': round(delta, 2),
                                 'salary_fraction': raw.get('cash_pct_salary'),
                                 'conditional': True})
            visit(raw, due, branch, {*seen, key}, ctx)

    visit(effects, int(profile.period_index), [], set(), chain_context or {})
    grouped = {}
    for row in rows:
        key = (row['period_index'], row['cash_delta'], row['salary_fraction'], tuple(row['choice_path'][:-1]))
        if key in grouped:
            grouped[key]['choice_path'][-1] += ' / ' + row['choice_path'][-1]
        else:
            grouped[key] = row
    return {'version': 1, 'payments': list(grouped.values()), 'incomplete': incomplete}
