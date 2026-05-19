"""API-gates по character_level."""

import pytest
from fastapi import HTTPException

from app.level_gates import (
    UNLOCK_BOND_BUY,
    UNLOCK_DEPOSIT_OPEN,
    UNLOCK_INSURANCE_BUY,
    UNLOCK_PERIOD_EVENTS,
    character_unlocks_payload,
    is_feature_unlocked,
    require_character_level,
)
from app.models import GameProfile


def _profile(level: int) -> GameProfile:
    return GameProfile(user_id=1, name="t", save_kind="game", is_active=1, level=level)


class TestLevelGates:
    def test_unlock_thresholds(self):
        assert is_feature_unlocked(_profile(1), UNLOCK_PERIOD_EVENTS) is False
        assert is_feature_unlocked(_profile(2), UNLOCK_PERIOD_EVENTS) is True
        p2 = _profile(2)
        assert is_feature_unlocked(p2, UNLOCK_DEPOSIT_OPEN) is False
        assert is_feature_unlocked(_profile(3), UNLOCK_DEPOSIT_OPEN) is True
        assert is_feature_unlocked(_profile(4), UNLOCK_BOND_BUY) is True
        assert is_feature_unlocked(_profile(5), UNLOCK_INSURANCE_BUY) is True

    def test_require_raises_403_with_payload(self):
        with pytest.raises(HTTPException) as exc:
            require_character_level(_profile(1), UNLOCK_DEPOSIT_OPEN, "invest.deposit_open")
        assert exc.value.status_code == 403
        detail = exc.value.detail
        assert detail["code"] == "level_gate"
        assert detail["required_level"] == 3

    def test_unlocks_payload_for_ui(self):
        items = character_unlocks_payload(_profile(4))
        by_feature = {i["feature"]: i for i in items}
        assert by_feature["invest.deposit_open"]["unlocked"] is True
        assert by_feature["invest.bond_buy"]["unlocked"] is True
        assert by_feature["insurance.buy"]["unlocked"] is False
