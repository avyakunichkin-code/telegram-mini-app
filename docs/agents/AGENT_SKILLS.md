---
tags:
  - tvoy-hod/layer/agents
aliases:
  - AGENT_SKILLS
---
﻿# Agent Skills ТВОЙ ХОД — что использовать и когда

**Активные** скиллы: `.claude/skills/<name>/` (см. [`catalog.yaml`](../../.claude/skills/catalog.yaml): `status` + **`tier`**). Политика качества: [release-ready-quality.md](../../.claude/skills/_shared/release-ready-quality.md).

**Текущая фаза (контент + данные):** [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md) — `tier: core` / `support` / `deferred` / `archived`.

**Архив** (не удалены, не автоподключаются): [`.claude/skills/_archived/`](../../.claude/skills/_archived/) — studio/GDD-наследие.

Встроенные и user-level скиллы Claude Code (`/code-review`, `/simplify`, `/security-review`, `~/.claude/skills/…`) в проект не дублируем.

**FE adjunct (не в `catalog.yaml`):** `frontend-react/.claude/skills/` — `react-best-practices`, `composition-patterns`, …  
**Контекст:** в always-on только **slim** [`AGENTS.md`](../../frontend-react/.claude/skills/react-best-practices/AGENTS.md) (~40 строк); полный compile — [`AGENTS.full.md`](../../frontend-react/.claude/skills/react-best-practices/AGENTS.full.md). Продуктовый конвейер — только `.claude/skills/`.

Ориентир по стеку: [`CLAUDE.md`](../../CLAUDE.md). Свод принципов: [`CONVENTIONS.md`](../../CONVENTIONS.md) (`py -3 scripts/check_conventions.py`).

**Интеграция с docs (2026-05-28):**

| Артефакт | Назначение |
|----------|------------|
| [`CONVENTIONS.md`](../../CONVENTIONS.md) | Свод принципов; гейт `py -3 scripts/check_conventions.py` (не hook до 2026-09-16) |
| [`SKILL_DOC_MAP.md`](SKILL_DOC_MAP.md) | Конвейер фаза → скилл → папки docs |
| [`catalog.yaml`](../../.claude/skills/catalog.yaml) → `context:` | `must_read` (всегда), `read_if` (условно), `writes_to`, `next_skill` |
| `SKILL.md` → **Прочитай сначала** | Те же пути для агента при явном вызове |
| `.claude/rules/router.md` | Роутер: фаза → primary skill + satellites (без `paths` → грузится всегда) |
| `.claude/settings.json` | Хуки: `PreToolUse` — гейт ручных правок сгенерированных файлов (`design-lab/index.html`, `lab-base.css`, DML в baseline); `PostToolUse` — напоминания pytest / guardrails / sync-lab. См. [`.claude/hooks/README.md`](../../.claude/hooks/README.md) |
| [`.claude/agents/`](../../.claude/agents/) | Subagents `economy-reviewer`, `economy-balance-runner`, `mqx-ui-reviewer` |
| [`docs/balance/README.md`](../balance/README.md) | Симуляция 40p, baseline JSON, diff |
| [`docs/templates/TASK_SLICE.md`](../templates/TASK_SLICE.md) | MQ-*: `phase`, `tier`, `skill`, `satellites`, `next_skill` |
| [`docs/templates/PLAN_FEATURE.md`](../templates/PLAN_FEATURE.md) | PLAN: `epic_id`, spec, `next_skill` |
| [`docs/TRACEABILITY.md`](../TRACEABILITY.md) | Обновлять после нарезки плана |
| [`DESIGN_IMPROVEMENTS_BACKLOG.md`](DESIGN_IMPROVEMENTS_BACKLOG.md) | UI-идеи **вне** скиллов до spec (D1–D12) |
| [`DESIGN_LAB_NAVIGATION.md`](DESIGN_LAB_NAVIGATION.md) | Хаб vs round vs page parity vs `#/dev/mqx` |
| [`docs/foundation/DOC_SYNC_LOG.md`](../foundation/DOC_SYNC_LOG.md) | Журнал prod ↔ docs/skills (2026-06: **Капитал**, Z-NEEDS v7) |
| [`SKILLS_QUALITY_AUDIT_2026-06-20.md`](SKILLS_QUALITY_AUDIT_2026-06-20.md) | Аудит скиллов (archived); канон — `_shared/release-ready-quality.md` |
| [`.claude/skills/_shared/release-ready-quality.md`](../../.claude/skills/_shared/release-ready-quality.md) | Стандарт merge-ready (не набросок) |
| [`.claude/skills/_shared/clarify-first.md`](../../.claude/skills/_shared/clarify-first.md) | Уточнение до implement |
| [`.claude/skills/_shared/delivery-workflow.md`](../../.claude/skills/_shared/delivery-workflow.md) | Думаем → уточняем → планируем → делаем |
| [`.claude/skills/_shared/visual-assets-policy.md`](../../.claude/skills/_shared/visual-assets-policy.md) | Иконки/фоны: формат → генерация → репо |
| [`.claude/skills/_shared/skill-responsibility-matrix.md`](../../.claude/skills/_shared/skill-responsibility-matrix.md) | Когда primary / When NOT |

