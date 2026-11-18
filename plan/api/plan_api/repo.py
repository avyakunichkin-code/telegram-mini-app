"""
Репозиторий БД `plan` (SPL-402) — заменил хранилище прототипа в памяти.

Изоляция по домохозяйству: каждый запрос чекапа, отчёта и шага фильтрует `household_id`,
чужой ресурс выглядит как отсутствующий (→ 404). Разделы чекапа — JSON-документ, валидируемый
pydantic-схемой `CheckupData` на входе и выходе.
"""

from __future__ import annotations

import json
import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .documents import CURRENT_SCHEMA_VERSION, load_checkup_data
from .schemas import Checkup, Member
from .analytics import event_props


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def now_iso(now: datetime | None = None, *, precise: bool = False) -> str:
    return (now or datetime.now(timezone.utc)).isoformat(timespec="microseconds" if precise else "seconds")


def _members_json(members: list[Member]) -> str:
    return json.dumps([m.model_dump(mode="json") for m in members], ensure_ascii=False)


def _members(raw: str) -> list[Member]:
    return [Member.model_validate(m) for m in json.loads(raw)]


class CheckupChanged(Exception):
    """Черновик успели изменить или создать параллельно (другая вкладка или устройство)."""


@dataclass
class User:
    id: str
    email: str
    household_id: str
    members: list[Member]
    token_version: int
    deleted_at: str | None


_USER_SQL = (
    "SELECT u.id, u.email, h.id, h.members_json, u.token_version, u.deleted_at "
    "FROM users u JOIN households h ON h.user_id = u.id "
)


