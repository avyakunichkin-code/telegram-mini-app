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
| `.claude/settings.json` | Напоминания pytest / guardrails / sync-lab после правок |
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
