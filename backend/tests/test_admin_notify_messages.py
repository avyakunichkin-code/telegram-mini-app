"""RU-тексты ops-алертов."""

import urllib.request

from app.admin.notify import _send_telegram_message, notify_period_milestone
from app.admin.notify_messages import format_alert_message_ru, kind_label_ru
from app.models import GameProfile


def test_kind_label_ru():
    assert kind_label_ru("period_milestone") == "Веха по месяцам"
    assert kind_label_ru("unknown_kind") == "Unknown kind"


def test_period_milestone_five_mentions_pre_alpha():
    text = format_alert_message_ru(
        "period_milestone",
        {"name": "Тест", "closed_period": 5, "next_period": 6},
    )
    assert "Pre-Alpha" in text
    assert "5" in text
    assert "key=" not in text


def test_game_lost_early_hint():
    text = format_alert_message_ru(
        "game_lost",
        {"name": "Игра", "period_index": 4, "cash_balance": -500},
    )
    assert "поражение" in text.lower()
    assert "Раннее" in text
    assert "500" in text


def test_salary_first_claim():
    text = format_alert_message_ru(
        "salary_claimed",
        {"name": "Студент", "period_index": 1, "amount": 50000, "first_claim": True},
    )
    assert "Первая зарплата" in text
    assert "50 000" in text


def test_user_registered_no_technical_keys():
    text = format_alert_message_ru(
        "user_registered",
        {"username": "alex", "telegram_id": 123},
    )
    assert "alex" in text
    assert "username=" not in text


def test_send_telegram_message_thread_id(monkeypatch):
    captured: dict[str, str] = {}

    def fake_urlopen(req, timeout=8):
        captured["body"] = req.data.decode("utf-8")

        class Resp:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        return Resp()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    from app import config as config_module

    config_module.config.OPS_TELEGRAM_BOT_TOKEN = "test-token"
    config_module.config.OPS_TELEGRAM_CHAT_ID = "-100123"
    config_module.config.OPS_TELEGRAM_MESSAGE_THREAD_ID = "42"

    assert _send_telegram_message("ping")
    assert "message_thread_id=42" in captured["body"]
    assert "chat_id=-100123" in captured["body"]


def test_send_telegram_without_thread_id_omits_param(monkeypatch):
    captured: dict[str, str] = {}

    def fake_urlopen(req, timeout=8):
        captured["body"] = req.data.decode("utf-8")

        class Resp:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        return Resp()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    from app import config as config_module

    config_module.config.OPS_TELEGRAM_BOT_TOKEN = "test-token"
    config_module.config.OPS_TELEGRAM_CHAT_ID = "1"
    config_module.config.OPS_TELEGRAM_MESSAGE_THREAD_ID = ""

    assert _send_telegram_message("ping")
    assert "message_thread_id" not in captured["body"]


def test_period_milestone_three_skips_telegram(db_session, monkeypatch):
    tg_calls: list[str] = []
    monkeypatch.setattr(
        "app.admin.notify._send_telegram_message",
        lambda text: tg_calls.append(text) or True,
    )
    monkeypatch.setenv("OPS_TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setenv("OPS_TELEGRAM_CHAT_ID", "1")
    from app import config as config_module

    config_module.config.OPS_TELEGRAM_BOT_TOKEN = "test-token"
    config_module.config.OPS_TELEGRAM_CHAT_ID = "1"

    profile = GameProfile(
        user_id=1,
        name="M3",
        save_kind="game",
        period_index=6,
    )
    db_session.add(profile)
    db_session.flush()

    notify_period_milestone(db_session, profile, closed_period_index=3)
    assert tg_calls == []

    notify_period_milestone(db_session, profile, closed_period_index=5)
    assert len(tg_calls) == 1
    assert "Pre-Alpha" in tg_calls[0]
