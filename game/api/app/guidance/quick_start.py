"""Version 2: contextual next-action hints, no compulsory reading or cushion gate."""
from ..models import EventInstance
from ..services.period.snapshot import get_current_period_snapshot


def quick_start_guidance(db, profile):
    payload = {"onboarding_version": 2, "show_curriculum": False}
    if int(profile.period_index or 1) != 1:
        return payload
    snapshot = get_current_period_snapshot(db, profile)
    paid = bool(snapshot and snapshot.salary_claimed) or profile.last_period_salary_claimed == 1
    selected = db.query(EventInstance).filter(
        EventInstance.game_profile_id == profile.id,
        EventInstance.period_index == 1, EventInstance.status == "selected",
    ).first()
    if not paid:
        step, title, body = "salary", "Первое действие — твоя зарплата", "Нажми «Получить зарплату». Деньги поступят на счёт; расходы спишутся при завершении хода."
    elif not selected:
        step, title, body = "event", "Теперь — твоё решение", "Открой «События» и выбери, как поступить. Посмотри, как выбор повлияет на деньги и потребности."
    else:
        step, title, body = "close", "Подведём первый итог", "Нажми «Завершить ход», когда будешь готов. Подушка и другие действия доступны, но сейчас не обязательны."
    return {**payload, "nudge_id": "quick_" + step, "nudge_title": title, "nudge_body": body}
