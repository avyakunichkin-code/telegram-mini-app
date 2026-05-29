---
name: game-economy-and-victory
description: >-
  Changes game period economics, victory engine, events, templates, and balance
  thresholds. Use when editing process_period_end, win_reached, victory_config_json,
  starter templates, or financial game rules.
argument-hint: "[period, victory, events, or balance focus]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

# Game Economy and Victory

## Прочитай сначала (ТВОЙ ХОД)

- [`CLAUDE.md`](../../../CLAUDE.md)
- [`docs/specs/features/SPEC_victory-v2.md`](../../../docs/specs/features/SPEC_victory-v2.md)
- [`docs/decisions/ADR-002-victory-engine-and-template-config.md`](../../../docs/decisions/ADR-002-victory-engine-and-template-config.md)
- [`docs/decisions/ADR-004-mechanics-unlock-victory-chain.md`](../../../docs/decisions/ADR-004-mechanics-unlock-victory-chain.md)
- [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](../../../docs/vision/ideas/game-balance-thresholds-and-constraints.md)
- [`backend/app/game/period.py`](../../../backend/app/game/period.py)
- [`backend/app/victory/engine.py`](../../../backend/app/victory/engine.py)
- [`backend/app/finance/overview_build.py`](../../../backend/app/finance/overview_build.py)
- [`docs/balance/README.md`](../../../docs/balance/README.md) — playtest после смены формул/порогов

**Satellites (та же задача):** `test-driven-development`, `doubt-driven-development`, **`balance-playtest`** (крупный баланс / seeds / period).

**Куда писать:** `backend/app/game/`, `backend/app/victory/`, `backend/app/events/`, `backend/app/seeds/`, `backend/migrations/`, `docs/specs/features/`, при смене контракта overview — `frontend-react/src/api.js` + UI целей.

**Дальше:** `code-review-and-quality`, `documentation-and-adrs` (если менялись ADR/публичный контракт).

## Overview

Prod-победа — **Victory v2** (`victory_config_json` шаблона, `progression_mode: chain` | `parallel`, `min_period_index_for_victory`). Не дублировать условия победы в роутерах вручную — только через `victory/engine.py` и сборку overview.

Legacy MVP-AND («3× подушка + просрочка + cashflow») — **только тесты** (`evaluate_mvp_victory`), не prod.

## When to Use

- `process_period_end`, зарплата, обязательства, просрочка, инвестиции, страховки в конце периода
- `win_reached`, цели цепочки, `mechanics_unlock`
- События периода, фильтр `EventDefinition.mode` × `save_kind`
- Сиды/миграции шаблонов и `victory_config_json`
- Баланс порогов (поражение, gate периода 7+)

**When NOT to use:** чисто визуальный UI без смены правил — `frontend-ui-engineering` / `design-lab-mqx`.

## Procedure

### 1. Spec gate

Если меняется **игроко-видимое правило** или контракт API — сначала обнови или создай `docs/specs/features/SPEC_*.md` (или подтверди, что изменение покрыто существующим spec).

### 2. Red — тест на поведение

```bash
cd backend && python -m pytest -q
```

Добавь failing test в `backend/tests/` на сценарий (конец периода, victory chain step, событие). Для victory — смотри существующие тесты движка и overview.

### 3. Green — минимальный код

| Область | Файлы |
|---------|--------|
| Экономика периода | `backend/app/game/period.py` |
| Победа | `backend/app/victory/engine.py`, `overview_build.py` |
| HTTP | `routers/` → `services/` (тонкие use-cases) |
| Данные | `backend/migrations/`, `backend/app/seeds/` |
| Контракт UI | `GET /api/finance/overview` → `overview.victory`, `win_reached` |

Роутеры **не** копируют формулы победы — только вызывают сервисы/движок.

### 4. Doubt pass (кратко)

Перед завершением ответь себе:

- Может ли игрок выиграть раньше gate без продуктового решения?
- Сломана ли chain-последовательность целей?
- Согласованы ли сиды всех Game-шаблонов?
- Нужна ли миграция + `migrate.ps1`?

### 5. Verify

```bash
cd backend && python -m pytest -q
```

Упомяни в ответе пользователю результат pytest, если не запускал.

При изменении `victory_config_json` в сидах — проверь tutorial chain и `mechanics_unlock` ([ADR-004](docs/decisions/ADR-004-mechanics-unlock-victory-chain.md)).

## Invariants (не ломать без spec + ADR)

- `save_kind`: `game` | `plan`; legacy light/hardcore не возвращать
- Победа: Victory v2, не только `period_index >= 7`
- `event_tier` от `period_index`, без character level/XP
- Поражение: три подряд периода с отрицательным `cash` (если не меняется в spec)

## Verdict

Завершай с **PASS** / **CONCERNS** / **FAIL** и списком проверок (pytest, spec, миграции).

## Согласование

Перед записью в репо (миграции, сиды, смена порогов победы): **Могу записать эти изменения?**

## Следующий шаг

- [`test-driven-development`](../test-driven-development/SKILL.md) — если тесты ещё не зелёные
- [`code-review-and-quality`](../code-review-and-quality/SKILL.md) — перед merge
- [`documentation-and-adrs`](../documentation-and-adrs/SKILL.md) — новый ADR или DOC_SYNC_LOG
