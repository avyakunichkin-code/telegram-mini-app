"""
Человекочитаемые тексты ops-алертов (RU) для Telegram и Watchtower.

Технические поля остаются в payload_json; здесь только отображение.
"""

from __future__ import annotations

from typing import Any, Optional

_KIND_LABEL_RU: dict[str, str] = {
    "user_registered": "Регистрация",
    "profile_created": "Новое сохранение",
    "game_started": "Старт игры",
    "game_won": "Победа",
    "game_lost": "Поражение",
    "period_milestone": "Веха по месяцам",
    "period_closed": "Месяц закрыт",
    "salary_claimed": "Зарплата",
    "onboarding_step_reached": "Онбординг: шаг",
    "onboarding_brief_done": "Онбординг завершён",
    "onboarding_skipped": "Пропуск онбординга",
}


def kind_label_ru(kind: str) -> str:
    return _KIND_LABEL_RU.get(kind, kind.replace("_", " ").capitalize())


def _rub(amount: Any) -> str:
    try:
        n = float(amount)
    except (TypeError, ValueError):
        return "—"
    s = f"{n:,.0f}".replace(",", " ")
    return f"{s} ₽"


def _name(payload: dict[str, Any]) -> str:
    return str(payload.get("name") or payload.get("username") or "без имени")


def _link_line(payload: dict[str, Any]) -> Optional[str]:
    link = payload.get("_admin_link")
    if link:
        return f"Открыть в админке:\n{link}"
    return None


def _lines(*parts: Optional[str]) -> str:
    return "\n".join(p for p in parts if p)


def format_alert_message_ru(kind: str, payload: dict[str, Any]) -> str:
    """Текст для Telegram и колонки «Событие» в Watchtower."""
    p = payload
    name = _name(p)
    link = _link_line(p)

    if kind == "user_registered":
        return _lines(
            "🟢 Новый пользователь",
            f"Логин: {p.get('username', '—')}",
            f"Telegram ID: {p.get('telegram_id') or '—'}",
            link,
        )

    if kind == "profile_created":
        save = p.get("save_kind")
        save_ru = "игра" if save == "game" else ("план" if save == "plan" else str(save or "—"))
        return _lines(
            "📁 Создано сохранение",
            f"Название: «{name}»",
            f"Режим: {save_ru}",
            link,
        )

    if kind == "game_started":
        template = p.get("template") or "ручной сценарий"
        mins = p.get("period_duration_seconds")
        dur = ""
        if mins:
            try:
                sec = int(mins)
                dur = f" · месяц ≈ {max(1, sec // 60)} мин"
            except (TypeError, ValueError):
                pass
        return _lines(
            "🎮 Начата новая партия",
            f"«{name}»",
            f"Шаблон: {template}{dur}",
            link,
        )

    if kind == "period_milestone":
        closed = int(p.get("closed_period") or 0)
        nxt = int(p.get("next_period") or closed + 1)
        hints = {
            3: "Игрок прошёл первые 3 месяца — core loop держится.",
            5: "🎯 Цель Pre-Alpha: ≥5 месяцев (опрос Q9 / метрика PA-A1). Можно напомнить про опрос.",
            8: "⭐ Stretch волны: ≥8 месяцев (PA-T1s / PA-A1s).",
        }
        return _lines(
            f"📅 Веха: закрыто {closed} мес.",
            f"Партия: «{name}»",
            hints.get(closed, f"Сейчас открыт {nxt}-й месяц."),
            link,
        )

    if kind == "period_closed":
        closed = int(p.get("closed_period") or 0)
        nxt = int(p.get("next_period") or closed + 1)
        return _lines(
            f"📆 Закрыт {closed}-й месяц",
            f"Партия: «{name}» · открыт {nxt}-й",
            link,
        )

    if kind == "salary_claimed":
        period = p.get("period_index")
        amount = _rub(p.get("amount"))
        first = p.get("first_claim")
        head = "💰 Первая зарплата в партии" if first else "💰 Зарплата получена"
        return _lines(
            head,
            f"Партия: «{name}»",
            f"Месяц {period} · {amount}",
            link,
        )

    if kind == "game_lost":
        period = p.get("period_index")
        cash = _rub(p.get("cash_balance"))
        early = ""
        try:
            if int(period) <= 5:
                early = "Раннее поражение (до 6-го месяца) — если таких много, стоит проверить баланс."
        except (TypeError, ValueError):
            pass
        return _lines(
            "💀 Партия завершена — поражение",
            f"«{name}» после {period}-го месяца",
            f"Остаток на счёте: {cash}",
            early or None,
            link,
        )

    if kind == "game_won":
        return _lines(
            "🏁 Победа в партии!",
            f"«{name}»",
            f"Шаблон: {p.get('template') or '—'} · месяц №{p.get('period_index', '—')}",
            link,
        )

    if kind == "onboarding_brief_done":
        return _lines(
            "✅ Онбординг (coach) пройден",
            f"Партия: «{name}»",
            f"Шаблон: {p.get('template') or '—'}",
            link,
        )

    if kind == "onboarding_step_reached":
        return _lines(
            "👣 Онбординг: новый шаг",
            f"Партия: «{name}» · шаг {p.get('step', '—')}",
            f"Месяц №{p.get('period_index', '—')}",
            link,
        )

    if kind == "onboarding_skipped":
        skips = p.get("skip_count")
        return _lines(
            "⏭️ Пропуск подсказок онбординга",
            f"Партия: «{name}» · пропусков: {skips}",
            f"Шаг: {p.get('step', '—')}",
            link,
        )

    # Fallback: без технических key=value
    emoji = "ℹ️"
    return _lines(
        f"{emoji} {kind_label_ru(kind)}",
        f"Партия/игрок: {name}",
        link,
    )
