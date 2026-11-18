"""Присутствие игрока: last_seen_at для D7-прокси и поиска застрявших (PR-17, PLT-107)."""

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..models import User
from ..timeutil import utc_now_naive

# Bootstrap зовётся после каждой мутации в партии — пишем не чаще раза в 10 минут.
LAST_SEEN_TOUCH_INTERVAL = timedelta(minutes=10)


def touch_last_seen(db: Session, user: User, *, now: datetime | None = None) -> bool:
    """Обновляет users.last_seen_at, если прошлая отметка старше интервала. True — записали."""
    now = now or utc_now_naive()
    last = user.last_seen_at
    if last is not None and now - last < LAST_SEEN_TOUCH_INTERVAL:
        return False
    user.last_seen_at = now
    db.commit()
    return True
