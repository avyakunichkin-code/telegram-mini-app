from sqlalchemy.orm import Session

from ...models import GameProfile, Transaction


def list_transactions(db: Session, profile: GameProfile, *, limit: int = 50, offset: int = 0) -> list[dict]:
    rows = (
        db.query(Transaction)
        .filter(Transaction.game_profile_id == profile.id)
        .order_by(Transaction.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "description": t.description,
            "period_index": t.period_index,
            "timestamp": t.timestamp.isoformat(),
        }
        for t in rows
    ]

