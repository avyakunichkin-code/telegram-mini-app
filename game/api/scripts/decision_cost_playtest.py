"""DC-06: observe real first finales, compare income thresholds without changing game rules."""
from __future__ import annotations

import argparse
from dataclasses import asdict
import json
from pathlib import Path
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from balance_simulate import run_balance_simulation


def capture_candidates(db, profile, outcome, period):
    from app.game.run_finale_decisions import (
        average_available_income, debt_overpaid_candidates, salary_missed_candidate, event_cost_candidate, investment_gain_candidate,
    )
    from app.models import PeriodEconomyClosing

    closings = db.query(PeriodEconomyClosing).filter(PeriodEconomyClosing.game_profile_id == profile.id).all()
    if not closings:
        raise ValueError("First finale must have closed-turn history; do not treat missing history as zero income")
    missed = salary_missed_candidate(db, profile)
    # period_income_rate contains received regular income. Add available missed salary
    # using the existing nearest-salary estimate, then divide by closed turns.
    received = sum(float(c.period_income_rate or 0) for c in closings)
    missed_amount = missed.amount if missed else 0.0
    average = average_available_income(db, profile, missed_salary_amount=missed_amount)
    candidates = debt_overpaid_candidates(db, profile)
    for candidate in (missed, event_cost_candidate(db, profile), investment_gain_candidate(db, profile)):
        if candidate is not None:
            candidates.append(candidate)
    return {
        "outcome": outcome, "period": period, "closed_turns": len(closings),
        "average_available_income": round(average, 2),
        "received_regular_income": round(received, 2),
        "missed_salary_estimate": missed_amount,
        "candidates": [asdict(c) for c in candidates],
    }


def compare_selection(audit, multiplier, mixed):
    from app.game.run_finale_decisions import KIND_ORDER

    income = audit["average_available_income"]
    if income <= 0:
        return {"eligible": False, "reason": "zero_income_requires_PO_rule"}
    threshold = income * multiplier
    passed = sorted((c for c in audit["candidates"] if c["amount"] >= threshold),
                    key=lambda c: (-c["amount"], KIND_ORDER.index(c["kind"])))
    picked = []
    for candidate in passed:
        if candidate["kind"] == "debt_overpaid" and sum(c["kind"] == "debt_overpaid" for c in picked) >= 2:
            continue
        picked.append(candidate)
        if len(picked) == 3:
            break
    displaced = None
    if mixed and len(picked) == 3:
        for direction in ("gain", "cost"):
            if not any(c["direction"] == direction for c in picked):
                replacement = next((c for c in passed if c["direction"] == direction), None)
                if replacement:
                    displaced = {"removed": picked[-1], "added": replacement}
                    picked[-1] = replacement
    picked.sort(key=lambda c: (-c["amount"], KIND_ORDER.index(c["kind"])))
    gain = next((c for c in audit["candidates"] if c["kind"] == "investment_gain"), None)
    gain_reason = ("no_positive_gain" if gain is None else "below_threshold" if gain["amount"] < threshold
                   else "selected" if gain in picked else "displaced_by_larger_amounts")
    return {"eligible": True, "threshold": threshold, "picked": picked,
            "investment_status": gain_reason, "diversity_replacement": displaced}


