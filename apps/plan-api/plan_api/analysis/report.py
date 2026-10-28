"""
Итоговый отчёт чекапа (SPEC_plan-v1 §Расчёт отчёта): метрики, прогноз, стресс-тест, долги,
цели, светофор, три шага с «почему» и ответ на вопрос со входа.

Детерминирован: одинаковые данные + `RULES_VERSION` + версия fincore → одинаковый отчёт.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from importlib.metadata import PackageNotFoundError, version

from fincore.household import HouseholdSnapshot
from fincore.metrics import HouseholdMetrics, compute_metrics

from ..schemas import Checkup
from . import config
from .adapter import build_snapshot, month_index, month_label, precision
from .debts import simulate
from .scenarios import Run, combine, main_earner, run, s1_income_loss, s2_child, s3_prices, verdict, with_decision

AREAS = ("budget", "debts", "cushion", "protection")

ENTRY_TITLES = {
    "mortgage": "Потянем ли ипотеку или крупный кредит?",
    "debts": "Когда закроем кредиты?",
    "resilience": "Выдержим ли, если что-то случится?",
    "goal": "Успеем ли накопить на цель?",
    "overview": "Как у нас дела в целом?",
}


def _fincore_version() -> str:
    try:
        return version("tvoy-hod-fincore")
    except PackageNotFoundError:  # пакет подключён путём, без установки
        return "src"


def rub(x: float) -> str:
    return f"{round(x):,}".replace(",", " ") + " ₽"  # неразрывные: сумма не рвётся по строкам


@dataclass
class Ctx:
    checkup: Checkup
    base: HouseholdSnapshot
    metrics: HouseholdMetrics
    metrics_p: HouseholdMetrics
    premiums: float
    free_cf: float
    outflow: float
    cushion: float
    cushion_target_months: float
    cushion_contrib: float
    extra: float
    scenarios: dict[str, dict] = field(default_factory=dict)
    flags: list[dict] = field(default_factory=list)
    goals: list[dict] = field(default_factory=list)
    debt: dict = field(default_factory=dict)


def _free_cashflow(m: HouseholdMetrics, premiums: float) -> float:
    return m.income_steady - m.total_monthly_outflow - premiums


def _cushion_target(ck: Checkup, snap: HouseholdSnapshot) -> float:
    has_child = any(mem.role == "child" for mem in ck.members)
    total = snap.monthly_income
    earner = main_earner(snap)
    top = sum(i.monthly_amount for i in snap.incomes if i.member_id == earner)
    if has_child and total > 0 and top / total > config.MAIN_EARNER_SHARE:
        return config.CUSHION_TARGET_MONTHS_FAMILY
    return config.CUSHION_TARGET_MONTHS


def _series(r: Run) -> list[dict]:
    return [{"month": m, "liquid": v} for m, v in zip(r.months, r.liquid)]


def _scenario(key: str, title: str, description: str, r: Run, outflow: float) -> dict:
    return {
        "id": key,
        "title": title,
        "description": description,
        "verdict": verdict(r, outflow),
        "months_until_negative": r.months_until_negative,
        "min_liquid": r.min_liquid,
        "series": _series(r),
    }


def _member_label(ck: Checkup, member_id) -> str:
    for m in ck.members:
        if m.id == member_id:
            return m.label
    return "основного дохода"


def _scenarios(ctx: Ctx) -> None:
    ck, data = ctx.checkup, ctx.checkup.data
    start = build_snapshot(data, ck.as_of, "base", merge_cushion=True)
    earner = _member_label(ck, main_earner(start))
    out = ctx.outflow + ctx.premiums
    ctx.scenarios["S1"] = _scenario(
        "S1",
        "Потеря крупнейшего дохода",
        f"Доход «{earner}» пропадает на {config.S1_MONTHS_WITHOUT_INCOME} мес.",
        run(start, modifier=s1_income_loss(start)),
        out,
    )
    ctx.scenarios["S2"] = _scenario(
        "S2",
        "Рождение ребёнка",
        f"+{rub(config.S2_CHILD_MONTHLY_COST)}/мес расходов, доход одного взрослого −{round(config.S2_PARENTAL_LEAVE_CUT * 100)} % на год",
        run(start, modifier=s2_child(start, ck.members)),
        out,
    )
    ctx.scenarios["S3"] = _scenario(
        "S3",
        "Рост цен",
        f"Расходы на жизнь +{round(config.S3_PRICE_GROWTH * 100)} %, доходы те же",
        run(start, modifier=s3_prices(start)),
        out,
    )
    decided = with_decision(start, data) if ck.entry_question == "mortgage" else None
    if decided:
        snap, payment = decided
        s4 = _scenario("S4", "Ваше решение: новый кредит", f"Взнос списан, платёж {rub(payment)}/мес", run(snap), out + payment)
        s4["payment"] = payment
        s4["cash_after_down_payment"] = snap.cash
        if snap.cash < 0:
            s4["verdict"] = "fail"
            s4["gap"] = -snap.cash
    else:
        s4 = _scenario(
            "S4",
            "Двойной удар",
            "Потеря крупнейшего дохода и рост цен одновременно",
            run(start, modifier=combine(s1_income_loss(start), s3_prices(start))),
            out,
        )
    ctx.scenarios["S4"] = s4


def _debts(ctx: Ctx) -> None:
    lis = ctx.base.liabilities
    current = simulate(lis)
    avalanche = simulate(lis, extra=ctx.extra, strategy="avalanche")
    snowball = simulate(lis, extra=ctx.extra, strategy="snowball")
    as_of = month_index(ctx.checkup.as_of)

    def view(p) -> dict:
        return {
            "months": p.months,
            "payoff_month": month_label(as_of + p.months) if p.months else None,
            "total_interest": p.total_interest,
            "order": list(p.order),
        }

    ctx.debt = {
        "extra": round(ctx.extra, 2),
        "current": view(current),
        "avalanche": view(avalanche),
        "snowball": view(snowball),
        "saved_by_avalanche": round(current.total_interest - avalanche.total_interest, 2),
        "high_rate": [
            {"title": li.title, "rate": li.annual_rate_percent}
            for li in sorted(lis, key=lambda x: -x.annual_rate_percent)
            if li.annual_rate_percent > config.HIGH_RATE_PERCENT
        ],
    }


def _goals(ctx: Ctx) -> None:
    as_of = month_index(ctx.checkup.as_of)
    available = max(0.0, ctx.free_cf - ctx.cushion_contrib)
    for g in sorted(ctx.checkup.data.goals, key=lambda g: g.priority):
        left = max(0.0, float(g.target_amount) - float(g.saved_amount))
        months = max(1, month_index(g.target_month) - as_of)
        need = round(left / months, 2)
        realistic = need <= available + 0.005
        if realistic:
            available -= need
            when = g.target_month
        else:
            when = month_label(as_of + math.ceil(left / available)) if available > 0 else None
        ctx.goals.append(
            {
                "title": g.title,
                "target_amount": float(g.target_amount),
                "target_month": g.target_month,
                "monthly_needed": need,
                "realistic": realistic,
                "realistic_month": when,
            }
        )


def _flags(ctx: Ctx) -> None:
    data, ck = ctx.checkup.data, ctx.checkup
    invest_total = sum(float(i.amount) for i in data.investments)
    target = ctx.cushion_target_months
    if invest_total > 0 and ctx.metrics.safety_fund_months < target:
        ctx.flags.append({"key": "invest_before_cushion", "text": "Есть вложения, но подушка ниже цели"})
    if invest_total > 0:
        by: dict[str, float] = {}
        for i in data.investments:
            by[i.asset_class] = by.get(i.asset_class, 0.0) + float(i.amount)
        top_class, top = max(by.items(), key=lambda kv: kv[1])
        if top / invest_total > config.CONCENTRATION_SHARE and len(data.investments) > 0:
            ctx.flags.append({"key": "concentration", "text": f"Больше половины вложений в одном классе активов ({top_class})"})
        near_goal = any(month_index(g.target_month) - month_index(ck.as_of) <= 12 for g in data.goals)
        if near_goal and any(i.liquidity == "years" for i in data.investments):
            ctx.flags.append({"key": "illiquid_vs_goal", "text": "Цель в ближайший год, а часть вложений неликвидна"})
    kinds = {p.kind for p in data.insurance}
    has_mortgage = any(li.kind == "mortgage" for li in data.liabilities) or (ck.entry_question == "mortgage" and data.decision)
    if has_mortgage and not kinds & {"life", "mortgage_title"}:
        ctx.flags.append({"key": "mortgage_unprotected", "text": "Ипотека без страхования жизни и титула"})
    adults_with_income = {i.member_id for i in data.incomes}
    if any(m.role == "child" for m in ck.members) and len(adults_with_income) == 1 and "life" not in kinds:
        ctx.flags.append({"key": "single_earner_unprotected", "text": "Один кормилец, дети, нет страхования жизни"})
    year = int(ck.as_of[:4])
    with_pension = {p.member_id for p in data.pension if p.savings_amount > 0 or p.has_voluntary_program}
    for m in ck.members:
        if m.role == "adult" and m.birth_year and year - m.birth_year > config.PENSION_AGE_FLAG and m.id not in with_pension:
            ctx.flags.append({"key": "no_pension", "text": f"У «{m.label}» нет пенсионных накоплений"})


def _areas(ctx: Ctx) -> list[dict]:
    m = ctx.metrics
    income = m.income_steady
    rate = ctx.free_cf / income if income > 0 else None
    if rate is None or rate < 0:
        budget = "red"
    elif rate < config.SAVINGS_RATE_GREEN:
        budget = "yellow"
    else:
        budget = "green"
    dti = m.liabilities_to_income_percent if income > 0 else (100.0 if m.liability_payments > 0 else 0.0)
    if dti > config.DTI_RED or m.total_overdue > 0:
        debts = "red"
    elif dti >= config.DTI_GREEN:
        debts = "yellow"
    else:
        debts = "green"
    months = m.safety_fund_months
    goals_ok = all(g["realistic"] for g in ctx.goals)
    if months < config.CUSHION_MIN_MONTHS:
        cushion = "red"
    elif months < ctx.cushion_target_months or not goals_ok:
        cushion = "yellow"
    else:
        cushion = "green"
    protection = "yellow" if ctx.flags else "green"
    return [
        {
            "key": "budget",
            "title": "Бюджет",
            "light": budget,
            "metrics": {"income": income, "outflow": m.total_monthly_outflow + ctx.premiums, "free_cashflow": ctx.free_cf, "savings_rate": rate},
        },
        {
            "key": "debts",
            "title": "Долги",
            "light": debts,
            "metrics": {"dti_percent": dti, "total_debt": m.total_debt, "overdue": m.total_overdue, "payments": m.liability_payments},
        },
        {
            "key": "cushion",
            "title": "Подушка и цели",
            "light": cushion,
            "metrics": {"cushion": ctx.cushion, "months": months, "target_months": ctx.cushion_target_months, "goals_realistic": goals_ok},
        },
        {
            "key": "protection",
            "title": "Инвестиции и защита",
            "light": protection,
            "metrics": {"investments": sum(float(i.amount) for i in ctx.checkup.data.investments)},
            "flags": ctx.flags,
        },
    ]


def _steps(ctx: Ctx, areas: list[dict]) -> list[dict]:
    """Правила по приоритету (SPEC §7); три первых сработавших."""
    m, data = ctx.metrics, ctx.checkup.data
    out: list[dict] = []

    def add(rule_key: str, title: str, why: str, numbers: dict) -> None:
        out.append({"rule_key": rule_key, "rank": len(out) + 1, "title": title, "why": why, "numbers": numbers, "status": "suggested"})

    target_amount = ctx.cushion_target_months * ctx.outflow
    if m.total_overdue > 0:
        worst = max(ctx.base.liabilities, key=lambda li: li.overdue_amount)
        add("close_overdue", f"Закрыть просрочку «{worst.title}» — {rub(worst.overdue_amount)}",
            "Просрочка копит штрафы и портит кредитную историю — это дороже любого другого шага.",
            {"overdue": m.total_overdue})
    if ctx.free_cf < 0:
        wants = sorted((e for e in ctx.base.expense_lines if e.tier == "want"), key=lambda e: -e.amount_monthly)[:3]
        top = ", ".join(e.title for e in wants) or "статьи «по желанию»"
        add("stop_deficit", f"Сократить расходы на {rub(-ctx.free_cf)}/мес",
            f"Сейчас расходы больше доходов на {rub(-ctx.free_cf)} в месяц. Начните с: {top}.",
            {"gap": -ctx.free_cf})
    if m.safety_fund_months < config.CUSHION_MIN_MONTHS:
        need = max(0.0, ctx.outflow - ctx.cushion)
        add("first_cushion", f"Отложить {rub(need)} — первый месяц подушки",
            f"Подушки хватит на {m.safety_fund_months:.1f} мес. Месяц расходов — первая ступень защиты от любой неожиданности.",
            {"need": need, "months": m.safety_fund_months})
    if ctx.debt.get("high_rate") and m.safety_fund_months >= config.CUSHION_MIN_MONTHS and ctx.extra > 0:
        hr = ctx.debt["high_rate"][0]
        saved = ctx.debt["saved_by_avalanche"]
        cur, av = ctx.debt["current"]["months"], ctx.debt["avalanche"]["months"]
        sooner = (cur - av) if cur and av else None
        add("avalanche", f"Гасить досрочно «{hr['title']}» ({hr['rate']:g} %)",
            f"Если добавлять {rub(ctx.extra)}/мес к самому дорогому долгу, переплата снизится на {rub(saved)}"
            + (f", кредиты закроются на {sooner} мес. раньше." if sooner else "."),
            {"extra": ctx.extra, "saved": saved, "sooner_months": sooner})
    for key in ("S1", "S4"):
        s = ctx.scenarios.get(key)
        if s and s["verdict"] == "fail":
            n = s["months_until_negative"]
            add("stress_fail", f"{s['title']}: укрепить запас",
                f"В этом сценарии деньги кончатся через {n} мес. Подушка {rub(target_amount)} даст время перестроиться.",
                {"scenario": key, "months_until_negative": n, "target": target_amount})
            break
    bad_goal = next((g for g in ctx.goals if not g["realistic"]), None)
    if bad_goal:
        when = bad_goal["realistic_month"] or "позже"
        add("goal_unrealistic", f"Пересмотреть цель «{bad_goal['title']}»",
            f"Нужно откладывать {rub(bad_goal['monthly_needed'])}/мес — больше, чем остаётся. Реалистичный срок: {when}.",
            {"monthly_needed": bad_goal["monthly_needed"], "realistic_month": bad_goal["realistic_month"]})
    # SPEC §7: «подушка < цели», без нижней границы — при пустой подушке идёт следом за first_cushion.
    # cushion_contrib > 0 нужен шаблону («по N ₽/мес — за M мес.»); при дефиците сработает stop_deficit.
    if m.safety_fund_months < ctx.cushion_target_months and ctx.cushion_contrib > 0:
        months = math.ceil(max(0.0, target_amount - ctx.cushion) / ctx.cushion_contrib)
        add("cushion_target", f"Довести подушку до {rub(target_amount)}",
            f"Сейчас {m.safety_fund_months:.1f} мес. из {ctx.cushion_target_months:g}. По {rub(ctx.cushion_contrib)}/мес — за {months} мес.",
            {"target": target_amount, "monthly": ctx.cushion_contrib, "months": months})
    flag_keys = {f["key"] for f in ctx.flags}
    if flag_keys & {"mortgage_unprotected", "single_earner_unprotected"}:
        add("protection_check", "Проверить, защищён ли доход семьи",
            "При ипотеке или детях потеря дохода кормильца бьёт сильнее всего. Узнайте, что покрывает страхование жизни.",
            {})
    if "invest_before_cushion" in flag_keys or "illiquid_vs_goal" in flag_keys:
        add("liquidity_first", "Сначала подушка, потом вложения",
            "Часть денег вложена, а запас на чёрный день меньше цели. В трудный месяц вложения может быть невыгодно или нельзя забрать.",
            {})
    if "concentration" in flag_keys:
        add("concentration", "Обсудить распределение вложений со специалистом",
            "Больше половины вложений в одном классе активов — их стоимость зависит от одного рынка.", {})
    if all(a["light"] == "green" for a in areas) and ctx.free_cf > 0:
        goal = data.goals[0].title if data.goals else "долгосрочную цель"
        add("direct_surplus", f"Направить свободные {rub(ctx.free_cf)}/мес на «{goal}»",
            "Все области в зелёной зоне — свободные деньги можно работать на цель.", {"amount": ctx.free_cf})
    seen, top3 = set(), []
    for s in out:
        if s["rule_key"] in seen:
            continue
        seen.add(s["rule_key"])
        top3.append({**s, "rank": len(top3) + 1})
        if len(top3) == 3:
            break
    return top3


def _entry_answer(ctx: Ctx, areas: list[dict]) -> dict:
    q = ctx.checkup.entry_question
    title = ENTRY_TITLES[q]
    if q == "mortgage":
        s4 = ctx.scenarios["S4"]
        if "payment" not in s4:
            return {"question": title, "verdict": "unknown", "text": "Добавьте параметры ипотеки: цену, взнос, ставку и срок."}
        dti_after = (ctx.metrics.liability_payments + s4["payment"]) / ctx.metrics.income_steady * 100 if ctx.metrics.income_steady else None
        verdict = s4["verdict"]
        text = f"Платёж {rub(s4['payment'])}/мес"
        if dti_after is not None:
            text += f", долговая нагрузка станет {dti_after:.0f} % дохода"
        if s4.get("gap"):
            text += f". На первый взнос не хватает {rub(s4['gap'])}"
        elif s4["months_until_negative"]:
            text += f". После взноса деньги кончатся через {s4['months_until_negative']} мес."
        else:
            text += ". После взноса бюджет держится все 12 месяцев прогноза."
        if dti_after is not None and dti_after > config.DTI_RED and verdict == "ok":
            verdict = "edge"
        return {"question": title, "verdict": verdict, "text": text, "numbers": {"payment": s4["payment"], "dti_after": round(dti_after, 1) if dti_after is not None else None}}
    if q == "debts":
        d = ctx.debt
        if not ctx.base.liabilities:
            return {"question": title, "verdict": "ok", "text": "Кредитов нет — закрывать нечего."}
        cur, av = d["current"], d["avalanche"]
        if not cur["months"]:
            text = "При текущих платежах часть долгов не гасится: платёж не покрывает проценты."
            v = "fail"
        else:
            text = f"При текущих платежах — к {cur['payoff_month']}."
            v = "ok" if cur["months"] <= 36 else "edge"
        if av["months"] and d["extra"] > 0:
            text += f" Если добавлять {rub(d['extra'])}/мес по методу лавины — к {av['payoff_month']}, экономия {rub(d['saved_by_avalanche'])}."
        return {"question": title, "verdict": v, "text": text, "numbers": {"current": cur, "avalanche": av}}
    if q == "resilience":
        s1 = ctx.scenarios["S1"]
        n = s1["months_until_negative"]
        if n:
            text = f"{s1['description']}: деньги кончатся через {n} мес."
        else:
            text = f"{s1['description']}: бюджет выдерживает все 12 месяцев прогноза."
        return {"question": title, "verdict": s1["verdict"], "text": text, "numbers": {"months_until_negative": n}}
    if q == "goal":
        if not ctx.goals:
            return {"question": title, "verdict": "unknown", "text": "Добавьте цель: сумму и срок."}
        g = ctx.goals[0]
        if g["realistic"]:
            text = f"«{g['title']}»: да, если откладывать {rub(g['monthly_needed'])}/мес до {g['target_month']}."
        else:
            text = f"«{g['title']}»: к {g['target_month']} не успеваете — нужно {rub(g['monthly_needed'])}/мес. Реалистично: {g['realistic_month'] or 'после выхода в плюс'}."
        return {"question": title, "verdict": "ok" if g["realistic"] else "fail", "text": text, "numbers": g}
    counts = {c: sum(1 for a in areas if a["light"] == c) for c in ("green", "yellow", "red")}
    v = "fail" if counts["red"] else ("edge" if counts["yellow"] else "ok")
    text = f"Зелёных областей — {counts['green']}, жёлтых — {counts['yellow']}, красных — {counts['red']}. Начните с шагов ниже."
    return {"question": title, "verdict": v, "text": text, "numbers": counts}


def _metrics_view(m: HouseholdMetrics) -> dict:
    return {
        "income": m.income_steady,
        "outflow": m.total_monthly_outflow,
        "liability_payments": m.liability_payments,
        "dti_percent": m.liabilities_to_income_percent,
        "safety_fund_months": m.safety_fund_months,
        "total_debt": m.total_debt,
        "net_worth": m.net_worth,
    }


def build_report(ck: Checkup) -> dict:
    data = ck.data
    base = build_snapshot(data, ck.as_of, "base")
    pess = build_snapshot(data, ck.as_of, "pessimistic")
    metrics, metrics_p = compute_metrics(base), compute_metrics(pess)
    premiums = sum(p.monthly_premium for p in base.policies)
    free_cf = round(_free_cashflow(metrics, premiums), 2)
    target_months = _cushion_target(ck, base)
    below_target = metrics.safety_fund_months < target_months
    cushion_contrib = round(max(0.0, free_cf) * config.CUSHION_SHARE_OF_FREE_CASHFLOW, 2) if below_target else 0.0
    extra = round(max(0.0, free_cf - cushion_contrib) * config.EXTRA_SHARE_OF_FREE_CASHFLOW, 2)
    ctx = Ctx(
        checkup=ck,
        base=base,
        metrics=metrics,
        metrics_p=metrics_p,
        premiums=premiums,
        free_cf=free_cf,
        outflow=metrics.total_monthly_outflow,
        cushion=base.safety_fund,
        cushion_target_months=target_months,
        cushion_contrib=cushion_contrib,
        extra=extra,
    )
    _scenarios(ctx)
    _debts(ctx)
    _goals(ctx)
    _flags(ctx)
    areas = _areas(ctx)
    steps = _steps(ctx, areas)
    base_run = run(build_snapshot(data, ck.as_of, "base", merge_cushion=True))
    pess_run = run(build_snapshot(data, ck.as_of, "pessimistic", merge_cushion=True))
    level, share = precision(data)
    return {
        "checkup_id": ck.id,
        "final": ck.status == "completed",
        "as_of": ck.as_of,
        "precision": level,
        "precision_share": round(share, 3),
        "rules_version": config.RULES_VERSION,
        "fincore_version": _fincore_version(),
        "entry_answer": _entry_answer(ctx, areas),
        "areas": areas,
        "metrics_base": _metrics_view(metrics),
        "metrics_pessimistic": _metrics_view(metrics_p),
        "net_worth": metrics.net_worth,
        "free_cashflow": free_cf,
        "forecast": {
            "base": _series(base_run),
            "pessimistic": _series(pess_run),
            "base_months_until_negative": base_run.months_until_negative,
            "pessimistic_months_until_negative": pess_run.months_until_negative,
        },
        "scenarios": [ctx.scenarios[k] for k in ("S1", "S2", "S3", "S4")],
        "debt_strategy": ctx.debt,
        "goals": ctx.goals,
        "steps": steps,
        "disclaimer": config.DISCLAIMER,
    }
