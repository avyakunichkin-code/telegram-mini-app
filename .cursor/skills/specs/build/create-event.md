# Skill Test Spec: /create-event

**Skill:** `.cursor/skills/create-event/SKILL.md`  
**Category:** build · **Priority:** high

---

## Test Case 1: Happy Path — событие для студента

### Fixture

- «Скидка на стриминг для студента, soft_offer, −500₽».

### Expected behavior

1. Читает persona-profiles + EVENT_BRIEF.
2. Предлагает brief и черновик кнопок с needs social/health.
3. Новый unique key, запись в data/events/mvp11/<domain>.yaml (events:).
4. pytest -k event.
5. **Verdict: COMPLETE**.

### Assertions

- [ ] Отдельный key; не variants[].
- [ ] Упоминает ограничение audience_json / prereq.

---

## Test Case 2: Пара student + professional

### Fixture

- «Та же механика кофе, два профиля».

### Expected behavior

1. Два key (`_student`, `_pro`), разный текст и needs_delta.
2. **Verdict: COMPLETE** или CONCERNS если pytest не запущен.

---

## Protocol Compliance

- [ ] Ask-before-write.
- [ ] Handoff test-driven-development.