---

## Фаза: контент и данные (`tier`)

Полная таблица **`tier: core / support / deferred / archived`** — только в [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md). Роутер: [`.claude/rules/router.md`](../../.claude/rules/router.md).

---

## Высокая ценность (`status: active`)

| Скилл | Зачем |
|-------|--------|
| **frontend-ui-engineering** | MQX, SPA/PWA UI; prod **Капитал** (Details \| Actions), **Z-NEEDS v7-e2e3** — [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) |
| **design-lab-mqx** | `design-lab/` — хаб `nav.manifest`; ★ `capital-page/details-actions-round`, `character-needs/dashboard-needs-v7-round` — `DESIGN_LAB_NAVIGATION.md` |
| **spec-driven-development** | Spec в `docs/specs/` до кода |
| **incremental-implementation** | Срезы без монолитных PR |
| **api-and-interface-design** | `/api/...`, `api.js`, контракты |
| **test-driven-development** | RED-GREEN одного теста, баги |
| **critical-test-scenarios** (`/critical-test-scenarios`) | Критичные сценарии, gate G1–G4, backlog suite |
| **create-event** | **`/create-event`** — brief (`lifecycle_class`, `needs_axis_map`), YAML, §10–§11 |
| **event-analysis** | **`/event-analysis`** — read-only: gaps, **§10 lifecycle**, **§11 axis**, trade-off |
| **game-economy-and-victory** | `period.py`, Victory v2, баланс движка (не контент карточек) |
| **balance-playtest** (`/balance-playtest`) | 40 периодов, JSON, diff к baseline; subagent `economy-balance-runner` |
| **code-review-and-quality** | Перед merge |
| **planning-and-task-breakdown** | Задачи из spec |
| **project-handbook-documentation** | Пакет `docs/handbook/` для людей / плейтест |
| **idea-refine** | `docs/vision/ideas/` до spec |
| **using-agent-skills** | Выбор скилла по фазе |
| **skill-test** | `audit` / `static` / `spec` / `category` |

---

## Средняя ценность (`status: optional`, `tier: deferred` или `support`)

