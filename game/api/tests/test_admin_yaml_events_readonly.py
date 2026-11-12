"""ADR-008: события из YAML-каталога нельзя править через админку (синк откатит правку)."""

from __future__ import annotations

from app.events.mvp11_seeds import MVP11_EVENT_SPECS
from app.models import EventChoice, EventDefinition


def _yaml_event(db_session) -> EventDefinition:
    key = MVP11_EVENT_SPECS[0]["key"]
    row = db_session.query(EventDefinition).filter(EventDefinition.key == key).first()
    if row is None:
        row = EventDefinition(key=key, mode="game", title="YAML", description="d", is_active=1, weight=50)
        db_session.add(row)
        db_session.flush()
        db_session.add(EventChoice(definition_id=row.id, title="A", effects_json="{}"))
        db_session.commit()
    return row


def _custom_event(db_session) -> EventDefinition:
    row = EventDefinition(key="admin_custom_evt", mode="game", title="Своё", description="d", is_active=0, weight=50)
    db_session.add(row)
    db_session.flush()
    db_session.add(EventChoice(definition_id=row.id, title="A", effects_json="{}"))
    db_session.commit()
    return row


def test_patch_yaml_event_rejected(client, admin_env, auth_headers, db_session):
    row = _yaml_event(db_session)
    title_before = row.title
    resp = client.patch(
        f"/api/admin/catalogs/events/rows/{row.id}",
        json={"title": "Правка из админки"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
    assert "YAML" in str(resp.json())
    db_session.refresh(row)
    assert row.title == title_before


def test_patch_custom_event_allowed(client, admin_env, auth_headers, db_session):
    row = _custom_event(db_session)
    resp = client.patch(
        f"/api/admin/catalogs/events/rows/{row.id}",
        json={"title": "Новое имя"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    db_session.refresh(row)
    assert row.title == "Новое имя"


def test_yaml_event_choices_readonly(client, admin_env, auth_headers, db_session):
    row = _yaml_event(db_session)
    choice = row.choices[0]
    create = client.post(
        f"/api/admin/catalogs/events/rows/{row.id}/choices",
        json={"title": "X", "description": "", "effects": {}},
        headers=auth_headers,
    )
    assert create.status_code == 409
    patch = client.patch(
        f"/api/admin/catalogs/events/rows/{row.id}/choices/{choice.id}",
        json={"title": "X"},
        headers=auth_headers,
    )
    assert patch.status_code == 409
    delete = client.delete(
        f"/api/admin/catalogs/events/rows/{row.id}/choices/{choice.id}",
        headers=auth_headers,
    )
    assert delete.status_code == 409


def test_choice_of_other_event_not_reachable_via_custom_row(client, admin_env, auth_headers, db_session):
    """Нельзя обойти защиту, подставив row_id своего события и choice_id YAML-события."""
    yaml_row = _yaml_event(db_session)
    custom = _custom_event(db_session)
    resp = client.delete(
        f"/api/admin/catalogs/events/rows/{custom.id}/choices/{yaml_row.choices[0].id}",
        headers=auth_headers,
    )
    assert resp.status_code == 404
    assert db_session.get(EventChoice, yaml_row.choices[0].id) is not None
