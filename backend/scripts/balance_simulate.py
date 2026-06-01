#!/usr/bin/env python3
"""
Headless balance playtest: N periods via TestClient, fixed bot policies, JSON report.

Policies:
  tutorial      — salary -> events (max affordable cash_delta) -> safety 5k (1x) -> deposit 10k (1x)
  safety_first  — same events; prioritize safety fund until baseline target
  passive       — salary -> events (min affordable cash_delta); no proactive safety/invest

See docs/decisions/ADR-009-metrics-dictionary-tb1.md, docs/balance/README.md

Usage (from backend/):
  python scripts/balance_simulate.py --policy tutorial --periods 40 --out report.json
  python scripts/balance_simulate.py --policy safety_first --format md
"""

from __future__ import annotations

import argparse
import json
import os
import random
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

PolicyName = Literal["tutorial", "safety_first", "passive"]

SCHEMA_VERSION = 1
DEFAULT_TEMPLATE = "mq_game_basic_v1"
DEFAULT_PERIODS = 40

BACKEND = Path(__file__).resolve().parents[1]


def _rebind_sqlite_engine(db_file: str) -> None:
    """Point SQLAlchemy at a fresh SQLite file (safe for repeated pytest calls)."""
    url = f"sqlite:///{db_file.replace(chr(92), '/')}"
    os.environ["DATABASE_URL"] = url
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.config import config
    from app import database

    config.DATABASE_URL = url
    database.engine.dispose()
    database.engine = create_engine(url, connect_args={"check_same_thread": False})
    database.SessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=database.engine,
    )
    # main.py keeps its own `engine` import — sync for ensure_schema_compatibility()
    import main as main_module

    main_module.engine = database.engine


def _git_sha_short() -> str | None:
    try:
        r = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=BACKEND.parent,
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if r.returncode == 0:
            return r.stdout.strip() or None
    except (OSError, subprocess.TimeoutExpired):
        pass
    return None


def _choice_cash_delta(ch: dict) -> float:
    impacts = ch.get("impacts") or []
    delta = 0.0
    if isinstance(impacts, list):
        for imp in impacts:
            if isinstance(imp, dict) and imp.get("kind") == "cash":
                delta = float(imp.get("delta") or 0)
                break
    elif isinstance(impacts, dict):
        delta = float(impacts.get("cash_delta") or 0)
    return float(ch.get("cash_delta") or delta)


def _pick_event_choice(choices: list[dict], cash: float, mode: Literal["max", "min"]) -> dict | None:
    affordable: list[tuple[float, dict]] = []
    for ch in choices:
        delta = _choice_cash_delta(ch)
        if delta < 0 and cash + delta < -1e-6:
            continue
        affordable.append((delta, ch))
    if not affordable:
        return choices[0] if choices else None
    if mode == "max":
        return max(affordable, key=lambda x: x[0])[1]
    return min(affordable, key=lambda x: x[0])[1]


@dataclass
class SimState:
    policy: PolicyName
    safety_once_done: bool = False
    invest_once_done: bool = False
    salaries_claimed: int = 0
    periods_attempted: int = 0
    events_resolved: int = 0
    event_cash_deltas: list[float] = field(default_factory=list)


