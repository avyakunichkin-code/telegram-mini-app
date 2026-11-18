---
layer: plan
epic_id: GE1
phase: ship
status: implemented
owner: product
last_reviewed: 2026-11-11
spec: ../specs/features/SPEC_run-finale-decision-cost.md
idea: ../vision/ideas/run-finale-decision-cost.md
traceability: ../TRACEABILITY.md
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/implemented
aliases:
  - "Plan: Цена решений"
  - PLAN_run-finale-decision-cost
---
# Plan: Цена решений

**Epic ID:** `GE1` (строка в [`TRACEABILITY.md`](../TRACEABILITY.md))  
**Spec:** [`specs/features/SPEC_run-finale-decision-cost.md`](../specs/features/SPEC_run-finale-decision-cost.md)  
**Реализация:** срезы DC-01…09 выполнены локально; итоговая проверка — в DC-09 ниже. Merge/deploy в этот план закрытия не включены.

## Summary

**Срез закрыт локально 2026-11-11:** DC-01…09 реализованы и проверены; PO утвердил A и предварительный 1× среднего дохода. PostgreSQL fresh/legacy/repeat проверены. [Свод готовности и ограничений](../audits/qa/2026-11-11-run-finale-decision-cost.md). Статус `implemented` не означает merge/deploy.

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
- [x] После DC-02: полный pytest 718 passed / 1 skipped; 10 сценариев DC-06 со сверкой summary, baseline не обновлён
- [x] После DC-05: проверка контракта — bootstrap сериализует `decisions` и `monthly_burn`, targeted 42 passed
- [x] После DC-06: решение PO по порогу — предварительно 1× среднего дохода (2026-11-11)
- [x] После DC-07: утверждение макета PO («утверждаем X»)
- Выбор PO 2026-11-11: **A · Чек** для победы и поражения, [запись в lab](../../design-lab/run-finale/decisions-round/APPROVED.md). PO отдельно разрешил DC-08 параллельно DC-06. Макет утверждён и локально внедрён; после отчёта DC-06 отдельно предварительно принят порог **1× среднего дохода**, прежнее ранжирование сохранено.
- [x] Spec status → `implemented`; backlog `[x]` (локальный срез, без deploy)

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
- **Files:** `game/api/migrations/0051_transaction_liability_id.sql`, `game/api/app/models.py`, `game/api/app/finance/balance_utils.py`, `game/api/app/game/period.py`, тест
- **Estimate:** M
- **Depends:** —

**Local status (2026-11-10):** DC-01 is verified in the working tree: migration, ORM field, period-close linkage and regression tests are present; targeted checks passed (9/9), full backend pytest passed (679 passed, 1 skipped), and the full 40-period playtest returned 11/11 baseline comparisons plus suite invariants `OK`. The pro and manager chain-runner reports show +2.7% and +2.0% `cash_p40` versus the older accepted baseline, both below the warning threshold and marked `NO SIGNIFICANT DELTA`; no balance baseline was updated. PostgreSQL migration application was not run.

### Исторический снимок (2026-11-10)

| Slice | Evidence in working tree | Status |
|-------|--------------------------|--------|
| DC-01 | Migration `0051`, model/helpers, monthly payment linkage, coupon stays unlinked; the earlier full pytest and balance suite passed before later DC-02…05 edits | **Verified at that snapshot**; PostgreSQL migration was not applied |
| DC-02…05 | Liability links, event instance link (`0052`), decision calculation and payload are present; regression tests were added | **Implemented locally, verification pending**; the recorded `679 passed / 1 skipped` run predates these changes |
| DC-06 | No report found with decision-card counts/types across 5–10 completed parties; the `codex_dc01` and 40-period balance reports record economy metrics only | **Not complete**; the threshold question in the spec remains unresolved |
| DC-07 | `game/design-lab/run-finale/decisions-round/` contains A/B/C variants for victory and defeat | **Draft exists, approval not recorded**; no `APPROVED.md` or PO choice found |
| DC-08…09 | No decisions block or display logic in `MqxRunFinale` / `runFinaleDisplay` / finale CSS | **Not started** |

