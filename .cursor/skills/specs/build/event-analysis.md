# Skill Test Spec: /event-analysis

**Skill:** `.cursor/skills/event-analysis/SKILL.md`  
**Category:** build · **Priority:** medium

---

## Test Case 1: Happy Path — весь каталог

### Fixture

- «Проанализируй события MVP 1.1, что не хватает для студента».

### Expected behavior

1. Read-only; не правит YAML.
2. Читает SPEC_event-system-v2; rg content_class / event_slot / audience.
3. Запускает event_catalog_report.py и/или pytest.
4. Отчёт: домены, tier, content_class coverage, EVT1 engine gap, persona gaps.
5. Verdict GAPS или HEALTHY.
6. Рекомендации → `/create-event`.

### Assertions

- [ ] Нет Write в YAML без явного запроса.
- [ ] Таблица или упоминание content_class × persona.
- [ ] Блок trade-off / free-lunch scan (event-balance-rules §1–4).
- [ ] Блок repeat/lifecycle §10 и axis §11 при scope all.
- [ ] Не путает с economy-reviewer / create-event implement.

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