class Repo:
    def __init__(self, session: Session):
        self.s = session

    def commit(self) -> None:
        self.s.commit()

    def _exec(self, sql: str, **params):
        return self.s.execute(text(sql), params)

    # --- пользователи -------------------------------------------------------------------------

    def _user(self, row) -> User | None:
        if not row:
            return None
        return User(id=row[0], email=row[1], household_id=row[2], members=_members(row[3]), token_version=row[4], deleted_at=row[5])

    def user(self, user_id: str) -> User | None:
        return self._user(self._exec(_USER_SQL + "WHERE u.id = :id", id=user_id).first())

    def user_by_email(self, email: str) -> User | None:
        return self._user(self._exec(_USER_SQL + "WHERE u.email = :e", e=email).first())

    def create_user(self, email: str, consent_version: str, ip_hash: str) -> User:
        uid, hid, at = new_id("u"), new_id("hh"), now_iso()
        members = [Member(id="m_me", label="Я")]
        self._exec("INSERT INTO users (id, email, created_at) VALUES (:id, :e, :at)", id=uid, e=email, at=at)
        self._exec("INSERT INTO households (id, user_id, members_json) VALUES (:id, :u, :m)", id=hid, u=uid, m=_members_json(members))
        self._exec(
            "INSERT INTO consent_log (id, user_id, consent_version, accepted_at, ip_hash) VALUES (:id, :u, :v, :at, :ip)",
            id=new_id("cl"), u=uid, v=consent_version, at=at, ip=ip_hash,
        )
        return User(id=uid, email=email, household_id=hid, members=members, token_version=0, deleted_at=None)

    def mark_deleted(self, user_id: str) -> None:
        """Вход блокируется сразу, токены отзываются через `token_version`; строки удалит `purge`."""
        self._exec(
            "UPDATE users SET deleted_at = :at, token_version = token_version + 1 WHERE id = :id", at=now_iso(), id=user_id
        )

    def set_members(self, user: User, members: list[Member]) -> None:
        self._exec("UPDATE households SET members_json = :m WHERE id = :h", m=_members_json(members), h=user.household_id)
        user.members = members

    # --- коды входа ---------------------------------------------------------------------------

    def code_requests_since(self, *, email: str | None = None, ip_hash: str | None = None, since: str) -> int:
        col, val = ("email", email) if email is not None else ("ip_hash", ip_hash)
        return self._exec(f"SELECT COUNT(*) FROM code_requests WHERE {col} = :v AND at >= :since", v=val, since=since).scalar()

    def put_code(self, email: str, code_hash: str, expires_at: str, ip_hash: str) -> None:
        self._exec("DELETE FROM email_codes WHERE email = :e", e=email)
        self._exec(
            "INSERT INTO email_codes (email, code_hash, expires_at, attempts) VALUES (:e, :h, :x, 0)", e=email, h=code_hash, x=expires_at
        )
        self._exec(
            "INSERT INTO code_requests (id, email, ip_hash, at) VALUES (:id, :e, :ip, :at)", id=new_id("cr"), e=email, ip=ip_hash, at=now_iso()
        )

    def code(self, email: str):
        return self._exec("SELECT code_hash, expires_at, attempts FROM email_codes WHERE email = :e", e=email).first()

    def bump_attempts(self, email: str) -> None:
        self._exec("UPDATE email_codes SET attempts = attempts + 1 WHERE email = :e", e=email)

    def drop_code(self, email: str) -> None:
        self._exec("DELETE FROM email_codes WHERE email = :e", e=email)

    # --- чекапы -------------------------------------------------------------------------------

    _CK = "SELECT id, entry_question, status, as_of, parent_checkup_id, completed_at, members_json, data_json, revision, schema_version FROM checkups "

    @staticmethod
    def _checkup(row) -> Checkup:
        return Checkup(
            id=row[0], entry_question=row[1], status=row[2], as_of=row[3], parent_checkup_id=row[4], completed_at=row[5],
            members=_members(row[6]), data=load_checkup_data(row[7], row[9]), revision=row[8],
        )

    def checkups(self, user: User) -> list[Checkup]:
        rows = self._exec(self._CK + "WHERE household_id = :h ORDER BY created_at", h=user.household_id).all()
        return [self._checkup(r) for r in rows]

    def checkup(self, user: User, checkup_id: str) -> Checkup | None:
        row = self._exec(self._CK + "WHERE id = :id AND household_id = :h", id=checkup_id, h=user.household_id).first()
        return self._checkup(row) if row else None

    def insert_checkup(self, user: User, ck: Checkup) -> None:
        try:
            self._exec(
                "INSERT INTO checkups (id, household_id, entry_question, status, as_of, parent_checkup_id, created_at, members_json, data_json, schema_version) "
                "VALUES (:id, :h, :q, :st, :as_of, :p, :at, :m, :d, :v)",
                id=ck.id, h=user.household_id, q=ck.entry_question, st=ck.status, as_of=ck.as_of, p=ck.parent_checkup_id,
                at=now_iso(precise=True), m=_members_json(ck.members), d=ck.data.model_dump_json(), v=CURRENT_SCHEMA_VERSION,
            )
        except IntegrityError as exc:
            raise CheckupChanged from exc

    def save_draft(self, user: User, ck: Checkup) -> None:
        """Сохранить черновик; завершённый чекап этим путём не меняется (WHERE status = 'draft')."""
        result = self._exec(
            "UPDATE checkups SET entry_question = :q, members_json = :m, data_json = :d, revision = revision + 1, schema_version = :v "
            "WHERE id = :id AND household_id = :h AND status = 'draft' AND revision = :rev",
            q=ck.entry_question, m=_members_json(ck.members), d=ck.data.model_dump_json(), v=CURRENT_SCHEMA_VERSION,
            id=ck.id, h=user.household_id, rev=ck.revision,
        )
        if result.rowcount != 1:
            raise CheckupChanged
        ck.revision += 1

    def mark_completed(self, user: User, checkup_id: str, at: str) -> bool:
        """Атомарный переход draft → completed: из двух параллельных complete выигрывает один."""
        res = self._exec(
            "UPDATE checkups SET status = 'completed', completed_at = :at WHERE id = :id AND household_id = :h AND status = 'draft'",
            at=at, id=checkup_id, h=user.household_id,
        )
        return res.rowcount == 1

    # --- отчёты и шаги ------------------------------------------------------------------------

    def report(self, checkup_id: str) -> dict | None:
        row = self._exec("SELECT payload_json FROM reports WHERE checkup_id = :c", c=checkup_id).first()
        return json.loads(row[0]) if row else None

    def history(self, user: User) -> list[dict]:
        from .history import areas
        rows = self._exec(
            "SELECT c.id, c.entry_question, c.status, c.as_of, c.completed_at, r.payload_json "
            "FROM checkups c LEFT JOIN reports r ON r.checkup_id = c.id "
            "WHERE c.household_id = :h ORDER BY CASE WHEN c.status = 'draft' THEN 0 ELSE 1 END, "
            "c.completed_at DESC, c.created_at DESC, c.id DESC", h=user.household_id,
        ).all()
        result = []
        for row in rows:
            report = json.loads(row[5]) if row[5] else None
            result.append({
                "id": row[0], "entry_question": row[1], "status": row[2], "as_of": row[3], "completed_at": row[4],
                "question": report.get("entry_answer", {}).get("question") if report else None,
                "report_available": report is not None, "areas": areas(report),
                "rules_version": report.get("rules_version") if report else None,
            })
        return result

    def insert_report(self, user: User, checkup_id: str, report: dict) -> None:
        rid = new_id("rp")
        for step in report["steps"]:
            step["id"] = new_id("st")
        self._exec(
            "INSERT INTO reports (id, checkup_id, rules_version, computed_at, idempotency_key, payload_json) VALUES (:id, :c, :rv, :at, :k, :p)",
            id=rid, c=checkup_id, rv=str(report.get("rules_version", "")), at=now_iso(), k=report.get("idempotency_key"),
            p=json.dumps(report, ensure_ascii=False),
        )
        for step in report["steps"]:
            self._exec(
                "INSERT INTO steps (id, report_id, household_id, rule_key, rank, status, payload_json) VALUES (:id, :r, :h, :k, :n, :st, :p)",
                id=step["id"], r=rid, h=user.household_id, k=step["rule_key"], n=step.get("rank", 0), st=step.get("status", "suggested"),
                p=json.dumps(step, ensure_ascii=False),
            )

    def step(self, user: User, step_id: str) -> dict | None:
        row = self._exec(
            "SELECT payload_json, status, status_at FROM steps WHERE id = :id AND household_id = :h", id=step_id, h=user.household_id
        ).first()
        if not row:
            return None
        return {**json.loads(row[0]), "status": row[1], "status_at": row[2]}

    def set_step_status(self, user: User, step_id: str, status: str, at: str) -> None:
        self._exec(
            "UPDATE steps SET status = :st, status_at = :at WHERE id = :id AND household_id = :h", st=status, at=at, id=step_id, h=user.household_id
        )

    def save_step(self, user: User, previous: dict, updated: dict) -> bool:
        """Compare-and-swap prevents concurrent action updates from losing marks."""
        row = self._exec(
            "SELECT payload_json, status, status_at FROM steps WHERE id = :id AND household_id = :h",
            id=previous["id"], h=user.household_id,
        ).first()
        if not row or {**json.loads(row[0]), "status": row[1], "status_at": row[2]} != previous:
            return False
        result = self._exec(
            "UPDATE steps SET payload_json = :p, status = :st, status_at = :at "
            "WHERE id = :id AND household_id = :h AND payload_json = :old AND status = :old_st "
            "AND (status_at = :old_at OR (status_at IS NULL AND :old_at IS NULL))",
            p=json.dumps(updated, ensure_ascii=False), st=updated["status"], at=updated["status_at"],
            id=previous["id"], h=user.household_id, old=row[0], old_st=row[1], old_at=row[2],
        )
        return result.rowcount == 1

    def report_with_step_status(self, checkup_id: str) -> dict | None:
        """Сохранённый отчёт с актуальными статусами шагов (отметка «сделано» переживает перезагрузку)."""
        report = self.report(checkup_id)
        if report:
            ids = [s["id"] for s in report["steps"]]
            if ids:
                rows = self._exec(
                    "SELECT id, status, status_at, payload_json FROM steps WHERE id IN (" + ",".join(f":s{i}" for i in range(len(ids))) + ")",
                    **{f"s{i}": sid for i, sid in enumerate(ids)},
                ).all()
                by_id = {r[0]: {**json.loads(r[3]), "status": r[1], "status_at": r[2]} for r in rows}
                for s in report["steps"]:
                    s.update(by_id.get(s["id"], {}))
        return report

    # --- события ------------------------------------------------------------------------------

    def checkup_elapsed(self, user: User, checkup_id: str, at: str | None = None) -> int:
        started = self._exec(
            "SELECT created_at FROM checkups WHERE id = :id AND household_id = :h",
            id=checkup_id, h=user.household_id,
        ).scalar_one()
        start = datetime.fromisoformat(started)
        end = datetime.fromisoformat(at or now_iso())
        return max(0, int((end - start).total_seconds()))

    def delete_events(self, user_id: str) -> None:
        self._exec("DELETE FROM product_events WHERE user_id = :u", u=user_id)

    def track(self, user_id: str | None, name: str, props: dict, *, once_key: str | None = None) -> None:
        props = event_props(name, props)
        if (name == "account_deleted") != (user_id is None):
            raise ValueError("Only account_deleted is anonymous")
        # Stable 128-bit milestone id fits the existing VARCHAR(40), SQLite/Postgres.
        event_id = "ev_" + hashlib.sha256(f"{user_id}:{name}:{once_key}".encode()).hexdigest()[:32] if once_key else new_id("ev")
        self._exec(
            "INSERT INTO product_events (id, user_id, name, props_json, at) VALUES (:id, :u, :n, :p, :at) ON CONFLICT (id) DO NOTHING",
            id=event_id, u=user_id, n=name, p=json.dumps(props, ensure_ascii=False), at=now_iso(),
        )

    def funnel(self, names: list[str]) -> dict[str, int]:
        return {
            n: self._exec("SELECT COUNT(DISTINCT user_id) FROM product_events WHERE name = :n", n=n).scalar() for n in names
        }

    # --- удаление (152-ФЗ, ст. 21) ------------------------------------------------------------

    def purge_deleted(self) -> int:
        """Удалить все строки пользователей с `deleted_at`. Запускается по расписанию (≤ 30 дней по spec)."""
        ids = [r[0] for r in self._exec("SELECT id FROM users WHERE deleted_at IS NOT NULL").all()]
        for uid in ids:
            hh = [r[0] for r in self._exec("SELECT id FROM households WHERE user_id = :u", u=uid).all()]
            for hid in hh:
                self._exec("DELETE FROM steps WHERE household_id = :h", h=hid)
                self._exec(
                    "DELETE FROM reports WHERE checkup_id IN (SELECT id FROM checkups WHERE household_id = :h)", h=hid
                )
                self._exec("DELETE FROM checkups WHERE household_id = :h", h=hid)
            email = self._exec("SELECT email FROM users WHERE id = :u", u=uid).scalar()
            self._exec("DELETE FROM households WHERE user_id = :u", u=uid)
            self._exec("DELETE FROM consent_log WHERE user_id = :u", u=uid)
            self._exec("DELETE FROM product_events WHERE user_id = :u", u=uid)
            self._exec("DELETE FROM email_codes WHERE email = :e", e=email)
            self._exec("DELETE FROM code_requests WHERE email = :e", e=email)
            self._exec("DELETE FROM users WHERE id = :u", u=uid)
        return len(ids)
