---
layer: plan
epic_id: SPL
phase: define
status: approved
owner: product
last_reviewed: 2026-10-21
adr: ../decisions/ADR-016-two-products-shared-fincore.md
supersedes_partially: ../decisions/ADR-013-game-only-drop-plan-mode.md
traceability: ../TRACEABILITY.md
next_skill: test-driven-development
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/status/approved
aliases:
  - PLAN_game-plan-split
  - "Plan: разделение Game и Plan на два продукта с общим ядром"
---
# План: два продукта (Game и Plan) на общем финансовом ядре

**Эпик:** `SPL` · **Статус:** approved 2026-10-21 · ADR-016 accepted.

## Решения, принятые 2026-10-21

| # | Решение | Следствие |
|---|---------|-----------|
| D1 | **Game** — игровое приложение с элементами финансовой грамотности. **Plan** — финансовый помощник: шаги, аналитика, рекомендации. Plan не игра. | Это два продукта, а не два `save_kind` одного продукта. Plan больше никогда не станет `save_kind`. |
| D2 | Один монорепозиторий, **два деплоя**. Общий код — пакеты внутри репозитория. | Общее ядро; релизы, БД и секреты раздельные. |
| D3 | Учётные записи **полностью раздельные**. | Две таблицы пользователей в двух БД, разные JWT issuer/audience. Общий только *код* аутентификации, не данные. |
| D4 | **Ядро выделяем сейчас. Продуктовую разработку Plan начинаем после Pre-Alpha gate игры.** | Фазы 0–2 полезны игре сами по себе; Plan-фазы закрыты gate. |
| D5 | Plan v1 работает на **ручном вводе, обезличенно**. | Нет импорта выписок и open banking, нет ФИО и реквизитов. |

### Связь с ADR-013

ADR-013 остаётся в силе для **игры**: в Game нет режима Plan, `save_kind=plan` → 400, плитки «Скоро» нет. Снимается только пункт 3 («не обещать Plan… M2.0 cancelled»): Plan возвращается **отдельным продуктом** и не связан с прежним M2.0. Решение фиксирует ADR-016 (SPL-001).

[`PLAN_game-only`](PLAN_game-only.md) выполняется как есть, с одной правкой: GO-05 может сузить `save_kind` до `game`, а потом удалить колонку, потому что второго значения не будет. Старый Plan-UI (`BaseParamsScreen`, `PlanExpenseEditor`) и `create/update/revoke_plan_expense_line` **не переносим** в новый продукт: удаляем в GO-03, они остаются в истории git. Plan проектируется заново поверх ядра.

---

## Архитектурная модель

### Принцип: Shared Kernel + Ports & Adapters

```text
                ┌──────────── packages/fincore ────────────┐
                │ чистый Python, без FastAPI/SQLAlchemy/IO │
                │ деньги (Decimal), аннуитет, обязательства,│
                │ расходы и burn, активы/инвестиции,        │
                │ страховки, шаг cashflow за месяц,         │
                │ прогноз N месяцев, метрики (ADR-009)      │
                └───────▲───────────────────────▲──────────┘
                        │ DTO (dataclasses)     │ DTO
      ┌─────────────────┴──────┐      ┌─────────┴──────────────┐
      │ game-api (backend/)    │      │ plan-api (apps/plan-api)│
      │ адаптеры ORM → DTO     │      │ адаптеры ORM → DTO      │
      │ период-ход, события,   │      │ календарные месяцы,     │
      │ needs, victory, ачивки │      │ факт vs план, шаги,     │
      │ шаблоны, guidance игры │      │ рекомендации, аналитика │
      │ БД game                │      │ БД plan                 │
      └────────────────────────┘      └─────────────────────────┘
                ▲                                 ▲
      packages/platform: config, db session factory, idempotency,
      JWT/Argon2, health, логирование, ошибки API (общий код, не общие данные)
```

Правила, которые проверяются в CI, а не держатся на договорённости:

1. `fincore` **не импортирует** `app.*`, `sqlalchemy`, `fastapi`, `pydantic` и ввод-вывод. Только stdlib, `Decimal` и dataclasses.
2. В `fincore` нет игровых понятий: needs, события, победа, шаблон, лига, ход. Время в ядре — абстрактный «месяц» (`month_index`). Игра отображает `period_index → month_index`, Plan — `date → month_index`.
3. `platform` не знает о доменах. Домены не импортируют друг друга между приложениями: game ↛ plan, plan ↛ game.
4. Контроль — `import-linter` (contracts: *forbidden*, *layers*, *independence*) в `pytest`/CI.

