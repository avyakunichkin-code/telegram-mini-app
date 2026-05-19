---
layer: reference
purpose: implementation-checklist
epic: E1
spec: ../features/SPEC_expenses.md
---

# Чеклист внедрения E1 «Расходы» (все слои)

Использовать при планировании спринтов и ревью PR: отмечать `[x]` по мере готовности.  
**Не начинать волну B**, пока волна A не закрывает строки DB + Domain + Period + Overview.

---

## 0. Документация и продукт

- [ ] [`EXPENSES_SYSTEM.md`](../gameplay/EXPENSES_SYSTEM.md) — `approved`
- [ ] [`SPEC_expenses.md`](../features/SPEC_expenses.md) — `approved`
- [ ] [`GLOSSARY.md`](../../foundation/GLOSSARY.md) — термины: burn, статья, категория
- [ ] [`SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md) — §3.3 дополнен шагом «расходы жизни»
- [ ] [`CLAUDE.md`](../../../CLAUDE.md) — эндпоинты и поля overview
- [ ] [`TRACEABILITY.md`](../../TRACEABILITY.md) — статус E1
- [ ] [`PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) — волны A–D
- [ ] Контент-гайд для авторов событий (раздел в SPEC или `docs/reference/EVENT_EXPENSE_EFFECTS.md`)

---

## 1. DB / миграции

- [ ] Таблица `expense_category_definitions` + сиды 8 категорий
- [ ] Таблица `profile_expense_lines` (индексы, FK)
- [ ] Миграция `0013_...sql` (+ `0014` если нужны ALTER шаблонов)
- [ ] SQLAlchemy модели в `models.py`
- [ ] `main.py` / `migrate.ps1` — порядок применения
- [ ] Скрипт/сиды: разложить `base_monthly_lifestyle_expense` → `expense_budget` для каждого `game_starter_template`
- [ ] `starter_params_json.expense_budget_snapshot` при `game/start`
- [ ] Backfill: существующие активные профили — строки из base+delta (одна строка `other` или полная разбивка по дефолту)

---

## 2. Backend — домен

- [ ] `backend/app/expenses.py`
  - [ ] `compute_monthly_burn(db, profile) -> BurnSnapshot`
  - [ ] `lines_by_category`, `total`, `must_total`, `discretionary_total`
  - [ ] `add_line`, `revoke_line`, `expire_lines_for_period`
  - [ ] `clamp_burn_delta`
- [ ] `expense_template_defaults.py` — доли по template_key если нет `expense_budget`
- [ ] Валидатор blueprint при старте игры
- [ ] Feature flag `EXPENSES_V1_LINES=1` для cutover событий

---

## 3. Backend — период и транзакции

- [ ] `game_period.process_period_end` — burn из `compute_monthly_burn`
- [ ] `TRANSACTION_TYPES` / описание транзакции с категориями в metadata
- [ ] `breakdown[]` — элементы по категориям (`type: expense_category`)
- [ ] `PeriodEconomyClosing` — поле `expense_breakdown_json` (если нужна аналитика)
- [ ] Ответ `POST /game/time/next` — включить breakdown (если клиент показывает итог)
- [ ] Idempotency: повторное закрытие не дублирует burn

---

## 4. Backend — API

- [ ] `GET /api/finance/overview` — поля §4.2 SPEC_expenses
- [ ] `GET /api/game/expenses` — детальный снимок
- [ ] `schemas.py` — Pydantic модели breakdown
- [ ] `routers/game.py` — создание строк при start
- [ ] `routers/events.py` — effects v2 + legacy alias
- [ ] `achievement_engine.monthly_reference_expense` → burn из домена
- [ ] `victory_engine` — goal `expense_to_income_ratio`
- [ ] `finance_analytics` / timeseries — опционально `burn_total` в точке
- [ ] Ошибки 400 при невалидном blueprint

---

## 5. Backend — тесты

- [ ] `test_expenses_compute.py`
- [ ] `test_game_start_expense_budget.py`
- [ ] `test_period_expense_breakdown.py`
- [ ] `test_expenses_events.py`
- [ ] `test_victory_expense_ratio.py`
- [ ] Регрессия: `test_achievement_engine`, `test_victory_engine`
- [ ] Регрессия: полный `pytest -q`

---

## 6. Контент — шаблоны

Для **каждого** `game_starter_templates.template_key`:

- [ ] Заполнен `expense_budget` (сумма = base)
- [ ] Чеклист: ипотека XOR аренда в housing
- [ ] Описание в blueprint согласовано с цифрами
- [ ] Плейтест: burn + obligations < salary × 1.2 (или осознанный hard template)

---

## 7. Контент — события

- [ ] Whitelist effects в `events.py`
- [ ] Обновить ≥3 существующих события с `expense_line` (подписки, переезд, питомец)
- [ ] Документ: какие категории для каких сюжетов
- [ ] Clamp и тесты на злоупотребление delta

---

## 8. Frontend

- [ ] `api.js` — поля burn / breakdown / `getExpenses()`
- [ ] **Dashboard:** одна цифра burn + подпись про конец периода (плитка «Расходы»)
- [ ] **Finance:** блок «Расходы» — **топ 3–5 категорий** + полный список / детали
- [ ] **Закрытие периода:** toast/modal с breakdown
- [ ] **Analytics:** блок burn / % дохода
- [ ] **VictoryGoalsPanel:** цель expense ratio если в шаблоне
- [ ] Design-lab: макет списка статей
- [ ] i18n / `asSafeReactText` для сумм
- [ ] Не смешивать burn с obligations в одной подписи без пояснения

---

## 9. Victory / Achievements / Meta

- [ ] `victory_config_json` — пример цели в 1–2 шаблонах
- [ ] UI прогресса цели expense ratio
- [ ] Достижения: проверить критерии с `monthly_reference_expense`
- [ ] Не ломать MVP победу (подушка 3× obligations — уточнить, входит ли burn в знаменатель цели подушки v2)

---

## 10. Plan Mode (волна D)

- [ ] Spec мастера Plan — секция расходов
- [ ] CRUD API статей (`save_kind=plan`)
- [ ] Префилл из `starter_params_json`
- [ ] UI редактора

---

## 11. QA / релиз

- [ ] Сценарий: новый профиль → overview breakdown = шаблон
- [ ] Сценарий: событие +1200 communications → total растёт
- [ ] Сценарий: expires_after 2 periods → строка исчезает
- [ ] Сценарий: конец периода → cash уменьшается на burn
- [ ] Регрессия: старый профиль после миграции
- [ ] Обновить `MVP_AUDIT_VS_SPEC.md` — снять DEFER по расходам

---

## 12. Ops / Admin (опционально)

- [ ] Watchtower: метрика «burn > 80% salary» по когорте
- [ ] Лог контент-ошибок blueprint validation

---

*Последнее обновление: 2026-05-19*
