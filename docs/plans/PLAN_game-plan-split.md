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

**Статус фазы 1 (2026-10-21, ветка `claude/spl-fincore`):**
- **SPL-102 ✅.** Enforce-контракт `backend/.importlinter` (fincore ↛ app/fastapi/starlette/sqlalchemy/pydantic) проверяется тестом `backend/tests/test_import_boundaries.py`. Негативная проба (`import sqlalchemy` в ядре) ловится. Report-контракт — `backend/importlinter-report.ini`. Backend CI для pytest пока нет (PR-04), поэтому гейт = локальный pytest.
- **SPL-103 ✅.** Rule `.claude/rules/fincore.md` + строка в `project-skills-layout`.
- **SPL-101 ✅ (2026-10-21, после NV-406/407).**
  - `backend/tests/unit/game/test_period_close_golden.py` и `backend/tests/golden/period_close_*.json`. На каждом периоде фиксируются `compute_monthly_burn`, `estimate_period_close_preview` до закрытия, результат `process_period_end`, транзакции периода, `PeriodEconomyClosing` и состояние долгов, вкладов, полисов и статей после закрытия.
  - Три сценария без событий (`ensure_period_events` замокан), зарплата — через `claim_salary`. `full_house` (7 периодов): все виды списаний и начислений, аннуитет гасится сроком, статья и полис истекают. `shortfall_defeat`: просрочка по двум долгам, backfill статей из base, поражение `cash_negative_streak`. `partial_recovery`: частичная оплата и минус, затем зарплата гасит просрочку двумя взносами, отрицательная delta.
  - Шаблон фикстуры не существует: потребности не участвуют, backfill идёт по долям по умолчанию. Поэтому golden не зависят ни от каталога событий, ни от баланса шаблонов.
  - Сравнение с точностью 4 знака. Достижения, guidance и пул событий из результата исключены.
  - Перегенерация — `UPDATE_GOLDEN=1`, только при осознанном изменении поведения.
  - Проверено: два прогона подряд стабильны. Негативная проба (обратный порядок долгов в `_pay_liabilities`) роняет `full_house` и `shortfall_defeat`. Golden фиксирует текущий порядок без ORDER BY, так что срез «порядок долгов» (критерий 3 SPL-204/205) перегенерирует их явно. Backend pytest — 535 passed.
  - Расхождение, которое golden фиксирует, а не чинит: превью не учитывает купоны облигаций (в `full_house` факт на 200 больше оценки). Для SPL-206 это входное условие: прогноз в ядре должен либо сохранить расхождение, либо исправить его отдельным срезом.

**Backlog фазы 2 из report-контракта** (прямые импорты ORM/HTTP в кандидатах; контракт удалён в SPL-208):

| Модуль | Нарушения | Срез |
|--------|-----------|------|
| `finance/expenses.py` | `sqlalchemy`, `app.models`, `fastapi` (в plan-CRUD — уйдёт в GO-03) — остаётся адаптером (backfill, ORM), расчёт в ядре | SPL-204 ✅ |
| `finance/period_close_preview.py` | `sqlalchemy`, `app.models` | SPL-206 |
| ~~`finance/period_metrics.py`~~ | читает закрытия из БД — адаптер, формула в ядре | SPL-207 ✅ |
| ~~`finance/starter_liability.py`~~ | `app.models` — остаётся адаптером (строит ORM-строку), расчёт в ядре | SPL-203 ✅ |
| `finance/balance_utils.py` | `sqlalchemy`, `app.models` (ledger — остаётся адаптером, см. таблицу «общее/уникальное») | SPL-205 |

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

