"""
plan-api — прототип «ТВОЙ ПЛАН» (docs/plan/specs/SPEC_plan-v1.md, этап P0 в docs/plan/ROADMAP.md).

Заглушки прототипа (заменяются в SPL-402):
- хранилище в памяти вместо БД `plan`;
- код входа не отправляется на почту, а возвращается в ответе (`dev_code`);
- токен — случайная строка в памяти вместо JWT `iss=plan` из `packages/platform`.

Расчёты настоящие: прогноз, сценарии и метрики считает `fincore`.
"""

from __future__ import annotations

import os
import secrets
from datetime import date
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import TypeAdapter, ValidationError

from .analysis.report import ENTRY_TITLES, build_report
from .demo import demo_data, demo_members
from .schemas import (
    SECTION_ROW,
    Checkup,
    CheckupCreate,
    CheckupData,
    EventIn,
    ExpenseRow,
    IncomeRow,
    LiabilityRow,
    Member,
    QuickIn,
    RequestCodeIn,
    RequestCodeOut,
    SavingsRow,
    Section,
    StepPatch,
    VerifyIn,
)
from .analysis import config
from .store import User, new_id, now_iso, store

CONSENT_VERSION = "2026-10-proto"

app = FastAPI(title="ТВОЙ ПЛАН API (прототип)", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("PLAN_CORS_ORIGINS", "http://localhost:5190,http://127.0.0.1:5190").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


def error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


@app.exception_handler(HTTPException)
async def _http_error(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content={"error": detail})


def current_user(authorization: Annotated[str | None, Header()] = None) -> User:
    token = (authorization or "").removeprefix("Bearer ").strip()
    user_id = store.tokens.get(token)
    user = store.users.get(user_id) if user_id else None
    if not user:
        raise error(401, "unauthorized", "Нужно войти")
    return user


UserDep = Annotated[User, Depends(current_user)]


def own_checkup(user: User, checkup_id: str) -> Checkup:
    item = store.checkups.get(checkup_id)
    if not item or item[0] != user.id:
        raise error(404, "not_found", "Чекап не найден")
    return item[1]


def editable(ck: Checkup) -> None:
    if ck.status != "draft":
        raise error(409, "checkup_completed", "Завершённый чекап не меняется — создайте новый")


def track(user: User, name: str, **props) -> None:
    store.events.append({"user_id": user.id, "name": name, "props": props, "at": now_iso()})


# --- health и вход ----------------------------------------------------------------------------


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "app": "plan-api", "mode": "prototype", "rules_version": config.RULES_VERSION}


@app.get("/api/meta")
def meta() -> dict:
    return {"entry_questions": ENTRY_TITLES, "consent_version": CONSENT_VERSION, "disclaimer": config.DISCLAIMER}


@app.post("/api/auth/email/request-code", response_model=RequestCodeOut)
def request_code(body: RequestCodeIn) -> RequestCodeOut:
    email = body.email.lower()
    code = f"{secrets.randbelow(1_000_000):06d}"
    store.codes[email] = code
    return RequestCodeOut(dev_code=code)


@app.post("/api/auth/email/verify")
def verify(body: VerifyIn) -> dict:
    email = body.email.lower()
    if store.codes.get(email) != body.code:
        raise error(400, "invalid_code", "Неверный или устаревший код")
    store.codes.pop(email, None)
    user_id = store.by_email.get(email)
    if not user_id:
        if body.consent_version != CONSENT_VERSION:
            raise error(400, "consent_required", "Нужно согласие на обработку персональных данных")
        user = User(id=new_id("u"), email=email, consent_version=body.consent_version, members=[Member(id="m_me", label="Я")])
        store.users[user.id] = user
        store.by_email[email] = user.id
        track(user, "signup")
    token = secrets.token_urlsafe(24)
    store.tokens[token] = store.by_email[email]
    user = store.users[store.by_email[email]]
    return {"access_token": token, "user": {"id": user.id, "email": user.email}}


@app.get("/api/me")
def me(user: UserDep) -> dict:
    return {"user": {"id": user.id, "email": user.email}, "members": [m.model_dump() for m in user.members]}


