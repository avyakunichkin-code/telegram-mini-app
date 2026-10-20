"""DL1 annuity and payoff helpers — перенесены в `fincore.annuity` (ADR-016, SPL-202). Шим для старых импортов."""

from fincore.annuity import (  # noqa: F401
    apply_partial_payment,
    monthly_payment,
    prepay_waterfall,
    sale_cashflow,
    split_full_payment,
)