**Статус (2026-10-21, ветка `claude/spl-fincore`):**
- **SPL-201 ✅.** `packages/fincore`: pyproject, `money`, тесты пакета. Подключение — `-e ../packages/fincore` в `backend/requirements.txt` (ставить из `backend/`). uv workspace не заводили: pip-path-dependency хватает, отдельный инструмент не нужен.
- **SPL-202 ✅.**
  - `fincore.annuity` (+ `monthly_interest_payment` из `finance/helpers`), `fincore.liabilities`, `fincore.invest` (`UnknownInvestProduct` вместо `HTTPException`).
  - `backend/app/finance/{annuity,helpers}` — реэкспорт.
  - `liability_kinds`, `invest_products` — адаптеры: ORM-сигнатуры и HTTP 400.
  - `MAX_ACTIVE_CONSUMER_LOANS` и `ASSET_KIND_FOR_AUTO` остались в игре: это игровые лимиты и каталог.
  - Каталог инвест-продуктов со ставками 14/16% тоже остался в игре (`INVEST_PRODUCTS`): ставки — баланс игры. В ядре — тип `InvestProduct` и `find_invest_product(catalog, kind)`. Решение по ревью economy-reviewer.
  - Проверено: pytest backend, тесты ядра, balance playtest до/после идентичен; economy-reviewer — APPROVED.
  - Тесты ядра не входят в backend pytest (`testpaths = tests`) — до CI (PR-04) это ручной шаг из таблицы «Команды» в `CLAUDE.md`.
- **SPL-203 ✅.**
  - `fincore.household`: `HouseholdSnapshot` и DTO `Income`, `Liability`, `Asset`, `ExpenseLine`, `InsurancePolicy`, `InvestmentPosition`. Время — `month_index`; id — непрозрачные ключи приложения.
  - Адаптер `backend/app/game/adapters/fincore_snapshot.py` (`build_household_snapshot`): только чтение — без backfill статей и без истечения полисов. `month_index = period_index`. Расходы вне статей (legacy-дельта или база шаблона без статей) → `extra_monthly_expense`. Сумма статей + extra совпадает с `compute_monthly_burn` (тест).
  - `fincore.liabilities.new_liability_schedule` — платёж и срок нового долга по режиму. `starter_liability` оставил себе разбор blueprint и подбор залога: это игровой контент (эвристики названий, сроки 240/60/36 по умолчанию).
  - `expenses._active_lines_query` → публичный `active_expense_lines_query` (нужен адаптеру).
  - Проверено: backend pytest 528 passed, fincore 12 passed, balance playtest совпадает с исходным baseline (кроме `meta.git_sha`/`timestamp`); economy-reviewer — APPROVED.

- **SPL-207 ✅ (ядро + паритет; потребители — частично).**
  - `fincore.metrics`: `compute_metrics(snapshot) → HouseholdMetrics` по словарю ADR-009 §2. Структурные обязательства, расходы на жизнь (`max(0, …)`), полный отток, доход steady и с проекцией вкладов, пассивный доход, структурный поток с проекцией и без, доли расходов и платежей к доходу, долг, просрочка, ликвидность, месяцы подушки. Плюс `net_worth` — новая метрика для Plan, игра её пока не показывает. И `average_liquid_delta` — среднее Δ (cash + подушка) по закрытиям.
  - Игра: `period_metrics.avg_net_cashflow_last_closed_intervals` считает через ядро. Арифметика та же: тест на записях закрытий зелёный и на старой, и на новой реализации.
  - Паритет-тест `tests/unit/game/test_fincore_metrics_parity.py`: метрики ядра на снимке профиля совпадают с `build_finance_overview` (с округлением API) и с `build_victory_evaluation_input`.
  - **Не переключены** `overview_build` и `victory/snap`: проекция вкладов там считается в другом порядке float-операций (`p*(r/100)/12` против `p*r/100/12`), разница до округления в последнем знаке. Перевод потребителей на `compute_metrics` — отдельный срез **SPL-207b** с balance diff. Он закрывает и целевой рефакторинг ADR-009 §4 (один снимок метрик для overview, победы и аналитики).
  - Проверено: backend pytest 532 passed, fincore 18 passed, balance playtest совпадает с baseline; economy-reviewer — APPROVED. По ревью: `net_worth` не вычитает просрочку аннуитета повторно (`liability_owed`), свойство снимка переименовано в `debt_with_overdue`, чтобы не путать с `HouseholdMetrics.total_debt` (только тела).

