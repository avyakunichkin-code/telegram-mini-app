# Skill Test Spec: /game-economy-and-victory

**Skill:** `.cursor/skills/game-economy-and-victory/SKILL.md`  
**Category:** build · **Priority:** high

---

## Test Case 1: Happy Path — правка chain-цели в шаблоне

### Fixture

- Задача: изменить порядок цели в `victory_config_json` tutorial-шаблона.
- Есть `SPEC_victory-v2.md`, ADR-002.

### Expected behavior

1. Читает spec + `engine.py` + seeds/migration.
2. Предлагает/пишет тест на `win_reached` или шаг цепочки.
3. Минимальная миграция или seed.
4. `pytest -q` упомянут или выполнен.
5. **Verdict: PASS**.

### Assertions

- [ ] Не хардкодит победу только как `period_index >= 7`.
- [ ] Satellites TDD + doubt упомянуты.

---

## Test Case 2: Edge Case — «поправь роутер, пусть win_ready true»

### Fixture

- Просьба выставить победу в `routers/finance.py` без движка.

### Expected behavior

1. Отказывается дублировать логику в роутере.
2. Указывает на `victory/engine.py` + overview build.
3. **Verdict: CONCERNS** или исправление через движок.

### Assertions

- [ ] Ссылается на ADR-002 / SPEC_victory-v2.

---

## Protocol Compliance

- [ ] Ask-before-write для миграций и сидов.
- [ ] Handoff: `code-review-and-quality`.
