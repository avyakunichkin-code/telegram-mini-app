# Skill Test Spec: /create-event

**Skill:** `.cursor/skills/create-event/SKILL.md`  
**Category:** build · **Priority:** high

---

## Test Case 1: Happy Path — событие для студента

### Fixture

- «Скидка на стриминг для студента, soft_offer, −500₽».

### Expected behavior

1. Читает persona-profiles + SPEC_event-system-v2 + EVENT_BRIEF.
2. Указывает content_class, event_slot, audience_template_keys.
3. Предлагает brief и черновик кнопок с needs social/health.
4. Новый unique key, запись в data/events/mvp11/<domain>.yaml.
5. pytest -k event.
6. **Verdict: COMPLETE**.

### Assertions

- [ ] Отдельный key; не variants[].
- [ ] profile + audience all — отклоняется / не предлагается.
- [ ] audience = фильтр; universal pair = два key + два audience.
- [ ] Каждый choice: needs+ ⇒ cash− или burn или needs− (event-balance-rules §1).
- [ ] lifecycle_class / cooldown для downgrade-событий (§10).
- [ ] needs_axis_map по теме (§11).

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
