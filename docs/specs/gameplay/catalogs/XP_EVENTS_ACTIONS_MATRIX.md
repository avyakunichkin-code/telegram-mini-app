---
layer: spec
catalog: xp-sources
status: draft
last_reviewed: 2026-05-17
authoritative_formula: ../LEVEL_XP_SYSTEM.md
execution_spec: ../features/SPEC_mvp-11-progression-events.md
---

# Матрица источников опыта: действия API и события

**Назначение:** один список, по которому балансируются **XP** и (опционально) **уровень разблокировки механики**. Любое изменение в коде должно находить здесь строку или добавлять новую строку до merge.

Формула порога уровней и принципы — **[`LEVEL_XP_SYSTEM.md`](../LEVEL_XP_SYSTEM.md)**.

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
| `period_close_base` | `period_close` | `period_actions`: начисление за закрытие снимком | см. смешение `period_close` блока ниже в §2.1 | — | — | coded |
| `period_close_salary_bonus` | `period_close` | там же (+20 если зарплата забрана) | +20 при условии | — | — | coded |
| `period_close_savings_bonus` | `period_close` | там же `min(30, savings/1000)` | переменное | — | — | coded |
| `period_end_ticks` | `period_close` | `game_period.py` закрытие периода (базово) | базово +5 паттерн | — | — | coded |
| `claim_salary` | `api_action` | `period_actions` claim | +10 в одном пути см. файл | — | 1 | coded |
| `safety_contribute` | `api_action` | `period_actions` | +10 | — | 1–2 (`LEVEL_XP_SYSTEM §3`) | coded |
| `safety_withdraw` | `api_action` | `period_actions` | +5 | — | 1 | coded |

### 2.1. Известная неоднородность (должен снять рефактор MQ-113)

Разные блоки в `period_actions.py` задают числа напрямую. После вынесения в **единый модуль начисления** замените этот подраздел **одной** строкой в таблице с точным ключом конфига константы (напр. `XP_PERIOD_CLOSE_PAYLOAD` как dict).

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
