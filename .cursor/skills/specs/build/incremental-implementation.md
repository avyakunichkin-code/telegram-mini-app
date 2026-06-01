# Skill Test Spec: /incremental-implementation

**Skill:** `.cursor/skills/incremental-implementation/SKILL.md`  
**Category:** build · **Priority:** high · **Status:** active

Связка: [`docs/plans/`](../../../../docs/plans/), [`docs/tasks/`](../../../../docs/tasks/) → срезы в `backend/` / `frontend-react/`.

---

## Test Case 1: Happy Path — вертикальный срез по spec

### Fixture

- Утверждённый `docs/specs/features/SPEC_*.md` с AC.
- План: первый срез (например endpoint + минимальный UI), не весь эпик.
- Пользователь согласовал объём среза.

### Expected behavior

1. Декомпозиция: один проверяемый инкремент с явным «готово когда…».
2. Реализация среза; предложение проверки (тест / ручной сценарий из spec).
3. Не тянет несвязанные рефакторинги в тот же заход.
4. **Verdict: COMPLETE** для среза + handoff `test-driven-development`.

### Assertions

- [ ] Упоминает `CLAUDE.md` / доменные пути из «Прочитай сначала» при экономике/периоде.
- [ ] Не «big bang» весь spec без согласования границ.
- [ ] «Могу записать» перед массовыми правками.

---

## Test Case 2: Edge Case — нет spec, пользователь торопит

### Fixture

- «Сразу сделай X в 15 файлах», spec и tasks отсутствуют.

### Expected behavior

1. Предлагает `spec-driven-development` или фиксацию AC в чате.
2. **CONCERNS** / **FAIL** при отказе от границ и большом объёме.
3. Не молча коммитит монолит.

### Assertions

- [ ] Не пропускает границы задачи.
- [ ] Handoff к spec/plan, не к «просто мержи».

---

## Test Case 3: Context — catalog ↔ SKILL.md

### Fixture

- `catalog.yaml` → `incremental-implementation.context` с `must_read`, `writes_to`, `next_skill`.

### Expected behavior

1. Блок «Прочитай сначала» перечисляет `docs/specs/features/`, `docs/plans/`, `docs/tasks/`, `backend/app/README.md`, `frontend-react/ARCHITECTURE.md`.
2. Строка **Дальше:** `test-driven-development`, `code-review-and-quality`.

### Assertions

- [ ] `/skill-test context incremental-implementation` → COMPLIANT (или только WARN по `writes_to` в теле).

---

## Protocol Compliance

- [ ] Ask-before-write при Write.
- [ ] Verdict + «Следующий шаг» / handoff.
- [ ] Не auto-commit без запроса.
