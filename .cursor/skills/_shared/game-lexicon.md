# Game lexicon (ТВОЙ ХОД) — краткий канон для скиллов

**Источник правды при конфликте:** код + тесты → `docs/specs/features/SPEC_*.md` → `docs/foundation/SPEC_PRODUCT.md` → `docs/vision/ideas/`.

## Цикл и сохранение

- **Период («месяц»):** открыт → действия игрока → **«Закрыть месяц»** (`POST /api/game/time/next` → `process_period_end`) → следующий период.
- **`save_kind`:** канон **`game`** (immutable). Старт из `game_starter_templates` + `template_key`. Режим **Plan снят** ([ADR-013](../../../docs/decisions/ADR-013-game-only-drop-plan-mode.md)); API `plan` → 400 (эпик GO). Колонка в БД может ещё существовать.
- **`period_index`:** номер закрытого/текущего периода; gate победы часто **`min_period_index_for_victory`** (дефолт **7**).

## Прогрессия и события

- **Без character level/XP** — канон: [`docs/vision/ideas/remove-character-xp-and-levels.md`](../../../docs/vision/ideas/remove-character-xp-and-levels.md).
- **`event_tier`:** от `period_index`, не от уровня персонажа.
- **`EventDefinition.mode`:** канон `game` \| `any`. Значение `plan` в YAML — долг GO-04, не второй продукт.
- **Два события на период** (`EVENTS_PER_PERIOD`); контент — `data/events/mvp11/*.yaml` → seeds (ADR-008).

## Экономика (MVP)

- **Зарплата:** только по кнопке в периоде; пропустил — за период не повторяется.
- **Обязательства:** платёж в конце периода; не хватило cash → `overdue_amount`.
- **Подушка, активы, инвестиции, страховки** — см. `backend/app/game/period.py`.

## Победа (prod: Victory v2)

- Движок: `backend/app/victory/engine.py`; UI/API: `GET /api/finance/overview` → `overview.victory`.
- **`victory_config_json`** шаблона: `progression_mode` **chain** (все шаги + gate) | **parallel** (M из N).
- **`mechanics_unlock`** в blueprint — после ключей целей (ADR-004).

## Needs (оси)

- **`needs_delta`** в choices; mapping темы → оси: **§11** в `create-event/event-balance-rules.md`.
- Оси: comfort, social, health, … — см. handbook `EVENTS_TERMS_RU.md`.

## Персоны (authoring)

- Студент ~**62.5k** / профессионал ~**100k** зарплата — `create-event/persona-profiles.md`.

## Границы скиллов

| Задача | Primary |
|--------|---------|
| YAML карточки, brief | create-event |
| period.py, victory, seeds шаблонов | game-economy-and-victory |
| REST + `api.js` | api-and-interface-design |
| MQX prod UI | frontend-ui-engineering |
| Перед выкаткой (PWA/web) | **release-web** |

## Каналы доставки (ADR-012)

| Приоритет | Канал | Agent focus |
|-----------|-------|-------------|
| **Primary** | PWA, web (browser) | Smoke W1–W5 в **`release-web`**; `browser-testing-with-devtools` при UI |
| **Secondary** | Telegram Mini App | **`telegram-mini-app-runtime`** только при правках TMA shell |

Канон: [`SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md) §1.1 · [`ADR-012`](../../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)
