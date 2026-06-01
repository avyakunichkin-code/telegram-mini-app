# Skill Test Spec: /using-agent-skills

**Skill:** `.cursor/skills/using-agent-skills/SKILL.md`  
**Category:** meta · **Priority:** high

---

## Test Case 1: Happy Path — выбор скилла по задаче

### Fixture

- «Добавь endpoint и экран в TMA для новой механики».

### Expected behavior

1. Сначала `tier` из `catalog.yaml` / `SKILLS_PHASE_CONTENT_AND_DATA.md`.
2. Дерево: `spec-driven-development` → `api-and-interface-design` → `incremental-implementation` → `frontend-ui-engineering` (все `tier: core`).
3. Не ставит `social-changelog-posts` / `release-tma` primary без запроса (`tier: deferred`).
4. Указывает satellites (например `test-driven-development`).
5. **Verdict: COMPLETE** со списком скиллов по порядку.

### Assertions

- [ ] Упоминает `docs/agents/CURSOR_SKILLS.md` или `SKILLS_PHASE_CONTENT_AND_DATA.md`.
- [ ] MQX-путь через design-lab при новом UI.
- [ ] Не путает `create-event` и `game-economy-and-victory`.

---

## Test Case 2: Edge Case — несуществующий скилл в репо

### Fixture

- Пользователь просит `ci-cd-and-automation` (удалён из проекта).

### Expected behavior

1. Указывает на CURSOR_SKILLS «низкая ценность / удалён».
2. Альтернатива: глобальные Cursor skills или ручной CI.
3. **PASS** с корректной навигацией.

### Assertions

- [ ] Не выдумывает путь `.cursor/skills/ci-cd-and-automation/`.

---

## Protocol Compliance

- [ ] Read-only meta-skill.
- [ ] Handoff: доменный скилл из таблицы.
