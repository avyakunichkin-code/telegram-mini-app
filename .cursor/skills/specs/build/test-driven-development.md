# Skill Test Spec: /test-driven-development

**Skill:** `.cursor/skills/test-driven-development/SKILL.md`  
**Category:** build · **Priority:** high

---

## Test Case 1: Happy Path — баг в period economics

### Fixture

- Баг: неверный расчёт при `process_period_end` в `backend/app/game/period.py`.
- Есть существующие тесты в `backend/tests/` (или соседний модуль).

### Expected behavior

1. Воспроизведение: failing test **до** фикса.
2. Минимальный фикс.
3. Test green.
4. **Verdict: PASS**.

### Assertions

- [ ] Red-green-refactor порядок соблюдён.
- [ ] Тест проверяет поведение, не implementation detail без причины.

---

## Test Case 2: Edge Case — «просто почини без теста»

### Fixture

- Пользователь просит hotfix без теста для критичной экономики.

### Expected behavior

1. Объясняет риск регрессии для `game/period`, `finance/`.
2. Предлагает минимальный тест или **CONCERNS** при отказе.

### Assertions

- [ ] Не игнорирует ставки для period/victory logic.

---

## Protocol Compliance

- [ ] Ask-before-write для тестов и prod-кода.
- [ ] Handoff: `code-review-and-quality`.
