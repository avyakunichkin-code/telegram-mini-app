---
name: api-and-interface-design
description: Designs the FastAPI ↔ React contract for ТВОЙ ХОД — Pydantic schemas, error codes, idempotent money endpoints, backward-compatible changes, src/api/<домен>.js mirror. Use when adding or changing an /api endpoint, request/response fields, or a boundary between services/<домен>.
argument-hint: "[focus: endpoint | module | contract]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# API and Interface Design

## Прочитай сначала (ТВОЙ ХОД)

- [`.claude/skills/_shared/game-lexicon.md`](../_shared/game-lexicon.md) — overview, period, victory контракт
- [`CLAUDE.md`](../../../CLAUDE.md)
- [`backend/app/README.md`](../../../backend/app/README.md)
- [`frontend-react/src/api/client.js`](../../../frontend-react/src/api/client.js)

## Читай при условии (`catalog.yaml` → `read_if`)

| Когда | Файлы |
|-------|--------|
| router / services pattern | [`backend/app/services/README.md`](../../../backend/app/services/README.md) |
| docs pipeline | [`docs/DOCUMENTATION_SYSTEM.md`](../../../docs/DOCUMENTATION_SYSTEM.md) |
| есть feature spec | matching [`docs/specs/features/SPEC_*.md`](../../../docs/specs/features/) |

**Куда писать:** `backend/app/routers/`, `backend/app/schemas.py`, `frontend-react/src/api/`, при необходимости `docs/specs/features/`. **Дальше:** `incremental-implementation`, `documentation-and-adrs`.

## Overview

Design stable, well-documented interfaces that are hard to misuse. Good interfaces make the right thing easy and the wrong thing hard. This applies to the FastAPI ↔ React contract, module boundaries between `services/<домен>`, component props, and any surface where one piece of code talks to another.

## When to Use

- Designing new API endpoints
- Defining module boundaries or contracts between teams
- Creating component prop interfaces
- Establishing database schema that informs API shape
- Changing existing public interfaces

**When NOT primary:** только YAML события → **create-event**; только CSS → **frontend-ui-engineering**; typo без контракта → **incremental-implementation**.

**Release-ready контракт:** OpenAPI-level ясность (поля, ошибки, backward compat); sync `schemas.py` + `src/api/<домен>.js` + critical test; self-review [`release-ready-quality.md`](../_shared/release-ready-quality.md).

## Core Principles

### Hyrum's Law

> With a sufficient number of users of an API, all observable behaviors of your system will be depended on by somebody, regardless of what you promise in the contract.

This means: every public behavior — including undocumented quirks, error message text, timing, and ordering — becomes a de facto contract once users depend on it. Design implications:

- **Be intentional about what you expose.** Every observable behavior is a potential commitment.
- **Don't leak implementation details.** If users can observe it, they will depend on it.
- **Plan for deprecation at design time.** See `deprecation-and-migration` for how to safely remove things users depend on.
- **Tests are not enough.** Even with perfect contract tests, Hyrum's Law means "safe" changes can break real users who depend on undocumented behavior.

### The One-Version Rule

Avoid forcing consumers to choose between multiple versions of the same dependency or API. Diamond dependency problems arise when different consumers need different versions of the same thing. Design for a world where only one version exists at a time — extend rather than fork.

### 1. Contract First

Сначала контракт, потом код: раздел **Data & API** в `docs/specs/features/SPEC_*.md`, затем Pydantic-модель в `backend/app/schemas.py` (`response_model=` на роуте), затем FE-зеркало в `frontend-react/src/api/<домен>.js`. Тело запроса — Pydantic-модель, а не `payload: dict` (старые `dict`-роуты в `invest.py`, `events.py` — долг, не образец).

### 2. Consistent Error Semantics

