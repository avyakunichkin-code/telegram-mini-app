# ТВОЙ ХОД — роутер агента

**Вердикт (почему):** [`CONVENTIONS.md`](CONVENTIONS.md) — C-X/C-Y, C-1…C-4. Точечные «как» — скиллы и rules ниже, не свод.

## Карта проекта

- **Код и API**: [`CLAUDE.md`](CLAUDE.md)
- **Лексикон игры**: [`.claude/skills/_shared/game-lexicon.md`](.claude/skills/_shared/game-lexicon.md)
- **Продукт**: [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) — §1.1 **каналы: PWA/web primary**, TMA secondary ([ADR-012](docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md))
- **Конвейер docs**: [`docs/agents/SKILL_DOC_MAP.md`](docs/agents/SKILL_DOC_MAP.md), [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md)
- **Аудиты (снимки)**: [`docs/audits/README.md`](docs/audits/README.md) — `product/` · `engineering/` · шаблон [`docs/templates/AUDIT.md`](docs/templates/AUDIT.md)
- **Скиллы**: [`docs/agents/AGENT_SKILLS.md`](docs/agents/AGENT_SKILLS.md), [`docs/agents/AI_ONBOARDING.md`](docs/agents/AI_ONBOARDING.md), [`docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md`](docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md), [`.claude/skills/catalog.yaml`](.claude/skills/catalog.yaml) (`tier`)
- **Баланс / пороги**: [`game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md)
- **Баланс событий (authoring)**: [`.claude/skills/create-event/event-balance-rules.md`](.claude/skills/create-event/event-balance-rules.md) — §10 lifecycle, §11 needs_axis_map
- **MQX**: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) — читать **целиком** перед новым UI (исключение: hotfix без смены дизайна)

**При конфликте источников ([C-1](CONVENTIONS.md)):** код + тесты → `docs/specs/features/SPEC_*.md` → `SPEC_PRODUCT.md` → `docs/vision/ideas/`.

Studio/GDD: [`.claude/skills/_archived/`](.claude/skills/_archived/) — Claude их не обнаруживает как скиллы; по явному запросу прочитай нужный `SKILL.md` вручную.

## Фаза: контент и данные (приоритет сейчас)

`catalog.yaml` → **`tier: core`** — primary по умолчанию. **`tier: support`** — plan / review / ADR. **`tier: deferred`** — только по запросу (perf, release, TMA runtime, …). Полная карта: [`SKILLS_PHASE_CONTENT_AND_DATA.md`](docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md).

| Ось | Core | Не путать с |
|-----|------|-------------|
| Концепт + контракт | idea-refine, spec-driven-development | studio `_archived/` |
| Данные (события) | create-event, event-analysis | game-economy (движок периода) |
| Механики | game-economy-and-victory | create-event (YAML карточек) |
| FE↔BE | api-and-interface-design | incremental без spec |
| Поверхность | design-lab-mqx → frontend-ui-engineering | lab без canon-sync в prod; **primary QA: PWA/web** |
| Границы доменов | documentation-and-adrs (support) | код без ADR при споре «кто владелец» |
| **Схема БД / миграции / seeds** | **db-baselines-and-migrations** (support) | create-event (контент в YAML, не SQL) |

**Satellites — когда задача их затрагивает:** create-event → тесты на YAML-каталог; game-economy → тесты + doubt-driven-development для необратимых или рискованных правок формул и победы; крупный diff → economy-reviewer / mqx-ui-reviewer.

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
| Неясно какой скилл | **using-agent-skills** | — |

**`tier: deferred`** (явный вызов): `browser-testing-with-devtools`, `security-and-hardening`, `performance-optimization`, `deprecation-and-migration`, **`release-web`**, `telegram-mini-app-runtime`, `social-changelog-posts`, `code-simplification`, `context-engineering`. Legacy **`release-tma`** → redirect на **`release-web`**.

**`tier: support`:** `planning-and-task-breakdown` (epic), `code-review-and-quality` (merge), `project-handbook-documentation` (handbook для людей), `documentation-and-adrs` (граница доменов), **`db-baselines-and-migrations`** (PostgreSQL baseline/миграции/seeds). **`doubt-driven-development`** — deferred, но satellite для game-economy.

Скилл с `status: active` — блок **«Прочитай сначала»** в `SKILL.md` до процедуры.

**Release-ready:** все product-скиллы следуют [`.claude/skills/_shared/release-ready-quality.md`](.claude/skills/_shared/release-ready-quality.md) — результат **готов к merge**, не набросок. **Workflow:** [delivery-workflow.md](.claude/skills/_shared/delivery-workflow.md) (думаем → уточняем → планируем → делаем). **Неясность:** [clarify-first.md](.claude/skills/_shared/clarify-first.md). **Визуал:** [visual-assets-policy.md](.claude/skills/_shared/visual-assets-policy.md). Границы: [`skill-responsibility-matrix.md`](.claude/skills/_shared/skill-responsibility-matrix.md).

## Primary + satellites (обязательные пары)

Один **primary**; satellite открывай, когда задача затрагивает его зону:

| Primary | Satellites |
|---------|------------|
| incremental-implementation | test-driven-development, critical-test-scenarios |
| game-economy-and-victory | test-driven-development, critical-test-scenarios, doubt-driven-development, balance-playtest (крупный баланс) |
| create-event (крупный YAML) | test-driven-development, **event-analysis** (§10/§11 audit), critical-test-scenarios (опционально) |
| api-and-interface-design | test-driven-development, critical-test-scenarios (если меняется поведение) |
| frontend-ui-engineering | design-lab-mqx (новый/смена UI), critical-test-scenarios (контракт UI), browser-testing-with-devtools (интерактив) |
| design-lab-mqx | — (canon: rule `.claude/rules/canon-sync.md` + skill) |

## Path-scoped rules (`.claude/rules/*.md` с `paths:` — подгружаются сами при работе с файлами)

| Rule | Когда |
|------|--------|
| `.claude/rules/backend.md` | `backend/**` |
| `.claude/rules/db-migrations.md` | `backend/migrations/**`, `backend/app/seeds/**`, `backend/scripts/db.sh` |
| `frontend-*.md` | `frontend-react/**` |
| `.claude/rules/design-lab.md` | `design-lab/**` — хаб `nav.manifest` → `design-lab:build-nav`; см. `docs/agents/DESIGN_LAB_NAVIGATION.md` |
| `.claude/rules/canon-sync.md` | утверждённый UI → prod |
| `release-web/guardrails.md` | перед PR / выкаткой |

**Hooks:** `.claude/settings.json` — `SessionStart` (указатель на роутер) и `PostToolUse` на `Edit|Write` (напоминания pytest / guardrails / sync-lab). Не блокируют.

## Subagents (post-diff review, не primary)

Parent agent запускает **после крупного diff** — дополняют pytest/TDD, не заменяют primary skill.

| Agent | Когда запускать | Режим | Не заменяет |
|-------|-----------------|-------|-------------|
| **economy-reviewer** | Логика/данные `game/`, `victory/`, events seeds; смена balance-чисел | Read/Grep/Glob + Bash (pytest) | `game-economy-and-victory`, pytest |
| **economy-balance-runner** | Крупная правка seeds/YAML/period — нужен sim 30–40p + diff baseline | Bash + Write (отчёты) | unit tests, authoring |
| **mqx-ui-reviewer** | Крупный MQX или lab→prod в одном PR | Read/Grep/Glob | `DESIGN_WORKFLOW`, мелкий hotfix |

**Когда НЕ запускать:** hotfix 1–2 файла, docs-only, rename без поведения, authoring YAML по **`create-event`** (satellite **`event-analysis`** для §10/§11 audit).

**Правила:** один primary на задачу; subagent — второй проход, не параллельный primary. Определения: [`.claude/agents/`](.claude/agents/) (запуск — Agent tool с `subagent_type` = имя агента или «Use economy-reviewer…» в запросе); `trigger_globs`: [`.claude/skills/catalog.yaml`](.claude/skills/catalog.yaml) → `agents:`. Онбординг: [`docs/agents/AI_ONBOARDING.md`](docs/agents/AI_ONBOARDING.md) §5.

При смене API: `frontend-react/src/api.js` + хуки/экраны.
