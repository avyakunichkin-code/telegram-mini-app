---
name: using-agent-skills
description: Discovers and invokes agent skills. Use when starting a session or when you need to discover which skill applies to the current task. This is the meta-skill that governs how all other skills are discovered and invoked.
argument-hint: "[task description or phase]"
user-invocable: true
allowed-tools: Read, Glob, Grep
---

# Using Agent Skills

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/agents/CURSOR_SKILLS.md`](../../../docs/agents/CURSOR_SKILLS.md)
- [`docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md`](../../../docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md)
- [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md)
- [`.cursor/skills/catalog.yaml`](../catalog.yaml) — поле **`tier`** на каждый скилл
- [`CLAUDE.md`](../../../CLAUDE.md)

Фаза → скилл: `.cursor/rules/tvoy-hod-router.mdc` (primary + satellites). В задаче MQ-*: `tier` + `skill` — [`docs/templates/TASK_SLICE.md`](../../../docs/templates/TASK_SLICE.md).

## Overview

Agent Skills is a collection of engineering workflow skills organized by development phase. Each skill encodes a specific process that senior engineers follow. This meta-skill helps you discover and apply the right skill for your current task.

## Skill Discovery (сначала `tier`)

**Шаг 0.** Открой `catalog.yaml` → `tier` скилла из задачи (или из [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../../../docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md)).

| `tier` | Поведение агента |
|--------|------------------|
| **core** | Primary по умолчанию; не подменять deferred-скиллом |
| **support** | Primary только если задача явно про plan / merge / ADR; иначе satellite |
| **deferred** | Только по явному запросу пользователя или полю `satellites` в MQ-* |
| **meta** | `skill-test`, настройка layout — не для продуктовых срезов |
| **archived** | `.cursor/skills/_archived/` — studio/GDD, явный вызов |

**Шаг 1.** Выбери primary по смыслу задачи (фаза «контент и данные» — дерево ниже).

**Шаг 2.** Открой **satellites** из таблицы «Primary + satellites» в router / phase doc; не завершай срез без них, если они указаны.

### Дерево primary (`tier: core`)

```
Task arrives
    │
    ├── Сырая гипотеза / идея ─────────────→ idea-refine
    ├── Контракт до кода ──────────────────→ spec-driven-development
    │       └── спор «кто владеет полем»? ─→ documentation-and-adrs (support)
    ├── Реализация срезом ─────────────────→ incremental-implementation
    │       └── satellite: test-driven-development
    │
    ├── Событие / YAML / brief ────────────→ create-event (/create-event)
    │       └── satellites: test-driven-development (pytest -k event)
    ├── Обзор каталога (read-only) ──────→ event-analysis (/event-analysis)
    │       └── при P1 gaps → create-event
    │
    ├── period.py / victory / шаблоны ───→ game-economy-and-victory
    │       └── satellites: test-driven-development, doubt-driven-development (deferred)
    │
    ├── REST / schemas / api.js ─────────→ api-and-interface-design
    │       └── satellite: test-driven-development (если меняется поведение)
    │
    ├── Макет lab ─────────────────────────→ design-lab-mqx
    ├── UI prod / MQX ───────────────────→ frontend-ui-engineering
    │       └── satellites: design-lab-mqx (новый UI), api-and-interface-design (новые поля)
    │
    └── Регрессия / баг в логике ────────→ test-driven-development
            └── перед merge → code-review-and-quality (support)
```

### Не путать (границы ответственности)

| Задача | Primary | Не использовать как primary |
|--------|---------|------------------------------|
| Текст карточки, choices, YAML | create-event | game-economy-and-victory |
| Закрытие месяца, cashflow, победа | game-economy-and-victory | create-event |
| Gaps в каталоге | event-analysis | create-event (пока только отчёт) |
| Новый экран | frontend-ui-engineering | design-lab-mqx в prod без canon |

### `tier: support` (primary только по задаче)

```
Epic / нарезка из spec ──→ planning-and-task-breakdown
Перед merge / крупный PR ─→ code-review-and-quality
Граница доменов / ADR ────→ documentation-and-adrs
```

### `tier: deferred` (явный вызов — не primary по умолчанию)

```
release-tma · browser-testing-with-devtools · telegram-mini-app-runtime
security-and-hardening · performance-optimization · deprecation-and-migration
social-changelog-posts · code-simplification · context-engineering
project-cursor-skills-layout
doubt-driven-development  ← исключение: обязателен как satellite для game-economy-and-victory
```

### `tier: archived`

Studio/GDD: `brainstorm`, `ux-design`, `design-system`, … — только `.cursor/skills/_archived/<name>/`.

*(CI/CD, git-workflow — в репо нет; см. `docs/agents/CURSOR_SKILLS.md`.)*

## Core Operating Behaviors

These behaviors apply at all times, across all skills. They are non-negotiable.

### 1. Surface Assumptions

Before implementing anything non-trivial, explicitly state your assumptions:

```
ASSUMPTIONS I'M MAKING:
1. [assumption about requirements]
2. [assumption about architecture]
3. [assumption about scope]
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The most common failure mode is making wrong assumptions and running with them unchecked. Surface uncertainty early — it's cheaper than rework.

### 2. Manage Confusion Actively

When you encounter inconsistencies, conflicting requirements, or unclear specifications:

1. **STOP.** Do not proceed with a guess.
2. Name the specific confusion.
3. Present the tradeoff or ask the clarifying question.
4. Wait for resolution before continuing.

**Bad:** Silently picking one interpretation and hoping it's right.
**Good:** "I see X in the spec but Y in the existing code. Which takes precedence?"

