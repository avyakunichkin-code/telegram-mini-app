---
status: accepted
date: 2026-05-28
deciders: проект (рефакторинг структуры после выноса services/)
---

# ADR-007: Доменные пакеты в `backend/app/` (модульный монолит)

## Context

После «генеральной уборки» бизнес-логика API живёт в `app/services/<domain>/`, но **~40 модулей** оставались плоским слоем в `app/*.py` (`game/period.py`, `victory/engine.py`, `finance/overview_build.py`, …). Это затрудняло онбординг агентов и людей и не совпадало с продуктовыми границами (game, finance, victory, events, …).

Рекомендации из соседнего архитектурного обзора (модульный монолит):

- явные границы доменов;
- контракты API и дисциплина изменений;
- фоновые задачи и observability — позже, без смены структуры папок;
- при декомпозиции **сначала периферия** (уведомления, телеметрия, каталоги), не ядро экономики периода.

Связано: [idea project-structure-standardization](../vision/ideas/project-structure-standardization.md) (направление A — границы + touch-it move-it).

## Decision

1. **Платформа** остаётся в корне `app/`: `models`, `schemas`, `auth`, `database`, `config`, `constants`, `idempotency`, `timeutil`, `cors_settings`.
2. **HTTP** — `app/routers/` (без переноса файлов роутеров).
3. **Use-cases под API** — `app/services/<domain>/` (см. [services/README](../../backend/app/services/README.md)).
4. **Доменная логика** — пакеты зеркалом продуктовых областей:

| Пакет | Назначение |
|-------|------------|
| `game/` | период, время, bootstrap, rules, start_validation |
| `finance/` | overview_build, expenses, balance_utils, helpers, period_metrics |
| `victory/` | engine, seeds, snap, goals, mechanics_progression, profile |
| `events/` | chains, taxonomy, mvp11, constants, insurance_hooks |
| `needs/` | engine, guide_content |
| `achievements/` | engine, seeds |
| `starters/` | mechanics, template_presentation, insurance_catalog |
| `admin/` | auth, catalogs, notify, onboarding_funnel |
| `seeds/` | bootstrap-данные для `main.py` |

5. **Ядро экономики конца периода** — `game/period.py` (`process_period_end`); **не** выносить в отдельный микросервис на этом этапе.
6. **Сборка overview / победа** — `finance/overview_build.py` + `victory/engine.py`; роутер вызывает `services/finance/overview.py`.
7. Карта слоёв для агентов: [`backend/app/README.md`](../../backend/app/README.md).

### Таблица переезда (legacy → prod)

| Было | Стало |
|------|--------|
| `game_period.py` | `game/period.py` |
| `game_time.py` | `game/time.py` |
| `game_rules.py` | `game/rules.py` |
| `finance_overview_build.py` | `finance/overview_build.py` |
| `finance_analytics.py` | `finance/period_metrics.py` |
| `expenses.py` | `finance/expenses.py` |
| `victory_engine.py` | `victory/engine.py` |
| `victory_seeds.py` | `victory/seeds.py` |
| `needs_engine.py` | `needs/engine.py` |
| `starter_mechanics.py` | `starters/mechanics.py` |
| `mvp11_event_seeds.py` | `events/mvp11_seeds.py` |
| `admin_notify.py` | `admin/notify.py` |
| … | полный список в `backend/scripts/reorganize_app.py` |

Импорты в коде: `from app.game.period import process_period_end`, не `from app.game_period`.

## Consequences

- **Плюсы:** предсказуемое размещение; зеркало `routers/` + `services/`; проще искать логику по домену.
- **Минусы:** одноразовый churn импортов и docs; агенты с устаревшим контекстом могут ссылаться на старые пути — см. [DOC_SYNC_LOG](../foundation/DOC_SYNC_LOG.md) 2026-05-28.
- **Не делаем сейчас:** отдельный пакет `victory/` на уровне `services/` (движок остаётся в `app/victory/`); очередь/workers; correlation id — backlog инфраструктуры.
- **Тесты:** 194 pytest после переезда; при добавлении модулей — импорт из доменного пакета, не из роутера.

## Alternatives considered

1. **Плоский `app/` + только `services/`** — отклонено: «простыня» доменных модулей остаётся.
2. **`app/domains/game/`** — отклонено: лишний уровень; достаточно `app/game/`.
3. **Сразу вырезать `game/period` в worker** — отклонено: ядро TB1 должно оставаться синхронным в request до явной причины.

## Связанные артефакты

- Карта: [`backend/app/README.md`](../../backend/app/README.md), [`backend/app/services/README.md`](../../backend/app/services/README.md)
- Скрипты (одноразово): `backend/scripts/reorganize_services.py`, `backend/scripts/reorganize_app.py`
- ADR с обновлёнными путями в §Code: [ADR-002](ADR-002-victory-engine-and-template-config.md), [ADR-004](ADR-004-mechanics-unlock-victory-chain.md), [ADR-005](ADR-005-character-needs-state-and-defeat.md)
- Онбординг: [`CLAUDE.md`](../../CLAUDE.md) §backend