- `HTTPException(status_code, detail=...)`; `detail` — русская строка для игрока или `{"message", "errors"}` для форм админки (422).
- Коды: **400** — невалидный ввод / нарушение правила игры; **403** — нет прав; **404** — нет сущности (или активного профиля); **409** — параллельный запрос с тем же ключом ещё выполняется; **410 Gone** — эндпоинт снят (пример: `POST /api/game/period/complete-period`).
- FE: `apiCall` → `ApiError`, текст — `formatApiErrorDetail` (`src/api/client.js`); не разбирать ошибки вручную в компонентах.

### 3. Validate at Boundaries

- Всё, что приходит от клиента, валидируется на входе (Pydantic, явные проверки диапазонов).
- **Цены, ставки, суммы наград — только с сервера** (`finance/invest_products.py`, каталоги в БД/YAML). Клиентское поле вроде `annual_rate_percent` игнорируется — иначе игрок задаёт себе экономику.

### 4. Prefer Addition Over Modification

- Новые поля — опциональные с дефолтом; старые клиенты не ломаются.
- Модели запросов с `model_config = ConfigDict(extra="ignore")` переживают устаревшие поля (пример: `period_duration_seconds` в `GameStartRequest` после удаления таймера).
- Удаление поля ответа: сначала `grep` по `frontend-react/src`, потом удаление; колонка БД — отдельным этапом (код перестаёт писать → миграция `DROP COLUMN` → модель), см. `db-baselines-and-migrations`.

### 5. Money and Mutations

- Денежный POST — `Idempotency-Key` → `run_idempotent` (`backend/app/idempotency.py`); FE добавляет ключ через `utils/idempotencyKey.js` — новый денежный эндпоинт внести в его список.
- Баланс меняется только через `adjust_balance` (row-lock), не присваиванием `cash_balance`.
- Повтор запроса после успеха возвращает сохранённый ответ, а не второе списание; тест на это — gate G3/G4 в `critical-test-scenarios`.

### 6. Naming and Layering

- Пути `/api/<домен>/...`, существительные во множественном числе для коллекций; действие, которое не CRUD, — глагол в конце пути (`/time/next`, `/claim-salary`).
- Роутер тонкий (auth, парсинг, вызов сервиса) → логика в `backend/app/services/<домен>/`; обработчики — `def`, не `async def` (сессия БД синхронная).
- Новый эндпоинт → строка в карте [`backend/app/README.md`](../../../backend/app/README.md).

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "We'll document the API later" | The types ARE the documentation. Define them first. |
| "We don't need pagination for now" | You will the moment someone has 100+ items. Add it from the start. |
| "PATCH is complicated, let's just use PUT" | PUT requires the full object every time. PATCH is what clients actually want. |
| "We'll version the API when we need to" | Breaking changes without versioning break consumers. Design for extension from the start. |
| "Nobody uses that undocumented behavior" | Hyrum's Law: if it's observable, somebody depends on it. Treat every public behavior as a commitment. |
| "We can just maintain two versions" | Multiple versions multiply maintenance cost and create diamond dependency problems. Prefer the One-Version Rule. |
| "Internal APIs don't need contracts" | Internal consumers are still consumers. Contracts prevent coupling and enable parallel work. |

## Red Flags

- Endpoints that return different shapes depending on conditions
- Inconsistent error formats across endpoints
- Validation scattered throughout internal code instead of at boundaries
- Breaking changes to existing fields (type changes, removals)
- List endpoints without pagination
- Verbs in REST URLs (`/api/createTask`, `/api/getUsers`)
- Third-party API responses used without validation or sanitization

## Verification

After designing an API:

- [ ] Every endpoint has typed input and output schemas
- [ ] Error responses follow a single consistent format
- [ ] Validation happens at system boundaries only
- [ ] List endpoints support pagination
- [ ] New fields are additive and optional (backward compatible)
- [ ] Naming follows consistent conventions across all endpoints
- [ ] API documentation or types are committed alongside the implementation

---

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

Перед созданием или изменением файлов в репозитории спроси: «Могу записать …?» — если пользователь не дал явное «делай» / «запиши».

## Следующий шаг

`spec-driven-development` → `incremental-implementation`; при смене контракта — `documentation-and-adrs`.

