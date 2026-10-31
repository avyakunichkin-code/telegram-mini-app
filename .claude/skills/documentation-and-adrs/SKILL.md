---
name: documentation-and-adrs
description: Records decisions and documentation. Use when making architectural decisions, changing public APIs, shipping features, or when you need to record context that future engineers and agents will need to understand the codebase.
argument-hint: "[topic, decision, or ADR title]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# Documentation and ADRs

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/DOCUMENTATION_SYSTEM.md`](../../../docs/DOCUMENTATION_SYSTEM.md)
- [`docs/foundation/DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md)
- [`docs/decisions/`](../../../docs/decisions/)
## Читай при условии (`catalog.yaml` → `read_if`)

| Когда | Файлы |
|-------|--------|
| снимок аудита (product / engineering / UX / QA / liveops) | [`docs/audits/README.md`](../../../docs/audits/README.md), [`docs/templates/AUDIT.md`](../../../docs/templates/AUDIT.md), [`engineering/`](../../../docs/audits/engineering/README.md), [`qa/`](../../../docs/audits/qa/README.md), [`ux/`](../../../docs/audits/ux/README.md), [`liveops/`](../../../docs/audits/liveops/README.md) |

**Куда писать:** `docs/decisions/`, `DOC_SYNC_LOG`; **аудиты** → `docs/audits/<kind>/` (см. README аудитов). **Дальше:** —

## Overview

Document decisions, not just code. The most valuable documentation captures the *why* — the context, constraints, and trade-offs that led to a decision. Code shows *what* was built; documentation explains *why it was built this way* and *what alternatives were considered*. This context is essential for future humans and agents working in the codebase.

## When to Use

- Making a significant architectural decision
- Choosing between competing approaches
- Adding or changing a public API
- Shipping a feature that changes user-facing behavior
- Onboarding new team members (or agents) to the project
- When you find yourself explaining the same thing repeatedly

**When NOT to use:** Don't document obvious code. Don't add comments that restate what the code already says. Don't write docs for throwaway prototypes.

**When NOT primary:** narrative handbook для людей → **project-handbook-documentation**; реализация фичи → **incremental-implementation**.

## Architecture Decision Records (ADRs)

ADRs capture the reasoning behind significant technical decisions. They're the highest-value documentation you can write.

### When to Write an ADR

- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Deciding on an API architecture (REST vs. GraphQL vs. tRPC)
- Choosing between build tools, hosting platforms, or infrastructure
- Any decision that would be expensive to reverse

### ADR — формат и место

Шаблон — [`docs/templates/ADR.md`](../../../docs/templates/ADR.md) (Context, Decision, Consequences, Alternatives considered). Файл — `docs/decisions/ADR-NNN-<slug>.md`, номер — следующий после последнего в [`docs/decisions/`](../../../docs/decisions/); строка в [`docs/decisions/README.md`](../../../docs/decisions/README.md). Решение, меняющее правило, — также строка в [`DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md).

### ADR Lifecycle

```
PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)
```

- **Don't delete old ADRs.** They capture historical context.
- When a decision changes, write a new ADR that references and supersedes the old one.

## Комментарии и docstrings

- Комментарий объясняет **почему** (ограничение, инвариант, ссылка на ADR/spec), а не пересказывает код.
- Ловушки фиксируются рядом с кодом: например, `DEPRECATED`-колонки в `backend/app/models.py` с причиной и ссылкой на план удаления.
- Закомментированный код не оставлять — удалять (история в git).

## API-документация

- OpenAPI генерирует FastAPI (`/docs`); карта доменов и эндпоинтов — [`backend/app/README.md`](../../../backend/app/README.md), FE-зеркало — `frontend-react/src/api/<домен>.js`.
- Контракт фичи (поля, ошибки, идемпотентность) — раздел **Data & API** в `docs/specs/features/SPEC_*.md`.

## README и журнал изменений

- README — на уровне домена: `backend/app/README.md`, `backend/app/services/README.md`, `frontend-react/ARCHITECTURE.md`, `design-lab/README.md`.
- Журнал доработок — [`docs/CHANGELOG.md`](../../../docs/CHANGELOG.md): заметная доработка (фича, решение, инструмент) — строка в разделе дня с областью и коммитом. Расхождения кода и docs — [`DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md), полная история — git.

## Documentation for Agents

Special consideration for AI agent context:

- **CLAUDE.md / rules files** — Document project conventions so agents follow them
- **Spec files** — Keep specs updated so agents build the right thing
- **ADRs** — Help agents understand why past decisions were made (prevents re-deciding)
- **Inline gotchas** — Prevent agents from falling into known traps

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The code is self-documenting" | Code shows what. It doesn't show why, what alternatives were rejected, or what constraints apply. |
| "We'll write docs when the API stabilizes" | APIs stabilize faster when you document them. The doc is the first test of the design. |
| "Nobody reads docs" | Agents do. Future engineers do. Your 3-months-later self does. |
| "ADRs are overhead" | A 10-minute ADR prevents a 2-hour debate about the same decision six months later. |
| "Comments get outdated" | Comments on *why* are stable. Comments on *what* get outdated — that's why you only write the former. |

## Red Flags

- Architectural decisions with no written rationale
- Public APIs with no documentation or types
- README that doesn't explain how to run the project
- Commented-out code instead of deletion
- TODO comments that have been there for weeks
- No ADRs in a project with significant architectural choices
- Documentation that restates the code instead of explaining intent

## Аудиты (снимки)

Не ADR и не spec. Полный аудит продукта / архитектуры / UX:

1. Прочитать [`docs/audits/README.md`](../../../docs/audits/README.md).
2. Записать `docs/audits/<kind>/<YYYY-MM-DD>-<slug>.md` по [`templates/AUDIT.md`](../../../docs/templates/AUDIT.md).
3. Строка в реестре README + `DOC_SYNC_LOG`.
4. Verdict **DRAFT**, пока человек не сказал APPROVED.

Технический kind: [`docs/audits/engineering/README.md`](../../../docs/audits/engineering/README.md).

## Verification

After documenting:

- [ ] ADRs exist for all significant architectural decisions
- [ ] README covers quick start, commands, and architecture overview
- [ ] API functions have parameter and return type documentation
- [ ] Known gotchas are documented inline where they matter
- [ ] No commented-out code remains
- [ ] Rules files (CLAUDE.md etc.) are current and accurate

---

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

Перед созданием или изменением файлов в репозитории спроси: «Могу записать …?» — если пользователь не дал явное «делай» / «запиши».

## Следующий шаг

`code-review-and-quality` при изменении публичного API; см. `docs/decisions/`.  
Narrative / GDD / плейтест-пакет → **`project-handbook-documentation`** (`docs/handbook/`).  
Снимок аудита → **`docs/audits/<kind>/`**.

