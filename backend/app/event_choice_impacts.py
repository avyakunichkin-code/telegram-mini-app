"""
Превью последствий выбора события — те же метрики, что у активов/долгов/страховок.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .expenses import compute_monthly_burn
from .insurance_events import find_policy_for_claim


def resolve_lifestyle_delta_from_effects(
    db: Session, profile, effects: dict[str, Any]
) -> float:
    """Суммарная дельта «жизни» из effects (включая monthly_burn_delta_pct от текущего burn)."""
    burn_total = float(compute_monthly_burn(db, profile).total)
    delta = float(effects.get("monthly_lifestyle_delta", 0) or 0) + float(
        effects.get("monthly_expense_delta", 0) or 0
    )
    pct = effects.get("monthly_burn_delta_pct")
    if pct is not None:
        delta += round(burn_total * float(pct), 2)
    raw_line = effects.get("expense_line")
    if isinstance(raw_line, dict):
        delta += float(raw_line.get("amount_monthly", raw_line.get("amount", 0)) or 0)
    return delta


def build_choice_impacts(db: Session, profile, effects: dict[str, Any]) -> list[dict[str, Any]]:
    """Структура для UI: kind, delta, value_after (опц.), tip."""
    if not isinstance(effects, dict):
        return []

    burn_now = float(compute_monthly_burn(db, profile).total)
    impacts: list[dict[str, Any]] = []

    cash = float(effects.get("cash_delta", 0) or 0)
    if abs(cash) >= 1e-6:
        impacts.append(
            {
                "kind": "cash",
                "delta": round(cash, 2),
                "tip": "Счёт сейчас",
            }
        )

    safety = float(effects.get("safety_delta", 0) or 0)
    if abs(safety) >= 1e-6:
        impacts.append(
            {
                "kind": "safety",
                "delta": round(safety, 2),
                "tip": "Подушка",
            }
        )

    burn_delta = resolve_lifestyle_delta_from_effects(db, profile, effects)
    if abs(burn_delta) >= 1e-6:
        burn_after = round(max(0.0, burn_now + burn_delta), 2)
        impacts.append(
            {
                "kind": "burn",
                "delta": round(burn_delta, 2),
                "value_after": burn_after,
                "tip": (
                    f"Расходы на жизнь / период: "
                    f"{int(round(burn_now)):,} → {int(round(burn_after)):,} ₽".replace(",", " ")
                ),
            }
        )

    claim = effects.get("insurance_claim")
    if isinstance(claim, dict):
        kind = (claim.get("kind") or "").strip() or None
        product = (claim.get("product") or "").strip() or None
        insured_object = (claim.get("insured_object") or "").strip() or None
        policy_id = claim.get("policy_id")
        pid = int(policy_id) if policy_id is not None else None
        policy = find_policy_for_claim(
            db,
            profile.id,
            kind=kind,
            product=product,
            insured_object=insured_object,
            policy_id=pid,
        )
        if policy:
            payout = float(
                policy.payout_amount if policy.payout_amount is not None else policy.coverage_limit or 0
            )
            if payout > 0:
                impacts.append(
                    {
                        "kind": "insurance_payout",
                        "delta": round(payout, 2),
                        "tip": "Выплата на счёт (полис)",
                    }
                )

    xp = effects.get("xp_delta")
    if xp is not None and int(xp) > 0:
        impacts.append({"kind": "xp", "delta": int(xp), "tip": "Опыт"})

    return impacts
