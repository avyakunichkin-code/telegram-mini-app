---
layer: idea
status: implemented-archive
owner: product
last_reviewed: 2026-05-30
implemented: 2026-05-24
note: Историческая запись ADR-003. Не дизайн-док для новых фич; xp_delta в каталоге запрещён.
supersedes_in_spirit:
  - ../../specs/gameplay/LEVEL_XP_SYSTEM.md
  - ../../plans/PLAN_level-xp-progression.md
related_specs:
  - ../../specs/features/SPEC_victory-v2.md
  - ../../specs/features/SPEC_mvp-11-progression-events.md
  - ../../foundation/SPEC_PRODUCT.md
adr: ../../decisions/ADR-003-remove-character-progression.md
---

# Убрать уровень персонажа, XP и «геймификационный» рейтинг

## Решения продукта (2026-05-24)

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | Что убираем | **Оба слоя:** `GameProfile.level` / `xp` / `character_*` в API **и** `score` / `gamification_level` / `xp_to_next_level` в overview |
| 2 | Гейты механик | **Всё доступно с периода 1** (нет 403 по level). Ограничения позже — **в шаблонах старта** (blueprint / flags), не через XP |
| 3 | `event_tier` | **Оставляем** на событиях. Привязка к **`period_index`**: **10 периодов на tier** → `L = (period_index - 1) // 10 + 1`; окно core `[max(1, L - 2), L]`, fallback P1 `[1, L]` |
| 4 | Достижения | **Остаются**; начисление XP за tier достижений **убираем** |
| 5 | Победа | Цель типа **`character_level`** — **удалить** из victory_config шаблонов и движка (или deprecated no-op) |
| 6 | События периода | С **1-го периода** для всех; intro `mq11_events_unlock_intro` без привязки к level 2 |
| 7 | БД | Колонки `game_profiles.level`, `game_profiles.xp` — **удалить** (мало игроков) |
| 8 | Plan | **Не трогаем** в этом цикле; уровней там тоже не будет, когда дойдём до Plan UI |

### Стартовый шаблон — `blueprint.mechanics` (реализовано 2026-05-24)

Ключи в `game_starter_templates.blueprint_json`:

| Ключ | Раздел на вкладке «Капитал» |
|------|----------------------------------|
| `capital_invest` | Инвестиции (депозит, облигации) |
| `capital_insurance` | Страховки |
| `capital_property` | Имущество (каталог активов) |
| `capital_liabilities` | Обязательства |

**Всегда включены** (не в flags): доходы и расходы за период; на дашборде — период, зарплата, подушка.

**`mq_game_basic_v1`:** только `capital_invest: true`, остальные capital-флаги `false`. Код: `backend/app/starters/mechanics.py`, поле `overview.mechanics`, API 403 `mechanic_disabled`.

---

## Технический план (этапы)

### Этап A — Backend: поведение без прогрессии

1. **События:** убрать проверки `character_level >= UNLOCK_PERIOD_EVENTS`; `ensure_period_events` с `period_index >= 1`.
2. **Гейты API:** убрать `require_character_level` из `invest`, `insurance`, `finance` (deposit/bond/asset/liability).
3. **XP:** удалить вызовы `apply_character_xp` (события, period_actions, game_period, achievements).
4. **`xp_delta`:** игнорировать в `choose event` (не начислять); опционально убрать из ответа pending/choices UI.
5. **`event_tier`:** в `ensure_period_events` передавать **`period_index`** вместо `character_level` в `event_tier_in_core_window` / fallback (переименовать параметр в коде → `progression_index` или явный alias).
6. **Victory:** убрать goal `character_level` из `victory/seeds.py` + SQL-миграция для существующих `victory_config_json`; удалить ветку в `victory/engine.py`.
7. **Overview:** не считать `_compute_gamification`; убрать поля `gamification_level`, `score`, `xp_to_next_level`, `character_*`, `character_unlocks` из `FinanceOverview` (или одним PR с фронтом).
8. **Миграция:** `ALTER TABLE game_profiles DROP COLUMN level, DROP COLUMN xp` (+ убрать `progression_milestones_awarded` если только под XP — проверить).
9. **Модули:** удалить или свести к no-op: `character_progression.py`, `level_gates.py` (если не нужны для template flags позже — переименовать позже в `feature_gates`).

### Этап B — Frontend

1. Убрать / упростить `MqxLevelDash` (нет XP/level/score chip).
2. `DashboardPremium`, `GameScreen` — нет `eventsUnlocked` по level; события с 1-го периода.
3. Удалить `levelProgressHint`, тосты `+XP` / `level_up` (`progressionToasts`, сообщения в period close / salary / safety).
4. `AnalyticsPremium` — блок «уровень / очки» заменить или убрать.
5. `EventChoiceButton` — не показывать `xp_delta`.
6. `victoryGoalDisplay` — убрать ветку `character_level`.
7. Синхронизировать `api.js` / типы ответов.

### Этап C — Контент и тесты

1. Сиды событий: `xp_delta` можно оставить в JSON (игнор) или вычистить отдельным коммитом.
2. Переписать / удалить: `test_progression_xp.py`, `test_level_gates.py`, части `test_progression_feedback`, `test_mq116` (assert level).
3. Обновить `LEVEL_XP_SYSTEM.md` → status **superseded**, ссылка на этот idea.
4. `SPEC_PRODUCT.md` §7 — убрать пункт про XP/level up.

### Этап D — Отложено

- Template flags: «только deposit+bond» для `mq_game_basic_v1`.
- Таблица `event_tier` ↔ `period_index` / difficulty шаблона.
- Plan mode UI/API.

---

## Риски и смягчение

| Риск | Митигация |
|------|-----------|
| Ранние периоды получат tier-5+ события | Временно окно по `period_index` (как было L=2…); позже mapping |
| Breaking API для фронта | Этапы A+B в одной ветке или feature flag на overview |
| Достижения без «награды» | Toast только title достижения, без XP |

---

## Критерии готовности

- [x] Новая игра: события с периода 1, депозит/облигация/страховка/каталог без 403 level.
- [x] Нигде в prod UI нет XP, level персонажа, score, gamification_level (каталог `#/dev/mqx` — демо-примитивы, не prod).
- [x] Выбор события / подушка / зарплата не меняют level/xp в БД (колонки сняты миграцией `0031`).
- [x] Victory без цели «уровень N».
- [x] `pytest` зелёный; `npm run build` зелёный.
- [x] `GET /api/game/profiles` без полей `level`/`xp` в `GameProfileResponse` (фикс сериализации списка сохранений).

### Документация (этот PR)

- [x] `LEVEL_XP_SYSTEM.md`, матрица XP, `PLAN_level-xp-progression` → **superseded**
- [x] `docs/README.md`, `SPEC_PRODUCT.md` §7.2
- [x] `GAME.md` §0 — сводка статуса (без character XP)
- [x] `PRODUCT_BACKLOG` — M11 / MQ-111–116 и level-gates отмечены выполненными; character XP снят
