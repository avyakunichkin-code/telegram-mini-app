# ТВОЙ ХОД — роутер агента

**Вердикт (почему):** [`CONVENTIONS.md`](CONVENTIONS.md) — C-X/C-Y, C-1…C-4. **При конфликте источников ([C-1](CONVENTIONS.md)):** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

Один **primary**-скилл на задачу; satellites — по зоне задачи. Уровни (`tier`), карта проекта, path-scoped rules и субагенты — скилл **`project-skills-layout`** (раздел «Расширенная карта роутера») и [`catalog.yaml`](.claude/skills/catalog.yaml).

## Фаза → primary skill

| Ситуация | Primary | Куда писать |
|----------|---------|-------------|
| Сырая гипотеза | **idea-refine** | `docs/vision/ideas/` |
| Контракт / фича до кода | **spec-driven-development** | `docs/specs/features/` |
| Spec → задачи | **planning-and-task-breakdown** | `docs/plans/`, `docs/tasks/` |
| Код срезами | **incremental-implementation** | `backend/`, `frontend-react/` |
| Экономика периода, победа | **game-economy-and-victory** | `backend/app/game/`, `victory/`, seeds |
| **Создать / доработать событие** | **create-event** (`/create-event`) | `data/events/mvp11`, brief, persona |
| **Анализ каталога событий** (read-only) | **event-analysis** (`/event-analysis`) | отчёт; satellite → create-event |
| **Прогон баланса 30–40 периодов** | **balance-playtest** (`/balance-playtest`) | `docs/balance/reports/`; baseline diff |
| API / контракты | **api-and-interface-design** | routers, `api.js` |
| UI prod (MQX) | **frontend-ui-engineering** | `mqx/`, `*Premium.jsx` |
| Макет в lab | **design-lab-mqx** | `design-lab/<theme>/` |
| Регрессии / баги в логике | **test-driven-development** | `backend/tests/` |
| **Критичные сценарии / test gate** | **critical-test-scenarios** (`/critical-test-scenarios`) | `backend/tests/`, FE `__tests__/` |
| Перед merge | **code-review-and-quality** | read-only |
| **SQL baseline / `00NN_*.sql` / seeds / `db.sh`** | **db-baselines-and-migrations** | `test-driven-development`; game-economy при `victory_goals` |
| **Онбординг / guidance** (биты, триггеры, gates, nudges, strip) | **guidance-onboarding** | `backend/app/guidance/`, `frontend-react/src/guidance/` |
| **Админка / ops** (справочники, Watchtower, воронки, алерты, CSV) | **admin-ops** | `backend/app/admin/`, `routers/admin.py`, `components/admin/` |

**`tier: deferred`** — только по явному запросу (`release-web`, `telegram-mini-app-runtime`, `deprecation-and-migration`, `social-changelog-posts`). Встроенные: `/simplify`, `/security-review`, `/code-review`.

## Primary + satellites (обязательные пары)

Один **primary**; satellite открывай, когда задача затрагивает его зону:

| Primary | Satellites |
|---------|------------|
| incremental-implementation | test-driven-development, critical-test-scenarios |
| game-economy-and-victory | test-driven-development, critical-test-scenarios, doubt-driven-development, balance-playtest (крупный баланс) |
| create-event (крупный YAML) | test-driven-development, **event-analysis** (§10/§11 audit), critical-test-scenarios (опционально) |
| api-and-interface-design | test-driven-development, critical-test-scenarios (если меняется поведение) |
| frontend-ui-engineering | design-lab-mqx (новый/смена UI), critical-test-scenarios (контракт UI); интерактив — `/run` + встроенный браузер Claude Code |
| design-lab-mqx | — (canon: rule `.claude/rules/canon-sync.md` + skill) |

**Субагенты** (второй проход после крупного diff, не primary): `economy-reviewer` — `game/`, `victory/`, seeds, баланс; `economy-balance-runner` — симуляция 30–40 периодов; `mqx-ui-reviewer` — MQX и lab→prod. Не запускать на hotfix 1–2 файла и docs-only.

При смене API: `frontend-react/src/api/` + хуки/экраны.
