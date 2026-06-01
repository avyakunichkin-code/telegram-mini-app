# Skill Test Spec: /frontend-ui-engineering

**Skill:** `.cursor/skills/frontend-ui-engineering/SKILL.md`  
**Category:** build · **Priority:** high · **Status:** active

Канон: [`DESIGN_WORKFLOW.md`](../../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md), [`SPEC_FRONTEND_UI.md`](../../../../docs/specs/SPEC_FRONTEND_UI.md).

---

## Test Case 1: Happy Path — новый MQX-паттерн через design-lab

### Fixture

- Задача: новая карточка Dashboard, затрагивает `mqx/` и `design-lab/dashboard/`.
- Пользователь не сказал «hotfix без дизайна».

### Expected behavior

1. Читает `DESIGN_WORKFLOW.md` **до** prod.
2. Предлагает/использует раунд в `design-lab/`, не лезет сразу в `*Premium.jsx` с новым визуалом.
3. После **утверждения в чате** — `mqx/` + `#/dev/mqx`.
4. **Verdict: COMPLETE** + handoff `design-lab-mqx` / canon sync при релизе.

### Assertions

- [ ] Явная отсылка к DESIGN_WORKFLOW (не только «сделай красиво»).
- [ ] Не добавляет `href="../"` в lab HTML.
- [ ] «Прочитай сначала» содержит SPEC_FRONTEND_UI, UI_CONSISTENCY_AUDIT, ARCHITECTURE.
- [ ] Капитал / Z-NEEDS ★: не новый визуал в prod без lab; не откатывать к v5 needs / finance-аккордеонам.
- [ ] Analytics ⚠: не новый визуал в prod без lab (волна C хвост).
- [ ] Не внедряет D1–D12 из DESIGN_IMPROVEMENTS_BACKLOG без spec.

---

## Test Case 2: Edge Case — hotfix без смены дизайна

### Fixture

- Баг: `aria-label`, визуал канонический; «дизайн не трогать».

### Expected behavior

1. Точечная правка без нового lab-раунда.
2. **Verdict: PASS** с пометкой hotfix.

### Assertions

- [ ] Не создаёт design-lab round без запроса.
- [ ] A11y из SKILL.md соблюдена.

---

## Test Case 3: Context — catalog ↔ SKILL.md

### Fixture

- `catalog.context` для `frontend-ui-engineering`.

### Expected behavior

1. «Прочитай сначала»: DESIGN_WORKFLOW, SPEC_FRONTEND_UI, ARCHITECTURE, CLAUDE.
2. **Дальше:** `design-lab-mqx`, `browser-testing-with-devtools`, `code-review-and-quality`.

### Assertions

- [ ] `/skill-test context frontend-ui-engineering` → COMPLIANT.

---

## Protocol Compliance

- [ ] Ask-before-write.
- [ ] Handoff на verify/review скиллы после UI-изменений.
- [ ] Не auto-commit.
