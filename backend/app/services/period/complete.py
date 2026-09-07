from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...models import GameProfile

COMPLETE_PERIOD_GONE_DETAIL = (
    "This endpoint is gone. Close the month with POST /api/game/time/next."
)


def complete_period(db: Session, profile: GameProfile) -> None:
    """
    Legacy POST /api/game/period/complete-period.

    Always 410: this path skipped process_period_end (burn, obligations, events).
    Canon close is POST /api/game/time/next.
    """
    del db, profile
    raise HTTPException(status_code=410, detail=COMPLETE_PERIOD_GONE_DETAIL)
