"""Сборка payload экрана финала партии (GE1, V1 «Газета»)."""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from ..finance.expenses import compute_monthly_burn
from ..models import (
    FinanceAsset,
    FinanceLiability,
    FinanceSalary,
    GameProfile,
    GameStarterTemplate,
    InsurancePolicy,
    InvestmentPosition,
    PeriodEconomyClosing,
)
from ..schemas import (
    RunFinaleFact,
    RunFinaleMetric,
    RunFinalePayload,
    RunFinaleSection,
)
from ..starters.template_presentation import _fmt_rub
from ..victory.engine import evaluate_victory, parse_victory_config
from ..victory.goals_store import override_config_goals_from_db
from ..victory.mechanics_progression import resolve_template_and_unlock
from ..victory.seeds import DEFAULT_TEMPLATE_KEY
from ..victory.snap import build_victory_evaluation_input

TEMPLATE_KEY_TO_PERSONA_SLUG: dict[str, str] = {
    "mq_game_basic_v1": "student",
    "mq_game_tight_budget_v1": "professional",
    "mq_game_mortgage_stress_v1": "manager",
    "mq_game_debt_stack_v1": "entrepreneur",
}

SCENARIO_COPY: dict[str, dict[str, str]] = {
    "student": {
        "win_title": "Ты вывел студенческий бюджет в плюс",
        "win_line": "Сценарий «Студент» — ты закрыл цепочку целей.",
        "gazeta_lead": "Цепочка целей закрыта — сценарий «Студент» пройден.",
        "loss_title": "Бюджет не выдержал три месяца",
        "loss_line": "В учебном сценарии важнее ритм: зарплата, подушка, обязательства.",
    },
    "professional": {
        "win_title": "Бюджет сошёлся",
        "win_line": "Сценарий «Профессионал» — цепочка целей закрыта.",
        "gazeta_lead": "Цепочка целей закрыта — сценарий «Профессионал» пройден.",
        "loss_title": "Расходы перебили доход",
        "loss_line": "В этом сценарии важно держать дисциплину по обязательствам.",
    },
    "manager": {
        "win_title": "Ипотека под контролем",
        "win_line": "Сценарий «Руководитель» — все шаги выполнены.",
        "gazeta_lead": "Цепочка целей закрыта — сценарий «Руководитель» пройден.",
        "loss_title": "Давление обязательств не снялось",
        "loss_line": "Ипотека и платежи требуют запаса на счёте каждый месяц.",
    },
    "entrepreneur": {
        "win_title": "Бизнес-модель сошлась",
        "win_line": "Сценарий «Предприниматель» — все шаги цепочки выполнены.",
        "gazeta_lead": "Все шаги цепочки выполнены — сценарий «Предприниматель» пройден.",
        "loss_title": "Кассовый разрыв не закрылся",
        "loss_line": "В этом сценарии cashflow и обязательства бьют сильнее.",
    },
}

DEFEAT_FACT_COPY: dict[str, dict[str, Any]] = {
    "cash_negative_streak": {
        "title": "Минус три месяца подряд",
        "fact_template": (
            "Три месяца подряд итоговый cash после закрытия был отрицательным"
            "{balance_suffix}."
        ),
        "tips": [
            "Забирай зарплату до «Закрыть месяц»",
            "Следи за прогнозом на дашборде",
            "Держи подушку на обязательные платежи",
        ],
    },
    "needs_depletion": {
        "title": "Потребности на нуле",
        "fact_template": (
            "Любая шкала потребностей три месяца подряд оставалась на нуле"
            "{balance_suffix}."
        ),
        "tips": [
            "События с needs_delta поднимают шкалы",
            "«Побаловать себя» — запасной путь",
            "Не игнорируй красные предупреждения",
        ],
    },
    "unknown": {
        "title": "Игра окончена",
        "fact_template": "Партия завершена{balance_suffix}.",
        "tips": [],
    },
}

COACH_TITLE = "Фух, хорошо, что это в игре"
COACH_TEXT = (
    "Не волнуйся, я сама первые несколько раз проигрывала, но разработчики не хотят, "
    "чтобы мы проигрывали — напишешь им свой комментарий?"
)


