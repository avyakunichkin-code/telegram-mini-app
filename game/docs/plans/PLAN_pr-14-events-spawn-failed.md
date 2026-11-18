---
layer: plan
epic_id: M1.2
phase: build
status: approved
owner: product
last_reviewed: 2026-09-07
spec:
idea: ../audits/ai/2026-09-07-ai-proposals.md
related:
  - ../plans/PLAN_production-ready.md
  - ../audits/ai/2026-09-07-runtime-and-dev-ai.md
  - ../audits/qa/2026-09-07-mechanics.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
verdict: APPROVED
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/approved
aliases:
  - PLAN_pr-14
  - PR-14
  - events_spawn_failed
---
# Plan: PR-14 — `events_spawn_failed`

**Эпик:** `M1.2` · **Статус:** APPROVED 2026-09-07 · **Skill после плана:** `incremental-implementation` + TDD + critical-tests.

**Зачем:** после close пул может молча не дать 2 карточки. Игрок видит «пустой мир», Watchtower не знает. Лог есть (M17); сигнала игроку нет (AI C1).

**Не в срезе:** переписать picker, BT/GOAP, seed RNG, skip событий (PR-13), lock close (PR-01).

## Решение

`ensure_period_events` возвращает статус. `process_period_end` кладёт `events_spawn_failed` в close. FE — chip на существующем ритуале. Picker не трогаем.

### Когда флаг `true`

| Ситуация | Флаг |
|----------|------|
| Exception в seed/pool | да |
| Ход ≥ 3 и после вызова меньше 2 `period_choice` | да |
| Ход 1–2, событий нет по правилам | нет |
| Уже было 2 карточки | нет |
| Спавн 1 из 2 | да |

Поле: `period_close.events_spawn_failed: boolean` (default `false`).

Статусы пула: `ok` \| `skipped_intro` \| `already_full` \| `empty_pool`. Exception в `period.py` → флаг `true`.

## Срезы

| # | Срез | Phase | Skill | Estimate |
|---|------|-------|-------|----------|
| 1 | Статус пула + флаг в close DTO | `build` | api + TDD | S |
| 2 | Pytest exception и тихий empty | `verify` | critical-tests | S |
| 3 | Chip + автооткрытие при флаге | `build` | frontend-ui-engineering (без lab — hotfix на ритуале) | S |
| 4 | Watchtower-колонка | — | **не блокер** | follow-up |

## Critical scenarios

| ID | Сценарий | Layer |
|----|----------|-------|
| CS-1 | Exception → close ок, флаг true, период +1 | unit |
| CS-2 | Тихий empty → флаг true | unit |
| CS-3 | Ход 1–2 без карточек → флаг false | unit |
| CS-4 | Нормальный spawn ≥3 → флаг false | unit |
| CS-5 | FE: true → chip; нет поля → нет chip; автооткрытие | vitest |

## Verify

```text
py -3 -m pytest tests/unit/game/test_period_event_pool_failure.py tests/integration/api/test_time_next_cashflow.py -q
cd frontend-react && npm run test:utils
```
