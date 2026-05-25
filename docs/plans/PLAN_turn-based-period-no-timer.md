---
layer: plan
status: implemented
last_reviewed: 2026-05-26
idea: ../vision/ideas/turn-based-period-no-timer.md
epic: TB1
design_lab: ../../design-lab/dashboard/hero-no-timer-round/
---

# Implementation Plan: Пошаговый месяц без таймера (TB1)

## Overview

Переход от модели «игровой месяц = 300 секунд real time» к **пошаговому месяцу**: период открыт, пока игрок не нажмёт **закрытие месяца** (`POST /api/game/time/next` → `process_period_end`). Убираем UI-таймер, play/pause, клиентский тик и авто-закрытие по нулю; чиним серверный `sync_time`, чтобы не сдвигать `period_index` без экономики.

**Design-lab ★ FINAL:** [`design-lab/dashboard/hero-no-timer-round/`](../../design-lab/dashboard/hero-no-timer-round/) — **H2**, CTA **«Закрыть месяц»**. Чипы плана месяца — **TB1.1** (не блокирует TB1).

## Architecture Decisions

| Решение | Rationale |
|---------|-----------|
| Закрытие месяца только через `time/next` | Уже есть гейты событий, `period_close`, game over — не плодим эндпоинт |
| `sync_time` не меняет `period_index` | Устраняет рассинхрон «индекс вырос — платежи нет» при AFK в play |
| `time_state` оставить в БД, UI не экспонировать | Меньший diff; default `pause` при старте уже есть |
| `period_duration_seconds` deprecated в API response | Опционально `null` или фиксированное поле «legacy»; убрать из UI |
| Hero **H2**: CTA-колонка справа | Утверждено; лейбл **«Закрыть месяц»** |
| Чипы плана месяца → **TB1.1** | H3 в lab только как референс; не в Task 5 |

## Dependency Graph

```text
Design-lab утверждение (hero CTA)
        │
        ▼
Backend sync_time fix + тесты
        │
        ├── API contract / bootstrap (seconds_until → optional)
        │
        ▼
Frontend useGame (убрать тикер)
        │
        ├── MqxDashboardHero + DashboardPremium
        ├── GameScreen mood / lifecycle
        │
        ▼
Onboarding + docs + landing demo (если есть таймер)
```

## Task List

### Phase 0: Design-lab (блокер для hero)

- [x] **Task 0.1:** Раунд `hero-no-timer-round` — 3 варианта hero (см. VARIANTS.md)
- [x] **Task 0.2:** Прогон в браузере — выбран **H2**
- [x] **Task 0.3:** ★ FINAL: **H2**, CTA **«Закрыть месяц»**; чипы плана → **TB1.1**

**Acceptance criteria:**

- [x] Нет 404 на CSS/assets в Network
- [x] На макете явная **primary** кнопка закрытия месяца и вторичная «События»
- [x] Нет цифр MM:SS и полосы «прогресс % времени»

**Verification:** `cd design-lab/dashboard/hero-no-timer-round && npx serve .`

**Dependencies:** None  
**Scope:** S (lab only)

---

### Phase 1: Backend — истина периода

#### Task 1: `sync_time` без авто-инкремента периода

**Description:** В `backend/app/game_time.py` функция `sync_time` в режиме `play` **не увеличивает** `period_index` и **не сдвигает** anchor по прошествии N×duration. Опционально: при `play` трактовать как `pause` для elapsed (или no-op для index). Документировать в docstring: переход только через `process_period_end`.

**Acceptance criteria:**

- [x] Профиль в `play` 20 минут AFK: `period_index` не меняется без `time/next`
- [x] `POST /api/game/time/next` по-прежнему вызывает `process_period_end` и инкрементирует период
- [x] `get_seconds_until_next` возвращает предсказуемое значение (0 или deprecated constant) — зафиксировать в комментарии к контракту

**Verification:**

- [x] `pytest backend/tests/test_game_bootstrap.py -q`
- [x] Новый тест `test_sync_time_does_not_advance_period_index_without_next`

