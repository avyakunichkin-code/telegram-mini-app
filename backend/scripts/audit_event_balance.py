"""Разовый аудит trade-off каталога (§1–§3 balance_contract + эвристики §2)."""
from __future__ import annotations

from app.events.balance_contract import (
    _choice_vector,
    _needs_sum_positive,
    is_free_lunch,
    validate_event_spec,
    validate_mvp11_balance,
)
from app.events.mvp11_catalog import clear_mvp11_catalog_cache, load_mvp11_catalog


def main() -> None:
    clear_mvp11_catalog_cache()
    specs, _ = load_mvp11_catalog(force_reload=True)
    violations = validate_mvp11_balance(specs)
    print(f"Specs: {len(specs)} | balance_contract violations: {len(violations)}")

    refusal_issues: list[tuple] = []
    neutral_refusal: list[tuple] = []
    for spec in specs:
        key = spec["key"]
        choices = spec.get("choices") or []
        for i, ch in enumerate(choices):
            if not isinstance(ch, dict):
                continue
            eff = ch.get("effects") or {}
            cash = float(eff.get("cash_delta", 0) or 0)
            needs_p = _needs_sum_positive(eff)
            needs_n = sum(
                min(0.0, float((eff.get("needs_delta") or {}).get(ax, 0) or 0))
                for ax in ("comfort", "status", "social", "health")
            )
            title = str(ch.get("title") or i)
            if cash >= 0 and needs_p > 0.5:
                refusal_issues.append((key, title, cash, needs_p, eff.get("needs_delta")))
            if cash >= 0 and abs(needs_p) < 0.01 and abs(needs_n) < 0.01:
                neutral_refusal.append((key, title))

        # paid vs free: free has MORE needs+
        effects_list = [ch.get("effects") or {} for ch in choices if isinstance(ch, dict)]
        titles = [str(ch.get("title") or i) for i, ch in enumerate(choices)]
        for i, ea in enumerate(effects_list):
            for j, eb in enumerate(effects_list):
                if i >= j:
                    continue
                ca = float(ea.get("cash_delta", 0) or 0)
                cb = float(eb.get("cash_delta", 0) or 0)
                if ca >= 0 and cb < -1e-6 and _needs_sum_positive(ea) > _needs_sum_positive(eb) + 0.01:
                    print(
                        f"WARN paid worse than free: {key} | "
                        f"free={titles[i]} needs+={_needs_sum_positive(ea)} | "
                        f"paid={titles[j]} needs+={_needs_sum_positive(eb)} cash={cb}"
                    )
                if cb >= 0 and ca < -1e-6 and _needs_sum_positive(eb) > _needs_sum_positive(ea) + 0.01:
                    print(
                        f"WARN paid worse than free: {key} | "
                        f"free={titles[j]} needs+={_needs_sum_positive(eb)} | "
                        f"paid={titles[i]} needs+={_needs_sum_positive(ea)} cash={ca}"
                    )

    print("\n=== Refusal with needs+ (§2 violation heuristic) ===")
    for row in refusal_issues:
        print(row)

    print("\n=== Neutral 0/0 choices ===")
    for row in neutral_refusal:
        print(row)

    print("\n=== Vectors (choice events) ===")
    for spec in specs:
        choices = spec.get("choices") or []
        if len(choices) < 2:
            continue
        ik = spec.get("interaction_kind", "choice")
        if ik != "choice":
            continue
        key = spec["key"]
        print(f"--- {key} tier={spec.get('event_tier')} ---")
        for ch in choices:
            eff = ch.get("effects") or {}
            print(
                f"  {ch.get('title')}: vec={_choice_vector(eff)} "
                f"free_lunch={is_free_lunch(eff)}"
            )
        per_spec = validate_event_spec(spec)
        if per_spec:
            print(f"  VIOLATIONS: {per_spec}")


if __name__ == "__main__":
    main()
