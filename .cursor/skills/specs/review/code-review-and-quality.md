# Skill Test Spec: /code-review-and-quality

**Skill:** `.cursor/skills/code-review-and-quality/SKILL.md`  
**Category:** review · **Priority:** high

---

## Test Case 1: Happy Path — review UI + economy diff

### Fixture

- Diff: `FinancePremium.jsx` + `period.py` в одном PR.

### Expected behavior

1. Multi-axis review (correctness, security, perf, maintainability, tests).
2. Findings с severity, без автоправок.
3. Явный итог: **PASS** / **CONCERNS** / **FAIL** для merge.
4. Read-only: не коммитит сам.

### Assertions

- [ ] Замечания привязаны к файлам/строкам.
- [ ] Для MQX/UI — сверка с SPEC_FRONTEND_UI / DESIGN_WORKFLOW при смене паттерна.

---

## Test Case 2: Edge Case — «LGTM без чтения»

### Fixture

- Пользователь: «просто скажи LGTM», diff > 500 строк, критичная экономика.

### Expected behavior

1. Отказывается поверхностного LGTM.
2. **CONCERNS** — нужен scope или время на review.

### Assertions

- [ ] Не выдаёт PASS без анализа критичных путей.

---

## Protocol Compliance

- [ ] Read-only (нет Write в allowed-tools).
- [ ] Handoff: исправления → `incremental-implementation`.
