---
layer: spec
status: implemented
owner: product
last_reviewed: 2026-05-25
tracks: save-kind, game-plan, victory-v2
idea: vision/ideas/tvoy-hod-evolution-after-mvp.md
plan: plans/PLAN_game-plan.md
adr: decisions/ADR-001-save-kind-remove-light-hardcore.md
audit: foundation/MVP_AUDIT_VS_SPEC.md
---

# Spec: Game Mode, шаблоны старта, отказ от light/hardcore (эпик G1)

## Пояснение терминов (чтобы не теряться)

| Термин | Что это значит практически |
|--------|----------------------------|
| **Вертикальный срез (vertical slice)** | Кусок работы, который **сам по себе уже работает сквозь весь стек**: есть изменения в БД, в API, на фронте, и игрок может **пройти сценарий целиком**. Противоположность — «сначала вся БД, потом весь API, потом весь UI»: так дольше видеть результат и легче ошибиться в интеграции. |
| **Dual-read** | Переходный режим в коде: бэкенд **одновременно** понимает **старое** поле (например `mode`) **и новое** (`save_kind`), пытаясь не сломать старых клиентов. Вопрос был: нужен ли нам такой переходный период. **Решение: нет** ([ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md)). |
| **Таблица `profile_lifestyle_adjustments` vs поле на профиле** | Речь про **куда сохранять дельты «жизненных» месячных расходов** после событий (например +500 ₽ к «базе жизни» на 3 периода). **Таблица** — отдельная строка на каждую дельту (удобно: источник, срок действия, история). **Поле на профиле** — одно число или компактный JSON «текущая сумма дельт». **Решение для G1:** начать с **поля на профиле** (проще для одного шаблона и смоука); вынести в таблицу, когда понадобятся множественные источники и сроки с разной жизнью. |

Перед разработкой эпика: [`foundation/MVP_AUDIT_VS_SPEC.md`](../../foundation/MVP_AUDIT_VS_SPEC.md) — соответствие **текущего** MVP foundation-спеки.

---

## Assumptions

1. Legacy **`light` / `hardcore`** снимаются **полностью**; новая ось — **`save_kind`**, см. [ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md). Переходного dual-read нет.
2. Первые **6** периодов без победы сохраняются (`min_period_index_for_victory` по умолчанию **7**).
3. Game Mode: **автоматические** списания «жизни»; ручная оплата расходов — вне scope.
4. **Plan Mode (мастер, prefill `starter_params_json`)** — **MVP 2.0**, **вне scope эпика G1**; в G1 допускается зарезервировать поля/контракт в БД без UI Plan.
5. **Порядок поставки:** полный путь **Game из каталога шаблонов end-to-end** (БД + API + применение в `process_period_end` + стартовый UI с выбором шаблона), а не отдельный релиз «только `save_kind` без шаблона».
6. Детали Q&A и таблицы по слоям — [evolution §II](../../vision/ideas/tvoy-hod-evolution-after-mvp.md); этот файл — **исполняемая spec** для G1.

---

## Objective

**Why:** перейти от устаревшей пары сложности к **Game-сохранениям со стартовым шаблоном** и заделом на Plan в 2.0.

**Who:** игрок TMA, начинающий новую игру в **Game Mode**.

**Success criteria (эпик G1 — Game only)**

- [x] Новый профиль создаётся с **`save_kind = game`** (и без выбора light/hardcore).
- [x] Сидированный **каталог Game-шаблонов** задаёт стартовые сущности и **базу «жизненных» расходов** (`base_monthly_lifestyle_expense` + blueprint).
- [x] Игрок проходит путь **от создания профиля до нескольких периодов** без `DifficultyScreen` legacy (экран удалён).
- [x] События и конец периода используют **новую семантику фильтра** (не `light`/`hardcore` профиля), согласованную с ADR.
- [x] **Overview:** поля **`avg_net_cashflow_6p`** / **`avg_net_cashflow_6p_n`** присутствуют; условие победы MVP не сломано до включения victory v2 (**M из N**).

**Реализовано после G1 (backend)**

- [x] Победа **M из N** из `victory_config_json` — [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md), `victory/engine.py`.

**Отложено на MVP 2.0 / backlog**

- [ ] `save_kind = plan`, мастер Plan, prefill из другого сохранения.
- [x] UI прогресса целей победы (P1: `MqxGoalDash`, `overview.victory`); [ ] расширение каталога шаблонов (ориентир 5 сценариев).

---

## Scope

### In scope (G1)

- Миграция: `save_kind`, таблица/сид **`game_starter_templates`**, удаление семантики **`GameProfile.mode`** light/hardcore из API/UI.
- Каталог шаблонов E2E + применение старта (blueprint) по **`template_key`**.
- Дельты «жизни» для смоука: **поле на профиле** (см. глоссарий выше); при росте сложности — таблица в отдельной задаче.
- Обновление фильтра событий и сидов под ADR.
- Документация: foundation §0, этот spec, MVP audit, TRACEABILITY.

