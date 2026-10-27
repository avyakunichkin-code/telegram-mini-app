---
layer: spec
status: approved
owner: product
last_reviewed: 2026-10-26
tracks: spl, plan-v1, family-checkup
epic_id: SPL
task_id: SPL-401
idea: plan/vision/plan-financial-assistant.md
plan: plan/ROADMAP.md
adr: decisions/ADR-016-two-products-shared-fincore.md
related: decisions/ADR-009-metrics-dictionary-tb1.md
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/approved
  - tvoy-hod/topic/spl
  - tvoy-hod/topic/plan-v1
aliases:
  - SPEC_plan-v1
  - "Spec: ТВОЙ ПЛАН v1 — семейный финансовый чекап"
---
# Spec: ТВОЙ ПЛАН v1 — семейный финансовый чекап

**Продукт:** «ТВОЙ ПЛАН: Финансы как есть» (рабочее имя). Отдельное приложение, не режим игры ([ADR-016](../../decisions/ADR-016-two-products-shared-fincore.md)). Общее с игрой — только `packages/fincore` и `packages/platform`.

**Статус:** approved владельцем продукта 2026-10-26.

**Gate реализации (ред. 2026-10-27, D4):** **рабочий прототип** (`apps/plan-api`, `apps/plan-web`) — сейчас: только поверх `fincore`, хранилище в памяти, код входа в ответе (`dev_code`), без деплоя и реальных пользователей. **Продуктовая реализация** — своя БД `plan`, реальный вход, хостинг в РФ, деплой (SPL-402+) — после Pre-Alpha gate игры, SPL-302 (`packages/platform`) и юриста. Роадмап — [`ROADMAP.md`](../ROADMAP.md).

## Assumptions

