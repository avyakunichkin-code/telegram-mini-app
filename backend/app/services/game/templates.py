from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ...models import GameStarterTemplate
from ...schemas import GameStarterTemplatePublic


def validate_save_kind(save_kind: str) -> str:
    normalized = (save_kind or "").strip().lower()
    if normalized not in ("game", "plan"):
        raise HTTPException(status_code=400, detail="save_kind must be 'game' or 'plan'")
    return normalized


def starter_template_public(
    row: GameStarterTemplate,
    *,
    previous_granted=None,
) -> GameStarterTemplatePublic:
    from ...starters.template_presentation import (
        compare_note_from_blueprint,
        parse_blueprint_json,
        scenario_icon_from_blueprint,
        scenario_picker_highlights,
    )

    bp = parse_blueprint_json(row.blueprint_json)
    desc: Optional[str] = None
    raw = bp.get("description")
    if isinstance(raw, str) and raw.strip():
        desc = raw.strip()
    tk = row.template_key
    return GameStarterTemplatePublic(
        template_key=tk,
        title=row.title,
        difficulty_rank=int(row.difficulty_rank or 1),
        description=desc,
        highlights=scenario_picker_highlights(
            bp,
            tk,
            base_monthly_lifestyle_expense=float(row.base_monthly_lifestyle_expense or 0),
            previous_granted=previous_granted,
        ),
        scenario_icon=scenario_icon_from_blueprint(bp, tk),
        compare_note=compare_note_from_blueprint(bp, tk),
    )


def starter_templates_public(rows: list[GameStarterTemplate]) -> list[GameStarterTemplatePublic]:
    from ...starters.template_presentation import (
        granted_capital_mechanics_from_blueprint,
        parse_blueprint_json,
    )

    prev = frozenset()
    out: list[GameStarterTemplatePublic] = []
    for row in rows:
        bp = parse_blueprint_json(row.blueprint_json)
        item = starter_template_public(row, previous_granted=prev)
        out.append(item)
        prev = granted_capital_mechanics_from_blueprint(bp, row.template_key)
    return out


def list_game_templates(db: Session, for_save_kind: Optional[str] = None) -> list[GameStarterTemplatePublic]:
    q = db.query(GameStarterTemplate).filter(GameStarterTemplate.is_active == 1)
    if for_save_kind:
        sk = for_save_kind.strip().lower()
        if sk not in ("game", "plan"):
            raise HTTPException(status_code=400, detail="for_save_kind must be 'game' or 'plan'")
        q = q.filter(
            or_(
                GameStarterTemplate.applies_to_save_kind == sk,
                GameStarterTemplate.applies_to_save_kind == "any",
            )
        )
    else:
        q = q.filter(
            or_(
                GameStarterTemplate.applies_to_save_kind == "game",
                GameStarterTemplate.applies_to_save_kind == "any",
            )
        )
    rows = q.order_by(GameStarterTemplate.sort_order.asc(), GameStarterTemplate.id.asc()).all()
    return starter_templates_public(rows)