### DC-02 — Привязка закрытия, погашений и комиссии

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`
- **Next skill:** `incremental-implementation`
- **Spec:** §Data & API, таблица движений
- **Acceptance:** закрытие, оба пути досрочного погашения и комиссия пишутся с `liability_id`; выдача кредита и доплата при продаже без него.
- **Verify:** `cd backend && py -3 -m pytest -q`
- **Files:** `game/api/app/services/finance/liabilities.py`, `game/api/app/events/chain_actions.py`, тест
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
- **Files:** `game/api/app/game/run_finale_decisions.py`, `game/api/tests/test_run_finale_decisions.py`
- **Estimate:** M
- **Depends:** DC-02

### DC-04 — Зарплаты, событие, вложения и правила отбора

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`, `critical-test-scenarios`
- **Next skill:** `api-and-interface-design`
- **Spec:** §Формулы, §Rules & edge cases
- **Acceptance:** оставшиеся три типа карточек считаются по формулам spec; отбор выполняется строго по пяти шагам; оценочные суммы помечены; списание события привязано к экземпляру (`event_instance_id`, миграция `0052`, решение PO 2026-11-10).
- **Critical scenarios:** CS-5, CS-6, CS-6a
- **Verify:** `cd backend && py -3 -m pytest -q tests/test_run_finale_decisions.py`
- **Files:** `game/api/app/game/run_finale_decisions.py`, `game/api/tests/test_run_finale_decisions.py`, `game/api/migrations/0052_transaction_event_instance_id.sql`, `game/api/app/models.py`, `game/api/app/finance/balance_utils.py`, `game/api/app/services/events/choose.py`
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
- **Files:** `game/api/app/schemas.py`, `game/api/app/game/run_finale.py`, `game/api/tests/test_run_finale.py`
- **Estimate:** S
- **Depends:** DC-04

### DC-06 — Проверка порога на 5–10 партиях

**Решение PO после отчёта, 2026-11-11:** «Давай пока 1х» — предварительно принят порог **1× среднего регулярного дохода за партию** с учётом доступных пропущенных зарплат. Реализация использует `average_available_income` по истории закрытых ходов; тот же helper использует измерительный runner. Денежные проводки, victory/needs и API-форма не изменяются. Прежние правила ранжирования, максимум две кредитные карточки и гарантия прошедшего порог `investment_gain` сохранены; новые лимиты/разделение вложений отдельно не утверждены. Условия DC-06 «отчёт + решение по порогу» выполнены; проверка внедрения 1× записывается ниже после завершения.

**Включение 1× проверено (2026-11-11):** cwd `backend`, `../.venv/Scripts/python.exe -m pytest -q` — **718 passed, 1 skipped**, exit 0 ([лог](../balance/reports/DC-06_1x-backend.log)). Skip — `test_pg_schema_drift`: требуется отдельный `TEST_DATABASE_URL` PostgreSQL; SQLite-проверки выполнены. Целевые тесты финала и измерителя — **42 passed**, exit 0 ([лог](../balance/reports/DC-06_1x-targeted.log)); production-отбор на сохранённых данных совпал с вариантом `1x_mixed` во всех **6/6** финалах ([лог](../balance/reports/DC-06_1x-recorded-verification.log)). `scripts/check_conventions.py` — exit 0 ([лог](../balance/reports/DC-06_1x-conventions.log)); `git diff --check` — exit 0. Frontend-код этим включением не менялся; проверки DC-08 остаются отдельным ранее проверенным срезом. Повторные финансовые симуляции не требовались: изменён только отбор фактов, а не экономика; исходный 40-ходовый отчёт сохранён, baseline не обновлён.

**База дохода утверждена PO 2026-11-11:** средний регулярный доход за партию, включая доступные, но пропущенные выплаты зарплаты. Расчёт по `PeriodEconomyClosing.period_income_rate` с добавлением оценки пропущенных зарплат и делением на число закрытых ходов. Выбран множитель 1×; новый лимит/разделение вложений остаётся отдельным решением.