1. **Каналы:** PWA/web (`apps/plan-web`, Vite + React), без Telegram Mini App в v1.
2. **Валюта и гранулярность:** только рубли; время — календарные месяцы. Адаптер Plan переводит `YYYY-MM` в `month_index` ядра.
3. **Вход:** e-mail + одноразовый код (без пароля). Telegram Login — открытый вопрос ([#1](#open-questions)).
4. **Хостинг и данные:** контур РФ, своя БД PostgreSQL `plan`; Plan — оператор ПДн по 152-ФЗ.
5. **Члены семьи** — профили внутри одного аккаунта: метка («Я», «Партнёр», «Ребёнок 1») и роль, **без ФИО**. Год рождения необязателен.
6. **Прогноз «если ничего не менять»:** без инфляции и индексации доходов (как `fincore.forecast`). Инфляция — только в стресс-сценарии.
7. **Пороги светофора и параметры сценариев — предварительные.** Они хранятся в версионируемом конфиге правил (`rules_version`) и калибруются до α Plan.
→ Поправьте до начала реализации.

## Objective

**Why:** пара или семья не видит целиком, где она сейчас, что её сломает и с чего начать. Трекеры расходов отвечают на вопрос «куда ушли деньги», банковские калькуляторы — на один частный вопрос. Plan за один вечер даёт честный разбор семьи и стресс-тест её устойчивости.

**Who:** пары и семьи 28–45 лет: два дохода, ипотека или кредиты, дети или планы на детей. Учёт ведёт один человек.

**Success criteria:**

Продуктовые (замер — собственные события Plan, см. [Аналитика](#аналитика-продукта)):

- [ ] **≥ 50 %** начавших чекап (`checkup_started`) получают итоговый отчёт (`report_viewed`, `final=true`).
- [ ] **≥ 30 %** получивших отчёт отмечают хотя бы один шаг выполненным в течение 30 дней (`step_done`).
- [ ] Черновой отчёт после быстрого старта — за **≤ 3 минуты**, медиана; полный чекап — за **≤ 20 минут**, медиана.

Технические:

- [ ] Прогноз и стресс-тесты считает `fincore` (`month_step` / `next_snapshot` / `forecast`); формул движения денег в Plan нет.
- [ ] Сверка до копейки: сумма проводок за месяц равна изменению `cash` на каждом месяце прогноза (CS-2).
- [ ] Отчёт детерминирован: одинаковые данные + `rules_version` + версия fincore дают одинаковый отчёт (CS-5).
- [ ] `GET .../report` укладывается в **p95 ≤ 1 с** (12 месяцев прогноза, 4 сценария, ≤ 8 членов семьи, ≤ 50 строк на раздел).
- [ ] Удаление аккаунта уничтожает данные пользователя не позже чем через 30 дней (152-ФЗ, ст. 21) (CS-8).

## Scope

### In scope

- Аккаунт по e-mail, согласие на обработку ПДн, удаление аккаунта.
- Одно домохозяйство на аккаунт; члены семьи — профили.
- **Вопрос на входе** (5 вариантов) задаёт порядок ввода и главный блок отчёта.
- **Быстрый старт:** 5 вопросов с ответами диапазонами → черновой отчёт.
- **Уточнение по разделам:** доходы, расходы, долги, накопления и подушка, имущество, инвестиции (по классам активов), пенсия, страховки, цели. Значение вводится точно или диапазоном.
- **Итоговый отчёт:** ответ на вопрос со входа, светофор по 4 областям, ключевые метрики, net worth, прогноз на 12 месяцев (базовый и пессимистичный), стресс-тест на 4 сценариях, стратегия гашения долгов, реалистичность целей, **3 шага** с объяснением «почему».
- Отметка шага: «сделано» или «не подходит».
- Повторный чекап — новая версия на основе прошлой; история отчётов.
- Собственная продуктовая аналитика: воронка и шаги.

### Out of scope

- PDF «Семейный совет» → v1.1.
- Ежемесячное ведение (факт против плана) и годовой отчёт семьи → v2.
- Пользовательские параметры сценариев и свои сценарии.
- Импорт выписок, подключение банков, совместный доступ нескольких аккаунтов.
- Конкретные ценные бумаги, «купи/продай», подбор продуктов и партнёрские предложения.
- LLM-советник, игровые механики, общий аккаунт с игрой, TMA, контур ЕС.
- Монетизация (решается при детальном планировании).

## User flows

| Step | Actor | Result |
|------|-------|--------|
| 1 | Гость открывает лендинг, вводит e-mail | На почту приходит 6-значный код (TTL 10 мин) |
| 2 | Вводит код, принимает согласие на обработку ПДн | Аккаунт, JWT Plan (`iss=plan`), запись в `consent_log` |
| 3 | Выбирает вопрос: «Потянем ли ипотеку/крупный кредит?», «Когда закроем кредиты?», «Выдержим ли, если что-то случится?», «Успеем ли накопить на цель?», «Как у нас дела в целом?» | Черновик чекапа `checkup` с `entry_question` |
| 4 | Добавляет членов семьи (метка, роль, взрослый/ребёнок) | Профили; по умолчанию один «Я» |
| 5 | Быстрый старт: доход семьи, обязательные расходы, платежи по кредитам, накопления, число детей — диапазоны или пресеты | **Черновой отчёт**: светофор, прогноз и шаги с пометкой «точность: черновая» |
| 6 | Уточняет разделы (мастер, порядок задан вопросом со входа). Например, для «ипотеки» сразу просим цену, первый взнос, ставку и срок | После каждого раздела черновой отчёт пересчитывается; точность растёт |
| 7 | Нажимает «Получить итоговый разбор» | `complete`: отчёт сохраняется с `rules_version`; `report_viewed final=true` |
| 8 | Читает отчёт, отмечает шаг | `step.status=done`; событие `step_done` |
| 9 | Возвращается через N месяцев: «Пересчитать» | Новый черновик = копия последнего чекапа; старые отчёты не меняются |
| 10 | Профиль → «Удалить мои данные» | `users.deleted_at`, вход заблокирован, данные уничтожаются в ≤ 30 дней |

## Data & API

### Время и месяц

`month_index = (year − 2000) × 12 + (month − 1)`. Отчёт строится на месяц `as_of`, в котором завершён чекап. Цели и сроки задаются как `YYYY-MM`.

### Ввод диапазонами

Каждое денежное поле — пара `amount_min` / `amount_max` (точное значение: `min = max`). Из одного чекапа собираются два снимка ядра:

| Снимок | Доходы | Расходы и платежи | Накопления |
|--------|--------|-------------------|------------|
| **base** | середина | середина | середина |
| **pessimistic** | `min` | `max` | `min` |

**Точность отчёта** = доля денежных полей с `max / min ≤ 1.1` среди заполненных, взвешенная по сумме. Пороги: `черновая` < 50 % ≤ `приблизительная` < 85 % ≤ `уточнённая`.

### Models / DB (`apps/plan-api`, БД `plan`)

Суммы — `NUMERIC(14,2)`; на границе API — `Decimal` (pydantic `condecimal(max_digits=14, decimal_places=2, ge=0)`).

| Таблица | Поля (основные) | Заметки |
|---------|------------------|---------|
| `users` | id, email (unique, citext), created_at, deleted_at | Плюс `email_codes` (hash, expires_at, attempts) |
| `consent_log` | user_id, consent_version, accepted_at, ip_hash | История, не перезаписывается |
| `households` | id, user_id (unique), title | Одно на аккаунт |
| `members` | id, household_id, label (≤ 40), role `adult`/`child`, birth_year? | Метка — подсказка «не ФИО»; ≤ 8 членов |
| `checkups` | id, household_id, entry_question, status `draft`/`completed`, as_of `YYYY-MM`, parent_checkup_id?, completed_at | Завершённый чекап — только чтение |
| `incomes` | checkup_id, member_id, kind (`salary`/`self_employed`/`pension`/`benefit`/`rent`/`other`), amount_min, amount_max | В месяц, на руки |
| `expense_lines` | checkup_id, category_key, tier `must`/`want`, amount_min, amount_max | Категории — справочник Plan, не игры |
| `liabilities` | checkup_id, member_id? (null = общий), kind (`mortgage`/`consumer`/`card`/`car`/`microloan`/`private`), balance, annual_rate, monthly_payment, term_months_left?, payment_mode, overdue_amount, secured_asset_id? | Ставка и платёж обязательны |
| `savings` | checkup_id, member_id?, kind (`cash`/`account`/`deposit`), amount_min, amount_max, annual_rate, is_safety_fund | Подушка — `is_safety_fund` |
| `assets` | checkup_id, kind (`home`/`car`/`land`/`other`), value, monthly_maintenance, monthly_income | Недвижимость и машины |
| `investments` | checkup_id, member_id?, asset_class (`bonds`/`stocks`/`funds`/`deposits_long`/`real_estate_invest`/`crypto`/`other`), amount, liquidity (`days`/`months`/`years`) | **Без тикеров и названий бумаг** |
| `pension` | checkup_id, member_id, savings_amount, has_voluntary_program | Обобщённо |
| `insurance` | checkup_id, member_id?, kind (`life`/`health`/`property`/`mortgage_title`/`car`), monthly_premium, coverage | |
| `goals` | checkup_id, title, target_amount, target_month, saved_amount, priority | |
| `reports` | id, checkup_id, final, rules_version, fincore_version, computed_at, payload JSONB | Сохраняется только при `complete` |
| `steps` | id, report_id, rule_key, rank 1..3, status `suggested`/`done`/`dismissed`, status_at | |
| `product_events` | user_id, name, props JSONB, at | Без сумм в props |

### Адаптер Plan → fincore

| Plan | fincore |
|------|---------|
| `incomes` | `Income(monthly_amount, member_id)` |
| `liabilities` | `Liability` (kind, payment_mode, term_months, overdue; `member_id`) |
| `expense_lines` | `ExpenseLine(category_key, amount_monthly, tier)` |
| `savings` с `is_safety_fund` | `HouseholdSnapshot.safety_fund` |
| `savings` (cash/account) | `cash` |
| `savings` (deposit) | `InvestmentPosition(principal, annual_rate_percent)` |
| `assets` | `Asset(value, monthly_maintenance, monthly_income)` |
| `investments` | `Asset(kind=f"invest:{asset_class}", value)` — для net worth, без доходности в прогнозе |
| `insurance` | `InsurancePolicy(monthly_premium, coverage_limit)` |
| `pension`, `goals`, `members` | не в ядре — слой анализа Plan |

**Изменение fincore (единственное):** опциональное поле `member_id: int | str | None = None` в `Income` и `Liability`. Игровой адаптер его не заполняет. Golden-тесты игры и balance diff должны остаться = 0 (CS-10).

### Расчёт отчёта (слой анализа Plan, `apps/plan-api/app/analysis/`)

1. **Метрики** — `fincore.compute_metrics` на base и pessimistic: DTI (`liabilities_to_income_percent`), норма сбережений `= net_structural_cashflow / income_steady`, `safety_fund_months`, `net_worth`, `total_overdue`.
2. **Прогноз 12 месяцев** — `fincore.forecast(credit_income=True)` для base и pessimistic: ликвидность по месяцам, месяц первого ухода в минус.
3. **Стресс-сценарии** — цикл `month_step` → `next_snapshot` с модификатором снимка по месяцам, 12 месяцев, на base:

   | ID | Сценарий | Модификатор (параметры в конфиге правил) |
   |----|----------|-------------------------------------------|
   | S1 | Потеря крупнейшего дохода | доход члена с макс. доходом = 0 на 6 мес. |
   | S2 | Рождение ребёнка | +`child_monthly_cost` расходов; доход одного взрослого −`parental_leave_cut` % на 12 мес. |
   | S3 | Рост цен | расходы `must` и `want` +10 % |
   | S4 | Решение со входа | для «ипотеки»: новый аннуитет `fincore.annuity` (цена − взнос, ставка, срок), взнос списывается из ликвидности; для остальных вопросов — S4 = комбинация S1 + S3 |

   Итог сценария: `months_until_negative` (или «> 12»), минимальная ликвидность и вердикт `ok` (ликвидность ≥ 0 все 12 мес.) / `edge` (минус ≤ 1 мес. расходов) / `fail`.
4. **Стратегия долгов** — три графика до полного погашения: «как сейчас», «лавина» (сверх платежа на максимальную ставку), «снежный ком» (на минимальный остаток). Сумма сверх платежа по умолчанию = 50 % положительного свободного потока после взноса в подушку; итог — дата закрытия и переплата.
5. **Цели** — нужный взнос в месяц `= (target − saved) / месяцев_до_срока`, сравнение со свободным потоком. Если не хватает — реалистичный срок.
6. **Светофор** (пороги предварительные, `rules_version=1`):

   | Область | Зелёный | Жёлтый | Красный |
   |---------|---------|--------|---------|
   | Бюджет | норма сбережений ≥ 10 % | 0–10 % | < 0 |
   | Долги | DTI < 30 % и нет просрочки | DTI 30–50 % | DTI > 50 % или просрочка > 0 |
   | Подушка и цели | подушка ≥ цели* и цели реалистичны | подушка 1 мес. – цель* или цель нереалистична | подушка < 1 мес. |
   | Инвестиции и защита | нет флагов | ≥ 1 флага | — (в v1 красного нет) |

   \* Цель подушки: 3 мес. расходов; 6 мес., если в семье есть ребёнок и один доход даёт > 70 % дохода семьи.

   Флаги «инвестиций и защиты»: инвестиции > 0 при подушке ниже цели; один класс активов > 50 % портфеля; неликвидные (`years`) активы при цели в ближайшие 12 мес.; ипотека без `life`/`mortgage_title`; ребёнок и единственный кормилец без `life`; у взрослого старше 35 нет пенсионных накоплений.

7. **Шаги** — детерминированные правила по приоритету. Берутся три первых сработавших, не больше одного на правило:

   | Приоритет | rule_key | Условие | Текст (шаблон) |
   |-----------|----------|---------|----------------|
   | 1 | `close_overdue` | просрочка > 0 | Закрыть просрочку {title} — {amount} ₽: штрафы и кредитная история |
   | 2 | `stop_deficit` | свободный поток < 0 | Сократить расходы на {gap} ₽/мес; крупнейшие статьи «по желанию»: {top3} |
   | 3 | `first_cushion` | подушка < 1 мес. | Отложить {amount} ₽ — месяц расходов, первая ступень подушки |
   | 4 | `avalanche` | долг со ставкой > 20 % и подушка ≥ 1 мес. | Гасить досрочно {title}: экономия {saved} ₽, закрытие на {months} мес. раньше |
   | 5 | `stress_fail` | S1 или S4 = `fail` | {scenario}: деньги кончатся через {n} мес.; нужна подушка {target} ₽ |
   | 6 | `goal_unrealistic` | цель нереалистична | Сдвинуть «{goal}» на {date} или откладывать {monthly} ₽/мес |
   | 7 | `cushion_target` | подушка < цели | Довести подушку до {target} ₽: {monthly} ₽/мес — {months} мес. |
   | 8 | `protection_check` | флаг страхования | Проверить, что защищён доход семьи при ипотеке/детях (страхование жизни) |
   | 9 | `liquidity_first` | инвестиции при подушке ниже цели | Сначала подушка: часть вложений неликвидна в нужный срок |
   | 10 | `concentration` | один класс > 50 % | Обсудить распределение вложений со специалистом |
   | 11 | `direct_surplus` | всё зелёное | Направить свободные {amount} ₽/мес на «{goal}» |

   «Почему» — это всегда числа из метрик, которые сработали в условии. Тексты правил 8–10 согласуются с юристом.

### Endpoints (`apps/plan-api`, префикс `/api`)

Ошибки, идемпотентность и health — из `packages/platform`. Все `/api/*`, кроме auth и health, требуют JWT Plan (`iss=plan`, `aud=plan-web`). Ресурсы чужого домохозяйства → **404**.

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| POST | `/api/auth/email/request-code` | `{email}` | `204` | Rate limit: 3 / 10 мин на e-mail, 20 / ч на IP. Ответ одинаковый для существующего и нового e-mail |
| POST | `/api/auth/email/verify` | `{email, code, consent_version?}` | `{access_token, user, consent_required}` | 5 попыток на код. Для нового пользователя `consent_version` обязателен |
| GET | `/api/me` | — | `{user, household}` | |
| DELETE | `/api/me` | — | `202` | `deleted_at`, отзыв токенов; уничтожение в ≤ 30 дней |
| PUT | `/api/household/members` | `[{id?, label, role, birth_year?}]` | `[member]` | Замена списка; удалить члена с привязанными строками → 409 |
| POST | `/api/checkups` | `{entry_question}` | `checkup` | Если есть завершённый чекап — копия (`parent_checkup_id`); один `draft` на домохозяйство |
| GET | `/api/checkups` | — | `[{id, status, as_of, entry_question, completed_at}]` | История |
| GET | `/api/checkups/{id}` | — | `checkup` со всеми разделами | |
| POST | `/api/checkups/{id}/quick` | 5 ответов диапазонами | `checkup` | Заполняет разделы агрегатными строками; уточнение их заменяет |
| PUT | `/api/checkups/{id}/sections/{section}` | `[row]` | `[row]` | `section` ∈ incomes, expenses, liabilities, savings, assets, investments, pension, insurance, goals. Замена списка; только `draft`, иначе 409 |
| GET | `/api/checkups/{id}/report` | — | `report` | Для `draft` считается на лету (`final=false`, не сохраняется); для `completed` — сохранённый |
| POST | `/api/checkups/{id}/complete` | — (`Idempotency-Key`) | `report` | Валидация полноты (мин. доход и расходы), сохраняет отчёт и шаги |
| PATCH | `/api/steps/{id}` | `{status: done \| dismissed \| suggested}` | `step` | |
| POST | `/api/events` | `{name, props}` | `204` | Белый список имён; суммы в props запрещены |
| GET | `/api/health` | — | platform | |

**`report` (основные поля):** `final`, `as_of`, `precision`, `rules_version`, `entry_answer {question, verdict, text, numbers}`, `areas[4] {key, light, metrics, flags}`, `metrics_base`, `metrics_pessimistic`, `net_worth`, `forecast {base[12], pessimistic[12]}`, `scenarios[4] {id, verdict, months_until_negative, min_liquid, series[12]}`, `debt_strategy {current, avalanche, snowball}`, `goals[]`, `steps[3] {id?, rule_key, rank, title, why, numbers}`, `disclaimer`.

Синхронизация: `apps/plan-web/src/api/` (через `packages/api-client`, SPL-403).

### Аналитика продукта

События (`product_events`): `signup`, `consent_accepted`, `checkup_started {entry_question}`, `quick_done`, `section_done {section}`, `report_viewed {final, precision}`, `checkup_completed`, `step_done {rule_key}`, `step_dismissed {rule_key}`, `account_deleted`. Сторонних аналитических SDK в v1 нет: финансовые данные и ПДн не уходят из контура РФ.

## UI / UX

- **Экраны `apps/plan-web`:** лендинг и вход по коду → согласие → выбор вопроса → члены семьи → быстрый старт → черновой отчёт → мастер уточнения (прогресс по разделам, на каждом шаге «точно / примерно от–до») → итоговый отчёт → профиль (история, удаление данных).
- **Отчёт сверху вниз:** ответ на вопрос со входа → три шага → светофор → прогноз (две линии: base и pessimistic) → стресс-тесты (карточки с вердиктом) → долги → цели → метрики. Бейдж точности; дисклеймер внизу.
- **Тон:** спокойный, без игровой эстетики и без запугивания. Красный цвет — только для фактов (просрочка, минус), не для оценки людей.
- **Бренд:** свои токены; из `packages/ui-kit` — только примитивы (SPL-403). Раунд lab — `design-lab/plan-checkup/` (SPL-404), сравнить лозунги: «Финансы как есть» и кандидаты из one-pager.
- Состояния: loading / empty / error на каждом экране; офлайн — только чтение последнего отчёта (PWA-кэш).

## Rules & edge cases

- `amount_min > amount_max` → 422; `max / min > 3` → предупреждение в UI, не ошибка.
- Нулевой доход: отчёт строится, норма сбережений = n/a, «Бюджет» = красный, первый шаг — `stop_deficit`.
- Карта без срока: `term_months_left = null`, `payment_mode` — минимальный платёж; лавина и снежный ком считают до нуля, но не дольше 360 мес. (иначе «не гасится при текущем платеже»).
- Платёж меньше процентов → долг растёт; флаг в «Долгах», шаг `stop_deficit` или `avalanche`.
- Ипотека со входа: взнос > ликвидности → вердикт S4 = `fail` с текстом «не хватает на взнос {gap} ₽».
- Члены семьи: ≤ 8; у `child` нет доходов и долгов (422).
- Завершённый чекап неизменяем; правка → новый черновик.
- Старые отчёты не пересчитываются при смене `rules_version`; в отчёте видна версия.
- В логах нет сумм вместе с `user_id`/e-mail; e-mail в логах маскируется.
- Дисклеймер в каждом отчёте: информационный расчёт на данных пользователя, не индивидуальная инвестиционная рекомендация.
- Повторный `complete` с тем же `Idempotency-Key` → тот же отчёт; без ключа на `completed` → 409.

## Testing strategy

Skill: **`/critical-test-scenarios`**. Цель — критичные сценарии, а не 100 % покрытия.

| Layer | What to prove |
|-------|----------------|
| Unit (fincore) | `member_id` не меняет расчёты; сверка проводок до копейки |
| Unit (plan analysis) | адаптер, диапазоны → base/pessimistic, сценарии, светофор, правила шагов, детерминизм |
| API / integration | auth по коду, изоляция пользователей, разделы → отчёт, complete, удаление |
| Contract | import-linter: plan ↛ `app.*` игры; fincore без фреймворков |
| FE | рендер отчёта (draft/final, точность), мастер «точно/диапазон», отметка шага |
| E2E (Playwright) | вход → быстрый старт → черновой отчёт → уточнение → итоговый отчёт → шаг |

### Critical scenarios (min gate)

| ID | Scenario | Layer | Command / path |
|----|----------|-------|----------------|
| CS-1 | Happy path: код → согласие → вопрос → quick → complete → отчёт с 4 областями и 3 шагами | integration | `apps/plan-api/tests/integration/test_checkup_flow.py` |
| CS-2 | Сверка: на каждом месяце прогноза Σ проводок = Δcash до копейки (фикстуры с дробными ставками) | unit | `packages/fincore/tests/test_reconciliation.py` |
| CS-3 | Диапазоны: pessimistic ≤ base по ликвидности на каждом месяце; точные значения → base = pessimistic | unit | `apps/plan-api/tests/unit/analysis/test_ranges.py` |
| CS-4 | Стресс S1/S4 на ручной фикстуре: `months_until_negative` и вердикт совпадают с расчётом вручную | unit | `apps/plan-api/tests/unit/analysis/test_scenarios.py` |
| CS-5 | Правила: просрочка → `close_overdue` на rank 1; одинаковый вход → одинаковый отчёт (детерминизм) | unit | `apps/plan-api/tests/unit/analysis/test_steps.py` |
| CS-6 | Регуляторный lint: ни один шаблон шага и отчёта не содержит «купите/продайте» и названий бумаг или эмитентов | unit | `apps/plan-api/tests/unit/analysis/test_wording.py` |
| CS-7 | Изоляция: токен игры отклоняется (401); пользователь A получает 404 на ресурсы B | integration | `apps/plan-api/tests/integration/test_auth_isolation.py` |
| CS-8 | `DELETE /api/me` → вход заблокирован; purge-задача удаляет все строки пользователя | integration | `apps/plan-api/tests/integration/test_account_delete.py` |
| CS-9 | import-linter: plan ↛ game, fincore ↛ фреймворки | contract | `apps/plan-api/tests/test_import_boundaries.py` |
| CS-10 | `member_id` в fincore: golden игры зелёные, balance diff = 0 | unit + balance | `cd backend && py -3 -m pytest -q tests/unit/game/test_period_close_golden.py` · `python scripts/balance_playtest.py` |
| CS-11 | E2E: путь «вход → черновой → итоговый отчёт → шаг сделан» | e2e | `cd apps/plan-web && npm run test:e2e` |

Commands:

```bash
# ядро
cd packages/fincore && python -m pytest -q
# игра (golden + границы) — при изменении fincore
cd backend && py -3 -m pytest -q
# plan-api
cd apps/plan-api && py -3 -m pytest -q
# plan-web
cd apps/plan-web && npm run build && npm run test:unit && npm run test:e2e
```

## Boundaries

- **Always:** все расчёты движения денег — через `fincore`; суммы `Decimal`/`NUMERIC` на границе API и в БД; правила и пороги — в версионируемом конфиге (`rules_version`); у каждого шага «почему» с числами; дисклеймер в отчёте; изоляция по `household_id` в каждом запросе.
- **Ask first:** любые изменения DTO `fincore`, кроме `member_id`; новые зависимости (почтовый провайдер, PDF); смена порогов светофора и параметров сценариев; новые события аналитики; тексты правил 8–10 и согласия (через юриста).
- **Never:** импорт `app.*` игры и игровые понятия (ход, потребности, события, победа); тикеры, эмитенты, «купи/продай»; LLM-генерация советов; ФИО и реквизиты в модели; отправка ПДн и финансовых данных сторонним сервисам вне контура РФ; суммы в логах вместе с идентификатором пользователя.

## Open questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Вход: только e-mail-код (рекомендация) или ещё Telegram Login? Какой почтовый провайдер в РФ? | product | — |
| 2 | Пороги светофора, цель подушки, параметры S2 (`child_monthly_cost`, `parental_leave_cut`): источник и калибровка | product + эксперт | предварительные в `rules_version=1` |
| 3 | `float` в fincore: достаточно ли CS-2 (сверка до копейки), или переводим ядро на `Decimal` до SPL-402 | engineering | решает результат CS-2 |
| 4 | Юрист: тексты правил 8–10, согласие на обработку ПДн, данные членов семьи от третьего лица, уведомление Роскомнадзора | product | до SPL-402 |
| 5 | Нужен ли «семейный» режим 6 мес. подушки для всех семей с детьми, а не только с одним основным доходом | product | — |
| 6 | Монетизация | product | при детальном планировании |

## Traceability

| Artifact | Link |
|----------|------|
| Idea | [`plan/vision/plan-financial-assistant.md`](../vision/plan-financial-assistant.md) |
| ADR | [ADR-016](../../decisions/ADR-016-two-products-shared-fincore.md), метрики — [ADR-009](../../decisions/ADR-009-metrics-dictionary-tb1.md) |
| Roadmap | [`plan/ROADMAP.md`](../ROADMAP.md) — P0 рабочий прототип; после gate SPL-402 (plan-api), SPL-403 (ui-kit, api-client), SPL-404 (plan-web, lab), SPL-405 (CI), SPL-406 (деплой) |
| Ядро (план выноса) | [`plans/PLAN_game-plan-split.md`](../../plans/PLAN_game-plan-split.md) — SPL-0xx…3xx |
| Ядро | [`packages/fincore`](../../../packages/fincore/README.md) |
