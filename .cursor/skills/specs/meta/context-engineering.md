# Skill Test Spec: /context-engineering

**Skill:** `.cursor/skills/context-engineering/SKILL.md`  
**Category:** meta · **Priority:** high

---

## Test Case 1: Happy Path — rules vs skills

### Fixture

- Длинная сессия; агент дублирует процедуры в `.cursor/rules/` и skills.

### Expected behavior

1. Рекомендует: постоянное → rules, процедуры → skills.
2. Ссылается на `CURSOR_SKILLS.md`, `project-cursor-skills-layout`.
3. **Verdict: PASS** с конкретным планом контекста.

### Assertions

- [ ] Не предлагает копировать весь CLAUDE.md в каждый rule.
- [ ] Учитывает token budget / релевантность.

---

## Test Case 2: Edge Case — всё в one-shot rule

### Fixture

- Пользователь хочет один `alwaysApply` rule на 50 страниц.

### Expected behavior

1. **CONCERNS**: раздует каждый запрос.
2. Альтернатива: узкие rules + skills по фазе.

### Assertions

- [ ] Объясняет trade-off, не просто соглашается.

---

## Protocol Compliance

- [ ] Ask-before-write при правках `.cursor/rules/`.
- [ ] Handoff: `using-agent-skills`.
