"""C1 — create / clone catalog rows (is_active=0)."""

from __future__ import annotations


def test_catalog_create_liability_draft(client, admin_env, auth_headers, db_session):
    resp = client.post(
        "/api/admin/catalogs/liabilities/rows",
        json={"title": "Тест C1 create"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["catalog_key"] == "liabilities"
    assert body["id"] > 0
    assert body["template_key"].startswith("draft_")

    from app.models import LiabilityTemplate

    row = db_session.query(LiabilityTemplate).filter(LiabilityTemplate.id == body["id"]).first()
    assert row is not None
    assert row.is_active == 0
    assert row.title == "Тест C1 create"


def test_catalog_clone_event_inactive(client, admin_env, auth_headers, db_session):
    from app.models import EventChoice, EventDefinition

    src = EventDefinition(
        key="c1_clone_source_evt",
        mode="game",
        title="Источник",
        description="d",
        is_active=1,
        weight=50,
    )
    db_session.add(src)
    db_session.flush()
    db_session.add(
        EventChoice(
            definition_id=src.id,
            title="A",
            effects_json='{"cash_delta": -100}',
        )
    )
    db_session.commit()

    resp = client.post(
        f"/api/admin/catalogs/events/rows/{src.id}/clone",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    clone_id = resp.json()["id"]
    clone_key = resp.json()["key"]
    assert clone_key.endswith("_copy") or "_copy_" in clone_key

    clone = db_session.query(EventDefinition).filter(EventDefinition.id == clone_id).first()
    assert clone is not None
    assert clone.is_active == 0
    assert len(clone.choices) == 1
    assert clone.choices[0].title == "A"
