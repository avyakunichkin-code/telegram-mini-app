# Skill Test Spec: /event-analysis

**Skill:** `.cursor/skills/event-analysis/SKILL.md`  
**Category:** build · **Priority:** medium

---

## Test Case 1: Happy Path — весь каталог

### Fixture

- «Проанализируй события MVP 1.1, что не хватает для студента».

### Expected behavior

1. Read-only; не правит YAML.
2. Запускает `event_catalog_report.py` и/или rg по `data/events/mvp11/`.
3. Отчёт: домены, tier, персоны, gaps; verdict GAPS или HEALTHY.
4. Рекомендации → `/create-event`, не автозапись.

### Assertions

- [ ] Нет Write в YAML без явного запроса.
- [ ] Упоминает persona-profiles / salary %.
- [ ] Не путает с economy-reviewer.

---

## Test Case 2: Scope domain

### Fixture

- «Разбери только social_family».

### Expected behavior

1. Узкий отчёт по одному domain-файлу.
2. **Verdict** с gaps по паре student/pro если уместно.

---

## Protocol Compliance

- [ ] Не смешивает с `/create-event` в одном verdict «записал».
- [ ] Handoff на create-event для P1 gaps.
