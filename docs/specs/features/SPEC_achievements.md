---
layer: spec
status: approved
owner: product
last_reviewed: 2026-05-19
tracks: achievements, m12, progression
idea: ../../GAME.md
foundation: ../../foundation/TARGET_PLAYER_AND_SESSION.md
related:
  - ../gameplay/LEVEL_XP_SYSTEM.md
  - SPEC_mvp-11-progression-events.md
  - SPEC_victory-v2.md
  - ../../../GAME.md
---

# Spec: Достижения (M12) — цепочки tier, XP, экран «Развитие»

Норматив для **системы достижений** в Game Mode: цепочки из 1–4 ступеней, награда **XP персонажа**, отдельно от **победы** (Victory v2) и от **финансовой геймификации** в overview.

Читать вместе с:

- [GAME.md](../../../GAME.md) §5.2–5.3, §10.5 — продуктовая анкета и философия
- [LEVEL_XP_SYSTEM.md](../gameplay/LEVEL_XP_SYSTEM.md) — уровень персонажа, API-gates, темп XP
- [SPEC_victory-v2.md](SPEC_victory-v2.md) — победа **M из N**; достижения **не** входят в цели победы
- [SPEC_mvp-11-progression-events.md](SPEC_mvp-11-progression-events.md) — события и `character_*` в overview

---

## 1. How Might We (проблема)

**Как дать игроку ощущение глубины и «осмысленных вех», не превратив прогресс в кликер и не смешав его с победой партии?**

Игрок должен видеть **понятные цепочки** (подушка → вклад → страховка → кредит → инвестиции → капитал), получать **заметный XP** за пороговые решения и открывать механики через **уровень персонажа** (отдельный слой).

---

## 2. Принятые решения (idea-refine → converge)

| Вопрос | Варианты | Решение |
|--------|----------|---------|
| Роль достижений vs событий | A: только достижения → XP | **Гибрид:** XP из событий, периода, действий **и** достижений ([GAME §5.1](GAME.md)) |
| «Месяцы подушки» | obligations-only vs obligations+lifestyle | **`monthly_reference_expense`** = платежи по долгам + обслуживание активов + lifestyle (как «полные расходы месяца») |
| Кредит tier 2 анкеты («досрочка ≥30%») | точный учёт погашений vs прокси | **v1.0 прокси:** `liabilities_closed_count` / `liability_close_payment`; точный % тела — **backlog** (нужен тип транзакции) |
| Страховка tier 4 («24 мес. без голого шока») | трекинг событий-шоков vs дисциплина | **v1.0 прокси:** `insured_clean_streak` при активной страховке или прошлой выплате |
| Проценты по вкладу | ledger vs оценка | **Оценка** по `principal × rate / 12 × periods_held` (см. движок) |
| Победа | достижения как цели | **Нет** — только `victory_config_json` шаблона ([SPEC_victory-v2](SPEC_victory-v2.md) §Assumption 6) |
| Plan Mode | те же цепочки | **Out of scope v1.0** — только `save_kind=game` |
| Альтернативные ветки (долг / без долга) | одна цепочка «Кредиты» | **v1.0:** одна цепочка; ветвление — **v1.1** ([GAME §9.3](GAME.md) п.6) |

---

## 3. Objective

### 3.1. Why

- Наградить **финансовую дисциплину** (подушка, отсутствие просрочки, пассивный доход), а не «открыл экран».
- Дать **второй рычаг прогресса** рядом с событиями — снижает зависимость от рандома карт.
- Подготовить экран **«Развитие»** с предсказуемым API.

### 3.2. Who

Игрок **Game Mode** в активной партии (`GameProfile.is_active`).

### 3.3. Success criteria

