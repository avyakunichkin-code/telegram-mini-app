---
layer: plan
epic_id: M1.2
phase: build
status: approved
owner: product
last_reviewed: 2026-09-07
spec: ../specs/features/SPEC_quality-release.md
related:
  - ../plans/PLAN_production-ready.md
  - ../audits/qa/2026-09-07-mechanics.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
verdict: APPROVED
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/approved
aliases:
  - PLAN_pr-02
  - PR-02
---
# Plan: PR-02 — lock salary / choose + FE Idempotency-Key

**Эпик:** `M1.2` · **Статус:** APPROVED 2026-09-07.

**Зачем:** две вкладки / retry дают две зарплаты или два apply события. Close защищён PR-01.

**Решение:** серверный ключ `profile+period:salary` и `profile+event:choose` (как PR-01). FE ставит `Idempotency-Key` на денежные POST, где повтор без ключа легален. Choose replay = 200.

**Не в срезе:** обязательный заголовок; CI; preview close; антидаблклик contribute.

## Critical scenarios

| ID | Scenario | Layer | Command |
|----|----------|-------|---------|
| CS-1 | Один claim +salary; повтор `already_claimed` | unit | `pytest tests/unit/period/test_salary_lock.py tests/unit/game/test_period_money_property_lite.py -q` |
| CS-2 | Concurrent claim — одна выплата | unit | `pytest tests/unit/period/test_salary_lock.py -q` |
| CS-3 | Повтор choose того же event — 200, cash один раз | unit + integration | `pytest tests/unit/events/test_choose_lock.py tests/integration/api/test_choose_replay.py -q` |
| CS-4 | Concurrent choose — один `selected` | unit | `pytest tests/unit/events/test_choose_lock.py -q` |
| CS-5 | FE `Idempotency-Key` на contribute, не на salary/choose/time/next | utils | `npm run test:utils` |

## Verify

```
cd backend && py -3 -m pytest tests/unit/game/test_period_money_property_lite.py tests/unit/period/test_salary_lock.py tests/unit/events/test_choose_lock.py tests/integration/api/test_choose_replay.py -q
cd frontend-react && npm run test:utils
```

`periodCloseBreakdown.test.js` красный **до** этого PR — не чинили.
