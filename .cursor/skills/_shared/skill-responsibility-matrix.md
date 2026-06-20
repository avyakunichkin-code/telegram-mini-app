# Матрица ответственности скиллов (ТВОЙ ХОД)

**Primary** — один на задачу. **Satellite** — открыть в той же задаче по таблице в router.  
**Не вызывать primary** без задачи в колонке «Когда primary».

| Скилл | `tier` | Когда primary | When NOT primary (→ вместо) |
|-------|--------|---------------|------------------------------|
| **using-agent-skills** | core | Неясно, какой скилл | Конкретная задача — сразу доменный скилл |
| **idea-refine** | core | Сырая гипотеза, diverge | Spec готов → `spec-driven-development`; код → `incremental-implementation` |
| **spec-driven-development** | core | Контракт до кода, новая фича | Правка одной строки; YAML события → `create-event` |
| **planning-and-task-breakdown** | support | Epic, MQ-* из spec | Один файл / очевидный scope |
| **incremental-implementation** | core | Срез кода по plan/spec | Новый контракт без spec; YAML → `create-event`; period → `game-economy` |
| **create-event** | core | Brief, YAML, choices, persona | Read-only обзор → `event-analysis`; period/victory → `game-economy` |
| **event-analysis** | core | Gaps, §10/§11 audit, EVT scope | Писать YAML → `create-event` |
| **game-economy-and-victory** | core | `period.py`, victory, seeds шаблонов, balance engine | Текст карточки → `create-event`; чистый UI → `frontend-ui-engineering` |
| **balance-playtest** | support | 30–40p sim, diff baseline | Мелкая правка без смены метрик |
| **api-and-interface-design** | core | Новый/изменённый REST, schemas, `api.js` | Только YAML; только CSS |
| **design-lab-mqx** | core | Новый/смена макета в `design-lab/` | Prod правка без lab → `frontend-ui-engineering` (hotfix) |
| **frontend-ui-engineering** | core | MQX prod, `*Premium.jsx`, UX spec | Lab макет → `design-lab-mqx`; экономика → `game-economy` |
| **test-driven-development** | core | Баг, RED-GREEN одного теста | Обзор каталога → `event-analysis` |
| **critical-test-scenarios** | core | Gate CS-* , контрактные тесты | Docs-only, rename без поведения |
| **code-review-and-quality** | support | Pre-merge, крупный PR | Авторинг контента |
| **db-baselines-and-migrations** | support | SQL `00NN_*`, baseline, seeds DDL | Контент событий YAML |
| **documentation-and-adrs** | support | Граница доменов, ADR | Narrative handbook → `project-handbook-documentation` |
| **project-handbook-documentation** | support | GDD/handbook для людей | Контракт spec → `spec-driven-development` |
| **doubt-driven-development** | deferred | Satellite: крупная economy/victory | Каждая мелкая правка |
| **release-web** | deferred | Явно: перед выкаткой PWA/web | Обычная фича |
| ~~release-tma~~ | archived | Alias → **release-web** | — |
| **telegram-mini-app-runtime** | deferred | WebApp SDK, initData, viewport | MQX layout → `frontend-ui-engineering` |
| **browser-testing-with-devtools** | deferred | Интерактив PWA/web/DOM | Backend pytest |
| **performance-optimization** | deferred | Измеренная проблема LCP/CLS | Новый экран → design+FE skills |
| **security-and-hardening** | deferred | Auth, input, явный аудит | — |
| **context-engineering** | deferred | Настройка rules/skills | Product slice |
| **social-changelog-posts** | deferred | Пост в `docs/marketing/` | Код |
| **skill-test** | meta | Lint/audit skills | Product work |

## Subagents (не skills)

| Agent | Когда | Не заменяет | trigger_globs |
|-------|-------|-------------|---------------|
| **economy-reviewer** | Крупный diff game/victory/events | pytest, authoring | `catalog.yaml` → `agents:` |
| **economy-balance-runner** | Sim 30–40p + baseline diff | Unit tests | idem |
| **mqx-ui-reviewer** | Крупный MQX/lab diff | DESIGN_WORKFLOW, hotfix | idem |

Parent agent решает запуск; не параллельно с другим primary. Подробнее: [`AI_ONBOARDING.md`](../../docs/agents/AI_ONBOARDING.md) §5 · router § Subagents.

## Конфликты

При споре «кто владелец поля» → **`documentation-and-adrs`**, не два primary параллельно.
