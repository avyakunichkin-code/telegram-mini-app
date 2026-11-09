---
layer: plan
epic_id: GE1
phase: define
status: approved
owner: product
last_reviewed: 2026-11-09
spec: ../specs/features/SPEC_run-finale-decision-cost.md
idea: ../vision/ideas/run-finale-decision-cost.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/approved
aliases:
  - "Plan: Цена решений"
  - PLAN_run-finale-decision-cost
---
# Plan: Цена решений

**Epic ID:** `GE1` (строка в [`TRACEABILITY.md`](../TRACEABILITY.md))  
**Spec:** [`specs/features/SPEC_run-finale-decision-cost.md`](../specs/features/SPEC_run-finale-decision-cost.md)  
**После утверждения плана:** Agent Skill **`incremental-implementation`** (срезы по задачам ниже).

## Summary

Сначала журнал (иначе нечего считать), затем расчёты и контракт, потом проверка порога на партиях, и только после неё дизайн и UI. Backend можно влить независимо от UI: новое поле по умолчанию пустое и экран не меняет. Префикс задач `DC-`, как в других эпиках (`GO-`, `DL1-`).

## Dependency graph

```text
DC-01 колонка и ежемесячный платёж
  └── DC-02 остальные движения по кредиту
        └── DC-03 переплата по кредиту
              └── DC-04 остальные карточки и отбор
                    └── DC-05 поле decisions
                          └── DC-06 проверка порога
                                └── DC-07 design-lab
                                      └── DC-08 блок в MqxRunFinale
                                            └── DC-09 документация и review
```

## Vertical slices

| # | Срез | Phase | Tier | Skill | Satellites | Read if (`when`) | Next skill |
|---|------|-------|------|-------|------------|------------------|------------|
| DC-01 | Колонка `liability_id` и запись ежемесячного платежа | `build` | `core` | `game-economy-and-victory` | `test-driven-development`, `db-baselines-and-migrations` | — | `incremental-implementation` |
| DC-02 | Привязка закрытия, погашений и комиссии | `build` | `core` | `incremental-implementation` | `test-driven-development` | — | `incremental-implementation` |
| DC-03 | Расчёт переплаты по кредиту | `build` | `core` | `incremental-implementation` | `test-driven-development`, `critical-test-scenarios` | — | `incremental-implementation` |
| DC-04 | Зарплаты, событие, вложения и правила отбора | `build` | `core` | `incremental-implementation` | `test-driven-development`, `critical-test-scenarios` | — | `api-and-interface-design` |
| DC-05 | Поле `decisions` в финале | `build` | `core` | `api-and-interface-design` | `test-driven-development` | — | `balance-playtest` |
| DC-06 | Проверка порога на 5–10 партиях | `verify` | `core` | `balance-playtest` | — | — | `design-lab-mqx` |
| DC-07 | Варианты блока в design-lab | `define` | `core` | `design-lab-mqx` | — | — | `frontend-ui-engineering` |
| DC-08 | Блок в `MqxRunFinale` | `build` | `core` | `frontend-ui-engineering` | `critical-test-scenarios` | — | `code-review-and-quality` |
| DC-09 | Обновление документации и review перед merge | `ship` | `support` | `code-review-and-quality` | `economy-reviewer` | — | — |

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Правка `period.py` случайно изменит экономику | Отдельный срез и сверка с baseline |
| Новое движение по кредиту запишут без `liability_id` | Правило в spec и тест на все пять мест |
| `balance_playtest` может не дойти до финала или не дать данных для карточек | Проверить в начале DC-06; если так, собрать партии тестовым сценарием |
| В DC-01 пять файлов, это верхний предел | Не добавлять в срез ничего сверх перечисленного |

## Checkpoints

- [x] Spec **approved**
- [x] Строка в `TRACEABILITY.md` (Plan колонка) обновлена
- [x] DC-01: полный backend pytest и balance suite без baseline update (2026-11-10)
- [ ] После DC-02: повторить полный pytest и сверку баланса
- [ ] После DC-05: проверка контракта
- [ ] После DC-06: решение PO по порогу
- [ ] После DC-07: утверждение макета PO («утверждаем X»)
- [ ] Spec status → `implemented`; backlog `[x]`

## Tasks

### DC-01 — Колонка `liability_id` и запись ежемесячного платежа

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `game-economy-and-victory`
- **Satellites:** `test-driven-development`, `db-baselines-and-migrations`
- **Next skill:** `incremental-implementation`
- **Spec:** §Data & API, Models / DB
- **Acceptance:** миграция `0051` идемпотентна; ежемесячный платёж пишется с `liability_id`, купон остаётся без него; суммы и порядок проводок не меняются.
- **Critical scenarios:** CS-8
- **Verify:** `cd backend && py -3 -m pytest -q`; `balance_diff` к baseline
- **Files:** `backend/migrations/0051_transaction_liability_id.sql`, `backend/app/models.py`, `backend/app/finance/balance_utils.py`, `backend/app/game/period.py`, тест
- **Estimate:** M
- **Depends:** —

**Local status (2026-11-10):** DC-01 is verified in the working tree: migration, ORM field, period-close linkage and regression tests are present; targeted checks passed (9/9), full backend pytest passed (679 passed, 1 skipped), and the full 40-period playtest returned 11/11 baseline comparisons plus suite invariants `OK`. The pro and manager chain-runner reports show +2.7% and +2.0% `cash_p40` versus the older accepted baseline, both below the warning threshold and marked `NO SIGNIFICANT DELTA`; no balance baseline was updated. PostgreSQL migration application was not run.

