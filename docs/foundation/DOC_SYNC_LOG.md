# Журнал синхронизации документации ↔ prod

Краткий лог, когда **код обогнал docs** или наоборот. Полный чеклист — [`MVP_AUDIT_VS_SPEC.md`](MVP_AUDIT_VS_SPEC.md).

| Дата | Что в prod | Что исправили в docs |
|------|------------|----------------------|
| 2026-05-24 | Сняты `level`/`xp`, victory без `character_level` | ADR-003, баннеры в evolution, LEVEL_XP superseded |
| 2026-05-24 | Victory v2 в `finance_overview_build` | ADR-002, GLOSSARY, TRACEABILITY |
| 2026-05-25 | `progression_mode: chain` + tutorial goals на всех шаблонах | ADR-002 §формула, SPEC_victory-v2, SPEC_PRODUCT §7.1, CLAUDE.md |
| 2026-05-25 | `mechanics_unlock` после `tutorial_cushion` / `tutorial_invest` (0037) | **ADR-004**, starter-template-mechanics-permissions, migrations README |
| 2026-05-25 | Второй проход | `dashboard.md`, `GAME.md` §1.8, GDD outline, `SPEC_mvp-11` banner, evolution §период, redirect `money-quest-evolution` → `tvoy-hod-evolution` |
| 2026-05-26 | Уборка docs | Удалены редиректы `docs/*` и `docs/ideas/`; архив stubs level/XP; удалены `balance-xp-evening-session`, `money-quest-evolution` stub |

## Источник правды по темам

| Тема | Документ | Код |
|------|----------|-----|
| Победа | [ADR-002](../decisions/ADR-002-victory-engine-and-template-config.md), [SPEC_victory-v2](../specs/features/SPEC_victory-v2.md) | `victory_engine.py`, `victory_seeds.py` |
| Механики UI/API | [ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md) | `starter_mechanics.py` |
| Режим сохранения | [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md) | `GameProfile.save_kind` |
| Прогрессия событий | [remove-character-xp](../vision/ideas/remove-character-xp-and-levels.md) | `game_rules.event_tier_*` |
| Legacy MVP AND-победа | — (только тесты) | `game_rules.evaluate_mvp_victory` |
