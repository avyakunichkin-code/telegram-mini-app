"""Isolated A/B: current Student v2 versus freelance offer in a normal slot at P5.

Only temporary simulation DB and process-local patches; no YAML/runtime changes.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from contextlib import ExitStack
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from balance_simulate import run_balance_simulation
import balance_simulate

OFFER = "mq11_freelance_project_offer"


def run_case(*, early: bool, seed: int, policy: str, periods: int = 40, progress: bool = False) -> dict:
    from app.models import EventChoice, EventDefinition, EventInstance
    from app.services.events import spawn
    from anyio.from_thread import start_blocking_portal
    import fastapi.testclient

    original_schedule = spawn.ensure_scheduled_chain_events
    original_pick = spawn._pick_diverse_period_events
    trace: dict[int, dict] = {}
    current_period = 0
    captured_period = 0

    def schedule(db, profile_id, period):
        nonlocal current_period, captured_period
        current_period = period
        if early:
            offer = db.query(EventDefinition).filter(EventDefinition.key == OFFER).one()
            # Only the offer's eligibility at P5 changes. Follow-ups/effects stay intact.
            offer.event_tier = 1 if period == 5 else 2
            db.flush()
        result = original_schedule(db, profile_id, period)
        if period == captured_period:
            return result
        captured_period = period
        if progress and period % 5 == 0:
            print(f"  {policy} seed{seed} {'early' if early else 'control'} P{period}", flush=True)
        for inst, definition, choice in (
            db.query(EventInstance, EventDefinition, EventChoice)
            .join(EventDefinition, EventDefinition.id == EventInstance.definition_id)
            .outerjoin(EventChoice, EventChoice.id == EventInstance.selected_choice_id)
            .filter(EventInstance.game_profile_id == profile_id).all()
        ):
            trace[inst.id] = {"period": inst.period_index, "key": definition.key,
                              "status": inst.status, "choice": choice.title if choice else None}
        return result

    def pick(candidates, k, counters, **kwargs):
        offer = next((row for row in candidates if row.key == OFFER), None)
        if early and current_period == 5 and offer is not None and k > 0:
            # Replace one random slot, never add a third ordinary event.
            return [offer] + original_pick([row for row in candidates if row.key != OFFER],
                                          k - 1, counters, **kwargs)
        return original_pick(candidates, k, counters, **kwargs)

    # Reuse TestClient's blocking portal for this run: Windows socketpair creation
    # per request is costly. No lifespan/startup invocation or HTTP semantics change.
    original_client = fastapi.testclient.TestClient
    original_rebind = balance_simulate._rebind_sqlite_engine

    def rebind(db_file):
        original_rebind(db_file)
        from app.database import engine
        from sqlalchemy import event

        def configure(connection, _record):
            connection.execute("PRAGMA synchronous=OFF")
            connection.execute("PRAGMA journal_mode=MEMORY")

        # This disposable DB is not a durability/crash test. Avoid Windows fsync
        # overhead while retaining the same SQL transactions and financial rules.
        event.listen(engine, "connect", configure)
        with engine.connect() as connection:
            configure(connection.connection.driver_connection, None)

    with ExitStack() as stack:
        portal = stack.enter_context(start_blocking_portal())

        def client_factory(*args, **kwargs):
            client = original_client(*args, **kwargs)
            client.portal = portal
            stack.callback(client.close)
            return client

        stack.enter_context(patch.object(fastapi.testclient, "TestClient", client_factory))
        stack.enter_context(patch.object(balance_simulate, "_rebind_sqlite_engine", rebind))
        stack.enter_context(patch.object(spawn, "ensure_scheduled_chain_events", schedule))
        stack.enter_context(patch.object(spawn, "_pick_diverse_period_events", pick))
        report = run_balance_simulation(policy=policy, periods=periods, rng_seed=seed,
                                        guest_start=True)
    report["meta"]["experiment"] = "freelance_p5" if early else "control"
    report["event_trace"] = sorted(trace.values(), key=lambda row: (row["period"], row["key"]))
    return report


def compare(control: dict, early: dict) -> dict:
    from balance_diff import diff_reports

    diff = diff_reports(early, control)
    keys = ["win_at_period", "goals_met_peak", "defeated", "defeat_reason", "periods_closed",
            "cash_p12", "cash_p20", "cash_p40", "events_resolved"]
    return {"seed": control["meta"]["rng_seed"], "policy": control["meta"]["policy"],
            "control": {key: control["summary"].get(key) for key in keys},
            "early": {key: early["summary"].get(key) for key in keys},
            "flags": diff["flags"], "meta_mismatch": diff["meta_mismatch"],
            "freelance_control": [row for row in control["event_trace"] if row["key"].startswith("mq11_freelance")],
            "freelance_early": [row for row in early["event_trace"] if row["key"].startswith("mq11_freelance")]}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    # CLI only, before application imports; importing this module does not alter env.
    os.environ["PYTHON_DOTENV_DISABLED"] = "1"
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["SECRET_KEY"] = "synthetic-freelance-experiment-only-32chars"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--seeds", type=int, nargs="+", default=[7, 42, 99])
    parser.add_argument("--policies", nargs="+", choices=["chain_runner", "needs_keeper", "tutorial"],
                        default=["chain_runner", "needs_keeper"])
    parser.add_argument("--periods", type=int, default=40)
    parser.add_argument("--resume", action="store_true", help="Reuse reports with matching experiment metadata")
    args = parser.parse_args()
    if args.periods < 10:
        parser.error("At least 10 periods required for scheduled follow-ups")
    args.out.mkdir(parents=True, exist_ok=True)
    comparisons = []
    for policy in args.policies:
        for seed in args.seeds:
            pair = []
            for early in (False, True):
                name = f"{policy}_{seed}_{'early' if early else 'control'}.json"
                cached = args.out / name
                report = json.loads(cached.read_text(encoding="utf-8")) if args.resume and cached.exists() else None
                expected = {"rng_seed": seed, "policy": policy, "periods_requested": args.periods,
                            "onboarding_version": 2, "template_key": "mq_game_basic_v1",
                            "experiment": "freelance_p5" if early else "control"}
                if report is not None and any(report.get("meta", {}).get(key) != value for key, value in expected.items()):
                    raise ValueError("Cached report metadata mismatch")
                print(f"Running {policy} seed{seed} {'early' if early else 'control'}", flush=True)
                if report is None:
                    report = run_case(early=early, seed=seed, policy=policy, periods=args.periods, progress=True)
                (args.out / name).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
                pair.append(report)
            comparison = compare(*pair)
            comparisons.append(comparison)
            print(json.dumps(comparison, ensure_ascii=False), flush=True)
    (args.out / "comparison.json").write_text(json.dumps(comparisons, ensure_ascii=False, indent=2), encoding="utf-8")
    # Completion is not balance acceptance. Flags are retained in comparison.json.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