- **SPL-204 ✅ (2026-10-21).**
  - `fincore.expenses.monthly_burn(lines, month_index, extra, categories) → MonthlyBurn`: статья активна при `expires_month_index > month_index`, сумма статьи ≥ 0 и `round(…, 2)`, итог = `max(0, Σ статей + extra)`. Суммы по категориям считаются до округления статей и сортируются по убыванию, при равенстве — в порядке появления. Уровень категории — из справочника, а не из статьи. Всё как в игре до переноса.
  - `compute_monthly_burn` сохранил сигнатуру и `BurnSnapshot` (12 потребителей) и стал адаптером: backfill статей → ORM → DTO → ядро. Backfill и справочник категорий остаются в игре — это IO и контент.
  - Правило «расходы вне статей» (дельта, а без статей и при нулевой дельте — база шаблона) теперь одно: `finance.expenses.lifestyle_extra`, его использует и адаптер снимка.
  - Перевод статьи из ORM в DTO — тоже один: `finance.expenses.expense_line_for_core`. Его вызывают и `compute_monthly_burn`, и адаптер снимка. Сумма передаётся как в БД: обрезку снизу и округление делает только ядро (по ревью economy-reviewer).
  - `fincore.metrics.lifestyle_burn` считает через `monthly_burn`: одна формула для игры, метрик и будущего Plan. Побочный эффект — метрика теперь округлена до копеек и не даёт отрицательных статей. Потребители метрики в игре ещё не переключены (SPL-207b).
  - Проверено: golden SPL-101 без изменений; backend pytest 535 passed; fincore 27 passed; economy-reviewer — APPROVED; balance playtest — 6 из 7 эталонов совпадают байт в байт. `main__student_tutorial_40p` расходится с эталоном (13 → 14 периодов, с периода 3 по выбору в событиях), но так же расходится и на дереве без SPL-204: эталон устарел раньше, отчёт после SPL-204 совпадает с отчётом до него.

- **Порядок строк в закрытии ✅ (2026-10-21, критерий 3 SPL-204/205).**
  - `ORDER BY id` для долгов, активов и вкладов в `period.py` (включая `_total_debt_balance`), для полисов в `charge_premiums_for_period` и `expire_policies_for_period`, для статей в `active_expense_lines_query` и `expire_expense_lines_for_period`, а также для долгов, активов и полисов в `period_close_preview`. Правило: при нехватке денег долги гасятся в порядке создания.
  - Этап потребностей закрытия (set_point) тоже читает строки по `id`: активы в `needs/set_point._assets_for_profile` и статьи из событий. От порядка активов зависит, какой из них `compute_level` сочтёт стартовым, а к какому применит привыкание; на PostgreSQL это давало недетерминированный уровень жизни (находка economy-reviewer). Транзакции периода в `_transactions_for_period` тоже читаются по `id`.
  - Golden SPL-101 не изменились: SQLite отдаёт строки в порядке вставки, то есть по `id`. Поэтому golden пропажу сортировки не заметят. Её ловит отдельный тест `tests/unit/game/test_period_close_order.py`: он проверяет SQL экономики и потребностей закрытия (шаблон с моделью set_point) и превью; выборки одной строки по первичному ключу исключены. Негативная проба (без сортировки в `_pay_liabilities`) тест роняет.
  - Вне экономики и потребностей сортировки нет: достижения, проверка победы и оповещения админам только суммируют и проверяют наличие строк.
  - Вне закрытия остаётся похожая проблема: `events/insurance_hooks.py` выбирает полис по `created_at` без второго ключа, и при совпадении времени выплата недетерминирована. Это путь событий, не этот срез.
  - Баланс: шесть эталонов совпадают байт в байт. `main__student_tutorial_40p` перегенерирован. Он не совпадал с кодом уже на `c46d883`, где его закоммитили: прогон tutorial в worktree на `c46d883` даёт 14 периодов, как HEAD, а в эталоне 13. SPL здесь ни при чём.
  - Проверено: backend pytest 537 passed; golden SPL-101 без изменений; balance playtest — все 7 эталонов совпадают; economy-reviewer — APPROVED (со второго прохода). Запись в `DOC_SYNC_LOG`.