### Почему так, а не иначе

| Вариант | Почему нет |
|---------|------------|
| Общий микросервис расчётов (HTTP/gRPC) | Сетевой вызов внутри закрытия периода, отдельный деплой и версия API ради чистых функций. Для команды из 1–2 человек дорого. Если понадобится, пакет потом легко обернуть в сервис. |
| Общая БД с префиксами таблиц | Финансовые данные людей рядом с игровыми; общие миграции связывают релизы. Противоречит D3. |
| Отдельные репозитории | Каждое изменение ядра = версия + публикация + bump в двух репо. Монорепо с path-зависимостями даёт атомарные PR. |
| Сначала переложить всё в `apps/` | На пути `backend/` и `frontend-react/` ссылаются **~16.8 тыс. мест в ~4 тыс. файлов** (`.claude/`, `docs/`, `scripts/`, guardrails; только в `.claude/` — 347 в 60 файлах), плюс CI (`deploy-app.yml`, `skills-check.yml`). Переезд перед α — чистая стоимость. Принцип: **добавляем рядом, не двигаем** (ниже). |

### Целевая раскладка репозитория

```text
packages/
  fincore/            # Python, uv workspace member, своя pytest-сюита
  platform/           # Python: config, db, idempotency, auth-примитивы, health
  ui-kit/             # (фаза 4) MQX-примитивы + токены тем, без игровых компонентов
  api-client/         # (фаза 4) apiCall/ApiError, обработка Idempotency-Key
backend/              # = game-api (остаётся на месте до отдельного решения)
frontend-react/       # = game-web (остаётся на месте)
apps/
  plan-api/           # (фаза 4) FastAPI, своя БД и миграции
  plan-web/           # (фаза 4) Vite + React, свой бренд-слой
data/events/          # только игра
```

Переименование `backend/ → apps/game-api` и `frontend-react/ → apps/game-web` — **опциональный** срез SPL-090, только после α одним PR со скриптом переписывания путей.

### Что общее, а что уникальное (по текущему коду)

| Модуль сейчас | Куда | Состояние |
|---------------|------|-----------|
| `finance/annuity.py` | **fincore** | уже чистый, перенос 1:1 |
| `finance/invest_products.py` | **fincore** | убрать `HTTPException` → доменное исключение |
| `finance/helpers.py`, округления | **fincore** (`money`) | чистый |
| `finance/liability_kinds.py`, `starter_liability.py` (расчёт) | **fincore** | отвязать от ORM `FinanceLiability` |
| `finance/expenses.py` → `compute_monthly_burn` | **fincore** (расчёт) + адаптер в game | загрузку из БД разделить с расчётом |
| `game/period.py` → `_pay_liabilities`, `_charge_assets`, `_charge_lifestyle`, `_charge_insurance`, `_accrue_investments` | **fincore** `month_step()` | главный рефакторинг: расчёт сейчас перемешан с ORM. Порядок шагов и запись транзакций остаются в игре |
| `finance/period_close_preview.py` | **fincore** (прогноз) | Plan использует как «прогноз месяца» |
| `finance/period_metrics.py`, метрики ADR-009 | **fincore** (`metrics`) | DTI, норма сбережений, месяцев подушки, net worth |
| `finance/balance_utils.py` (ledger, lock профиля) | **platform**-паттерн + адаптер в каждом приложении | у ledger у каждого своя таблица |
| `idempotency.py`, `auth*.py`, `config.py`, `database.py`, `cors_settings.py` | **platform** | после PR-05/PR-06 (секреты, Argon2), иначе перенесём долг |
| `events/`, `needs/`, `victory/`, `achievements/`, `starters/`, `game/` (оркестрация, run_finale), `telegram/` | **только Game** | — |
| `guidance/` (биты, триггеры, gates) | Game; **кандидат** в общий `journey` | выносить только когда Plan-шаги реально совпадут (правило трёх), не заранее |
| `admin/` (Watchtower) | у каждого приложения свой | общий админ-каркас — не раньше, чем появится второй потребитель |
| Plan: бюджет по факту, цели накоплений, рекомендации, шаги-сценарии | **только Plan** | новый код |

Модель `GameProfile` смешивает финансовое состояние (cash, подушка) и игровое (needs, лига, streak, исход). В ядре её **нет**. Вместо неё DTO `HouseholdSnapshot(incomes, liabilities, assets, expense_lines, policies, positions, cash, safety_fund)`. Игровой адаптер собирает DTO из `GameProfile` и связанных таблиц.

---

## Фазы и срезы

