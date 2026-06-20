# Smoke stub — общий протокол `/skill-test spec`

Используется skill-specific specs с пометкой «Smoke stub». Расширяй **в том же файле** секцией «Skill-specific fixtures» перед строгим behavioral test.

---

## Test Case 1: Smoke — invoke skill

### Fixture

- Skill и spec зарегистрированы в `catalog.yaml`.
- Пользователь вызывает skill с аргументом из `argument-hint`.

### Expected behavior

1. Агент читает `SKILL.md` и следует Overview / When to Use / «Прочитай сначала».
2. Завершает с явным **Verdict** (PASS / FAIL / CONCERNS / COMPLETE / APPROVED).

### Assertions

- [ ] `name` в frontmatter совпадает с каталогом.
- [ ] Есть блок «Следующий шаг» или эквивалентный handoff (`next_skill`).

---

## Protocol Compliance

- [ ] Ask-before-write / «Могу записать» если `allowed-tools` содержит Write.
- [ ] Read-only скиллы не пишут в репо без явной просьбы.
- [ ] Не auto-commit / auto-push.
