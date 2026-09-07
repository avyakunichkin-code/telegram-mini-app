---
layer: plan
epic_id: GO
phase: define
status: approved
owner: product
last_reviewed: 2026-09-07
idea: ../vision/ideas/game-only-drop-plan-mode.md
adr: ../decisions/ADR-013-game-only-drop-plan-mode.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
verdict: APPROVED
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/approved
aliases:
  - "План: только Game, вырезание Plan Mode"
  - PLAN_game-only
---
# План: только Game — вырезание режима Plan

**Эпик:** `GO` · **ADR:** [ADR-013](../decisions/ADR-013-game-only-drop-plan-mode.md) **Accepted**.  
**Очередь:** [`PLAN_production-ready.md`](PLAN_production-ready.md) (P1 до WAVE1; не тот же PR, что lock close). Этот файл — **детализация** файлов и Done-критериев, не второй roadmap.

**Не ломать:** TB1, шаблоны, `profile_expense_lines` Game, Victory v2, YAML ADR-008.

**Не делать в этих срезах:** мастер «свой бюджет» внутри Game; drop колонки `save_kind`; смена правила burn с подушки; советник.

---

## Порядок (зависимости)

```text
GO-01 UI: нет экрана режима / плитки «Скоро»
  └── GO-02 API: save_kind=plan → 400
        └── GO-03 снять Plan UI + Watchtower-фильтр
              └── GO-04 EventDefinition.mode plan → any / вычистка YAML
                    └── GO-05 (опционально, после SQL-аудита) CHECK save_kind='game'
```

GO-01 желателен **до WAVE1** (gate сводного плана). GO-02 можно в том же PR, что GO-01. GO-05 — не блокирует волну.

---

## Срезы

### GO-01 — поток «Новая игра» без выбора режима

| | |
|--|--|
| **Слой** | Frontend (+ lab canon) |
| **Skill** | incremental-implementation + frontend-ui-engineering |
| **Игрок** | «Новая игра» → сразу шаблоны (или авто-Студент при 0 сейвов, как сейчас после тапа «Игра») |
| **Файлы (ориентир)** | `App.jsx`, `NewProfileKindScreen.jsx`, `MqxSaveKindPicker.jsx`, `StartMenu`; lab `design-lab/new-game-mode` — Canon Sync без второй плитки |
| **Done** | Нет экрана «Игра / План»; нет copy «Скоро». Список сохранений без бейджа Plan. Монетка/O3 не обещают План. |
| **Не трогать** | `POST start` контракт (кроме если GO-02 в том же PR) |

### GO-02 — API только `game`

| | |
|--|--|
| **Слой** | Backend + tests |
| **Skill** | api-and-interface-design + TDD |
| **Контракт** | `save_kind=plan` (или отсутствие `template_key` «потому что plan») → **400**. Валидация: только `game` + `template_key`. |
| **Файлы** | `start_validation.py`, `services/game/start.py`, `schemas.py`; pytest start / plan expenses |
| **Done** | TestClient: plan start 400; game + template 201/200 как сейчас. Профили `plan` в БД не конвертировать (immutable): bootstrap/list — не открывать как игру (410/404 — решить в срезе, задокументировать). |
| **Перед выкладкой** | SQL `SELECT count(*) FROM game_profiles WHERE save_kind='plan'` на prod/staging. |

### GO-03 — мёртвый Plan UI и ops-поверхность

| | |
|--|--|
| **Слой** | Frontend + admin |
| **Файлы** | `BaseParamsScreen` plan path, `PlanExpenseEditor`, `PlanExpenseBudgetEditor`, `planSetup` route, `AnalyticsPremium` ветка `!== 'plan'`, Watchtower фильтр `by_save_kind=plan`, MQX-каталог демо picker |
| **Done** | Нет маршрута мастера Plan. Admin не предлагает сегмент plan как живой режим. `test_plan_expenses_contract` → game-only или удалён. |
| **Не путать** | `InsurancePlanCard`, страховой `buyingPlanKey`, `source_kind` burn ≠ save_kind. |

### GO-04 — каталог событий

| | |
|--|--|
| **Слой** | YAML + seeds + `ensure_period_events` |
| **Done** | Фильтр не ветвится на `plan`. Карточки `mode: plan` → `any` или `game` (create-event + event-analysis audit). |
| **Не делать** | Новый контент «для Plan». |

### GO-05 — схема (после аудита строк)

| | |
|--|--|
| **Слой** | DB (skill db-baselines-and-migrations) |
| **Done** | CHECK `save_kind IN ('game')` **или** колонка остаётся с дефолтом `game` без сужения — решение по факту count(plan)=0. Drop колонки **не** в α. |

---

## Acceptance (эпик)

- [ ] Игрок не видит второй режим на старте.
- [ ] API не создаёт `plan`.
- [ ] Docs агента (`game-lexicon`, CLAUDE, backend/frontend rules) совпадают с кодом после GO-03.
- [ ] WAVE1 FAQ: «Плана отдельным режимом не будет».
- [ ] Pytest: нет зелёных тестов, которые требуют успешный start `plan`.

## Риски

| Риск | Mitigation |
|------|------------|
| Живые plan-профили | SQL до GO-02; не авто-migrate в game |
| Lab ★ new-game-mode | Canon Sync в GO-01 |
| Смешать с P0 close | Отдельный PR от lock `/time/next` |
