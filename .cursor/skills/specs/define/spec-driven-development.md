# Skill Test Spec: /spec-driven-development

**Skill:** `.cursor/skills/spec-driven-development/SKILL.md`  
**Category:** define · **Priority:** high

---

## Test Case 1: Happy Path — новая фича в docs/specs

### Fixture

- Идея: новая механика в Finance tab, нет `docs/specs/features/SPEC_*.md`.

### Expected behavior

1. Gated workflow: SPECIFY → human review (не прыгает в IMPLEMENT).
2. Spec с AC, границами, ссылками на `CLAUDE.md` / ADR при необходимости.
3. Сохранение в `docs/specs/` после согласования.
4. **Verdict: COMPLETE** на фазе SPECIFY.

### Assertions

- [ ] Не пишет production-код до утверждения spec.
- [ ] AskUserQuestion / явное согласование границ.

---

## Test Case 2: Edge Case — typo fix

### Fixture

- Однострочная опечатка в README, пользователь явно указал файл.

### Expected behavior

1. Скилл не раздувает процесс (When NOT to use).
2. **PASS** — можно без полного spec.

### Assertions

- [ ] Не создаёт 5-страничный spec для typo.

---

## Protocol Compliance

- [ ] «Могу записать» перед spec в репо.
- [ ] Handoff: `planning-and-task-breakdown`.