Оценки в неделях фокуса (н), как в [`PLAN_production-ready`](PLAN_production-ready.md).

### Фаза 0 — Канон (до кода) · ~0.3 н

| ID | Задача | Skill | Done |
|----|--------|-------|------|
| SPL-001 | ADR-016 «Два продукта, общий fincore». Частично заменяет ADR-013 п.3; фиксирует D1–D5 и правила границ | documentation-and-adrs | accepted |
| SPL-002 | Idea `plan-financial-assistant.md`: ЦА, JTBD, «шаги», что считается рекомендацией, что Plan **не делает** | idea-refine | approved (сам продукт — после α) |
| SPL-003 | Канон: `CLAUDE.md`, `SPEC_PRODUCT` §0, `GLOSSARY`, `TRACEABILITY` (эпик SPL), правка GO-05 в `PLAN_game-only` | documentation-and-adrs | `check_conventions.py` зелёный |

### Фаза 1 — Границы внутри текущего backend (без переносов) · ~0.5 н

| ID | Задача | Done |
|----|--------|------|
| SPL-101 | **Characterization-тесты** до рефакторинга: зафиксировать baseline `balance_playtest` (30–40 периодов, 4 шаблона) и golden-ответы `process_period_end`, `estimate_period_close_preview`, `compute_monthly_burn` на фикстурах | golden-файлы в `backend/tests/golden/` |
| SPL-102 | `import-linter` в dev-зависимости + контракт «кандидаты в fincore не импортируют sqlalchemy/fastapi». Пока режим *report*: список нарушений = backlog фазы 2 | контракт в CI, отчёт в плане |
| SPL-103 | Path-scoped rule `.claude/rules/fincore.md`: без игровых терминов, без IO; обновить `project-skills-layout` | `_claude-config-check.mjs` зелёный |

### Фаза 2 — Выделение `packages/fincore` · ~1.5–2 н

Gate каждого среза: **balance diff = 0** относительно SPL-101 и pytest зелёный. Primary: game-economy-and-victory; satellites: test-driven-development, doubt-driven-development; второй проход — `economy-reviewer`.

| ID | Срез | Done |
|----|------|------|
| SPL-201 | Каркас: `packages/fincore` (pyproject, uv workspace / path-dependency в `backend/requirements`), `money.py` (Decimal, округление как сейчас) | `import fincore` в game-api; CI гоняет тесты пакета |
| SPL-202 | `annuity`, `invest_products`, `liability_kinds` → fincore; в `backend/app/finance/` реэкспорт-шимы | golden = 0 |
| SPL-203 | DTO `HouseholdSnapshot` + игровой адаптер `game/adapters/fincore_snapshot.py` | unit-тест адаптера |
| SPL-204 | `compute_monthly_burn` → чистая `fincore.expenses.burn(lines, month_index)` | golden = 0 |
| SPL-205 | `fincore.month_step(snapshot) → MonthResult(postings[], balances, warnings)`. `period.py` вызывает его и сам пишет `Transaction` и снапшоты. Порядок шагов закрытия — в игре (ADR-011) | golden = 0, balance diff = 0 |
| SPL-206 | `fincore.forecast(snapshot, months=N)` на базе `month_step`; `period_close_preview` → тонкий адаптер | golden = 0 |
| SPL-207 | `fincore.metrics` (ADR-009): DTI, норма сбережений, месяцы подушки, net worth | unit + сверка с overview |
| SPL-208 | Контракт import-linter переводим из *report* в *enforce*; шимы из SPL-202 удаляем | CI падает при нарушении |

### Фаза 3 — `packages/platform` · ~0.5 н (после PR-05, PR-06, PR-08)

| ID | Срез | Done |
|----|------|------|
| SPL-301 | `config`, `database` (session factory), `idempotency`, `health`, единый формат ошибок API → platform | game-api на platform, pytest зелёный |
| SPL-302 | Auth-примитивы (JWT с `iss`/`aud` по приложению, Argon2id, rehash) → platform. Пользователи и модели остаются в приложении | токен game не принимается plan-api (тест появится в SPL-402) |

**Gate α:** дальше идём только после Pre-Alpha gate игры (фаза 0 [`PLAN_backlog_may2026`](PLAN_backlog_may2026.md)).

### Фаза 4 — Plan: каркас · после α · ~2 н

