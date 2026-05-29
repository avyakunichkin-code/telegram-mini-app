# Skill Test Spec: /design-lab-mqx

**Skill:** `.cursor/skills/design-lab-mqx/SKILL.md`  
**Category:** build · **Priority:** high · **Status:** active

Правила: `tvoy-hod-design-lab.mdc`, `tvoy-hod-canon-sync.mdc`. Prod-перенос: DESIGN_WORKFLOW.

---

## Test Case 1: Happy Path — self-contained round

### Fixture

- Новый раунд `design-lab/dashboard/my-round/`.
- Рядом есть канонический раунд с `sync-lab.ps1`.

### Expected behavior

1. Структура: `index.html`, `styles.css`, `lab-base.css`, `assets/`, только `./` пути.
2. После правок родительских CSS — `sync-lab.ps1` (или явное напоминание).
3. Проверка: `npx serve` из каталога раунда.
4. **Verdict: COMPLETE** — макет готов к утверждению в чате; handoff `frontend-ui-engineering`.

### Assertions

- [ ] Нет `../` на стили/ассеты в `index.html`.
- [ ] Не правит `lab-base.css` вручную (AUTO).
- [ ] «Прочитай сначала» включает APPROVED.md и rules `.mdc`.

---

## Test Case 2: Edge Case — сломанные стили (404)

### Fixture

- Lab открыт через serve; в HTML `href="../styles.css"`, стили не грузятся.

### Expected behavior

1. Диагностика: serve не отдаёт родителя.
2. План: self-contained + sync-lab.
3. **Verdict: PASS** (фикс описан) или **CONCERNS** (нужен sync на машине пользователя).

### Assertions

- [ ] Объясняет 404 из SKILL.md.
- [ ] Не предлагает только «serve из корня репо» как единственный фикс.

---

## Test Case 3: Context — catalog ↔ SKILL.md

### Fixture

- `catalog.context` для `design-lab-mqx`.

### Expected behavior

1. must_read: DESIGN_WORKFLOW, SPEC_FRONTEND_UI, `design-lab/dashboard/APPROVED.md`, оба rules `.mdc`.
2. writes_to: `design-lab/`. next_skill: `frontend-ui-engineering`.

### Assertions

- [ ] `/skill-test context design-lab-mqx` → COMPLIANT.

---

## Protocol Compliance

- [ ] Ask-before-write при создании файлов раунда.
- [ ] Handoff: `frontend-ui-engineering` после утверждения макета.
- [ ] Не переносит в prod без утверждения в чате (DESIGN_WORKFLOW).