def _persona_slug(template_key: str | None) -> str:
    return TEMPLATE_KEY_TO_PERSONA_SLUG.get(template_key or "", "student")


def _scenario_copy(template_key: str | None) -> dict[str, str]:
    slug = _persona_slug(template_key)
    return SCENARIO_COPY.get(slug, SCENARIO_COPY["student"])


def _avg_closed_field(
    db: Session, profile_id: int, field: str, max_rows: int = 6
) -> tuple[float, int]:
    rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile_id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(max_rows)
        .all()
    )
    if not rows:
        return 0.0, 0
    values = [float(getattr(r, field, 0) or 0) for r in rows]
    return round(sum(values) / len(values), 2), len(values)


def _metric(glyph: str, headline: str, name: str, value: str) -> RunFinaleMetric:
    return RunFinaleMetric(glyph=glyph, headline=headline, name=name, value=value)


def _build_defeat_fact(profile: GameProfile, defeat_reason: str | None) -> RunFinaleFact:
    reason = defeat_reason or "unknown"
    pack = DEFEAT_FACT_COPY.get(reason, DEFEAT_FACT_COPY["unknown"])
    cash = float(profile.cash_balance or 0)
    suffix = ""
    if cash != 0:
        sign = "+" if cash > 0 else ""
        suffix = f" ({sign}{_fmt_rub(cash)} ₽ на счёте сейчас)"
    text = pack["fact_template"].format(balance_suffix=suffix)
    return RunFinaleFact(title=pack["title"], text=text, tips=list(pack.get("tips") or []))


def maybe_mark_victory_outcome(db: Session, profile: GameProfile, *, win_reached: bool) -> None:
    if not win_reached:
        return
    current = str(getattr(profile, "run_outcome", "") or "").strip()
    if current:
        return
    profile.run_outcome = "victory"
    db.commit()
    db.refresh(profile)


def should_show_run_finale(
    profile: GameProfile,
    *,
    win_reached: bool,
    game_session_status: str,
) -> bool:
    if game_session_status == "defeated":
        return True
    if win_reached and not getattr(profile, "victory_finale_shown_at", None):
        return True
    return False


