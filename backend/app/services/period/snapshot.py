from sqlalchemy.orm import Session

from ...models import GameProfile, PeriodSnapshot


def get_current_period_snapshot(
    db: Session,
    profile: GameProfile,
    create_if_missing: bool = True,
) -> PeriodSnapshot:
    """Получает или создаёт снимок текущего периода."""
    snapshot = (
        db.query(PeriodSnapshot)
        .filter(
            PeriodSnapshot.game_profile_id == profile.id,
            PeriodSnapshot.period_index == profile.period_index,
        )
        .first()
    )

    if not snapshot and create_if_missing:
        snapshot = PeriodSnapshot(
            game_profile_id=profile.id,
            period_index=profile.period_index,
            safety_fund_total=profile.safety_fund_balance,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)

    return snapshot