- [x] БД: `achievement_chains`, `achievement_tier_definitions`, `profile_achievement_unlocks` ([`0009_achievement_chains.sql`](../../../backend/migrations/0009_achievement_chains.sql)).
- [x] Каталог **6 цепочек × 4 tier** по [GAME §5.3](GAME.md); сиды в `achievement_seeds.py` (без `type: stub`).
- [x] Движок: последовательная разблокировка tier в цепочке + `apply_character_xp` при unlock.
- [x] Хуки оценки: конец периода (`process_period_end`), покупка актива из шаблона (`finance`), `GET /api/game/achievements`.
- [x] `GET /api/game/achievements` — состояние цепочек + `newly_unlocked` за запрос.
- [ ] UI: экран «Развитие», тост/оверлей при `newly_unlocked` и level-up (отдельные задачи FE).
- [x] Unit-тесты критериев и контракта API-gates не пересекаются с этим spec.

---

## 4. Assumptions

1. **Один активный профиль** на пользователя — как в остальном API игры.
2. **Tier строго по порядку:** нельзя получить tier 3 без tier 1–2 в той же `chain_key`.
3. **Unlock идемпотентен:** повторная проверка не дублирует запись в `profile_achievement_unlocks`.
4. **XP за tier начисляется один раз** при первом unlock; откат экономики **не** отзывает unlock (только forward progress).
5. **`criteria_json.schema_version = 1`** — неизвестный `type` → tier **не** выполняется (fail closed).
6. **Зарплата** для порогов «N зарплат» / «N месяцев дохода» = `FinanceSalary.monthly_amount` на момент оценки (как Victory v2 B3).
7. **Пассивный доход** = `monthly_income` активов + оценка купона облигаций (`principal × annual_rate / 12`).
8. **Ликвидность** для цепочки «Капитал» = `cash_balance + safety_fund_balance` (без нереализованных активов).
9. Контент цепочек редактируется через **сиды Python** (`ensure_achievement_catalog`); смена порогов **не** требует миграции схемы.
10. Достижения **не блокируют** `process_period_end` и обслуживание blueprint-сущностей ([LEVEL_XP §8](../gameplay/LEVEL_XP_SYSTEM.md)).

---

## 5. Отличие от соседних систем

| Система | Назначение | Пересечение |
|---------|------------|-------------|
| **`character_level` / gates** | Открытие **новых** механик (вклад L3, облигации L4…) | Достижения дают XP → ускоряют уровень; gates проверяются **до** действия |
| **Victory v2** | Победа партии **M из N** по шаблону | Общие метрики (подушка, просрочка); **разные** таблицы и движки |
| **`gamification_level` / score** | Условный «рейтинг финграмотности» в overview | **Не** используется в критериях достижений |
| **События `xp_delta`** | Вариативность и сюжет | Дополняют, не заменяют цепочки |

---

## 6. Философия и баланс

Из [GAME §5.2](GAME.md):

- Награда за **осмысленное использование** инструментов («вклад ≥ 2 зарплат» важнее «открыл на 1 000»).
- **Пороговые вехи** — крупный XP (до **500** на tier 4); мелкие действия — через события/период ([XP_EVENTS_ACTIONS_MATRIX](../gameplay/catalogs/XP_EVENTS_ACTIONS_MATRIX.md)).
- Целевой темп: между открытием механик **4–5+ периодов**; достижения не должны выдавать весь XP за 2–3 периода (плейтест).

**Суммарный XP каталога v1.0 (если закрыть все tier):** 2 395 XP (сверка с кривой `need(L)` — [LEVEL_XP §4](../gameplay/LEVEL_XP_SYSTEM.md)).

---

## 7. Модель данных

### 7.1. Таблицы

| Таблица | Назначение |
|---------|------------|
| `achievement_chains` | Категория, заголовок, `max_tier`, `sort_order`, `is_active` |
| `achievement_tier_definitions` | Ступень: `tier_key`, `criteria_json`, `xp_reward` |
| `profile_achievement_unlocks` | Факт unlock: `game_profile_id`, `tier_definition_id`, `period_index` |

### 7.2. Каталог v1.0 (контент)

