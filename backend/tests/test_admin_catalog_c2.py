"""C2 — GET detail + PATCH с валидацией JSON."""

from __future__ import annotations

import json


def test_catalog_get_and_patch_liability(client, admin_env, auth_headers, db_session):
    from app.models import LiabilityTemplate

    row = LiabilityTemplate(
        template_key="c2_patch_liab",
        title="Before",
        total_debt=50_000,
        annual_rate_percent=10,
        is_active=0,
        sort_order=100,
    )
    db_session.add(row)
    db_session.commit()

    detail = client.get(
        f"/api/admin/catalogs/liabilities/rows/{row.id}",
        headers=auth_headers,
    )
    assert detail.status_code == 200
    assert detail.json()["row"]["title"] == "Before"

    patch = client.patch(
        f"/api/admin/catalogs/liabilities/rows/{row.id}",
        json={"title": "After patch", "total_debt": 60_000},
        headers=auth_headers,
    )
    assert patch.status_code == 200
    assert patch.json()["row"]["title"] == "After patch"

    db_session.refresh(row)
    assert row.title == "After patch"
    assert float(row.total_debt) == 60_000


def test_catalog_patch_invalid_victory_config(client, admin_env, auth_headers, db_session):
    from app.models import GameStarterTemplate

    row = GameStarterTemplate(
        template_key="c2_bad_victory",
        title="Starter",
        blueprint_json="{}",
        victory_config_json='{"goals": []}',
        is_active=0,
    )
    db_session.add(row)
    db_session.commit()

    resp = client.patch(
        f"/api/admin/catalogs/starters/rows/{row.id}",
        json={"victory_config_json": '{"not": "valid goals"}'},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    errors = resp.json()["detail"]["errors"]
    assert "victory_config_json" in errors


def test_catalog_patch_valid_starter_json(client, admin_env, auth_headers, db_session):
    from app.models import GameStarterTemplate

    row = GameStarterTemplate(
        template_key="c2_good_starter",
        title="Starter OK",
        blueprint_json="{}",
        victory_config_json="{}",
        is_active=0,
    )
    db_session.add(row)
    db_session.commit()

    victory = {
        "schema_version": 1,
        "min_period_index_for_victory": 7,
        "progression_mode": "chain",
        "goals": [
            {
                "key": "safety_3x",
                "type": "safety_fund_months",
                "title": "Подушка",
                "enabled": True,
            }
        ],
    }
    bp = {"monthly_salary": 50000, "cash_balance": 1000}

    resp = client.patch(
        f"/api/admin/catalogs/starters/rows/{row.id}",
        json={
            "blueprint_json": json.dumps(bp),
            "victory_config_json": json.dumps(victory),
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    db_session.refresh(row)
    assert json.loads(row.blueprint_json)["monthly_salary"] == 50000
    assert len(json.loads(row.victory_config_json)["goals"]) == 1