- **SPL-205 ✅ (2026-10-22).**
  - `fincore.month.month_step(snapshot, categories, credit_income=False) → MonthResult`. Внутри:
    - проводки по порядку: обслуживание активов → доход активов → каждый долг → расходы на жизнь → премии → купоны;
    - остаток после каждой проводки округляется `quantize_money`, как в `adjust_balance`;
    - итоги по долгам `LiabilityOutcome`: платёж, просрочка, аннуитет по закрытым взносам;
    - итоги по вкладам `InvestmentOutcome`;
    - расходы на жизнь `MonthlyBurn`.
  - Правило премии — `fincore.insurance.premium_due`; `premium_due_for_period` игры делегирует ядру через `policy_for_core`.
  - `installments_outstanding` перенесён в ядро, туда же — `fincore.money.EPSILON`.
  - **Игра** (`period.py`). `_prepare_month` по порядку: истечение статей → backfill → снимок → `month_step`. Это критерий 1.
    - Этапы применяют результат: те же вызовы `adjust_balance` в том же порядке, с теми же типами и описаниями. Тип транзакции берётся из явной таблицы `_TRANSACTION_TYPE_BY_POSTING`.
    - Итоги переносятся в ORM, breakdown тот же.
    - Премии списываются в savepoint через `post_premiums_for_period`: истечение полисов + сумма ядра. Старая `charge_premiums_for_period` удалена.
    - Минус-серия, потребности, снимок закрытия, guidance и достижения остались в игре.
  - **Доход** ядро зачисляет только при `credit_income=True` (критерий 4). Игра флаг не ставит: зарплата уже лежит в `cash`.
  - **Сверка** `_check_cash_matches_core`: остаток в БД после расходов на жизнь против остатка ядра. Расхождение — только `warning` в лог, потому что премии в savepoint могут законно откатиться. На практике его не будет: закрытие держит блокировку профиля (`services/period/close.py`, `_lock_active_profile`).
  - **Сужение относительно плана:** в `MonthResult` нет `warnings`. Просрочка отдаётся числом `overdue_added`, а итоги долгов — `LiabilityOutcome`.
  - **Проверено:**
    - golden SPL-101 без изменений;
    - backend pytest 557 passed (вместе с тестами влитых цепочек `960c8db`);
    - fincore 42 passed;
    - balance playtest: до слияния цепочек (`960c8db`) все 7 эталонов совпадали байт в байт. После слияния — сравнение A/B в двух worktree от одного HEAD с одинаковой правкой бота баланса: без SPL-205 и с ним. Все 7 отчётов идентичны. Расхождение с эталонами даёт слияние цепочек, а не этот срез;
    - economy-reviewer — APPROVED.
    - Новые тесты (`tests/unit/game/test_period_close_month_step.py`):
      - backfill до снимка (база > 0, дельта ≠ 0); негативная проба с backfill после снимка тест роняет;
      - предупреждение при расхождении остатка;
      - таблица соответствия видов проводок типам транзакций.
  - **Открыто, вне среза:**
    - `expire_policies_for_period` делает `db.commit()` посреди закрытия и снимает блокировку профиля раньше времени. Это нарушает атомарность закрытия — нужна отдельная задача.
    - `month_index_for_period` даёт `max(1, period_index)`: для `period_index = 0` премии и вклады раньше считались с 0. В игре профиль стартует с 1.

