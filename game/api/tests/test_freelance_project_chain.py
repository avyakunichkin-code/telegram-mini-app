"""Цепочка mq11_freelance_project_* — расписание, ветки, mandatory."""

import json

import pytest

from app.events.chains import (
    FREELANCE_PROJECT_CHAIN_KEY,
    choice_allowed_for_chain_branch,
    ensure_scheduled_chain_events,
    get_active_chain,
    schedule_event_chain,
)
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.events.mandatory import pending_mandatory_blocking_event_titles
from app.models import EventDefinition, EventInstance, GameProfile


@pytest.fixture()
def student_profile(db_session):
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=1,
        name="freelance-chain",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        period_index=1,
        cash_balance=50_000,
    )
    db_session.add(profile)
    db_session.commit()
    return profile


class TestFreelanceProjectChain:
    def test_schedule_midperiod_after_two_periods(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_midperiod",
            after_periods=2,
            context={"payment": "advance", "branch": "advance"},
        )
        db_session.commit()
        chain = get_active_chain(db_session, student_profile.id, FREELANCE_PROJECT_CHAIN_KEY)
        assert chain is not None
        assert chain.due_period_index == 3

    def test_midperiod_mandatory_and_branch_filter(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_midperiod",
            after_periods=1,
            context={"payment": "advance", "branch": "advance"},
        )
        db_session.commit()
        ensure_scheduled_chain_events(db_session, student_profile.id, 2)
        defn = (
            db_session.query(EventDefinition)
            .filter(EventDefinition.key == "mq11_freelance_project_midperiod")
            .first()
        )
        assert defn is not None
        assert defn.mandatory_gate == "blocks_period_end"
        titles = pending_mandatory_blocking_event_titles(db_session, student_profile.id, 2)
        assert any("Середина" in t for t in titles)

        ctx = json.loads(
            get_active_chain(db_session, student_profile.id, FREELANCE_PROJECT_CHAIN_KEY).context_json
        )
        grill = {
            "requires_chain_branch": "advance",
            "needs_delta": {"social": 8},
        }
        grind = {"requires_chain_branch": "deferred"}
        assert choice_allowed_for_chain_branch(grill, ctx)
        assert not choice_allowed_for_chain_branch(grind, ctx)

    def test_grill_path_surfaces_rush_deadline(self, db_session, student_profile):
        schedule_event_chain(
            db_session,
            student_profile,
            chain_key=FREELANCE_PROJECT_CHAIN_KEY,
            followup_definition_key="mq11_freelance_project_deadline_rush",
            after_periods=1,
            context={"payment": "advance", "prep": "grill", "branch": "advance_grill"},
        )
        db_session.commit()
        created = ensure_scheduled_chain_events(db_session, student_profile.id, 2)
        assert created == 1
        inst = (
            db_session.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == student_profile.id,
                EventInstance.period_index == 2,
                EventInstance.status == "pending",
            )
            .first()
        )
        defn = db_session.query(EventDefinition).filter(EventDefinition.id == inst.definition_id).first()
        assert defn.key == "mq11_freelance_project_deadline_rush"
        assert defn.mandatory_gate == "blocks_period_end"


def _specs() -> dict[str, dict]:
    from app.events.mvp11_catalog import load_mvp11_catalog

    specs, _ = load_mvp11_catalog(force_reload=True)
    return {s["key"]: s for s in specs if s["key"].startswith("mq11_freelance_project_")}


def _branch_choices(spec: dict, branch: str) -> list[dict]:
    return [c for c in spec["choices"] if c["effects"].get("requires_chain_branch") == branch]


def _needs_sum(effects: dict) -> float:
    return sum(float(v) for v in (effects.get("needs_delta") or {}).values())


class TestFreelanceChainEconomics:
    """Разбор 2026-10-21: аванс — риск, цена времени 0.5, эпилоги без ложного выбора."""

    def test_advance_is_risky_when_work_is_rushed(self):
        s = _specs()
        advance = 8000
        rush_adv = _branch_choices(s["mq11_freelance_project_epilogue_rush"], "advance")[0]["effects"]["cash_delta"]
        rush_def = _branch_choices(s["mq11_freelance_project_epilogue_rush"], "deferred")[0]["effects"]["cash_delta"]
        steady_adv = _branch_choices(s["mq11_freelance_project_epilogue_steady"], "advance")[0]["effects"]["cash_delta"]
        steady_def = _branch_choices(s["mq11_freelance_project_epilogue_steady"], "deferred")[0]["effects"]["cash_delta"]
        assert advance + rush_adv < rush_def  # спешка: аванс стоит удержания
        assert advance + steady_adv == steady_def  # качество: аванс ничего не стоит, просто раньше

    def test_epilogue_buttons_do_not_differ_within_branch(self):
        s = _specs()
        for key in ("mq11_freelance_project_epilogue_rush", "mq11_freelance_project_epilogue_steady"):
            for branch in ("advance", "deferred"):
                effects = [c["effects"] for c in _branch_choices(s[key], branch)]
                assert len(effects) == 2
                assert effects[0] == effects[1], f"{key}/{branch}"

    def test_epilogue_payout_cannot_expire_unopened(self):
        """Выплата только в эпилоге — без блокировки она сгорает при закрытии месяца (expire)."""
        s = _specs()
        for key in ("mq11_freelance_project_epilogue_rush", "mq11_freelance_project_epilogue_steady"):
            assert s[key]["mandatory_gate"] == "blocks_period_end", key

    def test_epilogue_recaps_the_earlier_choice(self):
        s = _specs()
        for key in ("mq11_freelance_project_epilogue_rush", "mq11_freelance_project_epilogue_steady"):
            for branch in ("advance", "deferred"):
                text = _branch_choices(s[key], branch)[0].get("description", "")
                assert "периодов назад" in text, f"{key}/{branch}"

    def test_rest_path_pays_back_in_needs_at_half_price_of_bonus(self):
        """Путь «шашлыки» ≈ 0.5 · needs_points(бонус / зарплата Студента) выше пути «работа» по needs."""
        from app.needs.value_curve import needs_points

        s = _specs()
        mid = s["mq11_freelance_project_midperiod"]
        grill = next(c for c in _branch_choices(mid, "advance") if "Шашлыки" in c["title"])["effects"]
        grind = next(c for c in _branch_choices(mid, "advance") if "проект" in c["title"])["effects"]
        rush_self = next(
            c for c in _branch_choices(s["mq11_freelance_project_deadline_rush"], "advance_grill") if "самому" in c["title"]
        )["effects"]
        steady_min = min(
            _needs_sum(c["effects"]) for c in _branch_choices(s["mq11_freelance_project_deadline_steady"], "advance_grind")
        )
        epi_rush = _branch_choices(s["mq11_freelance_project_epilogue_rush"], "advance")[0]["effects"]
        epi_steady = _branch_choices(s["mq11_freelance_project_epilogue_steady"], "advance")[0]["effects"]

        rest_path = _needs_sum(grill) + _needs_sum(rush_self) + _needs_sum(epi_rush)
        work_path = _needs_sum(grind) + steady_min + _needs_sum(epi_steady)
        target = 0.5 * needs_points(7700, 62_500)
        assert rest_path - work_path == pytest.approx(target, abs=3)
