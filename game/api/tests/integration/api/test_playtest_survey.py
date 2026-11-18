import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.models import GameProfile, PeriodEconomyClosing, PlayerPlaytestSurvey, User
from main import app

ANSWERS = dict(salary="yes", safety="partly", close="yes", blocked=False, continue_playing="yes")
ANSWERS_V2 = dict(**ANSWERS, safety_transfer="yes", expense_buffer="partly", close_result="yes", difficulty="normal")


@pytest.fixture()
def profile(db_session, test_user):
    p = GameProfile(user_id=test_user.id, name="Survey test", save_kind="game", starter_template_key="mq_game_basic_v1", is_active=1)
    db_session.add(p)
    db_session.commit()
    return p


def test_five_actual_closings_and_dismiss_across_saves(client, db_session, profile, test_user):
    profile.period_index = 99
    db_session.commit()
    url = f"/api/game/playtest-survey?profile_id={profile.id}"
    assert client.get(url).json()["should_offer"] is False
    for i in range(1, 6):
        db_session.add(PeriodEconomyClosing(game_profile_id=profile.id, period_index=i))
        db_session.commit()
        assert client.get(url).json()["should_offer"] is (i == 5)
    identity = {"profile_id": profile.id}
    for _ in range(2):
        assert client.post("/api/game/playtest-survey/dismiss", json=identity).json()["state"] == "dismissed"
    other = GameProfile(user_id=test_user.id, name="Other", save_kind="game", starter_template_key="mq_game_basic_v1")
    db_session.add(other)
    db_session.commit()
    assert client.get(f"/api/game/playtest-survey?profile_id={other.id}").json()["state"] == "dismissed"
    assert db_session.query(PlayerPlaytestSurvey).count() == 1


def test_submit_retry_and_admin_contract(client, db_session, profile, admin_env):
    payload = dict(profile_id=profile.id, answers=ANSWERS, comment="  <b>Свой отзыв</b>  ")
    first = client.post("/api/game/playtest-survey", json=payload)
    assert first.status_code == 200
    state = first.json()
    assert state["state"] == "submitted" and state["closed_turns"] == 0
    assert state["can_submit"] is False and state["should_offer"] is False
    assert client.post("/api/game/playtest-survey", json=payload).json()["response_id"] == state["response_id"]
    assert client.post("/api/game/playtest-survey", json={**payload, "comment": "Changed"}).status_code == 409
    assert client.post("/api/game/playtest-survey/dismiss", json={"profile_id": profile.id}).json()["state"] == "submitted"
    rows = client.get("/api/admin/playtest-surveys").json()["responses"]
    assert len(rows) == 1
    row = rows[0]
    assert row["answers"] == ANSWERS and row["comment"] == "<b>Свой отзыв</b>"
    assert row["template_key"] == "mq_game_basic_v1" and row["closed_turns"] == 0
    assert not {"username", "email", "telegram_id", "user_id"} & row.keys()
    assert db_session.query(PlayerPlaytestSurvey).count() == 1


def test_dismiss_then_submit(client, db_session, profile):
    client.post("/api/game/playtest-survey/dismiss", json={"profile_id": profile.id})
    r = client.post("/api/game/playtest-survey", json=dict(profile_id=profile.id, answers=ANSWERS))
    assert r.status_code == 200 and r.json()["state"] == "submitted"
    assert db_session.query(PlayerPlaytestSurvey).count() == 1


@pytest.mark.parametrize("change", [
    {"answers": {**ANSWERS, "blocked": "false"}},
    {"answers": {**ANSWERS, "salary": "maybe"}},
    {"answers": {"salary": "yes"}}, {"survey_key": "other_version"},
    {"comment": "x" * 1001}, {"user_id": 777}, {"closed_turns": 100},
])
def test_validation(client, profile, change):
    assert client.post("/api/game/playtest-survey", json={"profile_id": profile.id, "answers": ANSWERS, **change}).status_code == 422


