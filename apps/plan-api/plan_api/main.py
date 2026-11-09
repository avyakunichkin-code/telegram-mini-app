"""
plan-api — «ТВОЙ ПЛАН» (docs/plan/specs/SPEC_plan-v1.md), продуктовый каркас P2 (SPL-402).

Инфраструктура — `packages/platform`: своя БД `plan` и SQL-миграции, JWT `iss=plan`/`aud=plan-web`,
health. Расчёты — `fincore` через слой `analysis/`. Игру (`backend/`) не импортирует.
Запуск: `uvicorn plan_api.main:create_app --factory --port 8020`.

До юриста по ПДн и решения PO реальных пользователей нет (ADR-017): письма с кодом — в лог,
в dev код ещё и в ответе (`dev_code`).
"""


import hashlib
import hmac
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import TypeAdapter, ValidationError
from sqlalchemy.orm import Session

from tvoy_platform.db import Database
from tvoy_platform.health import health_router
from tvoy_platform.migrations import migrate
from tvoy_platform.tokens import InvalidToken, TokenIssuer

from .analysis import config
from .analysis.preview import PreviewIn, preview as build_preview
from .analytics import CONSENT_VERSION
from .analysis.report import ENTRY_TITLES, build_report
from .history import compare
from .continuity import parent_context
from .goal_progress import add_goal_progress
from .demo import demo_data, demo_members
from .mailer import LogMailer
from .repo import CheckupChanged, Repo, User, new_id, now_iso
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
    StepActionPatch,
    VerifyIn,
)
from .settings import MIGRATIONS, Settings

ISSUER, AUDIENCE = "plan", "plan-web"
FUNNEL = ["signup", "checkup_started", "quick_done", "report_viewed", "checkup_completed", "step_done"]


