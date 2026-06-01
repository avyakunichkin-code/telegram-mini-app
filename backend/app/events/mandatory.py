"""Обязательные события, блокирующие закрытие периода (без зависимости от routers)."""
from sqlalchemy.orm import Session

from ..game.rules import MANDATORY_GATE_BLOCKS_PERIOD_END
from ..models import EventDefinition, EventInstance


def pending_mandatory_blocking_event_titles(
    db: Session, game_profile_id: int, period_index: int
) -> list[str]:
    """События с mandatory_gate=blocks_period_end, которые нужно закрыть выбором до конца периода."""
    rows = (
        db.query(EventInstance, EventDefinition)
        .join(EventDefinition, EventDefinition.id == EventInstance.definition_id)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == period_index,
            EventInstance.status == "pending",
            EventDefinition.mandatory_gate == MANDATORY_GATE_BLOCKS_PERIOD_END,
        )
        .order_by(EventInstance.id.asc())
        .all()
    )
    return [str(defn.title) for _inst, defn in rows]