@app.delete("/api/me", status_code=202)
def delete_me(user: UserDep) -> dict:
    store.delete_user(user.id)
    return {"deleted": True}


@app.put("/api/household/members")
def put_members(body: list[Member], user: UserDep) -> list[Member]:
    if not 1 <= len(body) <= 8:
        raise error(422, "members_limit", "В семье от 1 до 8 человек")
    members = [m if m.id else m.model_copy(update={"id": new_id("m")}) for m in body]
    ids = {m.id for m in members}
    for ck in store.user_checkups(user.id):
        if ck.status != "draft":
            continue
        used = {r.member_id for r in ck.data.incomes} | {r.member_id for r in ck.data.liabilities if r.member_id}
        if used - ids:
            raise error(409, "member_in_use", "У этого человека есть доходы или долги — сначала уберите их")
    user.members = members
    for ck in store.user_checkups(user.id):
        if ck.status == "draft":
            ck.members = members
    return members


# --- чекапы -----------------------------------------------------------------------------------


@app.post("/api/checkups")
def create_checkup(body: CheckupCreate, user: UserDep) -> Checkup:
    mine = store.user_checkups(user.id)
    draft = next((c for c in mine if c.status == "draft"), None)
    if draft:
        draft.entry_question = body.entry_question
        return draft
    last = max((c for c in mine if c.status == "completed"), key=lambda c: c.completed_at or "", default=None)
    today = date.today()
    ck = Checkup(
        id=new_id("ck"),
        entry_question=body.entry_question,
        as_of=f"{today.year:04d}-{today.month:02d}",
        parent_checkup_id=last.id if last else None,
        members=list(user.members),
        data=last.data.model_copy(deep=True) if last else CheckupData(),
    )
    store.checkups[ck.id] = (user.id, ck)
    track(user, "checkup_started", entry_question=body.entry_question)
    return ck


@app.get("/api/checkups")
def list_checkups(user: UserDep) -> list[dict]:
    return [
        {"id": c.id, "status": c.status, "as_of": c.as_of, "entry_question": c.entry_question, "completed_at": c.completed_at}
        for c in sorted(store.user_checkups(user.id), key=lambda c: c.completed_at or "~", reverse=True)
    ]


@app.get("/api/checkups/{checkup_id}")
def get_checkup(checkup_id: str, user: UserDep) -> Checkup:
    return own_checkup(user, checkup_id)


@app.post("/api/checkups/{checkup_id}/quick")
def quick(checkup_id: str, body: QuickIn, user: UserDep) -> Checkup:
    ck = own_checkup(user, checkup_id)
    editable(ck)
    adults = [m for m in ck.members if m.role == "adult"] or [Member(id="m_me", label="Я")]
    kids = [m for m in ck.members if m.role == "child"]
    for i in range(len(kids), body.children):
        kids.append(Member(id=new_id("m"), label=f"Ребёнок {i + 1}", role="child"))
    ck.members = adults + kids[: body.children]
    user.members = ck.members
    data = ck.data
    data.incomes = [IncomeRow(member_id=adults[0].id, kind="salary", amount=body.income)]
    data.expenses = [ExpenseRow(category_key="quick_must", title="Обязательные расходы (сводно)", tier="must", amount=body.must_expenses)]
    data.savings = [SavingsRow(kind="account", amount=body.savings, is_safety_fund=True)]
    pay = (float(body.debt_payments.min) + float(body.debt_payments.max)) / 2
    if pay > 0:
        # Остаток неизвестен: оцениваем как кредит на QUICK_DEBT_TERM мес. под QUICK_DEBT_RATE %
        r = config.QUICK_DEBT_RATE / 100 / 12
        balance = pay * (1 - (1 + r) ** -config.QUICK_DEBT_TERM) / r
        data.liabilities = [
            LiabilityRow(
                kind="consumer",
                title="Кредиты (сводно)",
                balance=round(balance, 2),
                annual_rate=config.QUICK_DEBT_RATE,
                monthly_payment=round(pay, 2),
                term_months_left=config.QUICK_DEBT_TERM,
                estimated=True,
            )
        ]
    else:
        data.liabilities = []
    track(user, "quick_done")
    return ck


