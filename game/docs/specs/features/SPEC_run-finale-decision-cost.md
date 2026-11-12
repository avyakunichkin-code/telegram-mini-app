---
layer: spec
status: implemented
owner: product
last_reviewed: 2026-11-11
tracks: ge1, run-finale, gameplay
idea: vision/ideas/run-finale-decision-cost.md
plan: plans/PLAN_run-finale-decision-cost.md
related: specs/features/SPEC_game-run-finale.md
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/implemented
  - tvoy-hod/topic/gameplay
  - tvoy-hod/topic/run-finale
aliases:
  - "Цена решений"
  - SPEC_run-finale-decision-cost
  - "Spec: Цена решений"
---
# Spec: Цена решений

## Assumptions

1. Партии, начатые до миграции, не пересчитываем: у их движений нет `liability_id` и `event_instance_id`, карточки кредитов и события для них не строятся. Реальных игроков до альфы нет.
2. Суммы считаются при сборке финала, отдельного хранения нет. `run_finale` и так собирается при bootstrap и после dismiss победы не отдаётся.
3. Тексты карточек формирует backend, как `sections[]` в текущем финале.
Реализовано и проверено локально 2026-11-11 (DC-01…09); статус не означает merge или deploy. [Проверки и ограничения](../../plans/PLAN_run-finale-decision-cost.md).

## Objective

**Why:** финал сейчас показывает итоговые показатели, но не объясняет, какие решения к ним привели. Блок «Что решило партию» называет до трёх решений с суммой в рублях.
**Who:** игрок, завершивший партию победой или поражением.
**Success criteria:**

- [x] При победе и при поражении `run_finale.decisions[]` содержит от 0 до 3 карточек по правилам отбора.
- [x] Суммы по кредитам сходятся с записями `transactions` с точностью до 0,01 ₽.
- [x] Каждая оценочная сумма помечена `is_estimate=true` и показана со знаком «≈».
- [x] В текстах карточек нет оценок и советов ([C-3](../../../../CONVENTIONS.md)).
- [x] Партия без подходящих карточек показывает финал без блока и без пустого состояния.

## Scope

### In scope

- Колонки `transactions.liability_id` и `transactions.event_instance_id` и их заполнение.
- Сборка карточек четырёх типов и поле `decisions` в `RunFinalePayload`.
- Блок в `MqxRunFinale` после утверждения варианта в design-lab.

### Out of scope

- Долгий эффект событий через `monthly_lifestyle_delta` (кандидат на v2).
- Симуляция «что было бы», советы, сравнение с другими игроками.
- Картинка для шаринга.
- Показ блока после dismiss и в свободном режиме.
- Пересчёт старых партий.

## User flows

| Step | Actor | Result |
|------|-------|--------|
| 1 | Игрок достигает победы или проигрывает | Bootstrap отдаёт `run_finale` с `decisions[]` |
| 2 | Игрок смотрит финал | Видит блок «Что решило партию», если есть карточки |
| 3a | Победа: «Играть дальше» | Dismiss, свободный режим, блок больше не показывается |
| 3b | Поражение | Блок показывается при каждом открытии архивной партии, значения не меняются |

