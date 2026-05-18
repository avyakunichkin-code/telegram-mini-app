import pytest

from app.insurance_catalog import (
    insurance_kind,
    legacy_kind_to_pair,
    list_catalog,
    resolve_product_object,
)


def test_insurance_kind_composite():
    assert insurance_kind("auto", "liability") == "auto_liability"


def test_resolve_from_product_object():
    spec = resolve_product_object(product="mortgage", insured_object="life")
    assert spec.kind == "mortgage_life"
    assert "Ипотека" in spec.title


def test_resolve_legacy_kind_car():
    spec = resolve_product_object(kind="car")
    assert spec.product == "auto"
    assert spec.insured_object == "property"


def test_legacy_kind_to_pair():
    assert legacy_kind_to_pair("health") == ("health", "life")


def test_catalog_has_mortgage_and_auto_pairs():
    kinds = {item["kind"] for item in list_catalog()}
    assert "mortgage_life" in kinds
    assert "auto_liability" in kinds
    assert "auto_property" in kinds


def test_unknown_pair_raises():
    with pytest.raises(ValueError):
        resolve_product_object(product="unknown", insured_object="thing")