**Прогоны выполнены 2026-11-11:** [отчёт DC-06](../balance/reports/DC-06_2026-11-11_income-thresholds.md), [JSON](../balance/reports/DC-06_2026-11-11_income-thresholds.json). Команда из `backend`: `../.venv/Scripts/python.exe -X utf8 scripts/decision_cost_playtest.py --out ../docs/balance/reports/DC-06_2026-11-11_income-thresholds.json` (executable из корневой `.venv`, exit 0). 10 сценариев manifest, seed 42, 40 ходов; 6 первых исходов (4 победы, 2 поражения), 4 без исхода за горизонт исключены из частот. Наблюдение только читает журнал и не меняет правила игры.

| Порог среднего дохода | Вложения в финале | Пустой блок | Оба направления |
|---|---:|---:|---:|
| 1× | 2/6 | 4/6 | 2/6 |
| 2× | 0/6 | 4/6 | 0/6 |
| 3× | 0/6 | 5/6 | 0/6 |

`largest` и `mixed` дали одинаковые результаты; случаи принудительной замены покрыты отдельным тестом. Вложения по-прежнему один агрегированный кандидат, поэтому различить лимиты 1/2 на этих данных невозможно. Все 10 summary-сравнений с baseline: meta соответствует, без блокирующих флагов; полный suite-invariant verdict не заявляется, baseline не обновлён. Независимый economy-reviewer: PASS по измерительному коду и API-добавлению на момент отчёта, не по желательности порога. По результатам PO предварительно принял **1× среднего дохода**; прежние правила разнообразия сохраняются.

**Граница решения:** сравнение диапазона 1–3 выполнено, выбран 1×. Разделение вложений на две карточки и новая гарантия представительства направлений в этот срез не входят; сейчас вложения агрегированы в одну карточку. См. spec, §Rules & edge cases.

- **Phase:** `verify`
- **Tier:** `core`
- **Skill:** `balance-playtest`
- **Next skill:** `design-lab-mqx`
- **Spec:** §Open questions, п. 5
- **Acceptance:** отчёт: сколько карточек получается в партиях разных ролей и какие; решение по порогу принято PO.
- **Verify:** отчёт в `game/docs/balance/reports/`
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
- **Files:** `game/design-lab/run-finale/`
- **Estimate:** M
- **Depends:** DC-06

### DC-08 — Блок в `MqxRunFinale`

**Поручение PO 2026-11-11:** выполнять DC-08 параллельно прогонам DC-06. A утверждён; UI отображает текущие `decisions` из API, не фиксируя новый порог или правила разнообразия. Зависимость DC-06 сохраняется для окончательного принятия отбора. Локально добавлены список A, подписи масштаба через совместимое поле `monthly_burn`, каталог и проверки пустого/оценочного состояния; финальные результаты проверок — ниже после завершения.

**Проверено локально 2026-11-11:**

- Backend, cwd `backend`, `../.venv/Scripts/python.exe -m pytest -q`: **712 passed, 1 skipped**, exit 0; [`лог`](../balance/reports/DC-08_backend-verified.log). Отдельно после изменения observer — `tests/test_balance_simulate.py tests/test_decision_cost_playtest.py`: **16 passed**, exit 0.
- Frontend, cwd `frontend-react`: `npm.cmd run test:unit` — exit 0; `npm.cmd run build` — exit 0; `npm.cmd run check:guardrails` — exit 0. Логи `game/web/dc08-unit.log`, `dc08-build-verified.log`, `dc08-guardrails-complete.log` (локальные).
- Chrome: `npm.cmd run test:ui-kit -- --grep "A · Чек|пустого блока"` — **10 passed**, exit 0; после исправления контраста заголовков повтор light/dark — **2 passed**, exit 0. Победа/оба поражения, 0/1/3 карточки, 320/390/1440 px, порядок блоков и кнопки.
- Независимый `mqx-ui-reviewer`: **PASS** по scoped UI; просмотрены light/dark screenshots 320 px. Это review, не подмена утверждения PO.
- Для Windows TestClient/Chrome использованы изолированные прогоны вне sandbox: sandbox-запуск зависал на `asyncio` socketpair. Зависшие запуски остановлены, их неполные результаты не приняты.
- Stale двух старых lab CSS устранён штатными `sync-lab.sh` через установленный Git Bash; контентный diff этих файлов отсутствует. Guardrails сохраняет неблокирующие предупреждения для трёх существующих plan-checkup раундов.

