"""Стартовые долги из blueprint шаблона: annuity + привязка к активу (DL1)."""

from __future__ import annotations

from dataclasses import dataclass

from .annuity import monthly_payment
from .helpers import monthly_interest_payment
from .liability_kinds import (
    LIABILITY_KIND_AUTO_LOAN,
    LIABILITY_KIND_CONSUMER,
    LIABILITY_KIND_MORTGAGE,
    PAYMENT_MODE_ANNUITY,
    PAYMENT_MODE_INTEREST_ONLY,
)
from ..models import FinanceAsset, FinanceLiability
_HOME_KINDS = frozenset({"home", "rental_home", "leased_dwelling"})
_CREDIT_CARD_MARKERS = ("кредитная карта", "credit card", "credit_card")


@dataclass(frozen=True)
class StarterLiabilitySpec:
    liability_kind: str
    payment_mode: str
    term_periods: int | None
    secured_asset_kind: str | None  # "home" | "car" | None


def _title_lower(blueprint_li: dict) -> str:
    return (blueprint_li.get("title") or "").strip().lower()


def _is_credit_card(blueprint_li: dict) -> bool:
    explicit = (blueprint_li.get("liability_kind") or "").strip().lower()
    if explicit in ("credit_card", "revolving"):
        return True
    title = _title_lower(blueprint_li)
    return any(m in title for m in _CREDIT_CARD_MARKERS)


def resolve_starter_liability_spec(blueprint_li: dict) -> StarterLiabilitySpec:
    """Канон стартовых долгов: ипотека/авто — annuity; кредитная карта — interest-only без prepay."""
    if _is_credit_card(blueprint_li):
        return StarterLiabilitySpec(
            liability_kind=LIABILITY_KIND_CONSUMER,
            payment_mode=PAYMENT_MODE_INTEREST_ONLY,
            term_periods=None,
            secured_asset_kind=None,
        )

    explicit_kind = (blueprint_li.get("liability_kind") or "").strip().lower()
    explicit_term = blueprint_li.get("term_periods")
    term_i = int(explicit_term) if explicit_term is not None else None

    title = _title_lower(blueprint_li)
    if explicit_kind in (LIABILITY_KIND_MORTGAGE, "mortgage") or "ипотек" in title:
        return StarterLiabilitySpec(
            liability_kind=LIABILITY_KIND_MORTGAGE,
            payment_mode=PAYMENT_MODE_ANNUITY,
            term_periods=term_i or 240,
            secured_asset_kind="home",
        )
    if explicit_kind in (LIABILITY_KIND_AUTO_LOAN, "auto_loan") or "авто" in title:
        return StarterLiabilitySpec(
            liability_kind=LIABILITY_KIND_AUTO_LOAN,
            payment_mode=PAYMENT_MODE_ANNUITY,
            term_periods=term_i or 60,
            secured_asset_kind="car",
        )

    return StarterLiabilitySpec(
        liability_kind=LIABILITY_KIND_CONSUMER,
        payment_mode=PAYMENT_MODE_ANNUITY,
        term_periods=term_i or 36,
        secured_asset_kind=None,
    )


def _asset_matches_home(asset: FinanceAsset) -> bool:
    kind = (asset.kind or "").lower()
    if kind in _HOME_KINDS:
        return True
    return kind.startswith("apt")


def _asset_matches_car(asset: FinanceAsset) -> bool:
    kind = (asset.kind or "").lower()
    return kind.startswith("car")


def _pick_secured_asset(
    assets: list[FinanceAsset],
    spec: StarterLiabilitySpec,
    used_asset_ids: set[int],
) -> FinanceAsset | None:
    if spec.secured_asset_kind == "home":
        matcher = _asset_matches_home
    elif spec.secured_asset_kind == "car":
        matcher = _asset_matches_car
    else:
        return None

    for asset in assets:
        if asset.id in used_asset_ids:
            continue
        if matcher(asset):
            return asset
    return None


def build_starter_liability(
    *,
    profile_id: int,
    blueprint_li: dict,
    assets: list[FinanceAsset],
    used_secured_asset_ids: set[int],
) -> FinanceLiability:
    title = (blueprint_li.get("title") or "Обязательство").strip() or "Обязательство"
    principal = float(blueprint_li.get("total_debt") or 0)
    rate = float(blueprint_li.get("annual_rate_percent") or 0)
    spec = resolve_starter_liability_spec(blueprint_li)

    secured_asset_id = None
    if spec.secured_asset_kind:
        asset = _pick_secured_asset(assets, spec, used_secured_asset_ids)
        if asset is not None:
            secured_asset_id = asset.id
            used_secured_asset_ids.add(asset.id)
            asset.acquisition_mode = "secured"

    if spec.payment_mode == PAYMENT_MODE_ANNUITY:
        term = int(spec.term_periods or 0)
        if term <= 0:
            raise ValueError(f"Annuity starter liability requires term_periods: {title}")
        mp = monthly_payment(principal, rate, term)
        pay_mode = PAYMENT_MODE_ANNUITY
        term_periods = term
    else:
        mp = monthly_interest_payment(principal, rate)
        pay_mode = PAYMENT_MODE_INTEREST_ONLY
        term_periods = None

    return FinanceLiability(
        game_profile_id=profile_id,
        title=title,
        total_debt=principal,
        original_principal=principal,
        annual_rate_percent=rate,
        monthly_payment=mp,
        liability_kind=spec.liability_kind,
        secured_asset_id=secured_asset_id,
        term_periods=term_periods,
        periods_paid=0,
        payment_mode=pay_mode,
        overdue_amount=0,
        overdue_periods=0,
        is_active=1,
    )
