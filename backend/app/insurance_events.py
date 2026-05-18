"""Страховые случаи: матч полиса, выплата (события и прочие вызовы)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .balance_utils import adjust_balance
from .insurance_catalog import insurance_kind, resolve_product_object
from .models import InsurancePolicy


def settle_insurance_claim(db: Session, profile, policy_id: int, period_index: int) -> dict:
    """Страховой случай: полная выплата на cash, полис закрывается."""
    policy = (
        db.query(InsurancePolicy)
        .filter(
            InsurancePolicy.id == policy_id,
            InsurancePolicy.game_profile_id == profile.id,
            InsurancePolicy.is_active == 1,
            InsurancePolicy.claimed_period_index.is_(None),
        )
        .first()
    )
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found or already used")

    payout = float(policy.payout_amount if policy.payout_amount is not None else policy.coverage_limit or 0)
    if payout <= 0:
        raise HTTPException(status_code=400, detail="Policy has no payout amount")

    adjust_balance(
        db,
        profile.id,
        payout,
        "insurance_claim",
        f"Страховая выплата: {policy.title}",
        period_index,
    )
    policy.claimed_period_index = period_index
    policy.is_active = 0
    db.commit()
    db.refresh(profile)
    return {"status": "success", "payout_amount": payout, "policy_id": policy.id}


def _normalize_claim_spec(spec: dict[str, Any]) -> tuple[str | None, str | None, str | None, int | None]:
    if not isinstance(spec, dict):
        return None, None, None, None
    policy_id = spec.get("policy_id")
    kind = (spec.get("kind") or "").strip() or None
    product = (spec.get("product") or "").strip() or None
    insured_object = (spec.get("insured_object") or "").strip() or None
    if product and insured_object:
        kind = insurance_kind(product, insured_object)
    pid = int(policy_id) if policy_id is not None else None
    return kind, product, insured_object, pid


def find_policy_for_claim(
    db: Session,
    game_profile_id: int,
    *,
    kind: str | None = None,
    product: str | None = None,
    insured_object: str | None = None,
    policy_id: int | None = None,
) -> InsurancePolicy | None:
    q = db.query(InsurancePolicy).filter(
        InsurancePolicy.game_profile_id == game_profile_id,
        InsurancePolicy.is_active == 1,
        InsurancePolicy.claimed_period_index.is_(None),
    )
    if policy_id is not None:
        return q.filter(InsurancePolicy.id == policy_id).first()

    if kind:
        return q.filter(InsurancePolicy.kind == kind).order_by(InsurancePolicy.created_at.asc()).first()

    if product and insured_object:
        k = insurance_kind(product, insured_object)
        return q.filter(InsurancePolicy.kind == k).order_by(InsurancePolicy.created_at.asc()).first()

    return None


def apply_insurance_claim_from_effects(
    db: Session,
    profile,
    claim_spec: dict[str, Any],
    period_index: int,
) -> dict[str, Any] | None:
    """
    Если в effects есть insurance_claim — находит активный полис и вызывает settle_insurance_claim.
    Возвращает сводку для ответа API или None, если ключа нет.
    """
    if not claim_spec:
        return None

    kind, product, insured_object, policy_id = _normalize_claim_spec(claim_spec)
    if not kind and not policy_id:
        raise ValueError("insurance_claim requires kind or product+insured_object or policy_id")

    if kind:
        resolve_product_object(kind=kind)

    policy = find_policy_for_claim(
        db,
        profile.id,
        kind=kind,
        product=product,
        insured_object=insured_object,
        policy_id=policy_id,
    )
    if not policy:
        raise ValueError("Нет подходящего активного полиса для страхового случая")

    result = settle_insurance_claim(db, profile, int(policy.id), int(period_index))
    return {
        "applied": True,
        "policy_id": int(policy.id),
        "policy_title": policy.title,
        "payout_amount": float(result.get("payout_amount") or 0),
        "kind": policy.kind,
    }