| Скилл | `tier` | Когда |
|-------|--------|--------|
| **project-handbook-documentation** | support | Пакет `docs/handbook/`: GDD, brief, плейтест, матрица фич (`/project-handbook-documentation`) |
| **documentation-and-adrs** | support | ADR, граница доменов, публичный API |
| **browser-testing-with-devtools** | deferred | DOM/сеть PWA/web (Chrome DevTools MCP) |
| **doubt-driven-development** | deferred | Satellite для game-economy; иначе высокие ставки |
| **deprecation-and-migration** | deferred | Смена контрактов, `save_kind` |
| **security-and-hardening** | deferred | JWT, ввод, интеграции |
| **code-simplification** | deferred | Рефакторинг после роста UI |
| **performance-optimization** | deferred | CLS/LCP, ререндеры |
| **context-engineering** | deferred | Rules vs skills, объём контекста |
| **social-changelog-posts** | deferred | Посты → `docs/marketing/` |
| **release-web** | deferred | Guardrails + design-lab:build + PWA/web smoke перед выкаткой |
| ~~release-tma~~ | deferred alias | → **release-web** |
| **telegram-mini-app-runtime** | deferred | WebApp SDK, initData, viewport TMA |
| **project-skills-layout** | meta | Rules vs skills, контракт `SKILL.md` |

---

## Предложение: консолидация с built-in Claude Code (на решение PO, 2026-10-14)

> **Статус: предложение.** Ничего не удалено и не переведено в архив; `catalog.yaml` не менялся. Решение — за пользователем; после «утверждаем» — чеклист ниже.

Встроенные команды Claude Code: **`/code-review`** (баги в diff/PR, уровни effort, `--fix`), **`/simplify`** (reuse / упрощение / эффективность изменённого кода с применением правок), **`/security-review`** (security-ревью pending-изменений ветки). Плюс сам механизм скиллов: `description` каждого скилла и так всегда в контексте, а `router.md` + `SessionStart`-хук уже дают выбор primary. Учтён prompt-audit: описания `using-agent-skills`, `test-driven-development`, `incremental-implementation`, `frontend-ui-engineering` сужены, satellites в `router.md` — **по зоне задачи, не обязательные**.

Метрики: «проектное» — сколько строк `SKILL.md` про ТВОЙ ХОД (пути, pytest, MQX, JWT…); «ссылки» — файлов в `.claude/` + `docs/`, где упомянут скилл (цена удаления).

