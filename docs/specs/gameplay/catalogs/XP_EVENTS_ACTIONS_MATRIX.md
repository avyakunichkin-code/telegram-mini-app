---
layer: spec
catalog: xp-sources
status: superseded
superseded_by: ../../../vision/ideas/remove-character-xp-and-levels.md
last_reviewed: 2026-05-24
authoritative_formula: ../LEVEL_XP_SYSTEM.md
execution_spec: ../features/SPEC_mvp-11-progression-events.md
---

# Матрица источников опыта: действия API и события

> **Superseded (2026-05-24).** Начисление character XP и гейты по уровню удалены. Таблица ниже — **архив** baseline; в runtime `xp_delta` в сидах событий игнорируется.

**Назначение *(архив)*:** список baseline XP и разблокировок до снятия прогрессии. Актуальная прогрессия контента — **`event_tier`** от **`period_index`**: [`remove-character-xp-and-levels.md`](../../../vision/ideas/remove-character-xp-and-levels.md).

Формула порога уровней *(архив)* — **[`LEVEL_XP_SYSTEM.md`](../LEVEL_XP_SYSTEM.md)** (superseded).

---

## 1. Конвенции

| Колонка | Значение |
|---------|----------|
| **Источник** | Короткий стабильный ключ (snake_case) |
| **Тип** | `api_action` \| `period_close` \| `event_choice` |
| **Якорь в коде / данных** | Путь файла или `event_definitions.key` |
| **XP (baseline)** | Число **на одно исполнение** или правило см. столбец «Примечания» |
| **event_tier** | Только определений событий; для действий «—» |
| **Разблок (цель)** | Минимальный `character_level` для **нового действия этого класса** (фаза API-gейтов см. PLAN) |
| **Статус** | `coded` значения из кода; `designed` — до рефактора константы; `tbd` |

---

## 2. Действия через API и конец периода

| Источник | Тип | Якорь в коде | XP (baseline) | event_tier | Разблок (цель) | Статус |
|----------|-----|---------------|---------------|-------------|----------------|---------|
| `period_close_base` | `period_close` | `progression_xp` → `process_period_end` | **12** | — | — | coded |
| `period_close_salary_bonus` | `period_close` | там же | **+10** если зарплата за период | — | — | coded |
| `period_close_savings_bonus` | `period_close` | там же | **+0…20** (`contrib/2000`, cap 20) | — | — | coded |
| `template_milestone` | `period_close` | `progression_xp` milestone 1/3/7 | **20 / 25 / 30** once | — | — | coded |
| `claim_salary` | `api_action` | `period_actions` claim | **0** (бонус в close) | — | 1 | coded |
| `safety_contribute` | `api_action` | `period_actions` | **3**, max **2**/период | — | 1–2 | coded |
| `safety_withdraw` | `api_action` | `period_actions` | **1**, max **1**/период | — | 1 | coded |

Канон v2: [`balance-xp-evening-session.md`](../../../vision/ideas/balance-xp-evening-session.md).

---

## 3. События (`event_definitions.key`)

Строки заполнять по факту сидов после миграции **`event_tier`**. Колонку **xp_delta по выбору** храните в коде данных (`effects_json` на `EventChoice`); здесь достаточно **диапазона ожиданий** для баланса.

| Событие `key` | event_tier (план) | Ожидание xp_delta на выбор (черновик) | Примечания |
|---------------|-------------------|----------------------------------------|-------------|
| `broken_phone` | 1–2 | 0–25 | учебное решение дорого/дешево |
| `tax_refund` | 1 | 10–25 | безоплатный ап |
| `friend_offer` | 1–2 | 10–25 | trade-off времени см. текст |
| *добавить после волны 12+* | 1–4 | по балансу | без микрозаймов и казино ([`TARGET_PLAYER` §3](../../foundation/TARGET_PLAYER_AND_SESSION.md)) |

---

## 4. Будущие источники (плейсхолдер до гейтов)

| Источник | Разблок (цель) | XP baseline (tbd) |
|----------|----------------|-------------------|
| `invest_open_deposit` | 3 (`LEVEL_XP_SYSTEM §3`) | tbd |
| `invest_buy_bond` | 4 | tbd |
| `insurance_buy_policy` | 5 | tbd |
| `asset_from_template_buy` | depends on шаблон | tbd |

---

## 5. Правила поддержки этого файла

1. Никакого XP в коде без строки здесь (**или** в JSON сидов для событий с отсылкой key).
2. **`xp_delta` в данных событий:** только **`≥ 0`** (согласовано [`LEVEL_XP_SYSTEM §10`](../LEVEL_XP_SYSTEM.md)).
3. При изменении `event_definitions` — добавить строку в §3.
4. PR с изменением порога need(L) — обновить **[`LEVEL_XP_SYSTEM.md`](../LEVEL_XP_SYSTEM.md) §4**.

---

### История

2026-05-17 — создание каталога и привязка к MVP 11.  
2026-05-19 — XP v2: единый `period_close`, milestone, капы подушки.