Источник правды: `backend/app/achievement_seeds.py` → `ACHIEVEMENT_CHAIN_SPECS`.

| `chain_key` | Категория | Tier 1 → 4 (кратко) | Σ XP |
|-------------|-----------|---------------------|------|
| `safety_fund` | Подушка | 1 / 3 / 6 / 12 мес. расходов | 405 |
| `deposit` | Вклад | открыть ≥1k; ≥2 зарплат; % ≥10k; % ≥10% расходов/мес | 320 |
| `insurance` | Страховки | 1 полис; 2 полиса; выплата; 24 периода streak | 260 |
| `credit` | Кредиты | нет просрочки; закрыть долг; streak 3; закрытие ≥300k | 450 |
| `investment` | Инвестиции | 1 облигация; 3 облигации; пассив 5%; пассив 30% | 485 |
| `capital` | Капитал | ликвидность >0; >6 / >24 мес. зарплаты; ≥100k | 710 |

\* В анкете для инвестиций tier 2 указаны «3 облигации или ETF» — **ETF вне scope**; только `bond_count`.

### 7.3. Соответствие анкете vs реализация v1.0

| Анкета (GAME §5.3) | Реализация v1.0 | Комментарий |
|--------------------|------------------|-------------|
| Кредит: досрочка ≥30% тела | `liabilities_closed_count` | Нужен учёт частичного досрочного погашения — backlog |
| Кредит: переплата <15% | — | Не в v1.0 |
| Страховка: выплата >50% ущерба | `insurance_claimed_count` | Любая зафиксированная выплата |
| Страховка: 24 мес. без «голого» шока | `insured_clean_streak` | Прокси: streak + страховка |
| Вклад tier 1: открыть + 1000 | `deposit_opened` min 1000 | Совпадает |
| Капитал tier 4: >100k | `liquid_net_worth` ≥ 100_000 | Совпадает |

---

## 8. Контракт `criteria_json` (schema_version 1)

```json
{
  "schema_version": 1,
  "type": "safety_fund_months",
  "months_multiplier": 3
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `schema_version` | int | Только **1** |
| `type` | string | См. таблицу типов |
| … | | Параметры типа |

### 8.1. Типы критериев (v1.0)

| `type` | Параметры | Условие `met` |
|--------|-----------|---------------|
| `safety_fund_months` | `months_multiplier` | `safety_fund >= monthly_reference_expense × multiplier` и expense > 0 |
| `liquid_net_worth` | `min_amount` | `cash + safety_fund >= min_amount` |
| `liquid_vs_salary_months` | `min_months` | `liquid_total >= salary × min_months`, salary > 0 |
| `deposit_opened` | `min_principal` | `max_deposit_principal >= min_principal` |
| `deposit_principal_vs_salary` | `salary_multiplier` | `max_deposit_principal >= salary × multiplier` |
| `deposit_accrued_interest` | `min_interest` | оценка накопленных % ≥ `min_interest` |
| `deposit_monthly_income_ratio` | `min_ratio` | месячные % вклада ≥ `monthly_reference_expense × min_ratio` |
| `insurance_active_count` | `min_count` | число активных полисов ≥ `min_count` |
| `insurance_claimed_count` | `min_count` | полисов с `claimed_period_index` ≥ `min_count` |
| `insured_clean_streak` | `min_periods` | `clean_period_streak ≥ min_periods` и (активная страховка или была выплата) |
| `no_overdue` | — | `total_overdue_amount <= 0` |
| `clean_period_streak` | `min_periods` | `clean_period_streak >= min_periods` |
| `liabilities_closed_count` | `min_count` | транзакций `liability_close` ≥ `min_count` |
| `liability_close_payment` | `min_amount` | max сумма закрытия ≥ `min_amount` |
| `bond_count` | `min_count` | активных облигаций ≥ `min_count` |
| `passive_income_ratio` | `min_ratio` | `monthly_passive_income >= monthly_reference_expense × min_ratio` |

**Зарезервировано / запрещено:**

- `type: "stub"` — всегда `false` (не использовать в прод-сидах).
- Неизвестный `type` — `false`, лог `debug`.

### 8.2. `monthly_reference_expense`

\[
\text{ref} = \sum \text{liability payments} + \sum \text{asset maintenance} + \text{base\_lifestyle} + \text{delta\_lifestyle}
\]

Используется для «месяцев расходов» подушки и долей пассивного/процентного дохода.

---

## 9. Алгоритм движка

```
ctx = build_achievement_context(db, profile)
for each active chain (sort_order):
  while next tier = max_unlocked_index + 1 exists:
    if evaluate(criteria_json, ctx):
      insert profile_achievement_unlock
      apply_character_xp(profile, xp_reward)
      append to newly_unlocked
    else:
      break inner loop for this chain