| Скилл | `status` / `tier` | Built-in аналог | Проектное (из строк) | Ссылки | Предложение | Почему |
|-------|-------------------|-----------------|----------------------|--------|-------------|--------|
| **code-simplification** | optional / deferred | `/simplify` | 2 / 376 (только `CLAUDE.md`) | 8 | 🔴 **Удалить** → `/simplify` | Полный дубль; проектного содержания нет |
| **code-review-and-quality** | active / support | `/code-review` (+ `/simplify`) | 1 / 397 (`CLAUDE.md`, `SPEC_PRODUCT.md`) | ~45, `next_skill` у 4+ скиллов, router «Перед merge» | 🟡 **Сжать в обёртку** (≤ 80 строк, имя оставить) | Generic-тело дублирует `/code-review`; ценность ТВОЙ ХОД — только **merge-gate**: `/code-review` → `economy-reviewer` / `mqx-ui-reviewer` по зоне → `pytest -q` / `check:guardrails` → verdict. Имя сохраняем, чтобы не ломать ~45 ссылок |
| **security-and-hardening** | optional / deferred | `/security-review` | 3 / 386 (`auth.py`) | 12 | 🟡 **Слить** проектный чеклист (JWT в `auth.py`, валидация `initData`, deny `.env`) в `release-web/guardrails.md` + `telegram-mini-app-runtime`; скилл удалить | Ревью diff покрывает built-in; design-time чеклист короткий и уже по зонам |
| **context-engineering** | optional / deferred | `/init`, `/memory`, механизм rules/skills; проектный аналог — **project-skills-layout** | 2 / 329 (есть устаревшие ссылки на `.cursorrules`) | 9 | 🔴 **Удалить**, 3–5 полезных строк → `project-skills-layout` | Про Cursor-эпоху; контракт rules/skills/hooks уже в `project-skills-layout` |
| **using-agent-skills** | active / **core** | Встроенное обнаружение по `description` + `router.md` + `SessionStart`-хук | 16 / 291 | 16; спец-случай в `_context-check.mjs` | 🟡 **Понизить до `support`**, дерево выбора → `router.md`; удалить через ~месяц, если не вызывается | После сужения описания — только тай-брейкер «два скилла пересекаются»; `core` для него завышен |
| **performance-optimization** | optional / deferred | Нет прямого | 3 / 389 | 12 | ⚪ **В `_archived/`** (`disable-model-invocation: true`) | Не дубль built-in, но generic и deferred; вернуть при задаче CWV для PWA |
| **doubt-driven-development** | optional / deferred | Частично `/code-review high+` | 3 / 282 | 16, satellite game-economy | 🟢 **Оставить** | Satellite для необратимых правок формул/победы — процесс, а не ревью diff |
| **test-driven-development** | active / core | Нет | 11 / 431 | 37, router ×6, хук-подсказки | 🟢 **Оставить** (описание уже сужено) | Satellite почти всех primary; `pytest -k event`, баги в логике |
| **incremental-implementation** | active / core | Нет (Plan mode — про план, не срезы) | 7 / 291 | 40 | 🟢 **Оставить** (описание сужено) | Primary «код срезами» в router |
| **frontend-ui-engineering** | active / core | Нет (`frontend-design` plugin — эстетика, не MQX-процесс) | 37 / 481 | 47 | 🟢 **Оставить** (описание сужено) | MQX, DESIGN_WORKFLOW, canon-sync — сугубо проектное |
| **planning-and-task-breakdown** | active / support | Plan mode / `Plan` subagent | 2 / 290 | 18 | 🟢 **Оставить** | Пишет артефакты `docs/plans`, `docs/tasks` (TASK_SLICE), built-in — нет |
| **browser-testing-with-devtools** | optional / deferred | Built-in browser pane, Claude in Chrome, `/run` | 2 / 339 | 17 | ⚪ **Пересмотреть** при следующем аудите | Инструменты теперь встроены; оставить только сценарии PWA-smoke (возможно → `release-web`) |
| `_archived/code-review` (studio) | archived | `/code-review` | — | — | 🔴 **Удалить** из архива | Тройной дубль: studio + `code-review-and-quality` + built-in |

Без built-in дубля и **вне** предложения: `api-and-interface-design`, `spec-driven-development`, `documentation-and-adrs`, `idea-refine`, `deprecation-and-migration`, все доменные (`create-event`, `event-analysis`, `game-economy-and-victory`, `db-baselines-and-migrations`, `design-lab-mqx`, `balance-playtest`, `critical-test-scenarios`, `release-web`, …).

**Итог при полном принятии:** −4 скилла (`code-simplification`, `context-engineering`, `security-and-hardening`, `_archived/code-review`), −1 в архив (`performance-optimization`), 2 сжаты/понижены (`code-review-and-quality`, `using-agent-skills`); ≈ −1 600 строк generic-текста в `.claude/skills/` (ещё 389 строк `performance-optimization` уходят в архив).

**Чеклист после «утверждаем»** (по каждому принятому пункту):

1. `catalog.yaml`: удалить запись / сменить `status`, `tier`; вычистить из `next_skill` и `read_if` других скиллов.
2. `.claude/rules/router.md` (список `tier: deferred`, таблица фаз), [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md), [`SKILL_DOC_MAP.md`](SKILL_DOC_MAP.md), этот файл (строка → таблица «Удалённые из репозитория» с заменой).
3. `.claude/skills/specs/**/<skill>.md` — удалить/перенести; `_shared/skill-responsibility-matrix.md`.
4. `grep -rn "<skill>" .claude docs CLAUDE.md` → заменить на built-in (`/simplify`, `/code-review`, `/security-review`).
5. Прогнать: `_static-check`, `_context-check`, `_category-check`, `_archived-check`, `_claude-config-check`, `py -3 scripts/check_conventions.py`; запись в [`DOC_SYNC_LOG.md`](../foundation/DOC_SYNC_LOG.md).

---