### Out of scope

- Plan UI и prefill (MVP 2.0).
- Ручная оплата расходов по категориям.
- Alembic.
- Полный контент «пятого» шаблона и связка достижений (часть контента уже в каталоге из **четырёх** сидов).

---

## User flows

Ref: [`foundation/TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md).

| Шаг | G1 (Game) |
|-----|------------|
| Новая игра | `NewProfileKindScreen` → **`GameTemplatePickScreen`**: выбор шаблона из **`GET /api/game/templates`** + длительность периода → создание профиля |
| Повторная игра | Тот же поток; каталог уже содержит несколько ключей сложности |

---

## Data & API

### Models (целевое для G1)

| Сущность | Поля (ключевые) |
|----------|-----------------|
| `GameProfile` | `save_kind`, `starter_template_key`, `starter_params_json`, `base_monthly_lifestyle_expense`, **`delta_monthly_lifestyle_expense`** |
| `game_starter_templates` | стартовые деньги/зарплата, `base_monthly_lifestyle_expense`, blueprint, задел `victory_config` |
| События | замена фильтра `light`/`hardcore` на согласованный с `save_kind` (см. ADR) |

### Endpoints

| Method | Path | Назначение |
|--------|------|------------|
| POST | `/api/game/profiles` | Без `mode` light/hardcore; тело с `save_kind` + `template_key` |
| GET | `/api/game/templates` | Каталог шаблонов для UI (`description` из blueprint при наличии) |
| GET | `/api/finance/overview` | **`avg_net_cashflow_6p`** / **`avg_net_cashflow_6p_n`** плюс текущая победа MVP; victory v2 подключается отдельно |
| GET | `/api/game/profiles` | `save_kind`, при необходимости `difficulty_rank` из шаблона |

Sync: `frontend-react/src/api.js`, `CLAUDE.md`.

---

## UI / UX

Ref: [`SPEC_FRONTEND_UI.md`](../SPEC_FRONTEND_UI.md).

- **`DifficultyScreen`** удалён. Поток: **`NewProfileKindScreen`** (Игра / План; Plan — заглушка) → **`GameTemplatePickScreen`** → игра.
- Бейджи `plan` и полная типизация сложности в списке сохранений — на усмотрение следующих задач (поле **Plan** в БД уже есть).

---

## Rules & edge cases

- `save_kind` immutable после create.
- Победа MVP: до внедрения victory v2 сохраняем текущие правила `win_reached` и `period_index >= 7`.
- События: не использовать `profile.mode` как light/hardcore после миграции.

---

## Testing strategy

| Layer | Verify |
|-------|--------|
| Backend | pytest: создание профиля, конец периода, фильтр событий |
| Manual TMA | новая игра через **NewProfileKind** → **GameTemplatePick**, без legacy экрана сложности |

```bash
cd backend && pytest
cd frontend-react && npm run build
```

---

## Boundaries

- **Always:** следовать [ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md); обновить [MVP audit](../../foundation/MVP_AUDIT_VS_SPEC.md) после merge.
- **Ask first:** расширение контракта overview ломающее фронт.
- **Never:** возвращать light/hardcore как обязательный выбор пользователя.

---

## Решения по бывшим open questions

| # | Было непонятно | Решение (2026-05-16) |
|---|----------------|----------------------|
| 1 | Порядок вертикальных срезов: сначала только `save_kind` или сразу шаблон + UI? | **Сразу полный вертикальный срез:** `save_kind`, каталог **`game_starter_templates`**, применение blueprint и новый поток старта (см. глоссарий «вертикальный срез»). |
| 2 | Нужен ли dual-read `mode` / `save_kind`? | **Нет** — одна волна миграции ([ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md)). |
| 3 | Таблица lifestyle vs поле на профиле? | **Поле на профиле в G1**; таблица — когда понадобится учёт по источникам/срокам. |

---

## Traceability

| Artifact | Link |
|----------|------|
| ADR | [ADR-001](../../decisions/ADR-001-save-kind-remove-light-hardcore.md) |
| Audit MVP | [`MVP_AUDIT_VS_SPEC`](../../foundation/MVP_AUDIT_VS_SPEC.md) |
| Idea | [evolution](../../vision/ideas/tvoy-hod-evolution-after-mvp.md) §II |
| Plan | [PLAN_game-plan](../../plans/PLAN_game-plan.md) |
| Backlog | [PRODUCT_BACKLOG](../../backlog/PRODUCT_BACKLOG.md) |
| Matrix | [TRACEABILITY](../../TRACEABILITY.md) G1 |