### DC-02 — Привязка закрытия, погашений и комиссии

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`
- **Next skill:** `incremental-implementation`
- **Spec:** §Data & API, таблица движений
- **Acceptance:** закрытие, оба пути досрочного погашения и комиссия пишутся с `liability_id`; выдача кредита и доплата при продаже без него.
- **Verify:** `cd backend && py -3 -m pytest -q`
- **Files:** `backend/app/services/finance/liabilities.py`, `backend/app/events/chain_actions.py`, тест
- **Estimate:** S
- **Depends:** DC-01

### DC-03 — Расчёт переплаты по кредиту

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`, `critical-test-scenarios`
- **Next skill:** `incremental-implementation`
- **Spec:** §Формулы, §Rules & edge cases
- **Acceptance:** переплата сходится с журналом до 0,01 ₽; кредит с проданным залогом и кредит без `original_principal` карточку не получают.
- **Critical scenarios:** CS-1, CS-2, CS-3, CS-4
- **Verify:** `cd backend && py -3 -m pytest -q tests/test_run_finale_decisions.py`
- **Files:** `backend/app/game/run_finale_decisions.py`, `backend/tests/test_run_finale_decisions.py`
- **Estimate:** M
- **Depends:** DC-02

### DC-04 — Зарплаты, событие, вложения и правила отбора

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`, `critical-test-scenarios`
- **Next skill:** `api-and-interface-design`
- **Spec:** §Формулы, §Rules & edge cases
- **Acceptance:** оставшиеся три типа карточек считаются по формулам spec; отбор выполняется строго по пяти шагам; оценочные суммы помечены.
- **Critical scenarios:** CS-5, CS-6
- **Verify:** `cd backend && py -3 -m pytest -q tests/test_run_finale_decisions.py`
- **Files:** `backend/app/game/run_finale_decisions.py`, `backend/tests/test_run_finale_decisions.py`
- **Estimate:** M
- **Depends:** DC-03

### DC-05 — Поле `decisions` в финале

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `api-and-interface-design`
- **Satellites:** `test-driven-development`
- **Next skill:** `balance-playtest`
- **Spec:** §Endpoints
- **Acceptance:** при обоих исходах приходит `decisions`; после dismiss `run_finale` отсутствует.
- **Critical scenarios:** CS-7
- **Verify:** `cd backend && py -3 -m pytest -q`
- **Files:** `backend/app/schemas.py`, `backend/app/game/run_finale.py`, `backend/tests/test_run_finale.py`
- **Estimate:** S
- **Depends:** DC-04

### DC-06 — Проверка порога на 5–10 партиях

- **Phase:** `verify`
- **Tier:** `core`
- **Skill:** `balance-playtest`
- **Next skill:** `design-lab-mqx`
- **Spec:** §Open questions, п. 5
- **Acceptance:** отчёт: сколько карточек получается в партиях разных ролей и какие; решение по порогу принято PO.
- **Verify:** отчёт в `docs/balance/reports/`
- **Files:** отчёт
- **Estimate:** S
- **Depends:** DC-05

### DC-07 — Варианты блока в design-lab

- **Phase:** `define`
- **Tier:** `core`
- **Skill:** `design-lab-mqx`
- **Next skill:** `frontend-ui-engineering`
- **Spec:** §UI / UX
- **Acceptance:** варианты для победы и поражения, включая соседство с разделом «Факт»; явное «утверждаем X» от PO.
- **Verify:** просмотр раунда в lab
- **Files:** `design-lab/run-finale/`
- **Estimate:** M
- **Depends:** DC-06

### DC-08 — Блок в `MqxRunFinale`

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `frontend-ui-engineering`
- **Satellites:** `critical-test-scenarios`
- **Next skill:** `code-review-and-quality`
- **Spec:** §UI / UX
- **Acceptance:** знак и подпись дублируют цвет; пустой массив не рисует блок; оценка показана со знаком «≈».
- **Verify:** `cd frontend-react && npm run build && npm run test:unit`; экраны на 320–390 px и desktop
- **Files:** `frontend-react/src/components/mqx/layout/MqxRunFinale.jsx`, `frontend-react/src/components/mqx/layout/runFinaleDisplay.js`, `frontend-react/src/styles/mqx/run-finale.css`, тест `runFinaleDisplay`, `frontend-react/src/api/game.js` при необходимости
- **Estimate:** M
- **Depends:** DC-07

### DC-09 — Обновление документации и review перед merge

- **Phase:** `ship`
- **Tier:** `support`
- **Skill:** `code-review-and-quality`
- **Satellites:** `economy-reviewer`
- **Spec:** §Traceability
- **Acceptance:** `SPEC_game-run-finale` и `CHANGELOG` обновлены; у spec статус `implemented`; review без блокирующих замечаний.
- **Verify:** `py -3 scripts/check_conventions.py`; `cd backend && py -3 -m pytest -q`; `cd frontend-react && npm run check:guardrails`
- **Files:** `docs/specs/features/SPEC_game-run-finale.md`, `docs/specs/features/SPEC_run-finale-decision-cost.md`, `docs/CHANGELOG.md`
- **Estimate:** S
- **Depends:** DC-08
