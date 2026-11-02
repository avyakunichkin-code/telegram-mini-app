"""action_once — «было хоть раз за партию»: закрытый вклад или истёкший полис не откатывают цепочку.

Регресс 2026-11-01: balance_playtest, профессионал на P15 потерял два шага (5 → 3), когда истёк полис.
"""
from app.models import GameProfile, InsurancePolicy, InvestmentPosition
from app.victory.snap import build_victory_evaluation_input
from tests.test_victory_engine import _eval_harder, _harder_complete_snap


def test_engine_counts_ever_flags_without_active_objects():
    r = _eval_harder(
        "mq_game_tight_budget_v1",
        _harder_complete_snap(
            has_active_deposit=False,
            has_active_insurance=False,
            deposit_ever_opened=True,
            insurance_ever_purchased=True,
        ),
    )
    by_key = {g.key: g for g in r.goals}
    assert by_key["tutorial_invest"].met is True
    assert by_key["tutorial_insurance"].met is True
    assert r.win_reached is True


def test_engine_still_unmet_when_never_done():
    r = _eval_harder("mq_game_tight_budget_v1", _harder_complete_snap(has_active_deposit=False, has_active_bond=False))
    assert {g.key: g for g in r.goals}["tutorial_invest"].met is False


def test_snap_reads_closed_rows_as_ever(db_session):
    profile = GameProfile(user_id=1, name="p", save_kind="game", is_active=1, period_index=16)
    db_session.add(profile)
    db_session.flush()
    db_session.add_all([
        InvestmentPosition(game_profile_id=profile.id, kind="deposit", title="Вклад", principal=1000,
                           started_period=3, last_accrued_period=9, is_active=0),
        InsurancePolicy(game_profile_id=profile.id, kind="health", title="Полис", is_active=0),
    ])
    db_session.commit()
    snap = build_victory_evaluation_input(db_session, profile)
    assert snap.has_active_deposit is False and snap.deposit_ever_opened is True
    assert snap.has_active_insurance is False and snap.insurance_ever_purchased is True
    assert snap.bond_ever_bought is False