**Dependencies:** Task 0.3 (можно параллельно)  
**Files:** `backend/app/game_time.py`, `backend/tests/test_game_time.py` (new)  
**Scope:** S

#### Task 2: Контракт API time / bootstrap

**Description:** Решить, остаются ли в `TimeStatusResponse` поля `seconds_until_next_period`, `period_duration_seconds`. MVP: оставить с `seconds_until_next_period: 0` или убрать из схемы с optional — **синхронизировать** `schemas.py`, `game_bootstrap.py`, `routers/game.py`. Обновить `admin_notify` при необходимости.

**Acceptance criteria:**

- [x] `GET /api/game/bootstrap` и `GET /api/game/time` не вводят клиент в заблуждение (0 или отсутствие поля задокументировано)
- [x] Существующие тесты зелёные

**Verification:** `pytest backend/tests/ -q -k "bootstrap or game_time"`  
**Dependencies:** Task 1  
**Scope:** S

#### Task 3: Старт игры — всегда «месяц открыт»

**Description:** При `POST /api/game/start` и создании профиля: `time_state=pause` (уже есть), не требовать `time/play` для начала хода. Убедиться, что `claim-salary` и `period/status` работают без предварительного play.

**Acceptance criteria:**

- [x] Новая партия: зарплата и period status доступны без POST `time/play`

**Verification:** `pytest backend/tests/test_mq116_acceptance.py -q` (при необходимости поправить)  
**Dependencies:** Task 1  
**Scope:** XS

---

### Checkpoint: Backend

- [x] Все backend-тесты TB1 зелёные
- [x] Ручной smoke: старт → claim salary → next → period_index +1, есть period_close

---

### Phase 2: Frontend — убрать таймер

#### Task 4: Упростить `useGame.js`

**Description:** Удалить `timerRef`, `startTimer`, `stopTimer`, `remainingLocal`, авто-вызов `handlePeriodEnd` при `remaining <= 0`, `maybeClosePeriodAfterResync` по нулю секунд. Оставить `advancePeriod`, `refreshGameState`, foreground resync **без** перезапуска секундомера.

**Acceptance criteria:**

- [x] Нет `setInterval` 1s в `useGame`
- [x] Возврат из фона не триггерит лишний `setTimeNext`
- [x] `advancePeriod` по-прежнему показывает sheet итога периода

**Verification:** Ручной: открыть игру, подождать 6+ мин — период **не** закрывается сам  
**Dependencies:** Task 2  
**Files:** `frontend-react/src/hooks/useGame.js`, `frontend-react/src/utils/appLifecycle.js` (комментарии)  
**Scope:** M

#### Task 5: Hero MQX — layout **H2**