### 3. Push Back When Warranted

You are not a yes-machine. When an approach has clear problems:

- Point out the issue directly
- Explain the concrete downside (quantify when possible — "this adds ~200ms latency" not "this might be slower")
- Propose an alternative
- Accept the human's decision if they override with full information

Sycophancy is a failure mode. "Of course!" followed by implementing a bad idea helps no one. Honest technical disagreement is more valuable than false agreement.

### 4. Enforce Simplicity

Your natural tendency is to overcomplicate. Actively resist it.

Before finishing any implementation, ask:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?
- Would a staff engineer look at this and say "why didn't you just..."?

If you build 1000 lines and 100 would suffice, you have failed. Prefer the boring, obvious solution. Cleverness is expensive.

### 5. Maintain Scope Discipline

Touch only what you're asked to touch.

Do NOT:
- Remove comments you don't understand
- "Clean up" code orthogonal to the task
- Refactor adjacent systems as a side effect
- Delete code that seems unused without explicit approval
- Add features not in the spec because they "seem useful"

Your job is surgical precision, not unsolicited renovation.

### 6. Verify, Don't Assume

Every skill includes a verification step. A task is not complete until verification passes. "Seems right" is never sufficient — there must be evidence (passing tests, build output, runtime data).

## Failure Modes to Avoid

These are the subtle errors that look like productivity but create problems:

1. Making wrong assumptions without checking
2. Not managing your own confusion — plowing ahead when lost
3. Not surfacing inconsistencies you notice
4. Not presenting tradeoffs on non-obvious decisions
5. Being sycophantic ("Of course!") to approaches with clear problems
6. Overcomplicating code and APIs
7. Modifying code or comments orthogonal to the task
8. Removing things you don't fully understand
9. Building without a spec because "it's obvious"
10. Skipping verification because "it looks right"

## Skill Rules

1. **Check for an applicable skill before starting work.** Skills encode processes that prevent common mistakes.

2. **Skills are workflows, not suggestions.** Follow the steps in order. Don't skip verification steps.

3. **Multiple skills can apply.** A feature implementation might involve `idea-refine` → `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `test-driven-development` → `code-review-and-quality`; перед релизом при необходимости добавить CI/deploy-скиллы (см. `docs/agents/CURSOR_SKILLS.md`).

4. **When in doubt, start with a spec.** If the task is non-trivial and there's no spec, begin with `spec-driven-development`.

## Lifecycle Sequence

### Полный epic (классика)

```
1.  idea-refine                    [core]
2.  spec-driven-development        [core]
3.  planning-and-task-breakdown    [support] — epic / несколько MQ-*
4.  incremental-implementation     [core] + test-driven-development [core]
5.  code-review-and-quality        [support]
6.  documentation-and-adrs         [support] — при новой границе домена
```

`context-engineering`, `release-tma` — **deferred**, не в цепочке по умолчанию.

### Фаза «контент и данные» (типичные короткие цепочки)

| Цель | Primary → satellites |
|------|----------------------|
| Новое событие | create-event → test-driven-development |
| Расширить каталог | event-analysis → create-event |
| Баланс / период | game-economy-and-victory → test-driven-development, doubt-driven-development |
| Новое поле в API + UI | spec-driven-development → api-and-interface-design → incremental-implementation → frontend-ui-engineering |
| Новый паттерн UI | design-lab-mqx → frontend-ui-engineering (+ canon-sync rule) |

Не каждая задача проходит все шаги. Баг: воспроизведение → `test-driven-development` → `code-review-and-quality` [support]. Коммиты — по user rules в Cursor.

## Quick Reference

`tier` — см. [`catalog.yaml`](../catalog.yaml). Фаза: [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../../../docs/agents/SKILLS_PHASE_CONTENT_AND_DATA.md).

| Phase | Skill | `tier` | One-Line Summary |
|-------|-------|--------|------------------|
| Define | idea-refine | core | Refine ideas (diverge/converge) |
| Define | spec-driven-development | core | Requirements before code |
| Define | planning-and-task-breakdown | support | Decompose spec → MQ-* |
| Build | create-event | core | Author MVP11 event YAML |
| Build | event-analysis | core | Read-only catalog report |
| Build | game-economy-and-victory | core | Period, victory, templates (not event copy) |
| Build | incremental-implementation | core | Thin vertical slices |
| Build | design-lab-mqx | core | design-lab HTML/CSS mockups |
| Build | frontend-ui-engineering | core | MQX / prod UI |
| Build | api-and-interface-design | core | REST + api.js contracts |
| Build | test-driven-development | core | Tests prove behavior |
| Build | doubt-driven-development | deferred | Adversarial review (satellite for economy) |
| Build | context-engineering | deferred | Rules vs skills context |
| Verify | browser-testing-with-devtools | deferred | Chrome DevTools MCP |
| Verify | security-and-hardening | deferred | OWASP, auth, input |
| Verify | performance-optimization | deferred | Measure, then optimize |
| Review | code-review-and-quality | support | Pre-merge review |
| Ship | documentation-and-adrs | support | ADR, domain boundaries |
| Ship | release-tma | deferred | Pre-release guardrails |
| Ship | social-changelog-posts | deferred | Marketing changelog posts |
| Meta | using-agent-skills | core | This skill — discovery |
| Meta | skill-test | meta | Lint / audit skills |
| Archived | *(studio/GDD)* | archived | `_archived/` — explicit invoke only |

---

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

По умолчанию только чтение и отчёт; правки в репозитории — только по явной просьбе пользователя.

## Следующий шаг

Выбранный доменный скилл из таблицы в теле скилла.

