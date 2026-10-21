"""Выборка событий: взвешенный сэмплинг, разнообразие доменов, контекст и счётчики профиля."""
import math
import random

from sqlalchemy.orm import Session

from ...events.taxonomy import effective_event_weight, event_domain
from ...game.rules import (
    EventProfileContext,
    EventProfileCounterSnapshot,
    event_prerequisites_met,
    parse_event_prerequisites_json,
)
from ...models import (
    EventDefinition,
    EventProfileCounter,
    FinanceAsset,
    FinanceLiability,
    InsurancePolicy,
)


def _weighted_sample_without_replacement(
    defs: list[EventDefinition],
    k: int,
    *,
    counter_map: dict[int, EventProfileCounterSnapshot] | None = None,
    weight_multiplier_by_id: dict[int, float] | None = None,
) -> list[EventDefinition]:
    """Взвешенная случайная выборка без повторов (ключ −ln(U)/weight)."""
    if k <= 0:
        return []
    if len(defs) <= k:
        return list(defs)
    scored = []
    for d in defs:
        if counter_map is not None:
            w = effective_event_weight(d, counter_map.get(int(d.id)))
        else:
            w = max(int(getattr(d, "weight", 100) or 100), 1)
        if weight_multiplier_by_id is not None:
            mult = float(weight_multiplier_by_id.get(int(d.id), 1.0) or 1.0)
            if mult > 1.0:
                w = max(1, int(round(float(w) * mult)))
        u = max(random.random(), 1e-12)
        scored.append((-math.log(u) / w, d))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [t[1] for t in scored[:k]]


def _pick_diverse_period_events(
    candidates: list[EventDefinition],
    k: int,
    counter_map: dict[int, EventProfileCounterSnapshot],
    *,
    weight_multiplier_by_id: dict[int, float] | None = None,
) -> list[EventDefinition]:
    """До k событий с разными event_domain, если кандидатов хватает."""
    picked: list[EventDefinition] = []
    remaining = list(candidates)
    for _ in range(k):
        if not remaining:
            break
        if picked:
            used_domains = {event_domain(d) for d in picked}
            pool = [d for d in remaining if event_domain(d) not in used_domains]
            if not pool:
                pool = remaining
        else:
            pool = remaining
        batch = _weighted_sample_without_replacement(
            pool,
            1,
            counter_map=counter_map,
            weight_multiplier_by_id=weight_multiplier_by_id,
        )
        if not batch:
            break
        choice = batch[0]
        picked.append(choice)
        remaining = [d for d in remaining if d.id != choice.id]
    return picked


def _def_tier(d: EventDefinition) -> int:
    return max(1, int(getattr(d, "event_tier", 1) or 1))


def _load_event_profile_context(db: Session, game_profile_id: int) -> EventProfileContext:
    from ...finance.liability_kinds import effective_liability_kind

    kind_counts: dict[str, int] = {}
    for row in (
        db.query(FinanceAsset.kind)
        .filter(
            FinanceAsset.game_profile_id == game_profile_id,
            FinanceAsset.is_active == 1,
        )
        .all()
    ):
        if row.kind:
            kind = str(row.kind).strip()
            kind_counts[kind] = kind_counts.get(kind, 0) + 1
    asset_kinds = set(kind_counts)
    liability_rows = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == game_profile_id,
            FinanceLiability.is_active == 1,
        )
        .all()
    )
    liability_kinds = {effective_liability_kind(row) for row in liability_rows}
    ins_keys: set[str] = set()
    for row in (
        db.query(InsurancePolicy.product, InsurancePolicy.insured_object)
        .filter(
            InsurancePolicy.game_profile_id == game_profile_id,
            InsurancePolicy.is_active == 1,
            InsurancePolicy.claimed_period_index.is_(None),
        )
        .all()
    ):
        product = str(row.product or "").strip()
        insured = str(row.insured_object or "").strip()
        if product and insured:
            ins_keys.add(f"{product}:{insured}")
    return EventProfileContext(
        active_asset_kinds=frozenset(asset_kinds),
        active_liability_count=len(liability_rows),
        active_liability_kinds=frozenset(liability_kinds),
        active_insurance_claim_keys=frozenset(ins_keys),
        active_asset_kind_counts=tuple(sorted(kind_counts.items())),
    )


def _definition_prerequisites_met(d: EventDefinition, ctx: EventProfileContext) -> bool:
    prereq = parse_event_prerequisites_json(getattr(d, "prerequisites_json", None))
    return event_prerequisites_met(prereq, ctx)


def _load_event_counter_map(db: Session, game_profile_id: int) -> dict[int, EventProfileCounterSnapshot]:
    rows = (
        db.query(EventProfileCounter)
        .filter(EventProfileCounter.game_profile_id == game_profile_id)
        .all()
    )
    return {
        int(r.definition_id): EventProfileCounterSnapshot(
            times_selected=int(r.times_selected or 0),
            last_selected_period_index=(
                int(r.last_selected_period_index) if r.last_selected_period_index is not None else None
            ),
        )
        for r in rows
    }


def record_event_profile_selection(
    db: Session, game_profile_id: int, definition_id: int, period_index: int
) -> None:
    row = (
        db.query(EventProfileCounter)
        .filter(
            EventProfileCounter.game_profile_id == game_profile_id,
            EventProfileCounter.definition_id == definition_id,
        )
        .first()
    )
    if row:
        row.times_selected = int(row.times_selected or 0) + 1
        row.last_selected_period_index = int(period_index)
    else:
        db.add(
            EventProfileCounter(
                game_profile_id=game_profile_id,
                definition_id=definition_id,
                times_selected=1,
                last_selected_period_index=int(period_index),
            )
        )
