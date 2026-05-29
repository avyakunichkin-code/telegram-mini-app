# Skill Test Spec: /doubt-driven-development

**Skill:** `.cursor/skills/doubt-driven-development/SKILL.md`  
**Category:** verify · **Priority:** medium

> Stub: расширить по [`templates/skill-test-spec.md`](../templates/skill-test-spec.md) перед строгим `/skill-test spec doubt-driven-development`.

---

## Test Case 1: Smoke — invoke skill

### Fixture

- Skill и spec зарегистрированы в `catalog.yaml`.
- Пользователь вызывает `/doubt-driven-development` с аргументом из `argument-hint`.

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

