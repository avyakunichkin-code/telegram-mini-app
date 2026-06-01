"""Константы движка событий (контракт эффектов, ключи)."""

EVENTS_UNLOCK_INTRO_KEY = "mq11_events_unlock_intro"
PERIOD_EVENT_POOL_EXCLUDE_KEYS = frozenset({EVENTS_UNLOCK_INTRO_KEY, "tax_refund"})

ALLOWED_EFFECT_KEYS = frozenset(
    {
        "cash_delta",
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
        "requires_chain_branch",
        "needs_delta",
    }
)