| ID | Срез | Skill | Done |
|----|------|-------|------|
| SPL-401 | `SPEC_plan-v1.md`: шаги, сущности, метрики, рекомендации (детерминированные правила с объяснением «почему»), ограничения D5 | spec-driven-development | approved |
| SPL-402 | `apps/plan-api`: FastAPI на platform, своя БД и миграции, свои users; health, auth, CRUD «домохозяйства» вручную | api-and-interface-design + TDD | e2e: регистрация → ввод → прогноз из fincore |
| SPL-403 | `packages/ui-kit` + `packages/api-client` (npm workspaces): из MQX выносим **только** примитивы и токены; игровые компоненты (needs, juice, events, pregame) остаются в game-web | frontend-ui-engineering | game-web собирается на ui-kit, guardrails зелёные |
| SPL-404 | `apps/plan-web`: Vite-приложение, своя тема и бренд, lab-раунд в `design-lab/plan-*` | design-lab-mqx → frontend-ui-engineering | путь «ввод → обзор → первый шаг» |
| SPL-405 | CI: фильтры по путям. Изменение в `packages/fincore` или `platform` → тесты **обоих** приложений + balance diff игры | release-web | required checks |
| SPL-406 | Деплой: два контейнера, два домена, раздельные `SECRET_KEY` и БД, бэкапы | release-web | smoke обоих |

### Фаза 5 — Plan v1 продукт · после SPL-4xx

Шаги-сценарии (кандидат на общий `journey` с guidance игры — решаем здесь, а не раньше), цели накоплений, рекомендации, аналитика. Отдельный `PLAN_plan-v1.md` после spec.

### SPL-090 (опционально, после α) — переезд игры в `apps/`

Один PR: `git mv` + скрипт переписывания путей в `.claude/`, `docs/`, guardrails и хуках + `_claude-config-check.mjs`. Делаем, только если два стиля раскладки реально мешают.

---

## Зависимости

```text
SPL-001..003 ─► SPL-101..103 ─► SPL-201 ─► 202 ─► 203 ─► 204 ─► 205 ─► 206 ─► 207 ─► 208
PR-05/06/08 (production-ready) ─► SPL-301 ─► 302
                       [Pre-Alpha gate игры] ─► SPL-401 ─► 402 ─► 403 ─► 404 ─► 405 ─► 406 ─► фаза 5
```

Фаза 2 **не параллелится** с NV-шагом 4 (калибровка needs, тот же `period.py`). Сначала закрыть NV-406/407, потом SPL-205. Иначе balance diff нечем интерпретировать.

## Риски

| Риск | Цена | Митигация |
|------|------|-----------|
| Рефакторинг закрытия периода меняет числа | Тихий сдвиг баланса, ломаются victory-пороги | SPL-101 golden + balance diff = 0 как gate каждого среза; `economy-reviewer` |
| Ядро «протекает» игровыми понятиями | Plan тащит needs и ходы | import-linter enforce, rule `fincore.md`, ревью |
| Преждевременное обобщение (journey, admin, ui-kit) | Абстракции под одного потребителя | Выносим только при втором реальном потребителе |
| Plan отвлекает от α | Сдвиг Pre-Alpha | D4: продуктовые фазы Plan закрыты gate |
| Обезличенность Plan формальна | Аккаунт с e-mail/TG id + финансовые данные = персональные данные (152-ФЗ, GDPR) | До SPL-402: решить, чем логинимся (псевдоним без e-mail?), где хостим (контур РФ/ЕС), хранение, удаление по запросу. Нужна консультация юриста |
| «Рекомендации» попадают под регулирование | Индивидуальные инвестиционные рекомендации регулируются (39-ФЗ) | В v1 только бюджет, долги и подушка; без рекомендаций по конкретным ценным бумагам; формулировки согласовать с юристом |
| Раздельные аккаунты (D3) | Нет воронки «игрок → клиент Plan», кросс-промо только ссылкой | Принято осознанно; вернуться при метриках α |

## Открытые вопросы (к SPL-002 / SPL-401)

1. Логин в Plan: e-mail, Telegram, анонимный ключ? От этого зависит, остаются ли данные обезличенными.
2. Контур хостинга Plan (РФ / ЕС / оба) — следует из целевой аудитории.
3. Бренд Plan: «ТВОЙ ХОД» или отдельное имя? От этого зависит объём `ui-kit` (общие токены или только примитивы).
4. «Шаги» в Plan — фиксированный сценарий (мастер) или динамический план действий по метрикам?

## Checkpoints

- [x] Владелец продукта: **APPROVED** этот план (2026-10-21)
- [x] ADR-016 accepted, канон синхронизирован (SPL-003)
- [ ] fincore выделен, balance diff = 0, import-linter enforce (SPL-208)
- [ ] platform выделен (SPL-302)
- [ ] Pre-Alpha gate игры пройден → старт фазы 4
