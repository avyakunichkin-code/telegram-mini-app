"""Unlock capital mechanics in API tests."""

from __future__ import annotations

import json

import pytest

from app.models import GameProfile, GameStarterTemplate
from app.victory.seeds import victory_config_json_for_template


@pytest.fixture()
def capital_unlocked_profile(db_session, test_user):
    template_key = "mq_game_dl1_test"
    if not db_session.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == template_key).first():
        db_session.add(
            GameStarterTemplate(
                template_key=template_key,
                title="DL1 test",
                difficulty_rank=1,
                base_monthly_lifestyle_expense=30_000.0,
                blueprint_json=json.dumps(
                    {
                        "mechanics": {
                            "capital_invest": True,
                            "capital_insurance": True,
                            "capital_property": True,
                            "capital_liabilities": True,
                        }
                    },
                    ensure_ascii=False,
                ),
                victory_config_json=victory_config_json_for_template("mq_game_basic_v1"),
                is_active=1,
                sort_order=99,
            )
        )
        db_session.commit()

    profile = GameProfile(
        user_id=test_user.id,
        name="dl1_test",
        save_kind="game",
        starter_template_key=template_key,
        is_active=1,
        cash_balance=5_000_000.0,
        period_index=2,
        base_params_locked=0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    return profile