def test_ownership_auth_and_admin_gate(client, db_session, profile):
    other = User(username="other-survey-user", hashed_password="not-a-login")
    db_session.add(other)
    db_session.flush()
    foreign = GameProfile(user_id=other.id, name="Private", save_kind="game", starter_template_key="mq_game_basic_v1")
    db_session.add(foreign)
    db_session.commit()
    for pid in [foreign.id, 999999]:
        assert client.get(f"/api/game/playtest-survey?profile_id={pid}").status_code == 404
        assert client.post("/api/game/playtest-survey", json=dict(profile_id=pid, answers=ANSWERS)).status_code == 404
        assert client.post("/api/game/playtest-survey/dismiss", json=dict(profile_id=pid)).status_code == 404
    assert client.get("/api/admin/playtest-surveys").status_code == 403
    override = app.dependency_overrides.pop(get_current_user)
    try:
        assert TestClient(app).get(f"/api/game/playtest-survey?profile_id={profile.id}").status_code == 401
    finally:
        app.dependency_overrides[get_current_user] = override


def test_legacy_and_unstarted_profiles(client, db_session, profile):
    profile.save_kind = "plan"
    db_session.commit()
    assert client.get(f"/api/game/playtest-survey?profile_id={profile.id}").status_code == 410
    profile.save_kind = "game"
    profile.starter_template_key = None
    db_session.commit()
    assert client.get(f"/api/game/playtest-survey?profile_id={profile.id}").status_code == 404


def test_versions_preserve_old_answers_and_negotiate_bootstrap(client, db_session, profile, admin_env):
    v1 = dict(profile_id=profile.id, answers=ANSWERS, comment="V1 original")
    old = client.post("/api/game/playtest-survey", json=v1).json()
    assert old["survey_key"] == "first_turns_v1"
    state_url = f"/api/game/playtest-survey?profile_id={profile.id}&survey_key=first_turns_v2"
    assert client.get(state_url).json()["state"] == "pending"
    assert client.get("/api/game/bootstrap").json()["playtest_survey"]["state"] == "submitted"
    bootstrap = client.get("/api/game/bootstrap?survey_key=first_turns_v2")
    assert bootstrap.status_code == 200
    assert bootstrap.json()["playtest_survey"]["survey_key"] == "first_turns_v2"
    assert bootstrap.json()["playtest_survey"]["state"] == "pending"
    v2 = dict(profile_id=profile.id, survey_key="first_turns_v2", answers=ANSWERS_V2, comment="New opinion")
    new = client.post("/api/game/playtest-survey", json=v2)
    assert new.status_code == 200
    assert new.json()["response_id"] != old["response_id"]
    assert client.post("/api/game/playtest-survey", json=v2).json()["response_id"] == new.json()["response_id"]
    assert client.post("/api/game/playtest-survey", json=v1).json()["response_id"] == old["response_id"]
    assert db_session.query(PlayerPlaytestSurvey).count() == 2
    rows = {r["survey_key"]: r for r in client.get("/api/admin/playtest-surveys").json()["responses"]}
    assert rows["first_turns_v1"]["answers"] == ANSWERS
    assert rows["first_turns_v1"]["comment"] == "V1 original"
    assert rows["first_turns_v2"]["answers"]["difficulty"] == "normal"
    assert len(rows["first_turns_v2"]["answers"]) == 9


def test_dismiss_is_scoped_to_requested_version(client, profile):
    identity = dict(profile_id=profile.id, survey_key="first_turns_v2")
    assert client.post("/api/game/playtest-survey/dismiss", json=identity).json()["state"] == "dismissed"
    legacy = client.get(f"/api/game/playtest-survey?profile_id={profile.id}").json()
    assert legacy["survey_key"] == "first_turns_v1" and legacy["state"] == "pending"


@pytest.mark.parametrize("key,answers", [
    ("first_turns_v2", ANSWERS),
    ("first_turns_v1", ANSWERS_V2),
    ("first_turns_v2", {**ANSWERS_V2, "difficulty": "partly"}),
    ("first_turns_v2", {**ANSWERS_V2, "safety_transfer": None}),
    ("first_turns_v2", {**ANSWERS_V2, "extra_question": "yes"}),
])
def test_version_schema_validation(client, profile, key, answers):
    result = client.post("/api/game/playtest-survey", json=dict(profile_id=profile.id, survey_key=key, answers=answers))
    assert result.status_code == 422