return newly_unlocked
```

**Свойства:**

- За один вызов `process_achievement_unlocks` возможно **несколько** unlock (в т.ч. скачок через цепочки после одного действия).
- Внешний `while progress` повторяет проход по цепочкам, если в том же вызове открылся tier, открывающий следующий в другой цепочке (редко; допустимо).

**Точки вызова (v1.0):**

| Момент | Модуль |
|--------|--------|
| Конец периода | `game_period.process_period_end` → `achievement_unlocks` в ответе |
| Покупка актива из шаблона | `finance` router (после commit позиции) |
| Явный запрос UI | `GET /api/game/achievements` |

---

## 10. API

### 10.1. `GET /api/game/achievements`

**Auth:** как у остальных game routes.

**Поведение:** `sync_time` → `ensure_achievement_catalog` → `process_achievement_unlocks` → `commit` → сериализация.

**Response** (`AchievementsOverviewResponse`):

```json
{
  "period_index": 4,
  "character_level": 3,
  "character_xp": 120,
  "chains": [
    {
      "chain_key": "safety_fund",
      "category": "safety_fund",
      "title": "Подушка безопасности",
      "description": "...",
      "max_tier": 4,
      "current_tier": 2,
      "tiers": [
        {
          "tier_key": "safety_fund_t1",
          "tier_index": 1,
          "title": "Первая подушка",
          "description": "Подушка ≥ 1 месяца расходов",
          "xp_reward": 15,
          "unlocked": true
        }
      ]
    }
  ],
  "newly_unlocked": [
    {
      "chain_key": "deposit",
      "tier_key": "deposit_t1",
      "tier_index": 1,
      "title": "Первый вклад",
      "xp_reward": 10,
      "xp_gained": 10,
      "level_up": false,
      "new_level": null
    }
  ]
}
```

| Поле | Смысл |
|------|--------|
| `current_tier` | Максимальный `tier_index` с `unlocked: true` |
| `newly_unlocked` | Только что выданные в **этом** запросе (пустой при повторном GET без новых условий) |

**Не в v1.0:** progress 0..1 к следующему tier, `criteria` в ответе, пагинация.

### 10.2. Конец периода

В payload `POST /api/game/time/next` (и внутренний результат `process_period_end`) поле:

```json
"achievement_unlocks": [ /* тот же shape, что newly_unlocked */ ]
```

Клиент **должен** показывать feedback при непустом массиве (тост / оверлей) — [SPEC_FRONTEND_UI](../SPEC_FRONTEND_UI.md), экран «Развитие».

### 10.3. Синхронизация `frontend-react/src/api.js`

```js
getAchievements: () => apiCall('/api/game/achievements'),
```

Типы ответа — по Pydantic-моделям в `schemas.py` (при появлении TS-генерации — обновить).

---

## 11. UX (scope FE, норматив поведения)

| Элемент | Требование |
|---------|------------|
| Экран **«Развитие»** | Список цепочек, tier, `unlocked`, `xp_reward`; вход из нижней навигации или профиля |
| Unlock feedback | При `newly_unlocked.length > 0` — тост с названием tier + XP; при `level_up` — акцент на новый уровень |
| Блокировка механик | Использовать `overview.character_unlocks` + 403 `level_gate` ([LEVEL_XP §3](../gameplay/LEVEL_XP_SYSTEM.md)), не дублировать логику достижений |
| Narrative | Заголовки/описания tier из БД; персонаж с репликами — backlog ([GAME §9.2](GAME.md)) |

---

## 12. Out of scope (v1.0)

| Тема | Почему |
|------|--------|
| Plan Mode | Отдельный продуктовый срез |
| Достижения как цели победы | Victory v2 |
| Альтернативные ветки долг / без долга | v1.1, отдельный дизайн |
| Отзыв unlock при падении метрик | Усложняет UX и save-integrity |
| `progress` / подсказка «осталось X до tier» | v1.1 UI |
| Админ-редактор цепочек в Watchtower | Только сиды в коде |
| Кросс-профильные / глобальные достижения | Только per `game_profile` |
| Negative XP за «провал» tier | [LEVEL_XP §10](../gameplay/LEVEL_XP_SYSTEM.md) |

---

## 13. Backlog v1.1+

1. **`early_repayment_ratio`** — доля досрочного погашения тела кредита (tier 2 кредитной цепочки по анкете).
2. **`overpayment_ratio`** — переплата <15% при закрытии.
3. **Разные `product_key` страховок** для tier 2 («2 разных» линии) — сейчас только счётчик полисов.
4. **Событийный критерий** «шок без страховки» для tier 4 страховок.
5. **Цепочка-ветка** `credit` vs `credit_free` по наличию активных liabilities на старте.
6. **Локализация** title/description (i18n).
7. **Интеграционные тесты** полного пути: старт → N периодов → unlock конкретного `tier_key`.

---

## 14. Тесты

| Файл | Покрытие |
|------|----------|
| `backend/tests/test_achievement_engine.py` | Каждый `type` из §8.1, границы, `stub` → false |
| `backend/tests/test_api_level_gates.py` | Не путать 403 gate с достижениями |
| *(backlog)* `test_achievements_api.py` | GET контракт, идемпотентность unlock |

После изменения `ACHIEVEMENT_CHAIN_SPECS` или типов критериев: `cd backend && python -m pytest -q`.

---

## 15. Реализация (код)

| Модуль | Назначение |
|--------|------------|
| `backend/app/achievement_engine.py` | Контекст, `evaluate_achievement_criteria`, unlock, serialize |
| `backend/app/achievement_seeds.py` | Каталог 6×4 |
| `backend/migrations/0009_achievement_chains.sql` | DDL |
| `backend/app/routers/achievements.py` | `GET /api/game/achievements` |
| `backend/app/game_period.py` | Хук конца периода |
| `backend/app/routers/finance.py` | Хук после asset from template |
| `backend/app/schemas.py` | `AchievementsOverviewResponse` |

---

## 16. Key assumptions to validate (плейтест)

- [ ] Игрок за **12–18 периодов** активной игры получает **2–4** unlock без «фарма» одного действия.
- [ ] Цепочка **credit** не тривиальна на шаблоне с ипотекой с первого месяца (прокси понятны в UI).
- [ ] Суммарный XP достижений **не** ломает темп level 5 относительно событий.
- [ ] Игроки различают **победу** и **достижения** (нет ощущения «два раза одно и то же»).

---

## 17. Связанные документы

- [PRODUCT_BACKLOG.md](../../backlog/PRODUCT_BACKLOG.md) — эпик M12
- [TRACEABILITY.md](../../TRACEABILITY.md) — строка M12
- [PLAN_level-xp-progression.md](../../plans/PLAN_level-xp-progression.md) — фазы gates + UX

---

## 18. История

| Дата | Изменение |
|------|-----------|
| 2026-05-19 | Первая версия spec; синхронизация с реализованным движком и сидами v1.0 |