## Удалённые из репозитория (не восстанавливать в `_archived`)

Эти скиллы **не лежат** в `.claude/skills/` и **не переносятся** в архив — для MVP не нужны. При появлении CI/релиза — взять из Skill Hub или другого проекта заново.

| Бывший скилл | Замена в ТВОЙ ХОД |
|--------------|-------------------|
| ci-cd-and-automation | Skills gate: [`.github/workflows/skills-check.yml`](../../.github/workflows/skills-check.yml); полный CI/CD — по запросу |
| shipping-and-launch | Skill **`release-web`** + `release-web/guardrails.md` ([ADR-012](../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)) |
| source-driven-development | `spec-driven-development` + docs |
| debugging-and-error-recovery | Воспроизведение + `test-driven-development` |
| git-workflow-and-versioning | Коммиты/PR — только по явной просьбе пользователя (поведение Claude Code по умолчанию) |

---

## Архив studio/GDD (`.claude/skills/_archived/`)

`disable-model-invocation: true` — только явный вызов. В каждом `SKILL.md` — баннер **АРХИВ (ТВОЙ ХОД)** (маппинг `design/gdd/` → `docs/`, studio → active-скиллы). Specs: `specs/_archived/studio/`.

| Скилл | Когда вручную |
|-------|----------------|
| **brainstorm** | Идея с нуля, дивергенция |
| **design-system** | GDD одной системы |
| **ux-design** | UX-spec экрана |
| **ux-review** | Gate UX: APPROVED / NEEDS REVISION |
| **design-review** | Ревью GDD |
| **team-ui** | Пайплайн UX → visual → code |
| **create-architecture** | Мастер architecture doc |
| **architecture-review** | GDD ↔ ADR |
| **code-review** | Узкий code review (есть **code-review-and-quality**) |
| **onboard** | Онбординг по роли |
| **retrospective** | Ретро спринта |

Для продуктовых идей в этом репо чаще: **idea-refine** → **spec-driven-development** (не studio-цепочка).

---

## Мета

| Скилл | Назначение |
|-------|------------|
| **project-skills-layout** | Пути, контракт, `catalog.yaml`, `_archived/` |
| **skill-test** | Линтер и audit скиллов |
| **using-agent-skills** | Дерево active/optional |

---

## Rules ↔ Skills

- **Rules** (`.claude/rules/*.md`) — `router.md` всегда; остальные по `paths:` при работе с файлами.
- **Skills** — процедуры по запросу.

UI: [`SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md). MQX: [`DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

---

## Skill-test

| Путь | Назначение |
|------|------------|
| [`catalog.yaml`](../../.claude/skills/catalog.yaml) | `status`, `priority`, `spec`, `context`, `archived_root` |
| [`specs/`](../../.claude/skills/specs/) | Behavioral specs |
| [`_static-check.mjs`](../../.claude/skills/skill-test/_static-check.mjs) | Static (только корень `skills/`, без `_archived`) |
| [`_context-check.mjs`](../../.claude/skills/skill-test/_context-check.mjs) | Context: `catalog.context` ↔ «Прочитай сначала» ↔ `SKILL_DOC_MAP` |
| [`_category-check.mjs`](../../.claude/skills/skill-test/_category-check.mjs) | Category rubric heuristics по `category:` в catalog |
| [`_resolve-read-if.mjs`](../../.claude/skills/skill-test/_resolve-read-if.mjs) | MQ-*: вывести `read_if` / `when` для skill |
| [`_maintain.mjs`](../../.claude/skills/skill-test/_maintain.mjs) | Maintenance: inject-quality, sync-smoke-specs, check-archived, … |
| [`specs/README.md`](../../.claude/skills/specs/README.md) | Behavioral specs vs SKILL.md |
| [`.github/workflows/skills-check.yml`](../../.github/workflows/skills-check.yml) | CI: static + context + category + archived |

---

*Обновляйте при смене набора active/optional или возврате скилла из `_archived/`.*
