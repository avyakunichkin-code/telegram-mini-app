---
layer: plan
status: draft
spec: specs/features/SPEC_game-plan.md
last_reviewed: 2026-05-17
---

# Plan: эпик G1 — Game Mode, каталог шаблонов E2E, ADR-001

**Spec (implemented):** [`SPEC_game-plan`](../specs/features/SPEC_game-plan.md)  
**ADR:** [`ADR-001`](../decisions/ADR-001-save-kind-remove-light-hardcore.md)  
**Тяжёлый детальный план по слоям БД/API:** [evolution §II.3](../vision/ideas/money-quest-evolution-after-mvp.md#ii3-план-доработок-по-слоям) (ориентир; G1 режет scope: Game only, Plan в MVP 2.0).

## Summary

Один **вертикальный срез**: миграция **`save_kind` + удаление light/hardcore**, таблица **`game_starter_templates`** и сид **каталога шаблонов**, применение старта (blueprint), правка **событий**, **API + `api.js`**, **новый поток старта без `DifficultyScreen`** (удалён), смоук **нескольких периодов**. Отдельного релиза «только поле без шаблона» нет.

## Dependency graph

```text
SQL: save_kind, шаблоны, миграция event filter, удаление mode usage
  └── models + seed каталога шаблонов
        └── POST profiles + GET templates
              └── process_period_end + lifestyle field (минимум)
                    └── frontend: NewProfileKindScreen → GameTemplatePickScreen
                          └── overview задел (опционально той же веткой)
```

## Vertical slices

1. **Slice 1 — Backend+DB ядро:** `save_kind`, шаблон, бэкфилл профилей `game`, убрать валидацию light/hardcore, мигрировать `EventDefinition`/фильтр, `ensure_period_events` от `save_kind`.
2. **Slice 2 — Старт из шаблона:** blueprint создаёт salary/assets/liabilities для выбранного ключа шаблона.
3. **Slice 3 — Frontend:** `NewProfileKindScreen` → `GameTemplatePickScreen` → игра; **`DifficultyScreen` удалён**; список профилей без legacy `mode`; Plan в UI — заглушка.
4. **Slice 4 — Наблюдаемость победы/cashflow:** малый прирост overview (если входит в объём G1 по spec).

**Не входит:** Plan UI и prefill; полный victory **M из N** (кроме задела схемой и полей overview). Контент каталога можно расширять без смены контракта.

## Risks

| Risk | Mitigation |
|------|------------|
| Ломаем прод при несогласованном деплое фронта/бэка | релиз одной волной; feature flag только если понадобится |
| Сиды событий | миграция значений `mode`/`any` явно в задаче |

## Checkpoints

- [x] SPEC_game-plan → `approved`
- [x] ADR-001 зафиксирован
- [x] MVP audit подписан владельцем (2026-05-16)
- [x] MQ-101–108 — playable Game path (каталог шаблонов + старт из blueprint E2E)
- [x] SPEC_game-plan → `implemented` в репозитории (продуктовый sign-off при необходимости отдельно)

## Tasks (MQ-101–108)

Очередь дублируется в [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md). Зависимости линейные там, где указано «После».

### MQ-101 — SQL: `save_kind`, шаблоны, отказ от `GameProfile.mode`

- **Acceptance:** миграция добавляет `save_kind` (NOT NULL, default `game` для бэкфилла), таблицу `game_starter_templates`, колонку дельты lifestyle на профиле (имя — по модели); колонка `mode` удалена или переименована по ADR; скрипт безопасен на БД с существующими профилями.
- **Verify:** применить миграцию локально / staging; smoke SELECT.
- **Files:** `backend/migrations/*.sql`, при необходимости `backend/main.py`.
- **Estimate:** M · **Depends:** —

### MQ-102 — SQLAlchemy модели и автодобавление колонок

- **Acceptance:** `models.py` отражает схему MQ-101; ответы API не используют legacy `mode`.
- **Verify:** импорт приложения, `create_all`/стартер без ошибок.
- **Files:** `backend/app/models.py`, `backend/main.py`.
- **Estimate:** S · **Depends:** MQ-101

### MQ-103 — Сиды: каталог Game-шаблонов + миграция значений событий

- **Acceptance:** несколько строк в `game_starter_templates` с blueprint (JSON); `event_definitions.mode` приведены к семантике `game` / `plan` / `any` по [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md).
- **Verify:** данные в БД после миграции + сид; выборка событий для `save_kind=game` не пустая там, где ожидается.
- **Files:** `backend/migrations/`, при необходимости SQL seed.
- **Estimate:** M · **Depends:** MQ-101

### MQ-104 — API профилей и каталог шаблонов

- **Acceptance:** `POST /api/game/profiles` принимает `save_kind` + `template_key` (Game); нет валидации light/hardcore; `GET /api/game/templates` отдаёт минимум один шаблон для UI.
- **Verify:** pytest или ручной curl; контракт в `frontend-react/src/api.js` обновлён в MQ-108.
- **Files:** `backend/app/routers/game.py`, `backend/app/schemas.py`.
- **Estimate:** M · **Depends:** MQ-102, MQ-103

### MQ-105 — Применение blueprint при создании профиля

- **Acceptance:** из шаблона создаются стартовые сущности (зарплата / активы / долги по задумке одного шаблона); профиль можно начать играть без ручного `BaseParams`, если это цель шаблона.
- **Verify:** создание профиля → данные в таблицах salary/assets/liabilities.
- **Files:** сервис/роутер игры, возможно `finance` helpers.
- **Estimate:** L · **Depends:** MQ-104

### MQ-106 — События: фильтр по `save_kind`, снять `profile.mode`

- **Acceptance:** `ensure_period_events` и связка из `game_period.py` не используют light/hardcore профиля; фильтр согласован с ADR.
- **Verify:** pytest на выбор событий для нового профиля; ручной период.
- **Files:** `backend/app/routers/events.py`, `backend/app/game_period.py`.
- **Estimate:** M · **Depends:** MQ-102, MQ-103

### MQ-107 — Конец периода: `base_monthly_lifestyle_expense` + дельта (минимум)

- **Acceptance:** в `process_period_end` учитываются базовая «жизнь» из шаблона и поле дельты на профиле (списание на `cash` или эквивалент, не ломая остальной цикл).
- **Verify:** pytest или сценарий 2 периода; cash согласован с ожиданием.
- **Files:** `backend/app/game_period.py`, хелперы.
- **Estimate:** M · **Depends:** MQ-105

### MQ-108 — Frontend: старт без `DifficultyScreen`, новый контракт

- **Acceptance:** поток новой игры не требует light/hardcore; вызовы `api.js` соответствуют MQ-104; список профилей не показывает legacy режим (достаточно `save_kind`/лейбла game).
- **Verify:** `npm run build`; ручной проход новой игры в dev.
- **Files:** `frontend-react/src/api.js`, `App.jsx`, `components/new-game/NewProfileKindScreen.jsx`, `components/new-game/GameTemplatePickScreen.jsx`, `GameStarterPicker.jsx`, список профилей.
- **Estimate:** L · **Depends:** MQ-104, MQ-105

**Расширение (не блокер G1):** overview `avg_net_cashflow_6p` / victory v2 — отдельные пункты бэклога после закрытия MQ-108.
