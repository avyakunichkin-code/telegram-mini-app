---
layer: spec
status: active
skill: project-handbook-documentation
last_reviewed: 2026-05-30
tags:
  - tvoy-hod/layer/spec
  - tvoy-hod/status/active
aliases:
  - "Build spec: Project Handbook Documentation"
  - project-handbook-documentation
---
# Build spec: Project Handbook Documentation

Скилл: `.cursor/skills/project-handbook-documentation/SKILL.md` (историческая цель: `../../../../.cursor/skills/project-handbook-documentation/SKILL.md`)  
Путеводитель: [`docs/game/handbook/README.md`](../../handbook/README.md)

## Назначение

Поддерживать **человекочитаемый пакет** `docs/game/handbook/` отдельно от feature specs и ADR.

## Acceptance (скилл применён корректно)

| ID | Критерий |
|----|----------|
| HB-1 | Три аудитории описаны в `handbook/README.md`; плейтест стартует с `PLAYER_EXPERIENCE.md` |
| HB-2 | `GAME.md` соответствует `GAME_FORMAT.md` (именованные разделы) |
| HB-3 | Формулы только в `handbook/internal/`; партнёры видят `ECONOMY_OVERVIEW` |
| HB-4 | ЦА 30+, pillars (2), MVP 2.0 Plan, monetization TBD — в `PRODUCT_BRIEF.md` |
| HB-5 | После смыслового изменения prod ↔ narrative — запись в `DOC_SYNC_LOG.md` |

## Не входит

- Написание `SPEC_*.md` с acceptance criteria  
- ADR в `docs/decisions/`  
- Миграция всех файлов `docs/` в handbook  

## Связанные артефакты (Волна 1)

| Файл | Роль |
|------|------|
| `PRODUCT_BRIEF.md` | Product brief |
| `PLAYER_EXPERIENCE.md` | Playtest 5 min |
| `FEATURE_STATUS.md` | Ship matrix |
| `ECONOMY_OVERVIEW.md` / `internal/ECONOMY_TUNING.md` | Public vs team formulas |
| `MONETIZATION.md` | TBD boundary |
| `foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md` | Ops protocol |