- **SPL-206 ✅ (2026-10-22).**
  - `fincore.forecast.forecast(snapshot, months, categories, credit_income)` — `month_step` в цикле. `next_snapshot` переносит остаток, долги (погашенные выпадают, просрочка сохраняется) и вклады; статьи и полисы переносятся как есть, их срок ядро учитывает по `month_index`. Прогноз не знает новых событий и решений.
  - `period_close_preview` стал тонким адаптером: backfill статей, как раньше, затем снимок и `forecast(months=1)`. Отдельный приближённый расчёт удалён.
  - **Изменение поведения (решение PO 2026-10-22):** превью теперь учитывает купоны облигаций. `estimated_cash_after_close` совпадает с реальным остатком после закрытия, а раньше у игроков с облигациями был занижен на сумму купона. `estimated_charges_total` не изменился: купоны — доход, а не списание. Golden `full_house` перегенерирован; отличаются только поля превью (+200 к оценке, строка `bond_coupon` во внутреннем breakdown). Новый тест `test_preview_matches_actual_close` проверяет, что превью равно остатку после закрытия в каждом периоде всех сценариев.
  - Боты баланса превью не читают. Онбординг (`p1_close`) берёт только сумму списаний.
  - По ревью economy-reviewer (APPROVED):
    - `overview_build` вызывает превью в savepoint. При ошибке снимка `period_close_preview = null` и запись в лог, а не 500 на весь overview (тест `tests/integration/api/test_overview_close_preview.py`).
    - Оговорка в docstring: если в периоде истекают все статьи, закрытие создаёт их заново из базы, а превью считает только дельту. Так было и до SPL-206.
    - Добавлены тесты прогноза: облигация на несколько месяцев, погашение просрочки после дохода, кредит «только проценты».
  - Проверено: backend pytest 575 passed; fincore 52 passed; balance playtest — все 7 эталонов совпадают байт в байт; golden `shortfall_defeat` и `partial_recovery` без изменений.

- **SPL-207b ✅ (2026-10-22).**
  - Overview (`build_finance_overview`) и вход целей победы (`build_victory_evaluation_input`) берут денежные метрики из `fincore.metrics.compute_metrics`.
    - Снимок готовит `household_metrics` (адаптер): backfill статей, как раньше в `compute_monthly_burn`, затем `prepared_household_snapshot`; его же использует превью.
    - Overview считает метрики один раз и передаёт их во вход победы (ADR-009 §4).
    - `compute_monthly_passive_income` удалена.
  - Решения по критериям:
    1. Цель `expense_to_income_ratio` сохраняет базу «зарплата»: движок победы считает от `monthly_salary`, он не менялся.
    2. Во вход победы идёт `net_structural_cashflow` (без проекции вкладов), в overview — `net_structural_cashflow_with_invest`.
    3. Проекция вкладов считается ядром по всем видам позиций. Сейчас видов два (deposit, bond), так что результат тот же. При новом виде вклада он сразу попадёт в пассивный доход цели победы — это осознанно.
    4. Overview больше не глотает ошибку чтения вкладов. Этот try был бесполезен: тот же overview строит вход победы, который читал вклады без защиты.
    5. Порядок float-операций изменился (`p*(r/100)/12`, сумма по id).
  - Проверено:
    - backend pytest 575 passed;
    - fincore 52 passed;
    - balance playtest — все 7 эталонов совпадают байт в байт;
    - паритет-тест `test_fincore_metrics_parity.py` теперь охраняет соответствие полей API метрикам. Расхождение формулы внутри самого ядра он не поймает: обе стороны считаются одним кодом. Это ловят эталоны баланса;
    - economy-reviewer — APPROVED.
  - **Хвост ADR-009 §4, вне среза:** `game/run_finale.py` (итоги забега) всё ещё вручную считает пассивный доход, проекцию вкладов, просрочку и долг. Формула та же, но это копия, и она может разойтись с ядром. Перевести на `household_metrics` отдельным мелким срезом.

