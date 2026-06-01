# Skill Spec Test: /test-driven-development

**Date:** 2026-05-31  
**Spec:** `.cursor/skills/specs/build/test-driven-development.md`  
**Skill:** `.cursor/skills/test-driven-development/SKILL.md`

---

## Case 1: Happy Path — баг в period economics

**Fixture:** неверный расчёт в `process_period_end` (`period.py`); есть соседние тесты.

**Expected behavior:**

| Step | Verdict | Notes |
|------|---------|-------|
| 1. Failing test до фикса | PASS | Prove-It Pattern + Step 1 RED |
| 2. Минимальный фикс | PASS | Step 2 GREEN — minimum code |
| 3. Test green | PASS | Step 3 REFACTOR / full suite |
| 4. Verdict PASS | PASS | § Verdict |

**Assertions:**

- [PASS] Red-green-refactor — § The TDD Cycle (RED → GREEN → REFACTOR).
- [PASS] Поведение, не implementation detail — § Test State, Not Interactions + anti-patterns.

**Case Verdict:** PASS (minor gap на явный итоговый verdict)

---

## Case 2: Edge Case — «просто почини без теста»

**Fixture:** hotfix без теста для критичной экономики.

**Expected behavior:**

| Step | Verdict | Notes |
|------|---------|-------|
| 1. Риск регрессии game/period, finance | PASS | Prove-It + `period.py` в must_read + Rationalizations |
| 2. Минимальный тест или CONCERNS | PASS | § Verdict CONCERNS + Rationalizations |

**Assertions:**

- [PASS] Не игнорирует stakes period/victory — bug fix = reproduction test обязателен; period в must_read; «You won't» skip tests.

**Case Verdict:** PASS

---

## Protocol Compliance

- [PASS] Ask-before-write — § Согласование («May I write» / «Могу записать»).
- [PASS] Handoff `code-review-and-quality` — «Дальше» + «Следующий шаг».

---

## Overall Verdict: **PASS** (re-run 2026-05-31 после правок)

0 case failures, 0 protocol gaps.

## Fixes applied

1. § **Критичные зоны** — `period` / `victory` / finance: reproduction test обязателен.
2. § **Verdict** — PASS / CONCERNS / FAIL.
3. § **Согласование** — «May I write» / «Могу записать» перед записью тестов и prod-кода.

## Initial run: PARTIAL

Gaps closed: ask-before-write, CONCERNS при отказе от теста, явный Verdict PASS.

## Recommended follow-up

- После правок SKILL → `/skill-test spec test-driven-development` (re-run).
- `/skill-test spec spec-driven-development` — следующий define core pass.
