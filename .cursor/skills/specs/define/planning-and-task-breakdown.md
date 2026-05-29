# Skill Test Spec: /planning-and-task-breakdown

**Skill:** `.cursor/skills/planning-and-task-breakdown/SKILL.md`  
**Category:** define · **Priority:** high · **Status:** active

---

## Test Case 1: Happy Path — задачи из spec

### Fixture

- Утверждённый `docs/specs/features/SPEC_*.md`.
- Строка эпика в `docs/TRACEABILITY.md`.

### Expected behavior

1. `PLAN_<slug>.md` по `templates/PLAN_FEATURE.md` (`epic_id`, `spec`, `next_skill`).
2. Задачи MQ-* с `phase`, `skill`, `next_skill` по `templates/TASK_SLICE.md`.
3. Обновление колонки **Plan** в `TRACEABILITY.md`.
4. **Verdict: COMPLETE** или **APPROVED** со списком задач.

### Assertions

- [ ] Каждая задача ссылается на секцию spec или AC.
- [ ] Не смешивает unrelated work.
- [ ] Gate: не `incremental-implementation` до утверждения плана.

---

## Test Case 2: Edge Case — размытый scope

### Fixture

- «Сделай финансы лучше» без spec.

### Expected behavior

1. Просит уточнение или отправляет к `spec-driven-development` / `idea-refine`.
2. **CONCERNS** без списка из 50 задач.

### Assertions

- [ ] Не выдаёт generic backlog на весь репозиторий.

---

## Test Case 3: Context — phase → skill

### Fixture

- Задача MQ-042 с `phase: build` в plan/tasks.

### Expected behavior

1. Handoff к `incremental-implementation`, не к `spec-driven-development`.
2. `phase: verify` → `code-review-and-quality` / `test-driven-development` по контексту.
3. Ссылается на `SKILL_DOC_MAP.md` при неясности.

### Assertions

- [ ] `/skill-test context planning-and-task-breakdown` → COMPLIANT.

---

## Protocol Compliance

- [ ] Ask-before-write при записи plan/tasks/traceability.
- [ ] Handoff: `incremental-implementation` после **APPROVED**.
