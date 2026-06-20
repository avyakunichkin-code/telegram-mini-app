# Skill Spec Test: /game-economy-and-victory

**Date:** 2026-06-20  
**Spec:** `.cursor/skills/specs/build/game-economy-and-victory.md`  
**Skill:** `.cursor/skills/game-economy-and-victory/SKILL.md`

---

## Case 1: Happy Path — chain-цель в шаблоне

**Fixture:** изменить порядок цели в `victory_config_json` tutorial-шаблона.

**Assertions:**

- [PASS] Не хардкод победы как только `period_index >= 7` — Overview, Invariants.
- [PASS] Satellites TDD + doubt (+ balance-playtest при seeds) — «Прочитай сначала», release-ready gate.

**Case Verdict:** PASS

---

## Case 2: Edge Case — win_ready в роутере

**Assertions:**

- [PASS] Отказ дублировать логику в роутере — Overview §52, Procedure §3.
- [PASS] Ссылка на ADR-002 / SPEC_victory-v2 + `victory/engine.py`.

**Case Verdict:** PASS

---

## Protocol Compliance

- [PASS] «Могу записать» для миграций/сидов.
- [PASS] Handoff `code-review-and-quality`.

---

## Overall Verdict: **PASS**