@app.put("/api/checkups/{checkup_id}/sections/{section}")
def put_section(checkup_id: str, section: Section, rows: list[dict], user: UserDep) -> list:
    ck = own_checkup(user, checkup_id)
    editable(ck)
    try:
        parsed = TypeAdapter(list[SECTION_ROW[section]]).validate_python(rows)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail={"code": "validation", "message": str(exc.errors()[0]["msg"]), "errors": exc.errors(include_url=False, include_context=False)})
    member_ids = {m.id for m in ck.members}
    child_ids = {m.id for m in ck.members if m.role == "child"}
    for row in parsed:
        mid = getattr(row, "member_id", None)
        if mid and mid not in member_ids:
            raise error(422, "unknown_member", "Нет такого члена семьи")
        if mid in child_ids and section in ("incomes", "liabilities"):
            raise error(422, "child_finance", "У ребёнка не может быть доходов и долгов")
    if section == "liabilities":
        parsed = [r if r.id else r.model_copy(update={"id": new_id("li")}) for r in parsed]
    if section == "decision" and len(parsed) > 1:
        raise error(422, "single_decision", "Решение одно")
    setattr(ck.data, section, parsed)
    track(user, "section_done", section=section)
    return parsed


@app.post("/api/checkups/{checkup_id}/demo")
def fill_demo(checkup_id: str, user: UserDep) -> Checkup:
    """Заглушка прототипа: заполнить чекап демо-семьёй."""
    ck = own_checkup(user, checkup_id)
    editable(ck)
    ck.members = demo_members()
    user.members = ck.members
    ck.data = demo_data(ck.as_of)
    return ck


@app.get("/api/checkups/{checkup_id}/report")
def get_report(checkup_id: str, user: UserDep) -> dict:
    ck = own_checkup(user, checkup_id)
    if ck.status == "completed":
        report = store.reports[ck.id]
    else:
        if not ck.data.incomes and not ck.data.expenses:
            raise error(409, "not_enough_data", "Заполните хотя бы доходы и расходы")
        report = build_report(ck)
    track(user, "report_viewed", final=report["final"], precision=report["precision"])
    return report


@app.post("/api/checkups/{checkup_id}/complete")
def complete(checkup_id: str, user: UserDep, idempotency_key: Annotated[str | None, Header()] = None) -> dict:
    ck = own_checkup(user, checkup_id)
    if ck.status == "completed":
        if idempotency_key and store.reports[ck.id].get("idempotency_key") == idempotency_key:
            return store.reports[ck.id]
        raise error(409, "checkup_completed", "Чекап уже завершён")
    if not ck.data.incomes or not ck.data.expenses:
        raise error(409, "not_enough_data", "Для итогового разбора нужны доходы и расходы")
    with store.lock:
        ck.status = "completed"
        ck.completed_at = now_iso()
        report = build_report(ck)
        report["idempotency_key"] = idempotency_key
        for step in report["steps"]:
            step["id"] = new_id("st")
            store.steps[step["id"]] = (user.id, step)
        store.reports[ck.id] = report
    track(user, "checkup_completed")
    return report


@app.patch("/api/steps/{step_id}")
def patch_step(step_id: str, body: StepPatch, user: UserDep) -> dict:
    item = store.steps.get(step_id)
    if not item or item[0] != user.id:
        raise error(404, "not_found", "Шаг не найден")
    step = item[1]
    step["status"] = body.status
    step["status_at"] = now_iso()
    if body.status in ("done", "dismissed"):
        track(user, f"step_{body.status}", rule_key=step["rule_key"])
    return step


@app.post("/api/events", status_code=204)
def post_event(body: EventIn, user: UserDep) -> None:
    track(user, body.name, **body.props)


@app.get("/api/dev/funnel")
def funnel() -> dict:
    """Заглушка прототипа: воронка по событиям (в проде — админка Plan)."""
    names = ["signup", "checkup_started", "quick_done", "report_viewed", "checkup_completed", "step_done"]
    return {n: len({e["user_id"] for e in store.events if e["name"] == n}) for n in names}

