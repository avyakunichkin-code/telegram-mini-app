"""Admin Catalog Registry C0 — read-only lists."""

from __future__ import annotations


def test_admin_catalogs_forbidden(client, auth_headers, monkeypatch):
    monkeypatch.setenv("ADMIN_USER_IDS", "")
    from app.config import config

    config.ADMIN_USER_IDS = set()
    resp = client.get("/api/admin/catalogs", headers=auth_headers)
    assert resp.status_code == 403


def test_admin_catalogs_meta(client, admin_env, auth_headers):
    resp = client.get("/api/admin/catalogs", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    keys = {item["key"] for item in data}
    assert keys == {"liabilities", "assets", "starters", "events"}
    events = next(x for x in data if x["key"] == "events")
    assert any(c["key"] == "choices_count" for c in events["columns"])


def test_admin_catalog_rows_unknown(client, admin_env, auth_headers):
    resp = client.get("/api/admin/catalogs/unknown/rows", headers=auth_headers)
    assert resp.status_code == 404


def test_admin_catalog_rows_liabilities(client, admin_env, auth_headers):
    resp = client.get("/api/admin/catalogs/liabilities/rows", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["catalog_key"] == "liabilities"
    assert body["total"] >= 0
    assert isinstance(body["rows"], list)
    if body["rows"]:
        row = body["rows"][0]
        assert "template_key" in row
        assert "is_active" in row


def test_admin_catalog_rows_search(client, admin_env, auth_headers, db_session):
    from app.models import AssetTemplate

    db_session.add(
        AssetTemplate(
            template_key="admin_c0_search_probe",
            title="Admin C0 Search Unique",
            kind="generic",
            asset_value=1,
            monthly_maintenance_cost=0,
            is_active=1,
            sort_order=9999,
        )
    )
    db_session.commit()

    resp = client.get(
        "/api/admin/catalogs/assets/rows?q=admin_c0_search_probe",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    rows = resp.json()["rows"]
    assert any(r["template_key"] == "admin_c0_search_probe" for r in rows)
