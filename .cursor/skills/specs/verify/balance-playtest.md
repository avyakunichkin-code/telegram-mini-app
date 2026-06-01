# Spec: balance-playtest

## Purpose

Headless N-period simulation + JSON baseline diff for balance regressions.

## Acceptance

- [ ] `balance_simulate.py` writes schema_version 1 JSON with meta + summary + periods.
- [ ] Policies: tutorial, safety_first, passive.
- [ ] `balance_diff.py` compares current vs baseline; flags REGRESSION heuristics.
- [ ] Baseline `docs/balance/baselines/main__student_tutorial_40p.json` committed.
- [ ] Skill `/balance-playtest` and agent `economy-balance-runner` documented in router.
- [ ] Does not duplicate economy-reviewer pytest gate.

## References

- `docs/balance/README.md`
- ADR-009
- `backend/scripts/balance_simulate.py`, `balance_diff.py`
