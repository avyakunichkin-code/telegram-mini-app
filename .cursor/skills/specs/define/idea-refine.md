# Skill Test Spec: /idea-refine

**Skill:** `.cursor/skills/idea-refine/SKILL.md`  
**Category:** define · **Priority:** medium · **Status:** active

Связка с продуктом: [`docs/DOCUMENTATION_SYSTEM.md`](../../../../docs/DOCUMENTATION_SYSTEM.md) — выход в `docs/vision/ideas/<slug>.md`, далее `spec-driven-development`.

---

## Test Case 1: Happy Path — новая гипотеза → one-pager в vision/ideas

### Fixture

- Пользователь: «Проработай идею: показывать средний cashflow за 6 периодов на Dashboard».
- В `docs/specs/features/` нет готового SPEC; в `docs/vision/ideas/` похожих файлов нет.
- Репозиторий ТВОЙ ХОД: есть `DashboardPremium`, `GET /api/finance/overview`, `CLAUDE.md`.

### Expected behavior

1. **Phase 1 (Divergent):** restate как How Might We; 3–5 sharpening questions (кто, success, constraints); 5–8 вариаций (не 20+); при необходимости `Read`/`Grep` по коду (overview, dashboard).
2. **Phase 2 (Converge):** 2–3 направления; stress-test (value / feasibility / differentiation); явные assumptions и риски; честный pushback, не yes-machine.
3. **Phase 3 (Ship):** one-pager с Problem, Recommended Direction, Key Assumptions, MVP Scope, **Not Doing**, Open Questions.
4. Спросить: «Могу записать в `docs/vision/ideas/<slug>.md`?» — записать только после «да».
5. **Gate:** не предлагать `spec-driven-development` или код до **APPROVED** направления.
6. **Verdict: APPROVED** или **COMPLETE** + handoff `spec-driven-development`.

### Assertions

- [ ] Пройдены все три фазы (не сразу шаблон Phase 3).
- [ ] Есть секция **Not Doing** с явными trade-offs.
- [ ] Файл сохраняется только в `docs/vision/ideas/` (или путь по согласованию), не в `docs/specs/`.
- [ ] Нет production-кода и нет SPEC до утверждения идеи.

---

## Test Case 2: Edge Case — уже есть spec, пользователь торопит в код

### Fixture

- Пользователь: «Быстро сделай кнопку X» — в `docs/specs/features/` уже есть утверждённый SPEC с AC.
- Или: мелкая правка, пользователь явно сказал «без идеи, по спеке».

### Expected behavior

1. Скилл **не раздувает** ideation: направляет к `spec-driven-development` / `incremental-implementation` или отказывается от полного цикла idea-refine.
2. **Verdict: PASS** с пояснением «idea-refine не нужен — есть spec».
3. Не создаёт дублирующий `docs/vision/ideas/*.md` без запроса.

### Assertions

- [ ] Не блокирует работу лишним 5–8 вариациями.
- [ ] Не пишет код сам (это не зона idea-refine).

---

## Test Case 3: Edge Case — слабая идея, пользователь настаивает

### Fixture

- Идея: «Сделать всё как в Sims, но за неделю».
- После stress-test feasibility провалена.

### Expected behavior

1. **CONCERNS** или честный pushback с конкретикой (scope, ресурсы, MVP).
2. Предложить упрощённое направление или **Not Doing** для нереалистичного scope.
3. **Do not advance** к spec/коду без согласованного урезанного MVP.
4. Не yes-machine.

### Assertions

- [ ] Verdict не **APPROVED** без явного принятия рисков пользователем.
- [ ] Assumptions и «что убьёт идею» названы явно.

---

## Protocol Compliance

- [ ] «Могу записать …?» перед записью в `docs/vision/ideas/`.
- [ ] AskUserQuestion / sharpening questions до генерации вариаций (Phase 1).
- [ ] Handoff: `spec-driven-development` после **APPROVED**.
- [ ] Не auto-commit / auto-push.
