"""YAML-каталог MVP 1.1: загрузка, контракт, паритет с ensure."""

from app.events.mvp11_catalog import clear_mvp11_catalog_cache, load_mvp11_catalog
from app.events.mvp11_contract import validate_mvp11_specs
from app.events.mvp11_seeds import MVP11_EVENT_SPECS, ensure_mvp11_event_catalog


def test_mvp11_yaml_loads_full_catalog():
    clear_mvp11_catalog_cache()
    specs, taxonomy = load_mvp11_catalog(force_reload=True)
    assert len(specs) == 56
    assert len(taxonomy) == 56
    assert {s["key"] for s in specs} == set(taxonomy.keys())
    validate_mvp11_specs(specs)


def test_mvp11_module_exports_match_loader():
    assert len(MVP11_EVENT_SPECS) == 56
    keys = {s["key"] for s in MVP11_EVENT_SPECS}
    assert "mq11_friend_outing_student" in keys
    assert "mq11_refinance_bank" in keys


def test_ensure_mvp11_works_from_yaml_catalog(db_session):
    ensure_mvp11_event_catalog(db_session)
    from app.models import EventDefinition

    row = (
        db_session.query(EventDefinition)
        .filter(EventDefinition.key == "mq11_friend_outing_student")
        .first()
    )
    assert row is not None
    assert "Подруга" in row.title
