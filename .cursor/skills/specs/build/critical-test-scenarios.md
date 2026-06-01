# Skill Test Spec: /critical-test-scenarios

**Skill:** `.cursor/skills/critical-test-scenarios/SKILL.md`  
**Category:** build · **Priority:** high

---

## Test Case 1: Happy Path — новая фича из spec

### Fixture

- Утверждённый `docs/specs/features/SPEC_*.md` с § Critical scenarios (CS-1, CS-2).
- Срез `incremental-implementation` реализован.

### Expected behavior

1. Агент открывает `backend/tests/README.md` и определяет слой (unit/integration).
2. Добавляет минимум happy + boundary/contract по gate G1–G3.
3. Запускает `pytest` и при необходимости `npm run test:unit`.
4. Обновляет Verify в MQ-* или spec с командами.
5. **Verdict: PASS**.

### Assertions

- [ ] Не менее 2 critical scenarios на нетривиальную фичу.
- [ ] Новые файлы в `tests/unit/` или `tests/integration/`, не дубликат legacy без причины.
- [ ] Assert на бизнес-инвариант, не только HTTP status.

---

## Test Case 2: Edge Case — «тесты потом»

### Fixture

- Пользователь просит merge без тестов для нового API поля, читаемого FE.

### Expected behavior

1. Ссылается на gate G3 (контракт FE↔BE).
2. Предлагает минимальный integration + contract test или follow-up MQ-* с `critical_scenarios`.
3. Не помечает задачу done без явного исключения в PR.

### Assertions

- [ ] Gate не игнорируется для behavioral change.
- [ ] Handoff на `test-driven-development` для реализации.

---

## Test Case 3: Backlog — расширение suite

### Fixture

- Запрос: «добавить тесты по backlog из README».

### Expected behavior

1. Читает приоритеты в `backend/tests/README.md`.
2. Берёт следующий пункт (period close, victory chain, …).
3. Пишет тесты в правильной подпапке с маркерами.

### Assertions

- [ ] Backlog item отмечен или обновлён в README.
- [ ] Использует `tests/fixtures/` где уместно.

---

## Protocol Compliance

- [ ] Satellite `test-driven-development` для RED-GREEN при новом поведении.
- [ ] Handoff: `code-review-and-quality` после зелёных тестов.
- [ ] Не требует 100% coverage.