**Description:** Рефактор `MqxDashboardHero`: убрать timer, progress bar, play/pause. **Одна строка (H2):** лого · блок периода («Месяц открыт» + «Период #N») · **колонка справа:** primary `MqxButton` **«Закрыть месяц»** (full width колонки), ниже pill «События». Без чипов плана (TB1.1). Стили: `layout.css` + `hero-no-timer-round/styles.css`.

**Acceptance criteria:**

- [x] Визуально соответствует **H2** в lab (не H1/H3)
- [x] Текст кнопки: **«Закрыть месяц»** (не «Следующий период»)
- [x] `data-onboarding-anchor="next_period"` на primary CTA
- [x] a11y: `aria-label="Закрыть месяц и перейти к следующему периоду"` (или согласованный вариант)

**Verification:** `#/game` ручной + dev/mqx при наличии  
**Dependencies:** Task 0.3, Task 4  
**Files:** `MqxDashboardHero.jsx`, `DashboardPremium.jsx`, `layout.css`  
**Scope:** M

#### Task 6: GameScreen mood и мёртвый API

**Description:** Убрать зависимость mood от `time_state===play` или заменить на нейтральный/«месяц открыт». Опционально: не вызывать `setTimePlay`/`setTimePause` из UI; пометить в `api/game.js` deprecated (комментарий).

**Acceptance criteria:**

- [x] Нет видимых ▶/⏸ на дашборде
- [x] Страница не «мигает» mood при загрузке

**Dependencies:** Task 5  
**Scope:** S

#### Task 7: Pre-game / defaults

**Description:** `GameTemplatePickScreen`, `startGame.js`, `BaseParamsScreen` — перестать подчёркивать выбор длительности периода (можно оставить константу 300 в payload для BC). `DEFAULT_PERIOD_DURATION_SECONDS` — комментарий deprecated.

**Acceptance criteria:**

- [x] В UI создания игры нет «5 минут = месяц»

**Dependencies:** Task 5  
**Scope:** XS

---

### Checkpoint: Frontend core

- [x] Полный цикл: зарплата → подушка → событие → закрыть месяц → sheet
- [x] Онбординг проходит без упоминания таймера (Task 8)

---

### Phase 3: Контент и документация

#### Task 8: Онбординг

**Description:** `onboardingSteps.js`: шаг 1 — период без таймера/play; шаг 4 — только primary «Закрыть месяц». `SPEC_onboarding-tma.md`, demo `OnboardingCoachDemo.jsx`.

**Acceptance criteria:**

- [x] Тексты не содержат «таймер», «⏸», «▶», «секунд», «дождаться нуля»

**Dependencies:** Task 5  
**Scope:** S

#### Task 9: Docs + traceability

**Description:** Обновить `SPEC_PRODUCT.md` §3.1, `dashboard.md`, `TMA_USER_FLOWS`, `GLOSSARY`, `CLAUDE.md`, `DOC_SYNC_LOG.md`, `PRODUCT_BACKLOG` (TB1).

**Acceptance criteria:**

- [x] Описан пошаговый месяц без real-time таймера

**Dependencies:** Task 8  
**Scope:** S

#### Task 10: Landing / прочие поверхности

**Description:** Проверить `landing/src/scripts/demo-hero.js` и скрины — убрать MM:SS если есть.

**Dependencies:** Task 5  
**Scope:** XS

---

### Checkpoint: Complete

- [x] Design-lab ★ FINAL отражён в prod hero
- [x] pytest backend + ручной TMA чеклист (ниже)
- [x] Docs синхронизированы

## Manual Test Checklist (TMA)

1. Новая игра → hero без таймера, видна primary «Закрыть месяц».
2. 6+ мин в приложении без кнопки — период **не** меняется.
3. Зарплата → закрыть месяц → sheet итога, period +1.
4. Незакрытая зарплата → предупреждение при закрытии (если уже в prod).
5. Обязательное событие → закрытие заблокировано.
6. Lock/unlock Telegram — баланс и period_index без сюрпризного auto-next.
7. Онбординг первой игры — шаги 1 и 4 без таймера.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Игроки не понимают «месяц открыт» | Med | Lab + онбординг + статус в hero |
| Старые клиенты ждут auto-next | Low | Нет массового prod с таймером как core |
| Сломать тесты, завязанные на 300s | Med | Явный тест sync_time; правка conftest |
| PW1 resync упрощён слишком агрессивно | Med | Resync только overview/period/events |

## Open Questions

- [x] Hero: **H2**; CTA: **«Закрыть месяц»**; чипы плана: **TB1.1**
- [ ] Deprecate `POST time/play|pause` в OpenAPI или оставить silent no-op?
- [ ] Эпик **TB1.1**: scope чипов плана (derived из `periodStatus` / events) — отдельный plan после TB1

## Follow-up: TB1.1 (отдельный эпик)

**Не входит в TB1.** Референс UI: **H3** в `hero-no-timer-round`. Чипы: зарплата / события / подушка (состояния done/warn). Idea/plan TB1.1 — создать после закрытия TB1.

## Parallelization

| Параллельно | Последовательно |
|-------------|-----------------|
| Task 0 (lab) + Task 1 (backend) | Task 5 после 0.3 |
| Task 9 (docs черновик) после согласования копирайта | Task 4 → 5 → 6 |