def error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def create_app(settings: Settings | None = None, mailer: LogMailer | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    db = Database(settings.database_url)
    if not settings.production:
        migrate(db.engine, MIGRATIONS)  # в production — только `py -3 -m plan_api.migrate`
    tokens = TokenIssuer(secret=settings.secret_key, issuer=ISSUER, audience=AUDIENCE, ttl=settings.token_ttl)
    mailer = mailer or LogMailer(log_code=not settings.production)  # код входа не попадает в логи production

    app = FastAPI(title="ТВОЙ ПЛАН API", version="0.2.0")
    app.state.settings, app.state.db, app.state.tokens, app.state.mailer = settings, db, tokens, mailer
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
    app.include_router(health_router(db, "plan-api", env=settings.env, rules_version=config.RULES_VERSION))

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else {"code": "error", "message": str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content={"error": detail})

    @app.exception_handler(CheckupChanged)
    async def _checkup_changed(_: Request, __: CheckupChanged) -> JSONResponse:
        message = "Данные изменились на другом устройстве. Обновите страницу и повторите"
        return JSONResponse(status_code=409, content={"error": {"code": "checkup_changed", "message": message}})

    def repo(session: Annotated[Session, Depends(db.get_session)]) -> Repo:
        return Repo(session)

    RepoDep = Annotated[Repo, Depends(repo)]

    def current_user(r: RepoDep, authorization: Annotated[str | None, Header()] = None) -> User:
        token = (authorization or "").removeprefix("Bearer ").strip()
        try:
            claims = tokens.verify(token)
        except InvalidToken:
            raise error(401, "unauthorized", "Нужно войти")
        user = r.user(claims["sub"])
        if not user or user.deleted_at or claims.get("ver") != user.token_version:
            raise error(401, "unauthorized", "Нужно войти")
        return user

    UserDep = Annotated[User, Depends(current_user)]

    def client_ip(request: Request) -> str:
        # Только свои прокси дописывают адреса справа: левая часть заголовка подделывается клиентом.
        if settings.trusted_proxies:
            chain = [p.strip() for p in request.headers.get("x-forwarded-for", "").split(",") if p.strip()]
            if len(chain) >= settings.trusted_proxies:
                return chain[-settings.trusted_proxies]
        return request.client.host if request.client else ""

    def ip_hash(request: Request) -> str:
        ip = client_ip(request)
        return hmac.new(settings.secret_key.encode(), ip.encode(), hashlib.sha256).hexdigest()

    def code_hash(email: str, code: str) -> str:
        return hmac.new(settings.secret_key.encode(), f"{email}:{code}".encode(), hashlib.sha256).hexdigest()

    def own_checkup(r: Repo, user: User, checkup_id: str) -> Checkup:
        ck = r.checkup(user, checkup_id)
        if not ck:
            raise error(404, "not_found", "Чекап не найден")
        return ck

    def editable(ck: Checkup) -> None:
        if ck.status != "draft":
            raise error(409, "checkup_completed", "Завершённый чекап не меняется — создайте новый")

    # --- мета и вход --------------------------------------------------------------------------

    @app.get("/api/meta")
    def meta() -> dict:
        return {"entry_questions": ENTRY_TITLES, "consent_version": CONSENT_VERSION, "disclaimer": config.DISCLAIMER}

    @app.post("/api/auth/email/request-code", response_model=RequestCodeOut, response_model_exclude_none=True)
    def request_code(body: RequestCodeIn, request: Request, r: RepoDep) -> RequestCodeOut:
        email, ip = body.email.lower(), ip_hash(request)
        now = datetime.now(timezone.utc)
        if (
            r.code_requests_since(email=email, since=now_iso(now - timedelta(minutes=10))) >= settings.codes_per_email
            or r.code_requests_since(ip_hash=ip, since=now_iso(now - timedelta(hours=1))) >= settings.codes_per_ip
        ):
            raise error(429, "too_many_requests", "Слишком много запросов кода — попробуйте позже")
        code = f"{secrets.randbelow(1_000_000):06d}"
        r.put_code(email, code_hash(email, code), now_iso(now + settings.code_ttl), ip)
        mailer.send_code(email, code)
        # Ответ одинаковый для нового и существующего e-mail
        return RequestCodeOut(dev_code=code if settings.expose_dev_code else None)

    @app.post("/api/auth/email/verify")
    def verify(body: VerifyIn, request: Request, r: RepoDep) -> dict:
        email = body.email.lower()
        row = r.code(email)
        if not row or row[1] < now_iso() or row[2] >= settings.code_attempts:
            raise error(400, "invalid_code", "Неверный или устаревший код")
        if not hmac.compare_digest(row[0], code_hash(email, body.code)):
            r.bump_attempts(email)
            r.commit()  # попытка засчитывается, хотя ответ — ошибка (сессия откатывает незафиксированное)
            raise error(400, "invalid_code", "Неверный или устаревший код")
        user = r.user_by_email(email)
        if user and user.deleted_at:
            raise error(403, "account_deleted", "Аккаунт удалён — данные будут уничтожены в течение 30 дней")
        if not user:
            if body.consent_version != CONSENT_VERSION:
                # код не сгорает: пользователь примет согласие и повторит
                raise error(400, "consent_required", "Нужно согласие на обработку персональных данных")
            user = r.create_user(email, body.consent_version, ip_hash(request))
            r.track(user.id, "signup", {})
            r.track(user.id, "consent_accepted", {"consent_version": body.consent_version})
        r.drop_code(email)
        token = tokens.issue(user.id, ver=user.token_version)
        return {"access_token": token, "user": {"id": user.id, "email": user.email}, "consent_required": False}

    @app.get("/api/me")
    def me(user: UserDep) -> dict:
        return {"user": {"id": user.id, "email": user.email}, "members": [m.model_dump() for m in user.members]}

    @app.delete("/api/me", status_code=202)
    def delete_me(user: UserDep, r: RepoDep) -> dict:
        r.mark_deleted(user.id)
        r.delete_events(user.id)
        r.track(None, "account_deleted", {})
        return {"deleted": True}

    @app.put("/api/household/members")
    def put_members(body: list[Member], user: UserDep, r: RepoDep) -> list[Member]:
        if not 1 <= len(body) <= 8:
            raise error(422, "members_limit", "В семье от 1 до 8 человек")
        members = [m if m.id else m.model_copy(update={"id": new_id("m")}) for m in body]
        ids = {m.id for m in members}
        if len(ids) != len(members):
            raise error(422, "duplicate_member", "Идентификаторы членов семьи должны быть уникальными")
        child_ids = {m.id for m in members if m.role == "child"}
        drafts = [c for c in r.checkups(user) if c.status == "draft"]
        for ck in drafts:
            used = {
                row.member_id
                for section in SECTION_ROW
                for row in getattr(ck.data, section)
                if getattr(row, "member_id", None)
            }
            if used - ids:
                raise error(409, "member_in_use", "У этого человека есть финансовые записи — сначала уберите их")
            adult_finance = {x.member_id for x in ck.data.incomes + ck.data.liabilities + ck.data.pension}
            if adult_finance & child_ids:
                raise error(409, "member_in_use", "У этого взрослого есть доходы, долги или пенсионные данные")
        r.set_members(user, members)
        for ck in drafts:
            ck.members = members
            r.save_draft(user, ck)
        return members

    # --- чекапы -------------------------------------------------------------------------------

    @app.post("/api/checkups")
    def create_checkup(body: CheckupCreate, user: UserDep, r: RepoDep) -> Checkup:
        mine = r.checkups(user)
        draft = next((c for c in mine if c.status == "draft"), None)
        if draft:
            draft.entry_question = body.entry_question
            r.save_draft(user, draft)
            return draft
        last = max((c for c in mine if c.status == "completed"), key=lambda c: c.completed_at or "", default=None)
        today = date.today()
        ck = Checkup(
            id=new_id("ck"),
            entry_question=body.entry_question,
            as_of=f"{today.year:04d}-{today.month:02d}",
            parent_checkup_id=last.id if last else None,
            members=[m.model_copy(deep=True) for m in (last.members if last else user.members)],
            data=last.data.model_copy(deep=True) if last else CheckupData(),
        )
        for goal in ck.data.goals:
            if not goal.id:
                goal.id = new_id("goal")
        r.insert_checkup(user, ck)
        r.track(user.id, "checkup_started", {"entry_question": body.entry_question})
        return ck

    @app.get("/api/checkups")
    def list_checkups(user: UserDep, r: RepoDep) -> list[dict]:
        return r.history(user)

    @app.get("/api/checkups/{checkup_id}/compare/{previous_id}")
    def compare_checkups(checkup_id: str, previous_id: str, user: UserDep, r: RepoDep) -> dict:
        after, before = own_checkup(r, user, checkup_id), own_checkup(r, user, previous_id)
        if after.id == before.id or after.status != "completed" or before.status != "completed":
            raise error(422, "invalid_comparison", "Выберите два разных завершённых чекапа")
        if before.completed_at > after.completed_at:
            raise error(422, "invalid_comparison", "В поле «Было» нужен более ранний чекап")
        saved_before, saved_after = r.report(before.id), r.report(after.id)
        if saved_before is None or saved_after is None:
            raise error(409, "report_unavailable", "Сохранённый отчёт недоступен. Пересчёт не выполнялся")
        return compare(before, saved_before, after, saved_after)

    @app.get("/api/checkups/{checkup_id}")
    def get_checkup(checkup_id: str, user: UserDep, r: RepoDep) -> Checkup:
        return own_checkup(r, user, checkup_id)

    @app.post("/api/checkups/{checkup_id}/preview")
    def preview_checkup(checkup_id: str, body: PreviewIn, user: UserDep, r: RepoDep) -> dict:
        ck = own_checkup(r, user, checkup_id)
        if ck.status == 'completed':
            saved = r.report(ck.id)
            if not saved or str(saved.get('rules_version')) != str(config.RULES_VERSION):
                raise error(409, 'preview_version', 'Версия сохранённого отчёта не поддерживает новый расчёт')
        try:
            return build_preview(ck, body)
        except ValueError as exc:
            raise error(422, 'preview_input', str(exc))

    @app.post("/api/checkups/{checkup_id}/quick")
    def quick(checkup_id: str, body: QuickIn, user: UserDep, r: RepoDep) -> Checkup:
        ck = own_checkup(r, user, checkup_id)
        editable(ck)
        adults = [m for m in ck.members if m.role == "adult"] or [Member(id="m_me", label="Я")]
        kids = [m for m in ck.members if m.role == "child"]
        for i in range(len(kids), body.children):
            kids.append(Member(id=new_id("m"), label=f"Ребёнок {i + 1}", role="child"))
        ck.members = adults + kids[: body.children]
        data = ck.data
        data.incomes = [IncomeRow(member_id=adults[0].id, kind="salary", amount=body.income)]
        data.expenses = [ExpenseRow(category_key="quick_must", title="Обязательные расходы (сводно)", tier="must", amount=body.must_expenses)]
        data.savings = [SavingsRow(kind="account", amount=body.savings, is_safety_fund=True)]
        pay = (float(body.debt_payments.min) + float(body.debt_payments.max)) / 2
        if pay > 0:
            # Остаток неизвестен: оцениваем как кредит на QUICK_DEBT_TERM мес. под QUICK_DEBT_RATE %
            rate = config.QUICK_DEBT_RATE / 100 / 12
            balance = pay * (1 - (1 + rate) ** -config.QUICK_DEBT_TERM) / rate
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
        r.set_members(user, ck.members)
        r.save_draft(user, ck)
        r.track(user.id, "quick_done", {"duration_seconds": r.checkup_elapsed(user, ck.id)}, once_key=ck.id)
        return ck

    @app.put("/api/checkups/{checkup_id}/sections/{section}")
    def put_section(checkup_id: str, section: Section, rows: list[dict], user: UserDep, r: RepoDep) -> list:
        ck = own_checkup(r, user, checkup_id)
        editable(ck)
        try:
            parsed = TypeAdapter(list[SECTION_ROW[section]]).validate_python(rows)
        except ValidationError as exc:
            raise HTTPException(
                status_code=422,
                detail={"code": "validation", "message": str(exc.errors()[0]["msg"]), "errors": exc.errors(include_url=False, include_context=False)},
            )
        member_ids = {m.id for m in ck.members}
        child_ids = {m.id for m in ck.members if m.role == "child"}
        for row in parsed:
            mid = getattr(row, "member_id", None)
            if mid and mid not in member_ids:
                raise error(422, "unknown_member", "Нет такого члена семьи")
            if mid in child_ids and section in ("incomes", "liabilities"):
                raise error(422, "child_finance", "У ребёнка не может быть доходов и долгов")
        if section == "liabilities":
            parsed = [x if x.id else x.model_copy(update={"id": new_id("li")}) for x in parsed]
            if len({x.id for x in parsed}) != len(parsed):
                raise error(422, "duplicate_liability", "Идентификаторы долгов должны быть уникальными")
        if section == "goals":
            existing = {g.id for g in ck.data.goals if g.id}
            if any(g.id and g.id not in existing for g in parsed):
                raise error(422, "unknown_goal", "Нет такой цели в этом чекапе")
            parsed = [g if g.id else g.model_copy(update={"id": new_id("goal")}) for g in parsed]
            if len({g.id for g in parsed}) != len(parsed):
                raise error(422, "duplicate_goal", "Идентификаторы целей должны быть уникальными")
        if section == "decision" and len(parsed) > 1:
            raise error(422, "single_decision", "Решение одно")
        setattr(ck.data, section, parsed)
        r.save_draft(user, ck)
        r.track(user.id, "section_done", {"section": section}, once_key=f"{ck.id}:{section}")
        return parsed

    @app.post("/api/checkups/{checkup_id}/demo")
    def fill_demo(checkup_id: str, user: UserDep, r: RepoDep) -> Checkup:
        """Заполнить чекап синтетической демо-семьёй (не ПДн)."""
        ck = own_checkup(r, user, checkup_id)
        editable(ck)
        ck.members = demo_members()
        ck.data = demo_data(ck.as_of)
        for goal in ck.data.goals:
            goal.id = new_id("goal")
        r.set_members(user, ck.members)
        r.save_draft(user, ck)
        return ck

    @app.get("/api/checkups/{checkup_id}/report")
    def get_report(checkup_id: str, user: UserDep, r: RepoDep) -> dict:
        ck = own_checkup(r, user, checkup_id)
        if ck.status == "completed":
            report = r.report_with_step_status(ck.id)
            if report is None:
                raise error(409, "report_unavailable", "Сохранённый отчёт недоступен. Пересчёт не выполнялся")
        else:
            if not ck.data.incomes and not ck.data.expenses:
                raise error(409, "not_enough_data", "Заполните хотя бы доходы и расходы")
            report = jsonable_encoder(build_report(ck))
            report["previous_steps"] = parent_context(r, user, ck, report)
            add_goal_progress(r, user, ck, report)
        r.track(user.id, "report_viewed", {"final": report["final"], "precision": report["precision"]})
        return report

    @app.post("/api/checkups/{checkup_id}/complete")
    def complete(checkup_id: str, user: UserDep, r: RepoDep, idempotency_key: Annotated[str | None, Header()] = None) -> dict:
        ck = own_checkup(r, user, checkup_id)
        if ck.status == "completed":
            saved = r.report_with_step_status(ck.id)
            if idempotency_key and saved and saved.get("idempotency_key") == idempotency_key:
                r.track(user.id, "report_viewed", {"final": saved["final"], "precision": saved["precision"]})
                return saved
            raise error(409, "checkup_completed", "Чекап уже завершён")
        if not ck.data.incomes or not ck.data.expenses:
            raise error(409, "not_enough_data", "Для итогового разбора нужны доходы и расходы")
        at = now_iso(precise=True)
        if not r.mark_completed(user, ck.id, at):
            raise error(409, "checkup_completed", "Чекап уже завершён")
        ck.status, ck.completed_at = "completed", at
        report = jsonable_encoder(build_report(ck))
        report["previous_steps"] = parent_context(r, user, ck, report)
        add_goal_progress(r, user, ck, report)
        report["idempotency_key"] = idempotency_key
        r.insert_report(user, ck.id, report)
        r.track(user.id, "checkup_completed", {"duration_seconds": r.checkup_elapsed(user, ck.id, at)})
        r.track(user.id, "report_viewed", {"final": report["final"], "precision": report["precision"]})
        return report

    @app.patch("/api/steps/{step_id}")
    def patch_step(step_id: str, body: StepPatch, user: UserDep, r: RepoDep) -> dict:
        step = r.step(user, step_id)
        if not step:
            raise error(404, "not_found", "Шаг не найден")
        at = now_iso()
        updated = {**step, "status": body.status, "status_at": at}
        if body.status == "suggested" and step.get("actions") and all(a["done"] for a in step["actions"]):
            updated["actions"] = [{**a, "done": False} if i == len(step["actions"]) - 1 else a for i, a in enumerate(step["actions"])]
        if updated == step or body.status == step["status"]:
            return step
        if not r.save_step(user, step, updated):
            raise error(409, "step_changed", "Шаг изменился. Обновите отчёт и повторите действие")
        if body.status in ("done", "dismissed"):
            r.track(user.id, f"step_{body.status}", {"rule_key": step["rule_key"]})
        return updated

    @app.patch("/api/steps/{step_id}/actions/{action_key}")
    def patch_step_action(step_id: str, action_key: str, body: StepActionPatch, user: UserDep, r: RepoDep) -> dict:
        step = r.step(user, step_id)
        if not step:
            raise error(404, "not_found", "Шаг не найден")
        action = next((a for a in step.get("actions", []) if a["key"] == action_key), None)
        if action is None:
            raise error(404, "not_found", "Действие не найдено")
        if action["done"] == body.done:
            return step
        if step["status"] != "suggested":
            raise error(409, "step_closed", "Сначала верните шаг в работу")
        actions = [{**a, "done": body.done} if a["key"] == action_key else a for a in step["actions"]]
        updated = {**step, "actions": actions, "status": "done" if all(a["done"] for a in actions) else "suggested", "status_at": now_iso()}
        if not r.save_step(user, step, updated):
            raise error(409, "step_changed", "Шаг изменился. Обновите отчёт и повторите действие")
        if body.done:
            r.track(user.id, "step_action_done", {"rule_key": step["rule_key"], "action": action_key})
        if updated["status"] == "done":
            r.track(user.id, "step_done", {"rule_key": step["rule_key"]})
        return updated

    @app.post("/api/events", status_code=204)
    def post_event(body: EventIn, user: UserDep, r: RepoDep) -> None:
        if body.name != "report_viewed":
            raise error(422, "server_event_only", "Событие создаётся сервером при выполнении действия")
        r.track(user.id, body.name, body.props)

    if not settings.production:

        @app.get("/api/dev/funnel")
        def funnel(r: RepoDep) -> dict:
            """Только dev: воронка по событиям (в проде — админка Plan)."""
            return r.funnel(FUNNEL)

    return app

