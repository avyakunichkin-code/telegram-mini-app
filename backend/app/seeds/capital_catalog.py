"""Каталог капитала (DL1): шаблоны активов и обязательств — идемпотентный upsert при старте API."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import AssetTemplate, LiabilityTemplate

# Канон: docs/vision/ideas/real-estate-asset-catalog.md + migration archive/0029.
CAPITAL_ASSET_SEEDS: list[dict] = [
    {
        "template_key": "apt_1br",
        "title": "1-комнатная квартира",
        "kind": "home",
        "asset_value": 5_000_000.0,
        "monthly_maintenance_cost": 15_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 11,
    },
    {
        "template_key": "apt_2br",
        "title": "2-комнатная квартира",
        "kind": "home",
        "asset_value": 10_000_000.0,
        "monthly_maintenance_cost": 30_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 12,
    },
    {
        "template_key": "apt_3br",
        "title": "3-комнатная квартира",
        "kind": "home",
        "asset_value": 15_000_000.0,
        "monthly_maintenance_cost": 45_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 13,
    },
    {
        "template_key": "land_plot",
        "title": "Участок",
        "kind": "land",
        "asset_value": 2_500_000.0,
        "monthly_maintenance_cost": 10_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 14,
    },
    {
        "template_key": "house_private",
        "title": "Частный дом",
        "kind": "house",
        "asset_value": 20_000_000.0,
        "monthly_maintenance_cost": 80_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 15,
    },
    {
        "template_key": "mansion",
        "title": "Особняк 300+ м²",
        "kind": "mansion",
        "asset_value": 50_000_000.0,
        "monthly_maintenance_cost": 200_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 16,
    },
    {
        "template_key": "apt_1br_income",
        "title": "1-комнатная (сдача)",
        "kind": "rental_home",
        "asset_value": 5_000_000.0,
        "monthly_maintenance_cost": 7_500.0,
        "monthly_income": 37_500.0,
        "estate_role": "income",
        "income_yield_annual": 0.09,
        "has_tenants_default": 1,
        "is_active": 1,
        "sort_order": 21,
    },
    {
        "template_key": "apt_2br_income",
        "title": "2-комнатная (сдача)",
        "kind": "rental_home",
        "asset_value": 10_000_000.0,
        "monthly_maintenance_cost": 15_000.0,
        "monthly_income": 66_667.0,
        "estate_role": "income",
        "income_yield_annual": 0.08,
        "has_tenants_default": 1,
        "is_active": 1,
        "sort_order": 22,
    },
    {
        "template_key": "apt_3br_income",
        "title": "3-комнатная (сдача)",
        "kind": "rental_home",
        "asset_value": 15_000_000.0,
        "monthly_maintenance_cost": 22_500.0,
        "monthly_income": 87_500.0,
        "estate_role": "income",
        "income_yield_annual": 0.07,
        "has_tenants_default": 1,
        "is_active": 1,
        "sort_order": 23,
    },
    {
        "template_key": "house_private_income",
        "title": "Частный дом (сдача)",
        "kind": "rental_house",
        "asset_value": 20_000_000.0,
        "monthly_maintenance_cost": 40_000.0,
        "monthly_income": 116_667.0,
        "estate_role": "income",
        "income_yield_annual": 0.07,
        "has_tenants_default": 1,
        "is_active": 1,
        "sort_order": 24,
    },
    {
        "template_key": "mansion_income",
        "title": "Особняк (сдача)",
        "kind": "rental_mansion",
        "asset_value": 50_000_000.0,
        "monthly_maintenance_cost": 100_000.0,
        "monthly_income": 250_000.0,
        "estate_role": "income",
        "income_yield_annual": 0.06,
        "has_tenants_default": 1,
        "is_active": 1,
        "sort_order": 25,
    },
    {
        "template_key": "lease_studio",
        "title": "Студия (аренда)",
        "kind": "leased_dwelling",
        "asset_value": 0.0,
        "monthly_maintenance_cost": 27_500.0,
        "monthly_income": 0.0,
        "estate_role": "leased",
        "monthly_rent_cost": 22_500.0,
        "monthly_utilities_cost": 5_000.0,
        "is_active": 1,
        "sort_order": 31,
    },
    {
        "template_key": "lease_apt_2br",
        "title": "2-комнатная (аренда)",
        "kind": "leased_dwelling",
        "asset_value": 0.0,
        "monthly_maintenance_cost": 52_500.0,
        "monthly_income": 0.0,
        "estate_role": "leased",
        "monthly_rent_cost": 45_000.0,
        "monthly_utilities_cost": 7_500.0,
        "is_active": 1,
        "sort_order": 32,
    },
    {
        "template_key": "lease_apt_3br",
        "title": "3-комнатная (аренда)",
        "kind": "leased_dwelling",
        "asset_value": 0.0,
        "monthly_maintenance_cost": 82_500.0,
        "monthly_income": 0.0,
        "estate_role": "leased",
        "monthly_rent_cost": 70_000.0,
        "monthly_utilities_cost": 12_500.0,
        "is_active": 1,
        "sort_order": 33,
    },
    {
        "template_key": "lease_house",
        "title": "Дом (аренда)",
        "kind": "leased_dwelling",
        "asset_value": 0.0,
        "monthly_maintenance_cost": 115_000.0,
        "monthly_income": 0.0,
        "estate_role": "leased",
        "monthly_rent_cost": 100_000.0,
        "monthly_utilities_cost": 15_000.0,
        "is_active": 1,
        "sort_order": 34,
    },
    {
        "template_key": "car_personal",
        "title": "Личная машина",
        "kind": "car_personal",
        "asset_value": 1_200_000.0,
        "monthly_maintenance_cost": 12_000.0,
        "monthly_income": 0.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 30,
    },
    {
        "template_key": "car_taxi",
        "title": "Машина для такси (аренда)",
        "kind": "car_taxi",
        "asset_value": 1_500_000.0,
        "monthly_maintenance_cost": 18_000.0,
        "monthly_income": 45_000.0,
        "estate_role": "owned",
        "is_active": 1,
        "sort_order": 40,
    },
]

LEGACY_ASSET_TEMPLATE_KEYS = ("home", "rental_home")

# total_debt в шаблоне — ориентир для UI; secured bundle считает тело из asset − down_payment.
CAPITAL_LIABILITY_SEEDS: list[dict] = [
    {
        "template_key": "mortgage",
        "title": "Ипотека",
        "total_debt": 4_000_000.0,
        "annual_rate_percent": 12.0,
        "liability_kind": "mortgage",
        "term_periods": 240,
        "disbursement_mode": "to_asset_purchase",
        "down_payment_amount": 1_000_000.0,
        "requires_asset_kind": "home",
        "linked_asset_template_key": "apt_1br",
        "is_active": 1,
        "sort_order": 10,
    },
    {
        "template_key": "car_loan",
        "title": "Автокредит",
        "total_debt": 900_000.0,
        "annual_rate_percent": 14.0,
        "liability_kind": "auto_loan",
        "term_periods": 60,
        "disbursement_mode": "to_asset_purchase",
        "down_payment_amount": 300_000.0,
        "requires_asset_kind": "car",
        "linked_asset_template_key": "car_personal",
        "is_active": 1,
        "sort_order": 20,
    },
    {
        "template_key": "consumer",
        "title": "Потребительский кредит",
        "total_debt": 400_000.0,
        "annual_rate_percent": 18.0,
        "liability_kind": "consumer",
        "term_periods": 36,
        "disbursement_mode": "to_cash",
        "down_payment_amount": 0.0,
        "requires_asset_kind": None,
        "linked_asset_template_key": None,
        "is_active": 1,
        "sort_order": 30,
    },
    {
        "template_key": "credit_card",
        "title": "Кредитная карта",
        "total_debt": 150_000.0,
        "annual_rate_percent": 22.0,
        "liability_kind": "consumer",
        "term_periods": None,
        "disbursement_mode": "to_cash",
        "down_payment_amount": 0.0,
        "requires_asset_kind": None,
        "linked_asset_template_key": None,
        "is_active": 1,
        "sort_order": 40,
    },
]


def upsert_capital_asset_catalog(db: Session) -> None:
    """Синхронизировать asset_templates с каноном недвижимости и авто (prod + dev)."""
    for seed in CAPITAL_ASSET_SEEDS:
        key = seed["template_key"]
        row = (
            db.query(AssetTemplate)
            .filter(AssetTemplate.template_key == key)
            .first()
        )
        if row is None:
            db.add(AssetTemplate(**seed))
            continue
        for field, value in seed.items():
            setattr(row, field, value)
    for legacy_key in LEGACY_ASSET_TEMPLATE_KEYS:
        legacy = (
            db.query(AssetTemplate)
            .filter(AssetTemplate.template_key == legacy_key)
            .first()
        )
        if legacy is not None:
            legacy.is_active = 0
    db.commit()


def upsert_capital_liability_catalog(db: Session) -> None:
    """Синхронизировать liability_templates с DL1-метаданными (prod + dev)."""
    for seed in CAPITAL_LIABILITY_SEEDS:
        key = seed["template_key"]
        row = (
            db.query(LiabilityTemplate)
            .filter(LiabilityTemplate.template_key == key)
            .first()
        )
        if row is None:
            db.add(LiabilityTemplate(**seed))
            continue
        for field, value in seed.items():
            setattr(row, field, value)
    db.commit()