- **SPL-208 ✅ (2026-10-22).**
  - Шимы SPL-202 `app/finance/annuity.py` и `app/finance/helpers.py` удалены. 10 модулей приложения и 6 тестов импортируют `fincore.annuity` напрямую.
  - **Report-контракт удалён, а не переведён в enforce.** Его модули (`finance/expenses`, `period_close_preview`, `balance_utils`) по решениям SPL-204–206 стали адаптерами ORM → ядро. Запрет ORM для них неверен по смыслу: расчёт ушёл в `fincore`, а чтение и запись БД остались там намеренно.
  - Границу охраняет enforce-контракт `fincore-pure` (`backend/.importlinter`, тест `test_import_boundaries.py`): ядро не импортирует `app`, FastAPI, Starlette, SQLAlchemy и Pydantic.
  - Тесты ядра входят в backend pytest (`testpaths` в `backend/pytest.ini`): ручной шаг из SPL-201 закрыт. Без CI (PR-04) гейт по-прежнему — локальный pytest. Строка «Ядро fincore» в `CLAUDE.md` обновлена.
  - Проверено: backend pytest 627 passed (575 backend + 52 fincore); balance playtest — все 7 эталонов совпадают байт в байт; `check_conventions.py` и `_claude-config-check.mjs` зелёные. Срез механический (импорты и конфиг), economy-reviewer не запускался.

**Критерии приёмки SPL-207b (из ревью SPL-207):**
1. Цель победы `expense_to_income_ratio` сохраняет базу «зарплата» — не брать `HouseholdMetrics.expense_to_income_ratio` (база — доход с проекцией вкладов).
2. `net_monthly_cashflow` во входе победы — без проекции вкладов, в overview — с проекцией.
3. Проекция вкладов: в ядре по всем видам позиций, во входе победы — только deposit и bond. Пока видов два, это одно и то же; при новом виде — решить явно.
4. Overview глотает исключение при чтении вкладов (проекция = 0) — решить, сохранять ли это поведение.
5. Порядок float-операций меняется (`p*r/100/12` → `p*(r/100)/12`, сумма по id). Gate — паритет-тест + balance diff по округлённым полям.

**Критерии приёмки SPL-204/205 (из ревью SPL-203):**
1. **Backfill до снимка.** Игра вызывает `ensure_profile_expense_lines` и `expire_expense_lines_for_period` *до* `build_household_snapshot`. Тест: профиль без статей, base > 0, delta ≠ 0.
2. **Ограничение снизу.** Расходы на жизнь = `max(0, Σ статей + extra)` считает ядро; тест с отрицательной delta уже есть в адаптере.
3. **Порядок долгов — изменение поведения.** `_pay_liabilities` читает долги без ORDER BY, а при нехватке денег порядок решает, какой долг уйдёт в просрочку. До переноса — отдельный срез `order_by(FinanceLiability.id)` в `period.py` (и в активах, полисах, вкладах для стабильного breakdown) с явной записью в DOC_SYNC_LOG и balance diff. Не делать параллельно с NV-406/407.
4. **Доход не зачисляется дважды.** Зарплата в игре приходит по кнопке и уже лежит в `cash`. `month_step` не зачисляет `incomes`, если вызывающий не попросил.
5. **Полисы.** Премия по правилу `premium_due_for_period` (0 в месяц оформления, после истечения или выплаты) уходит в ядро. Деактивация `expire_policies_for_period` (пишет в БД) остаётся в игре.

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
- [x] fincore выделен, balance diff = 0, import-linter enforce (SPL-208)
- [ ] platform выделен (SPL-302)
- [ ] Pre-Alpha gate игры пройден → старт фазы 4
