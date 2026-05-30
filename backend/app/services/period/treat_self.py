import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...finance.balance_utils import adjust_balance
from ...models import FinanceSalary, GameProfile, GameStarterTemplate
from ...needs.engine import (
    needs_values_from_profile,
    normalize_treat_self_options,
    parse_needs_config,
    set_profile_needs,
    treat_self_availability,
)


def treat_self(db: Session, profile: GameProfile, option_id: str) -> dict:
    """«Порадовать себя»: списание с cash + needs_delta, с кулдауном по периодам (ADR-006)."""
    option_id = (option_id or "").strip()
    if not option_id:
        raise HTTPException(status_code=400, detail="option_id is required")

    if str(getattr(profile, "save_kind", "game") or "game") != "game":
        raise HTTPException(status_code=400, detail="Недоступно в Plan")

    tk = str(getattr(profile, "starter_template_key", "") or "")
    tmpl = (
        db.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == tk).first()
        if tk
        else None
    )
    blueprint = {}
    if tmpl is not None:
        try:
            blueprint = json.loads(tmpl.blueprint_json or "{}")
        except Exception:
            blueprint = {}

    cfg = parse_needs_config(blueprint)
    if not cfg:
        raise HTTPException(status_code=400, detail="Потребности отключены для этого персонажа")

    period_index = int(profile.period_index or 0)
    last_pi = int(getattr(profile, "treat_self_last_period_index", 0) or 0)
    av = treat_self_availability(cfg, period_index=period_index, last_period_index=last_pi)
    if not bool(av.get("available")):
        rem = int(av.get("cooldown_periods_remaining") or 0)
        raise HTTPException(status_code=400, detail=f"Можно снова через {rem} периодов")

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_salary = float(salary.monthly_amount) if salary else 0.0
    options = normalize_treat_self_options(cfg, monthly_salary=monthly_salary)
    opt = next((o for o in options if str(o.get("id") or "") == option_id), None)
    if opt is None:
        raise HTTPException(status_code=400, detail="Неизвестная опция")

    cost = float(opt.get("cost") or 0)
    if cost <= 0:
        raise HTTPException(status_code=400, detail="Некорректная стоимость")
    if float(profile.cash_balance or 0) < cost:
        raise HTTPException(status_code=400, detail="Не хватает средств на карте")

    adjust_balance(
        db=db,
        game_profile_id=profile.id,
        amount=-cost,
        type="treat_self",
        description=f"Порадовать себя: {opt.get('title')}",
        period_index=period_index,
    )
    db.refresh(profile)

    before = needs_values_from_profile(profile)
    delta = opt.get("needs_delta") if isinstance(opt.get("needs_delta"), dict) else {}
    after = {k: float(before.get(k) or 0) + float(delta.get(k) or 0) for k in before.keys()}
    set_profile_needs(profile, after)
    profile.treat_self_last_period_index = period_index
    db.commit()
    db.refresh(profile)

    return {
        "status": "success",
        "option_id": option_id,
        "cost": round(cost, 2),
        "needs_after": needs_values_from_profile(profile),
        "message": "Потребности улучшились",
    }

