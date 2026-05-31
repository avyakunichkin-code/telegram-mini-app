# Skill Spec Test: /game-economy-and-victory

**Date:** 2026-05-31  
**Spec:** `.cursor/skills/specs/build/game-economy-and-victory.md`  
**Skill:** `.cursor/skills/game-economy-and-victory/SKILL.md`

---

## Case 1: Happy Path — правка chain-цели в шаблоне

**Fixture:** изменить порядок цели в `victory_config_json` tutorial-шаблона; есть SPEC_victory-v2, ADR-002.

**Expected behavior:**

| Step | Verdict | Notes |
|------|---------|-------|
| 1. Читает spec + engine.py + seeds/migration | PASS | «Прочитай сначала» + Procedure §3 (seeds/migrations) |
| 2. Тест на `win_reached` / шаг цепочки | PASS | Procedure §2 Red — failing test |
| 3. Минимальная миграция или seed | PASS | §3 Green — `migrations/`, `seeds/` |
| 4. `pytest -q` | PASS | §2, §5 Verify |
| 5. Verdict PASS | PASS | § Verdict |

**Assertions:**

- [PASS] Не хардкодит победу только как `period_index >= 7` — Overview + Invariants («Victory v2, не только period_index >= 7»).
- [PASS] Satellites TDD + doubt — «Прочитай сначала»: `test-driven-development`, `doubt-driven-development`; §4 Doubt pass.

**Case Verdict:** PASS

---

## Case 2: Edge Case — «поправь роутер, пусть win_ready true»

**Fixture:** выставить победу в `routers/finance.py` без движка.

**Expected behavior:**

| Step | Verdict | Notes |
|------|---------|-------|
| 1. Отказывается дублировать логику в роутере | PASS | Overview + §3 «Роутеры не копируют формулы победы» |
| 2. Указывает на `victory/engine.py` + overview | PASS | must_read + §3 таблица |
| 3. Verdict CONCERNS или fix через движок | PASS | Verdict CONCERNS/FAIL; правка через engine/overview |

**Assertions:**

- [PASS] Ссылается на ADR-002 / SPEC_victory-v2 — must_read, Overview Victory v2.

**Case Verdict:** PASS

---

## Protocol Compliance

- [PASS] Ask-before-write для миграций и сидов — «**Могу записать**» (миграции, сиды, пороги победы).
- [PASS] Handoff `code-review-and-quality` — «Дальше» + «Следующий шаг».

---

## Overall Verdict: **PASS**

0 case failures, 0 protocol gaps.

## Recommended follow-up

- `/skill-test spec test-driven-development` — следующий core behavioral pass.
- При крупных правках period/victory — satellite `balance-playtest` (уже в must_read satellites).
