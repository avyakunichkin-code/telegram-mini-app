# Skill Test Spec: /api-and-interface-design

**Skill:** `.cursor/skills/api-and-interface-design/SKILL.md`  
**Category:** api · **Priority:** high

---

## Test Case 1: Happy Path — новый GET endpoint

### Fixture

- Нужен `GET /api/finance/...` поле в overview; есть `backend/app/routers/finance.py`, `frontend-react/src/api/`.

### Expected behavior

1. Contract first: схема ответа, ошибки, пагинация если список.
2. Напоминание синхронизировать `api.js` и типичные хуки.
3. Additive, backward-compatible поля.
4. **Verdict: PASS** на дизайн контракта.

### Assertions

- [ ] Упоминает Hyrum's Law / не ломает существующих клиентов.
- [ ] Валидация на границе, не размазана по UI.

---

## Test Case 2: Edge Case — breaking rename поля

### Fixture

- Запрос переименовать публичное поле в `overview` без версии API.

### Expected behavior

1. **CONCERNS** или план через `deprecation-and-migration`.
2. Не одобряет silent break для TMA клиентов.

### Assertions

- [ ] Ссылается на deprecation skill или dual-write период.

---

## Protocol Compliance

- [ ] Ask-before-write при правках routers/schemas/api.js.
- [ ] Handoff: `documentation-and-adrs`, `incremental-implementation`.
