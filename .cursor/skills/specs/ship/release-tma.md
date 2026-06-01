# Skill Test Spec: /release-tma

**Skill:** `.cursor/skills/release-tma/SKILL.md`  
**Category:** ship · **Priority:** medium

---

## Test Case 1: Happy Path — «готов к релизу»

### Expected behavior

1. Запускает или перечисляет `check:guardrails` и `design-lab:build`.
2. Упоминает pytest если был backend diff.
3. **Verdict: READY** или **BLOCKED** с командами.

### Assertions

- [ ] Не коммитит без явной просьбы.
- [ ] Ссылается на `tvoy-hod-release-guardrails.mdc`.
