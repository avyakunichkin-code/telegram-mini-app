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
| 2026-05-26 | M11 MQ-116 приёмка doc (Task 0.1) | `GAME.md` §0.2, `MVP_AUDIT_VS_SPEC` §M11, `TRACEABILITY` M11/E1/T1; бэклог Doc P0 [x] |
| 2026-05-26 | PW1-004 Task 0.2 (частично) | Checklist TB1; `test:utils` + `useGameForeground.test.js`; TMA прогоны 1–2 ⬜ |
| 2026-05-26 | TB1 в prod | `game_time.sync_time`, hero H2 «Закрыть месяц»; `dashboard.md`, SPEC §3.1/§52, GLOSSARY, TMA flows, TRACEABILITY T1, backlog, idea/plan status |
| 2026-05-26 | Дочистка TB1 в docs | `SPEC_onboarding-tma`, `GAME.md` §12, `CLAUDE.md`, PW1 plan, Pre-Alpha опрос, evolution §снимок, balance-thresholds, hero-compact → superseded |
| 2026-05-26 | GAME.md §5–6 | Сжаты level/XP; канон → remove-character-xp + ADR-003/004; пошаговый период в §0–1 |
| 2026-05-26 | Character needs (pre-code) | UX пакет: `docs/ux/CHARACTER_NEEDS_UX.md` + 6 screen specs; `design-lab/character-needs/`; ADR-005/006 + SPEC; architecture TR-needs-004 |
| 2026-05-28 | Доменные пакеты `app/{game,finance,victory,events,…}/` + `services/` | **ADR-007**, `backend/app/README.md`, CLAUDE.md, 40+ docs (пути к модулям) |
| 2026-05-29 | **ADR-009:** 2 события/период, словарь метрик TB1, Q1–Q3 продукт | `SPEC_PRODUCT` §3.3, `MVP_AUDIT`, `CLAUDE.md`, `game-balance-thresholds`; симуляция `backend/scripts/simulate_student_12p.py` |
| 2026-05-29 | Balance playtest: `balance_simulate.py`, diff, baseline, skill + subagent | `docs/balance/`, `/balance-playtest`, `economy-balance-runner`, ADR-009 consequences |
| 2026-05-29 | Playtest suite: manifest, `safety_first` baseline, THRESHOLDS, hook, pytest | `balance_playtest.py`, `test_balance_simulate.py`, hooks `game/victory/seeds/events` |

## Источник правды по темам

| Тема | Документ | Код |
|------|----------|-----|
| Победа | [ADR-002](../decisions/ADR-002-victory-engine-and-template-config.md), [SPEC_victory-v2](../specs/features/SPEC_victory-v2.md) | `victory/engine.py`, `victory/seeds.py` |
| Механики UI/API | [ADR-004](../decisions/ADR-004-mechanics-unlock-victory-chain.md) | `starters/mechanics.py` |
| Режим сохранения | [ADR-001](../decisions/ADR-001-save-kind-remove-light-hardcore.md) | `GameProfile.save_kind` |
| Прогрессия событий (M11) | [SPEC_mvp-11](../specs/features/SPEC_mvp-11-progression-events.md), [remove-character-xp](../vision/ideas/remove-character-xp-and-levels.md) | `game_rules.event_tier_*`, `cooldown_periods` (`0007`), `test_mq116_acceptance.py` |
| Период (TB1) | [SPEC_PRODUCT](SPEC_PRODUCT.md) §3.1, [dashboard UX](../ux/screens/dashboard.md) | `game/time.py`, `MqxDashboardHero.jsx` |
| Метрики TB1, 2 события/период | [ADR-009](../decisions/ADR-009-metrics-dictionary-tb1.md) | `game/rules.EVENTS_PER_PERIOD`, `overview_build`, `victory/snap` |
| Legacy MVP AND-победа | — (только тесты) | `game/rules.evaluate_mvp_victory` |
| Структура backend | [ADR-007](../decisions/ADR-007-backend-domain-packages.md) | `app/README.md`, `app/services/README.md` |