Ref: [`foundation/TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md)

## Data & API

### Models / DB

Миграция `game/api/migrations/0051_transaction_liability_id.sql` (идемпотентная) и `models.py`:

```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS liability_id INTEGER NULL REFERENCES finance_liabilities(id);
CREATE INDEX IF NOT EXISTS ix_transactions_liability_id ON transactions (liability_id);
```

`add_transaction` и `adjust_balance` получают необязательный параметр `liability_id: int | None = None`.

| Движение | Место | Тип | `liability_id` |
|----------|-------|-----|----------------|
| Ежемесячный платёж | `game/period.py`, `_post` для `POSTING_LIABILITY_PAYMENT` | `LIABILITY_PAYMENT` | Да, из `posting.ref_id` |
| Закрытие кредита | `services/finance/liabilities.py` | `liability_close` | Да |
| Досрочное погашение | `services/finance/liabilities.py` | `liability_prepay` | Да |
| Досрочное погашение по событию | `events/chain_actions.py` | `liability_prepay` | Да |
| Комиссия за рефинансирование | `events/chain_actions.py` | `liability_fee` | Да |
| Получение кредита | `services/finance/liabilities.py` | `liability_disbursement` | Нет |
| Доплата при продаже актива | `services/finance/asset_sale.py` | `liability_payoff_from_sale` | Нет, см. правила |

`ref_id` проводки купона указывает на вклад, поэтому в `_post` он передаётся как `liability_id` только для `POSTING_LIABILITY_PAYMENT`.

Миграция `game/api/migrations/0052_transaction_event_instance_id.sql` (решение PO 2026-11-10) и `models.py`:

```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS event_instance_id INTEGER NULL REFERENCES event_instances(id);
CREATE INDEX IF NOT EXISTS ix_transactions_event_instance_id ON transactions (event_instance_id);
```

`add_transaction` и `adjust_balance` получают необязательный параметр `event_instance_id: int | None = None`. Его передаёт списание `event_cash` в `services/events/choose.py`.

**Почему не `effects_json`:** в 33 вариантах каталога сумма задана через `cash_pct_salary` и вычисляется от зарплаты на момент выбора, а событие `mq11_used_car_deadline` пересчитывает сумму цепочкой. Восстановить фактическое списание по `effects_json` нельзя.

### Endpoints

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/api/game/bootstrap` | — | `run_finale.decisions[]` | Новое поле со значением по умолчанию `[]`, изменение обратно совместимо |

```python
class RunFinaleDecision(BaseModel):
    kind: str  # debt_overpaid | salary_missed | event_cost | investment_gain
    direction: str  # cost | gain
    title: str
    detail: str
    amount: float  # всегда > 0, смысл задаёт direction
    period_index: Optional[int] = None  # None для сумм за всю партию
    is_estimate: bool = False
```

DC-08: `RunFinalePayload.monthly_burn: Optional[float] = None` — текущие месячные расходы для подписи масштаба в A. Backend отдаёт число (включая 0), старый payload без поля поддерживается: UI скрывает подпись. Порог отбора на frontend по этому полю не вычисляется. Auth, маршруты, статусы и ошибки не изменены.

Сборка: новый модуль `game/api/app/game/run_finale_decisions.py`, вызов из `build_run_finale_payload`. Sync: `game/web/src/api/game.js`, `runFinaleDisplay.js`.

### Формулы

| `kind` | Расчёт | Оценка |
|--------|--------|--------|
| `debt_overpaid`, по кредиту | `paid − (original_principal − remaining)`, где `paid` — сумма списаний с этим `liability_id`, `remaining = total_debt` у активного кредита и `0` у закрытого | Нет |
| `salary_missed`, одна карточка | По закрытым ходам из `PeriodEconomyClosing` без `PeriodSnapshot.salary_claimed=1`: сумма ближайшей полученной зарплаты, сначала ищем раньше, затем позже, иначе `FinanceSalary.monthly_amount` | Да |
| `event_cost`, одна карточка | Наибольшее списание `event_cash` с заполненным `event_instance_id`; заголовок из названия события, подпись из выбранного варианта. Списания без привязки (партии до миграции) не учитываются | Нет |
| `investment_gain`, одна карточка | `invest_close + bond_coupon + principal активных позиций − deposit_open − bond_buy` по журналу и `InvestmentPosition` | Нет |

`remaining` нельзя брать из `total_debt` закрытого кредита: при обычном закрытии поле не обнуляется (`liabilities.py`, закрывается только `is_active`).

## UI / UX

- Блок «Что решило партию» в `MqxRunFinale`: заголовок `h2`, карточки списком.
- Направление показывается знаком и подписью, а не только цветом. Суммы — через `MoneyText`.
- Рядом с суммой подпись «это N мес. расходов», `N` считается по `monthly_burn` и скрывается при нулевом значении.
- Новый визуальный блок идёт по [`DESIGN_WORKFLOW`](../../../web/src/components/mqx/DESIGN_WORKFLOW.md): `game/design-lab/run-finale/` → утверждение → `mqx/` → prod. Отдельно проверить экран поражения рядом с разделом «Факт» на перегруз.
- Копирайт описывает факт: «Кредит "Авто": заплачено сверх взятого». Слова «ошибка», «зря», «надо было» запрещены.
- Ref: [`specs/SPEC_FRONTEND_UI.md`](../SPEC_FRONTEND_UI.md)

## Rules & edge cases

### Решения PO и проверка DC-06 (2026-11-11)

PO: «Сумма должна быть значимая в 1-3 месяца доходов». Нужны крупнейшие суммы с разнообразием направлений (не только минусы, но и плюсы). Вложения конкурируют по сумме и не должны занимать все три строки; лимит в одну или две строки определяется по тестовым прогонам и частоте попадания вложений.

По итогам [DC-06](../../balance/reports/DC-06_2026-11-11_income-thresholds.md) PO предварительно выбрал **1×**: «Давай пока 1х» (2026-11-11). Порог внедряется как один средний регулярный доход за партию. Множитель не задаёт верхний предел суммы карточки. Правила разнообразия отдельно этим ответом не переутверждены: текущий алгоритм сохраняется.

- **База утверждена PO 2026-11-11:** средний регулярный доход за партию, включая пропущенные выплаты как доступный доход (ответ в чате: «Средний за партию»). Расчёт по истории и поведение нулевого порога описаны ниже.
- Пороги 1 / 2 / 3 сравнены на 6 завершённых партиях разных ролей из 10 прогонов: вложения выбраны в 2/6, 0/6, 0/6; пустой блок — в 4/6, 4/6, 5/6 соответственно. Полные частоты и причины отсева — в отчёте DC-06.
- Чистое ранжирование и вариант с обоими направлениями в этой выборке совпали. Нынешняя гарантия прошедшего порог `investment_gain` сохраняется; новая политика разнообразия отдельно не утверждена.
- Текущий `investment_gain` агрегирует все вклады и облигации в одну карточку. Лимиты 1 и 2 при этом эквивалентны; для осмысленного сравнения двух строк сначала согласовать разделение кандидатов, без двойного учёта дохода.

Принятый предварительный порог: **1× среднего регулярного дохода по закрытым ходам**. Среднее = `(sum(PeriodEconomyClosing.period_income_rate) + оценка пропущенных зарплат) / число закрытых ходов`, округление до 0,01 ₽. В `period_income_rate` входят полученная зарплата и регулярные пассивные поступления; разовые события, выдача кредита и возврат тела вложений в базу не входят. Пропущенные зарплаты восстанавливаются существующей оценкой по ближайшей полученной, затем текущей зарплате, и не уменьшают знаменатель. Финальный текущий доход не подменяет историю. Это правило только отображения финала: суммы экономики не меняются.

При нулевом среднем сохраняется прежнее поведение нулевого порога — проходят только положительные суммы; без закрытых ходов список пуст. Отдельная политика для нулевого дохода и изменение гарантий разнообразия остаются открытыми, новые гарантии этим решением не вводятся. Вложения остаются одним агрегированным кандидатом.

**Отбор карточек, строго по порядку:**

1. Считаем кандидатов всех типов. `debt_overpaid` строится по каждому кредиту.
2. Отбрасываем суммы меньше порога: порог равен **1× среднего регулярного дохода за закрытые ходы**, включая оценку пропущенных зарплат. При нулевом среднем сохраняется фильтр только положительных сумм.
3. Сортируем по сумме по убыванию; при равенстве порядок типов: `debt_overpaid`, `salary_missed`, `event_cost`, `investment_gain`.
4. Берём первые три, не больше двух `debt_overpaid`.
5. Если `investment_gain` прошёл порог, но не попал в тройку, он заменяет третью карточку.

**Случаи:**

- Кредит с пустым `original_principal` карточку не получает.
- Кредит, у которого продан залоговый актив (`secured_asset_id` указывает на неактивный актив), карточку не получает: `asset_sale` гасит долг из выручки, и эта часть не проходит через журнал. Возможны редкие лишние исключения, это безопаснее неверной суммы.
- Отрицательная переплата приравнивается к отсутствию карточки.
- Нулевая зарплата карточку `salary_missed` не создаёт.
- Партия с нулём закрытых ходов даёт `decisions=[]`.
- Отрицательный `investment_gain` карточку не создаёт.
- Если между победой и dismiss через API закрыт ещё один ход, карточки соберутся по новому состоянию. В UI финал открыт поверх игры, отдельная блокировка не вводится.
- Расчёт не меняет экономику: `process_period_end` меняется только передачей `liability_id` в запись журнала, суммы и порядок проводок те же.

## Testing strategy

Skill: **`/critical-test-scenarios`** ([`critical-test-scenarios`](../../../../.agents/skills/verify-change/SKILL.md)).
Цель — **не 100% coverage**, а критичные сценарии (gate G1–G4). Ref: [`game/api/tests/README.md`](../../../api/tests/README.md).

| Layer | What to prove |
|-------|----------------|
| Unit | Формулы и правила отбора |
| API / integration | `liability_id` пишется во всех пяти местах; `decisions` приходит в bootstrap |
| FE contract | `runFinaleDisplay` разбирает `decisions`, пустой массив не рисует блок |
| Manual | Экраны победы и поражения на 320–390 px и desktop |

### Critical scenarios (min gate)

| ID | Scenario | Layer | Command / path |
|----|----------|-------|----------------|
| CS-1 | Аннуитетный кредит выплачен: переплата равна сумме платежей минус тело | integration | `tests/test_run_finale_decisions.py` |
| CS-2 | Кредит закрыт досрочно через `liability_close` при ненулевом `total_debt`: `remaining=0`, сумма верна | integration | `tests/test_run_finale_decisions.py` |
| CS-3 | Кредит только с процентами, активный: переплата равна сумме платежей | unit | `tests/test_run_finale_decisions.py` |
| CS-4 | Продан залоговый актив: карточки кредита нет | integration | `tests/test_run_finale_decisions.py` |
| CS-5 | Пропущено N зарплат: одна карточка, сумма по ближайшей, `is_estimate=true` | unit | `tests/test_run_finale_decisions.py` |
| CS-6 | Отбор: порог, максимум две по кредитам, замена третьей на `investment_gain` | unit | `tests/test_run_finale_decisions.py` |
| CS-6a | Событие с суммой от зарплаты: карточка показывает фактическое списание, даже если зарплата потом изменилась | integration | `tests/test_run_finale_decisions.py` |
| CS-7 | Победа и поражение отдают `decisions`; после dismiss `run_finale` отсутствует | integration | `tests/test_run_finale.py` |
| CS-8 | Суммы и порядок проводок закрытия хода не изменились | golden | `balance_diff` к baseline |

Commands:

```bash
cd backend && py -3 -m pytest -q
cd backend && py -3 scripts/balance_playtest.py
cd frontend-react && npm run build && npm run test:unit
```

## Boundaries

- **Always:** считать только по фактам партии; помечать оценки; добавлять новые движения по кредиту с `liability_id`.
- **Ask first:** изменение порога и правил отбора, новые типы карточек, изменение схемы сверх `liability_id` и `event_instance_id`.
- **Never:** разбирать `Transaction.description`; давать советы и оценки в карточках; заносить игровые понятия в `shared/packages/fincore`; менять суммы экономики в этой фиче.

## Open questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | Показывать при поражении? | PO | Да, оба исхода (2026-11-09) |
| 2 | Показывать вне финала? | PO | Нет, итог победы; дальше свободный режим (2026-11-09) |
| 3 | `liability_id` или `total_paid`? | PO | `liability_id` (2026-11-09) |
| 4 | Хранить карточки в БД? | Агент | Нет, финал собирается при bootstrap и после dismiss не отдаётся |
| 5 | Какой порог значимости использовать? | PO | После DC-06 предварительно принят **1× среднего регулярного дохода за партию**, включая доступные пропущенные выплаты: «Давай пока 1х» (2026-11-11). В выборке 6 финалов, вложения выбраны в 2/6; расходы больше не база порога. |

## Traceability

| Artifact | Link |
|----------|------|
| Idea | [`vision/ideas/run-finale-decision-cost.md`](../../vision/ideas/run-finale-decision-cost.md) |
| Parent spec | [`SPEC_game-run-finale.md`](SPEC_game-run-finale.md) |
| Plan | [`plans/PLAN_run-finale-decision-cost.md`](../../plans/PLAN_run-finale-decision-cost.md) |
| Backlog | `backlog/PRODUCT_BACKLOG.md`, эпик GE1 |