def build_run_finale_payload(
    db: Session,
    profile: GameProfile,
    *,
    outcome: str,
    defeat_reason: str | None = None,
) -> RunFinalePayload:
    template_key = str(getattr(profile, "starter_template_key", "") or "") or DEFAULT_TEMPLATE_KEY
    template_row = (
        db.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == template_key).first()
    )
    template_title = template_row.title if template_row else template_key
    if template_row:
        template_key = template_row.template_key

    copy = _scenario_copy(template_key)
    is_win = outcome == "victory"
    period_index = int(profile.period_index or 0)

    salary = db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).first()
    monthly_income = float(salary.monthly_amount if salary else 0)

    assets_orm = (
        db.query(FinanceAsset)
        .filter(FinanceAsset.game_profile_id == profile.id, FinanceAsset.is_active == 1)
        .all()
    )
    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id, FinanceLiability.is_active == 1)
        .all()
    )
    assets_income = sum(float(a.monthly_income or 0) for a in assets_orm)
    asset_value = sum(float(a.asset_value or 0) for a in assets_orm)
    total_debt = sum(float(l.total_debt or 0) for l in liabilities_orm)
    total_overdue = sum(float(l.overdue_amount or 0) for l in liabilities_orm)

    invest_rows = (
        db.query(InvestmentPosition)
        .filter(InvestmentPosition.game_profile_id == profile.id, InvestmentPosition.is_active == 1)
        .all()
    )
    invest_principal = sum(float(p.principal or 0) for p in invest_rows)
    invest_income = 0.0
    for pos in invest_rows:
        principal = float(pos.principal or 0)
        rate = float(pos.annual_rate_percent or 0)
        if principal > 0 and rate > 0:
            invest_income += principal * (rate / 100.0) / 12.0
    passive_monthly = assets_income + invest_income

    insurance_count = (
        db.query(InsurancePolicy)
        .filter(InsurancePolicy.game_profile_id == profile.id, InsurancePolicy.is_active == 1)
        .count()
    )

    burn = compute_monthly_burn(db, profile)
    monthly_burn = float(burn.total)
    safety = float(profile.safety_fund_balance or 0)
    cushion_months = round(safety / monthly_burn, 1) if monthly_burn > 0 else 0.0

    avg_income, _ = _avg_closed_field(db, profile.id, "period_income_rate")
    avg_expense, _ = _avg_closed_field(db, profile.id, "period_expense_total")
    if avg_income <= 0 and monthly_income > 0:
        avg_income = monthly_income + assets_income + invest_income
    if avg_expense <= 0 and monthly_burn > 0:
        avg_expense = monthly_burn + sum(float(l.monthly_payment or 0) for l in liabilities_orm)

    raw_victory = template_row.victory_config_json if template_row else None
    victory_cfg = parse_victory_config(raw_victory, template_key=template_key)
    victory_cfg = override_config_goals_from_db(db, template_key=template_key, victory_cfg=victory_cfg)
    victory_snap = build_victory_evaluation_input(db, profile)
    template_cap, mechanics_unlock, template_key = resolve_template_and_unlock(db, profile)
    victory_result = evaluate_victory(
        victory_cfg,
        victory_snap,
        template_key=template_key,
        template_cap=template_cap,
        mechanics_unlock=mechanics_unlock,
    )
    goals_line = f"{victory_result.goals_met} / {victory_result.goals_enabled}"
    if victory_result.progression_mode == "chain" and victory_result.goals_enabled:
        goals_line = f"{victory_result.goals_met} / {victory_result.goals_enabled}"

    sections = [
        RunFinaleSection(
            title="Доходы, расходы и подушка",
            divider_before=False,
            metrics=[
                _metric("term", "Периодов сыграно", "До исхода", str(period_index)),
                _metric("up", "Доходы", "В среднем за период", f"{_fmt_rub(avg_income)} ₽"),
                _metric("down", "Расходы", "В среднем за период", f"{_fmt_rub(avg_expense)} ₽"),
                _metric(
                    "coin",
                    "Подушка",
                    "В месяцах обязательств",
                    f"{cushion_months} мес." if cushion_months else "—",
                ),
            ],
        ),
        RunFinaleSection(
            title="Вложения, имущество и долги",
            divider_before=True,
            metrics=[
                _metric("coin", "Инвестиции", "Сумма позиций", f"{_fmt_rub(invest_principal)} ₽"),
                _metric("coin", "Недвижимость и авто", "Оценка активов", f"{_fmt_rub(asset_value)} ₽"),
                _metric("coin", "Страховки", "Активные полисы", f"{insurance_count} шт."),
                _metric("down", "Кредиты и ипотека", "Тело долга", f"{_fmt_rub(total_debt)} ₽"),
                _metric(
                    "up",
                    "Пассивный поток",
                    "Активы и купоны",
                    f"{_fmt_rub(passive_monthly)} ₽ / мес",
                ),
                _metric(
                    "goal",
                    "Цели сценария",
                    victory_result.progression_mode or "chain",
                    goals_line,
                ),
            ],
        ),
    ]

    if total_overdue > 0:
        sections[1].metrics.append(
            _metric("down", "Просрочка", "На конец партии", f"{_fmt_rub(total_overdue)} ₽")
        )

    fact = _build_defeat_fact(profile, defeat_reason) if not is_win else None

    return RunFinalePayload(
        outcome=outcome,
        period_index=period_index,
        template_key=template_key,
        template_title=template_title,
        persona_slug=_persona_slug(template_key),
        scenario_title=copy["win_title"] if is_win else copy["loss_title"],
        scenario_line=copy["win_line"] if is_win else copy["loss_line"],
        gazeta_lead=copy["gazeta_lead"] if is_win else None,
        coach_title=COACH_TITLE,
        coach_text=COACH_TEXT,
        sections=sections,
        fact=fact,
        defeat_reason=defeat_reason if not is_win else None,
        can_dismiss=is_win,
    )