def run_balance_simulation(
    *,
    template_key: str = DEFAULT_TEMPLATE,
    periods: int = DEFAULT_PERIODS,
    policy: PolicyName = "tutorial",
    profile_name: str = "Balance Sim",
    rng_seed: int | None = 42,
) -> dict[str, Any]:
    """Run simulation in isolated SQLite DB; return JSON-serializable report."""
    if rng_seed is not None:
        random.seed(rng_seed)

    db_file = os.path.join(tempfile.gettempdir(), f"balance_sim_{uuid.uuid4().hex}.db")
    os.environ.setdefault("SECRET_KEY", "balance-sim-dev")

    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))
    _rebind_sqlite_engine(db_file)

    import app.models  # noqa: F401
    from app.auth import create_access_token, get_password_hash
    from app.database import Base, engine, get_db
    from app.events.mvp11_seeds import ensure_mvp11_event_catalog
    from app.models import User
    from fastapi.testclient import TestClient
    from main import app, ensure_schema_compatibility
    from sqlalchemy.orm import sessionmaker

    Base.metadata.create_all(bind=engine)
    ensure_schema_compatibility()
    SessionLocal = sessionmaker(bind=engine)

    def _override_get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db

    db = SessionLocal()
    user = User(
        username=f"bal_{uuid.uuid4().hex[:8]}",
        hashed_password=get_password_hash("secret"),
        email=f"bal_{uuid.uuid4().hex}@example.com",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = int(user.id)
    try:
        ensure_mvp11_event_catalog(db)
        db.commit()
    finally:
        db.close()

    headers = {"Authorization": f"Bearer {create_access_token({'sub': user_id})}"}
    client = TestClient(app)
    state = SimState(policy=policy)
    period_rows: list[dict[str, Any]] = []

    def overview() -> dict:
        r = client.get("/api/finance/overview", headers=headers)
        r.raise_for_status()
        return r.json()

    def start_game() -> None:
        r = client.post(
            "/api/game/start",
            headers=headers,
            json={
                "profile_name": profile_name,
                "save_kind": "game",
                "template_key": template_key,
            },
        )
        r.raise_for_status()

    def _pending_events() -> list[dict]:
        r = client.get("/api/game/events/pending", headers=headers)
        r.raise_for_status()
        payload = r.json()
        events = list(payload.get("events") or [])
        if not events and payload.get("event"):
            events = [payload["event"]]
        return events

    def _choose_one_event(ev: dict, cash: float, *, force: bool = False) -> bool:
        eid = ev.get("id")
        choices = ev.get("choices") or []
        if not choices:
            return False
        mode: Literal["max", "min"] = "min" if policy == "passive" else "max"
        best = _pick_event_choice(choices, cash, mode) if not force else None
        if best is None:
            best = choices[0]
        delta = _choice_cash_delta(best)
        cr = client.post(
            f"/api/game/events/{eid}/choose",
            headers=headers,
            json={"choice_id": best["id"]},
        )
        if cr.status_code == 200:
            state.events_resolved += 1
            state.event_cash_deltas.append(delta)
            return True
        for ch in sorted(choices, key=_choice_cash_delta):
            cr2 = client.post(
                f"/api/game/events/{eid}/choose",
                headers=headers,
                json={"choice_id": ch["id"]},
            )
            if cr2.status_code == 200:
                state.events_resolved += 1
                state.event_cash_deltas.append(_choice_cash_delta(ch))
                return True
        return False

    def pick_events() -> None:
        for _round in range(8):
            events = _pending_events()
            if not events:
                return
            ov = overview()
            cash = float(ov.get("cash_balance") or 0)
            resolved_any = False
            for ev in events:
                if _choose_one_event(ev, cash):
                    resolved_any = True
                    ov = overview()
                    cash = float(ov.get("cash_balance") or 0)
                elif _choose_one_event(ev, cash, force=True):
                    resolved_any = True
                    ov = overview()
                    cash = float(ov.get("cash_balance") or 0)
            if not resolved_any:
                return

    def maybe_safety_tutorial() -> None:
        if policy != "tutorial" or state.safety_once_done:
            return
        ov = overview()
        cash = float(ov.get("cash_balance") or 0)
        if cash >= 10_000:
            amt = min(5_000.0, cash - 5_000)
            if amt >= 1_000:
                r = client.post(
                    "/api/game/period/contribute-to-safety-fund",
                    headers=headers,
                    json={"amount": amt},
                )
                if r.status_code == 200:
                    state.safety_once_done = True

    def maybe_safety_first() -> None:
        if policy != "safety_first":
            return
        ov = overview()
        cash = float(ov.get("cash_balance") or 0)
        safety = float(ov.get("safety_fund_balance") or 0)
        target = float(ov.get("safety_fund_baseline_target") or 0)
        if target <= 0 or safety >= target - 1:
            return
        buffer_cash = 5_000.0
        need = target - safety
        amt = min(need, max(0.0, cash - buffer_cash))
        if amt >= 500:
            r = client.post(
                "/api/game/period/contribute-to-safety-fund",
                headers=headers,
                json={"amount": round(amt, 2)},
            )
            if r.status_code == 200:
                state.safety_once_done = True

    def maybe_invest() -> None:
        if policy == "passive":
            return
        if policy == "tutorial" and state.invest_once_done:
            return
        ov = overview()
        cash = float(ov.get("cash_balance") or 0)
        mech = ov.get("mechanics_effective") or ov.get("mechanics") or {}
        if not mech.get("capital_invest"):
            return
        if policy == "safety_first":
            safety = float(ov.get("safety_fund_balance") or 0)
            target = float(ov.get("safety_fund_baseline_target") or 0)
            if target > 0 and safety < target - 1:
                return
        if state.invest_once_done:
            return
        if cash >= 25_000:
            r = client.post(
                "/api/invest/deposit/open",
                headers=headers,
                json={"amount": 10_000, "annual_rate_percent": 14.0},
            )
            if r.status_code == 200:
                state.invest_once_done = True

    def claim_salary() -> None:
        r = client.post("/api/game/period/claim-salary", headers=headers)
        if r.status_code == 200:
            state.salaries_claimed += 1

    def close_period() -> dict:
        for attempt in range(6):
            pick_events()
            r = client.post("/api/game/time/next", headers=headers)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 400:
                detail = str(r.json().get("detail") or r.text or "")
                if "обязательн" in detail.lower() or "событ" in detail.lower():
                    pick_events()
                    continue
                if "игра окончена" in detail.lower() or "game over" in detail.lower():
                    return {
                        "game_over": True,
                        "defeat_reason": "cash_negative_streak",
                        "detail": detail,
                        "period_close": {},
                    }
            r.raise_for_status()
        return {"game_over": False, "period_close": {}}

    def snapshot_row(period: int, phase: str, close_body: dict | None = None) -> dict:
        ov = overview()
        pc = (close_body or {}).get("period_close") or {}
        v = ov.get("victory") or {}
        structural = float(ov.get("total_monthly_obligations") or 0)
        lifestyle = float(ov.get("monthly_burn_total") or 0)
        cash = float(ov.get("cash_balance") or 0)
        safety = float(ov.get("safety_fund_balance") or 0)
        return {
            "period": period,
            "phase": phase,
            "cash": round(cash, 2),
            "safety": round(safety, 2),
            "liquid": round(cash + safety, 2),
            "net_cf": round(float(ov.get("net_monthly_cashflow") or 0), 2),
            "structural_obligations": round(structural, 2),
            "lifestyle_burn": round(lifestyle, 2),
            "outflow": round(structural + lifestyle, 2),
            "overdue": round(float(ov.get("total_overdue_amount") or 0), 2),
            "neg_streak": int(pc.get("negative_streak") or ov.get("negative_periods_count") or 0),
            "win": bool(ov.get("win_reached")),
            "is_active": bool(ov.get("is_active", True)),
            "goal": v.get("current_goal_key"),
            "goals_met": v.get("goals_met"),
            "goals_enabled": v.get("goals_enabled"),
            "goals_required": v.get("goals_required"),
            "period_gate_open": v.get("period_gate_open"),
        }

    try:
        start_game()
        period_rows.append(snapshot_row(0, "start"))

        win_at_period: int | None = None
        defeated = False
        defeat_reason: str | None = None
        periods_to_safety_3x: int | None = None

        for p in range(1, periods + 1):
            state.periods_attempted = p
            claim_salary()
            pick_events()
            if policy == "tutorial":
                maybe_safety_tutorial()
            elif policy == "safety_first":
                maybe_safety_first()
            maybe_invest()
            close_body = close_period()
            row = snapshot_row(p, "closed", close_body)
            period_rows.append(row)

            ov = overview()
            target = float(ov.get("safety_fund_baseline_target") or 0)
            safety = float(ov.get("safety_fund_balance") or 0)
            if periods_to_safety_3x is None and target > 0 and safety >= target - 1:
                periods_to_safety_3x = p

            if row["win"] and win_at_period is None:
                win_at_period = p

            if close_body.get("game_over"):
                defeated = True
                defeat_reason = close_body.get("defeat_reason") or "game_over"
                row["is_active"] = False
                period_rows[-1] = row
                break

            if not ov.get("is_active", True):
                defeated = True
                pc = close_body.get("period_close") or {}
                defeat_reason = pc.get("defeat_reason") or "inactive_profile"
                break

        final_ov = overview()
        last = period_rows[-1]
        v = final_ov.get("victory") or {}
        max_neg = max((r.get("neg_streak") or 0) for r in period_rows)
        max_overdue = max((r.get("overdue") or 0) for r in period_rows)
        n_periods_closed = last["period"] if last["phase"] == "closed" else 0

        deltas = state.event_cash_deltas
        avg_delta = round(sum(deltas) / len(deltas), 2) if deltas else 0.0

        summary = {
            "win_at_period": win_at_period,
            "defeated": defeated,
            "defeat_reason": defeat_reason,
            "goals_met": v.get("goals_met"),
            "goals_enabled": v.get("goals_enabled"),
            "goals_required": v.get("goals_required"),
            "period_gate_open": v.get("period_gate_open"),
            "win_reached": bool(final_ov.get("win_reached")),
            "period_index": final_ov.get("period_index"),
            "cash_end": last.get("cash"),
            "safety_end": last.get("safety"),
            "liquid_end": last.get("liquid"),
            "max_neg_streak": max_neg,
            "max_overdue": max_overdue,
            "periods_closed": n_periods_closed,
            "periods_to_safety_3x": periods_to_safety_3x,
            "safety_target": round(float(final_ov.get("safety_fund_baseline_target") or 0), 2),
            "salary_claim_rate": round(
                state.salaries_claimed / max(1, n_periods_closed), 4
            ),
            "events_resolved": state.events_resolved,
            "avg_event_cash_delta": avg_delta,
            "avg_net_cashflow_6p": final_ov.get("avg_net_cashflow_6p"),
            "avg_net_cashflow_6p_n": final_ov.get("avg_net_cashflow_6p_n"),
        }

        for milestone in (12, 20, 30, 40):
            key = f"cash_p{milestone}"
            row_m = next((r for r in period_rows if r["period"] == milestone), None)
            summary[key] = row_m["cash"] if row_m else None
            summary[f"liquid_p{milestone}"] = row_m["liquid"] if row_m else None
            summary[f"safety_p{milestone}"] = row_m["safety"] if row_m else None

        report = {
            "meta": {
                "schema_version": SCHEMA_VERSION,
                "template_key": template_key,
                "policy": policy,
                "periods_requested": periods,
                "periods_closed": n_periods_closed,
                "git_sha": _git_sha_short(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "rng_seed": rng_seed,
            },
            "summary": summary,
            "periods": period_rows,
        }
        return report
    finally:
        app.dependency_overrides.clear()
        try:
            os.remove(db_file)
        except OSError:
            pass


def format_report_markdown(report: dict[str, Any]) -> str:
    meta = report["meta"]
    s = report["summary"]
    lines = [
        f"# Balance playtest: `{meta['template_key']}` / `{meta['policy']}`",
        "",
        f"- **Периодов:** {s['periods_closed']} / {meta['periods_requested']}",
        f"- **git:** {meta.get('git_sha') or 'n/a'} | **UTC:** {meta.get('timestamp', '')[:19]}",
        "",
        "## Сводка",
        "",
        f"| Метрика | Значение |",
        f"|---------|----------|",
        f"| win_at_period | {s.get('win_at_period')} |",
        f"| win_reached | {s.get('win_reached')} |",
        f"| goals_met | {s.get('goals_met')}/{s.get('goals_enabled')} |",
        f"| defeated | {s.get('defeated')} ({s.get('defeat_reason') or '-'}) |",
        f"| cash_end | {s.get('cash_end'):,.0f} |" if s.get("cash_end") is not None else "| cash_end | - |",
        f"| safety_end | {s.get('safety_end'):,.0f} |" if s.get("safety_end") is not None else "| safety_end | - |",
        f"| liquid_end | {s.get('liquid_end'):,.0f} |" if s.get("liquid_end") is not None else "| liquid_end | - |",
        f"| max_neg_streak | {s.get('max_neg_streak')} |",
        f"| max_overdue | {s.get('max_overdue'):,.0f} |" if s.get("max_overdue") is not None else "| max_overdue | - |",
        f"| periods_to_safety_3x | {s.get('periods_to_safety_3x')} |",
        f"| events_resolved | {s.get('events_resolved')} |",
        f"| salary_claim_rate | {s.get('salary_claim_rate')} |",
        "",
        "## Ряд (сокращённо)",
        "",
        "| P | cash | safety | liquid | net_cf* | outflow | overdue | neg | win | goal |",
        "|---|-----:|-------:|-------:|--------:|--------:|--------:|----:|:---:|------|",
    ]
    for r in report.get("periods", []):
        if r["period"] > 0 and r["period"] % 4 != 0 and r["period"] != report["summary"]["periods_closed"]:
            continue
        win = "Y" if r.get("win") else ""
        goal = (r.get("goal") or "-")[:20]
        lines.append(
            f"| {r['period']} | {r['cash']:,.0f} | {r['safety']:,.0f} | {r['liquid']:,.0f} | "
            f"{r['net_cf']:,.0f} | {r['outflow']:,.0f} | {r['overdue']:,.0f} | "
            f"{r.get('neg_streak', '')} | {win} | {goal} |"
        )
    lines.append("")
    lines.append("*net_cf = structural net (без lifestyle burn), ADR-009.*")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Balance playtest simulation")
    parser.add_argument("--template", default=DEFAULT_TEMPLATE)
    parser.add_argument("--periods", type=int, default=DEFAULT_PERIODS)
    parser.add_argument(
        "--policy",
        choices=["tutorial", "safety_first", "passive"],
        default="tutorial",
    )
    parser.add_argument("--out", type=Path, help="Write JSON report to file")
    parser.add_argument(
        "--format",
        choices=["json", "md", "both"],
        default="json",
        help="stdout format when --out not set for md",
    )
    parser.add_argument(
        "--rng-seed",
        type=int,
        default=42,
        help="RNG seed for event pool (default 42; use -1 for nondeterministic)",
    )
    args = parser.parse_args(argv)

    seed: int | None = None if args.rng_seed < 0 else args.rng_seed
    report = run_balance_simulation(
        template_key=args.template,
        periods=args.periods,
        policy=args.policy,  # type: ignore[arg-type]
        rng_seed=seed,
    )

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Wrote {args.out}", file=sys.stderr)

    if args.format in ("json", "both") and not args.out:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    elif args.format in ("json", "both") and args.out:
        pass
    elif args.format in ("md", "both"):
        print(format_report_markdown(report))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
