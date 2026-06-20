# Skill Spec Test: /create-event

**Date:** 2026-06-20  
**Spec:** `.cursor/skills/specs/build/create-event.md`  
**Skill:** `.cursor/skills/create-event/SKILL.md`

---

## Case 1: Happy Path — событие для студента

**Fixture:** «Скидка на стриминг для студента, soft_offer, −500₽».

**Assertions:**

- [PASS] Отдельный `definition_key`; не `variants[]` — §Модель, «Генерация пары»; spec §2026-06-20 + event-balance-rules.
- [PASS] `profile` + `audience: all` — отклоняется (§Модель, чеклист **profile ≠ all**).
- [PASS] audience = фильтр; universal pair = два key + два audience.
- [PASS] trade-off §1 (needs+ ⇒ cash− / burn / needs−) — §4 + event-balance-rules.
- [PASS] `test_event_balance_contract.py` — §6 Verify, gate 233–234.
- [PASS] lifecycle §10 — §10–11, чеклист.
- [PASS] needs_axis_map §11 — §11, EVENT_BRIEF.

**Case Verdict:** PASS

---

## Case 2: Пара student + professional

**Case Verdict:** PASS — § «Генерация пары», два key, разный текст.

---

## Protocol Compliance

- [PASS] «Могу записать» + черновик до Write.
- [PASS] Handoff `test-driven-development`.

---

## Overall Verdict: **PASS**
