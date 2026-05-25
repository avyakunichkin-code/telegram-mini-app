---
status: accepted
date: 2026-05-24
deciders: проект (architecture-review retroactive, 2026-05-25)
---

# ADR-003: Снятие character level, XP и геймификационного score

## Context

MVP 1.1 вводил **уровень персонажа**, **XP** (период, события, достижения), **гейты API по level** и цель победы **`character_level`**. Параллельно целевая модель эволюции перешла на:

- сложность из **шаблона** (`save_kind`, blueprint);
- сложность событий из **`event_tier`** ∝ **`period_index`**;
- мотивацию через **достижения** и **цели победы v2**, без «уровня персонажа».

Два слоя прогрессии перегружали UX и расходились с [`remove-character-xp-and-levels.md`](../vision/ideas/remove-character-xp-and-levels.md).

## Decision

1. **Удалить** `GameProfile.level`, `GameProfile.xp` и начисление XP в `game_period`, событиях, достижениях.
2. **Убрать** из `GET /api/finance/overview` поля `character_*`, `gamification_level`, `score`, `xp_to_next_level`.
3. **Снять** API-gates `require_character_level` (инвестиции, страховки, активы) — доступ через **`blueprint.mechanics`** (`starter_mechanics.py`, 403 `mechanic_disabled`).
4. **`event_tier`:** L = `(period_index - 1) // 10 + 1`; окно событий **[max(1, L−2), L]** (M11).
5. **Victory:** удалить тип цели **`character_level`** из `victory_engine` и JSON шаблонов (миграция **`0031_remove_character_progression.sql`**).
6. **`xp_delta`** в `event_choices` — **игнорировать** (данные в БД можно оставить).

## Consequences

- Проще онбординг и меньше «ложных» метрик на дашборде.
- Достижения остаются без XP-награды за tier.
- Документы evolution §II (старые Q&A про XP) помечены superseded.
- Тесты `test_progression_xp`, `test_level_gates` удалены/переписаны; MQ-116 без assert level.

## Alternatives considered

1. **Оставить level только для событий** — отклонено: дублирует `event_tier` от периода.
2. **Скрыть XP в UI, оставить в API** — отклонено: лишний контракт и баги синхронизации.
3. **Перенести level в шаблон как meta** — отклонено: заменено `mechanics` flags.

## Связанные артефакты

- Idea (канон): [`remove-character-xp-and-levels.md`](../vision/ideas/remove-character-xp-and-levels.md)
- Supersedes: [`LEVEL_XP_SYSTEM.md`](../specs/gameplay/LEVEL_XP_SYSTEM.md) (архив)
- Spec: [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md)
- Migration: `backend/migrations/0031_remove_character_progression.sql`
