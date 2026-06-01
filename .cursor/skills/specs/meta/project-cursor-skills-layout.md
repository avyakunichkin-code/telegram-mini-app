# Skill Test Spec: /project-cursor-skills-layout

**Skill:** `.cursor/skills/project-cursor-skills-layout/SKILL.md`  
**Category:** meta · **Priority:** meta

> Stub: расширить по [`templates/skill-test-spec.md`](../templates/skill-test-spec.md) перед строгим `/skill-test spec project-cursor-skills-layout`.

---

## Test Case 1: Smoke — invoke skill

### Fixture

- Skill и spec зарегистрированы в `catalog.yaml`.
- Пользователь вызывает `/project-cursor-skills-layout` с аргументом из `argument-hint`.

### Expected behavior

1. Агент читает SKILL.md и следует Overview / When to Use.
2. Завершает с явным **Verdict** (PASS / FAIL / CONCERNS / COMPLETE / APPROVED).

### Assertions

- [ ] `name` в frontmatter совпадает с каталогом.
- [ ] Есть блок «Следующий шаг» или эквивалентный handoff.

---

## Protocol Compliance

- [ ] Ask-before-write / «Могу записать» если `allowed-tools` содержит Write.
- [ ] Read-only скиллы не пишут в репо без явной просьбы.
- [ ] Не auto-commit / auto-push.