def write_summary(report, output):
    """Persist a readable report; summary diffs do not claim full-suite invariants."""
    from balance_diff import diff_reports
    import yaml
    report["po_threshold_decision"] = {"date": "2026-11-11", "multiplier": 1,
                                        "status": "provisional", "quote": "Давай пока 1х"}
    report["limitations"] = [s for s in report.get("limitations", []) if "expense-based" not in s]
    manifest = yaml.safe_load((BACKEND.parent / "game/docs/balance/baselines/manifest.yaml").read_text(encoding="utf-8"))
    entries = {e["id"]: e for e in manifest["baselines"]}
    for run in report["runs"]:
        baseline = json.loads((BACKEND.parent / "game/docs/balance/baselines" / entries[run["id"]]["file"]).read_text(encoding="utf-8"))
        for key in ("template_key", "policy", "rng_seed", "periods_requested"):
            if run["meta"].get(key) != baseline["meta"].get(key):
                raise ValueError(f"Incomparable baseline metadata: {run['id']} / {key}")
        run["baseline_summary_diff"] = diff_reports(run, baseline)
    report["sample"] = {
        "runs": len(report["runs"]),
        "first_finales": sum(r["finale"] is not None for r in report["runs"]),
        "no_finale_by_40": sum(r["finale"] is None for r in report["runs"]),
    }
    lines = ["# DC-06 — пороги относительно среднего дохода (2026-11-11)", "",
             "Изолированный SQLite, seed 42, горизонт 40 ходов. Кандидаты сняты на первом исходе, а не в свободной игре после победы.", "",
             "Средний доход = (полученный регулярный доход по закрытым ходам + оценка пропущенных зарплат) / число закрытых ходов. Разовые события, выдача кредита и возврат тела вложения не считаются регулярным доходом.", "",
             "## Частота карточек", "",
             "| Порог / отбор | Финалов с доходом | Пустых | Вложения выбраны | Ниже порога | Нет заработка | Вытеснены | Оба знака | Замен ради разнообразия |",
             "|---|---:|---:|---:|---:|---:|---:|---:|---:|"]
    for key, row in report["aggregate"].items():
        s = row["investment_status"]
        lines.append(f"| {key} | {row['completed_with_positive_income']} | {row['empty']} | {s['selected']} | {s['below_threshold']} | {s['no_positive_gain']} | {s['displaced_by_larger_amounts']} | {row['mixed_signs']} | {row['diversity_replacements']} |")
    lines += ["", "`largest` — крупнейшие суммы, максимум два кредита; `mixed` дополнительно сохраняет оба знака, если оба прошли порог. Это сравнение гипотез, не изменение production.", "",
              "## Партии и сравнение summary с baseline", "",
              "| Сценарий | Первый исход / ход | Ходов закрыто к 40 | Победа на ходе | Цели | cash P12 / P20 / P40 | Diff flags |",
              "|---|---|---:|---|---|---|---|"]
    for run in report["runs"]:
        f, s = run["finale"], run["summary"]
        outcome = f"{f['outcome']} / {f['period']}" if f else "нет исхода за 40 ходов"
        flags = "; ".join(run["baseline_summary_diff"]["flags"]) or "NO SIGNIFICANT DELTA"
        lines.append(f"| {run['id']} | {outcome} | {s['periods_closed']} | {s.get('win_at_period')} | {s.get('goals_met')} | {s.get('cash_p12')} / {s.get('cash_p20')} / {s.get('cash_p40')} | {flags} |")
    lines += ["", "## Кандидаты на первом исходе", "",
              "| Сценарий | Средний доступный доход | Тип / сумма | Доля месячного дохода |",
              "|---|---:|---|---:|"]
    for run in report["runs"]:
        f = run["finale"]
        if not f:
            continue
        for c in f["candidates"]:
            ratio = round(c["amount"] / f["average_available_income"], 3) if f["average_available_income"] > 0 else "—"
            lines.append(f"| {run['id']} | {f['average_available_income']} | {c['kind']} / {c['amount']} | {ratio} |")
    lines += ["", "## Вывод для PO", "",
              "После отчёта PO предварительно выбрал порог 1 среднего регулярного дохода: «Давай пока 1х» (2026-11-11). Более высокие пороги в этой выборке убирают все инвестиционные плюсы. Новое разделение вложений/изменение гарантий этим ответом отдельно не утверждено.",
              "Разнообразие можно обеспечить обоими направлениями, только когда оба прошли порог. В этой выборке largest/mixed совпали: эмпирического случая вытеснения нет; замена проверена отдельным сценарным тестом.", "",
              "## Ограничения и решения PO", "",
              "- Вложения агрегированы в одну карточку. Лимиты 1 и 2 дают одинаковый результат; две строки требуют отдельного решения о разделении кандидатов без двойного учёта.",
              "- Частоты относятся к этим фиксированным ботам, не к реальным игрокам. Сценарии без исхода за 40 ходов исключены из частот финалов.",
              "- Боты забирают зарплату каждый ход. Восстановление пропущенного дохода проверено отдельным тестом; частоту таких карточек эта выборка не оценивает.",
              "- При нулевом доходе правило ещё требует PO; такие исходы не входят в знаменатель.",
              "- Сравнение baseline выполнено по meta/summary; проверены template/policy/seed/горизонт. Полный manifest и suite-инварианты этим отчётом не заменяются. Baseline не обновлён.",
              "- Предварительно принятый порог 1× внедрён по той же формуле среднего дохода; существующее ранжирование и гарантия прошедшего порог investment_gain сохранены. Проводки и баланс не меняются. Подпись масштаба в UI A остаётся в месяцах расходов.", ""]
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    output.with_suffix(".md").write_text("\n".join(lines), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--summarize-only", action="store_true", help="Format an already completed JSON without rerunning games")
    args = parser.parse_args()
    if args.summarize_only:
        report = json.loads(args.out.read_text(encoding="utf-8"))
        if report.get("status") != "complete":
            raise ValueError("Cannot summarize incomplete games")
        write_summary(report, args.out)
        return 0
    import yaml
    manifest = yaml.safe_load((BACKEND.parent / "game/docs/balance/baselines/manifest.yaml").read_text(encoding="utf-8"))
    # Ten existing deterministic scenarios; preserve metadata and all baseline files.
    entries = [e for e in manifest["baselines"] if e["id"] != "main__student_safety_first_40p"][:10]
    runs = []
    for entry in entries:
        captured = []
        def observe(db, profile, outcome, period):
            captured.append(capture_candidates(db, profile, outcome, period))
        print(f"Running {entry['id']}", flush=True)
        result = run_balance_simulation(template_key=entry.get("template_key", manifest["defaults"]["template_key"]),
                                        policy=entry["policy"], periods=40, rng_seed=42, observe_finale=observe)
        run = {"id": entry["id"], "meta": result["meta"], "summary": result["summary"],
               "finale": captured[0] if captured else None}
        run["comparisons"] = {f"{m}x_{mode}": compare_selection(captured[0], m, mode == "mixed")
                              for m in (1, 2, 3) for mode in ("largest", "mixed")} if captured else {}
        runs.append(run)
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps({"status": "running", "runs": runs}, ensure_ascii=False, indent=2), encoding="utf-8")
    aggregate = {}
    for m in (1, 2, 3):
        for mode in ("largest", "mixed"):
            key = f"{m}x_{mode}"
            rows = [r["comparisons"][key] for r in runs if key in r["comparisons"] and r["comparisons"][key]["eligible"]]
            aggregate[key] = {
                "completed_with_positive_income": len(rows),
                "empty": sum(not r["picked"] for r in rows),
                "card_counts": {str(n): sum(len(r["picked"]) == n for r in rows) for n in range(4)},
                "investment_status": {s: sum(r["investment_status"] == s for r in rows)
                                      for s in ("no_positive_gain", "below_threshold", "selected", "displaced_by_larger_amounts")},
                "mixed_signs": sum(len({c["direction"] for c in r["picked"]}) == 2 for r in rows),
                "diversity_replacements": sum(r["diversity_replacement"] is not None for r in rows),
            }
    report = {
        "status": "complete", "schema_version": 1,
        "method": "first finale; received regular income + estimated missed salary / closed turns; thresholds >= 1/2/3x",
        "limitations": ["Investment gain is one aggregate candidate: caps 1 and 2 are equivalent.",
                        "Fixed bots/seeds are coverage, not real-player frequency.",
                        "No skipped-salary policy in this sample; missed salary reconstruction needs separate scenarios.",
                        "Zero-income outcomes excluded pending PO rule; no-finale runs excluded.",
                        "PO provisionally selected 1x average income; other selection rules are unchanged."],
        "aggregate": aggregate, "runs": runs,
    }
    write_summary(report, args.out)
    print(json.dumps(aggregate, ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
