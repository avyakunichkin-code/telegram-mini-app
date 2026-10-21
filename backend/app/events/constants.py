"""Константы движка событий (контракт эффектов, ключи)."""

EVENTS_UNLOCK_INTRO_KEY = "mq11_events_unlock_intro"
PERIOD_EVENT_POOL_EXCLUDE_KEYS = frozenset({EVENTS_UNLOCK_INTRO_KEY, "tax_refund"})

# Назначение траты в выборе (SPEC_needs-set-point, NV-202): только YAML-авторинг и линтер.
CHOICE_PURPOSES = frozenset({"pleasure", "mitigation", "investment", "obligation"})

ALLOWED_EFFECT_KEYS = frozenset(
    {
        "cash_delta",
        "cash_pct_salary",
        "safety_delta",
        "safety_grant",
        "xp_delta",
        "monthly_lifestyle_delta",
        "monthly_expense_delta",
        "monthly_burn_delta_pct",
        "expense_line",
        "insurance_claim",
        "enqueue_event",
        "asset_from_template",
        "used_car_action",
        "chain_action",
        "requires_chain_branch",
        "needs_delta",
    }
)
