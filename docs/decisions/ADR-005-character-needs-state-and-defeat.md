---
status: accepted
date: 2026-05-26
deciders: продукт (сессия character needs)
---

# ADR-005: Состояние потребностей, медленный decay и поражение при нуле

## Context

Нужен слой **потребностей** (4 шкалы на профиле) как мотивация к событиям и удержание, без возврата character XP ([ADR-003](ADR-003-remove-character-progression.md)). Победа остаётся в Victory v2 ([ADR-002](ADR-002-victory-engine-and-template-config.md)).

Продуктовые уточнения (2026-05-26):

- Сгорание шкал **медленное** (~10–15 периодов до нуля без пополнения).
- **Поражение у всех персонажей**, не только у «жёсткого» archetype.
- Условие поражения: **любая шкала = 0** три **периода подряд** (в игре период = «месяц»; в UI — «3 месяца подряд»).
- Различие персонажей — в **помощи и силе последствий** при низких шкалах (<30%), не в отсутствии game over.

## Decision

1. **Хранение:** четыре колонки `need_*` на `game_profiles` + `needs_zero_periods_streak` + `treat_self_last_period_index`.
2. **Конфиг** в `game_starter_templates.blueprint_json.needs`: `initial`, `periods_to_empty_target` (дефолт **12**), опциональный override `decay_per_period`, пороги, `consequence_profile`, блок помощи.
3. **Decay** в `process_period_end` (до `period_index += 1`):
   ```text
   decay[key] = decay_per_period[key]
     ?? round(initial[key] / periods_to_empty_target, 1)
   need[key] = clamp(need[key] - decay[key], 0, 100)
   ```
4. **Поражение (все save_kind=game с needs.enabled):**
   ```text
   has_zero = any(need[key] == 0 for key in axes)
   if has_zero: needs_zero_periods_streak += 1
   else: needs_zero_periods_streak = 0
   if needs_zero_periods_streak >= 3:
     game over, defeat_reason = "needs_depletion"
   ```
5. **Зона «истощение» (distressed):** любая шкала **< 30** после decay → последствия по `consequence_profile` (штрафы/давление), **без** отдельного счётчика поражения.
6. **Персонаж «мягкий» (Студент):** `consequence_profile: soft` — слабые штрафы, проактивные подсказки, больше спасательных событий с `needs_delta` (контент).
7. **Персонаж «жёсткий» (Предприниматель):** `consequence_profile: hard` — сильные последствия при <30%; проактивные подсказки в событиях минимальны; **справочник помощи по запросу** доступен всем (см. ADR-006 / spec §Help).

## Alternatives considered

1. **Поражение только у hard + streak по min < 25** — отклонено: пользователь хочет единое правило нуля; сложность через поддержку.
2. **Decay 10+ пунктов/период** — отклонено: слишком быстро для цели «10–15 периодов до нуля».
3. **Отдельная таблица `profile_needs`** — отклонено на MVP: достаточно колонок на профиле.

## Consequences

- Нужны миграция SQL, `needs_engine.py`, хук в `game_period.py`, расширение overview.
- Баланс чисел (`periods_to_empty_target`, штрафы) — **playtest**; формулы зафиксированы в [SPEC_game-character-needs](../specs/features/SPEC_game-character-needs.md).
- Поражение по cash (`negative_periods_count`) остаётся **независимым** каналом.

## GDD / requirements addressed

- TR-needs-001, 002, 005, 006, 007, 010, 011, 012 (см. [architecture.md](../architecture/architecture.md))

## Связанные артефакты

- Spec: [`SPEC_game-character-needs.md`](../specs/features/SPEC_game-character-needs.md)
- Vision: [`game-character-needs-foundation.md`](../vision/ideas/game-character-needs-foundation.md)