DC-08 готов как отображение API. После отдельного решения PO по DC-06 предварительно принят и включён порог 1× среднего дохода; проверка включения записана в DC-06. DC-09 закрыт локально ниже. Baseline не обновлён, деплоя не было.

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `frontend-ui-engineering`
- **Satellites:** `critical-test-scenarios`
- **Next skill:** `code-review-and-quality`
- **Spec:** §UI / UX
- **Acceptance:** знак и подпись дублируют цвет; пустой массив не рисует блок; оценка показана со знаком «≈».
- **Verify:** `cd frontend-react && npm run build && npm run test:unit`; экраны на 320–390 px и desktop
- **Files:** `game/web/src/components/mqx/layout/MqxRunFinale.jsx`, `game/web/src/components/mqx/layout/runFinaleDisplay.js`, `game/web/src/styles/mqx/run-finale.css`, тест `runFinaleDisplay`, `game/web/src/api/game.js` при необходимости
- **Estimate:** M
- **Depends:** DC-07

### DC-09 — Обновление документации и review перед merge

**Статус 2026-11-11:** выполнено локально. Обновлены parent/feature specs, CHANGELOG, backlog, TRACEABILITY и DOC_SYNC_LOG. Итоги проверок и независимых проходов — [DC-09 closeout](../audits/qa/2026-11-11-run-finale-decision-cost.md). Выполнены PostgreSQL 18 fresh migrate, synthetic legacy upgrade и repeat; nullable/FK/index и сохранность сумм/ссылок подтверждены. Исправлено разбиение путей с пробелами в `db.sh`, регрессия покрыта тестом. `tests/test_db_migration_runner.py tests/test_schema_canon.py tests/test_pg_schema_drift.py`: **9 passed**, exit 0. Ранее проверенный backend-код с порогом 1× в DC-09 не менялся: полный gate **718 passed, 1 skipped**, exit 0; прежний PG skip отдельно закрыт реальным PostgreSQL-тестом. Финальный независимый `economy-reviewer`: **PASS** по DC-09, без воспроизводимых регрессий. `npm.cmd run check:guardrails` — exit 0. Временный PostgreSQL-кластер остановлен штатным `pg_ctl ... -w stop`, exit 0. Проверены 58 добавленных относительных Markdown-ссылок (существование файлов/папок, не anchors). Baseline не обновлён; merge и deploy не выполнялись.

- **Phase:** `ship`
- **Tier:** `support`
- **Skill:** `code-review-and-quality`
- **Satellites:** `economy-reviewer`
- **Spec:** §Traceability
- **Финальный doc gate:** `scripts/check_conventions.py` — exit 0, лог `game/docs/balance/reports/DC-09_conventions.log`; scoped `git diff --check` — exit 0. Относительные ссылки проверены по добавленным строкам и новому своду.
- **Acceptance:** `SPEC_game-run-finale` и `CHANGELOG` обновлены; у spec статус `implemented`; review без блокирующих замечаний.
- **Verify:** root: `& .venv/Scripts/python.exe -X utf8 scripts/check_conventions.py`; backend: `& ../.venv/Scripts/python.exe -m pytest -q`; frontend-react: `npm.cmd run check:guardrails` (cwd и результаты в closeout).
- **Files:** `game/docs/specs/features/SPEC_game-run-finale.md`, `game/docs/specs/features/SPEC_run-finale-decision-cost.md`, `docs/CHANGELOG.md`
- **Estimate:** S
- **Depends:** DC-08
