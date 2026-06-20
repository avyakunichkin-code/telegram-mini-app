# Skill Test Spec: /release-web

**Skill:** `.cursor/skills/release-web/SKILL.md`  
**Category:** ship · **Priority:** medium

---

## Test Case 1: Happy Path — «готов к релизу web/PWA»

### Expected behavior

1. Запускает или перечисляет `check:guardrails` и `design-lab:build`.
2. Упоминает pytest если был backend diff.
3. Перечисляет **PWA/web smoke** (W1–W5 минимум).
4. TMA — optional, не единственный gate.
5. **Verdict: READY** или **BLOCKED** с командами.

### Assertions

- [ ] Не коммитит без явной просьбы.
- [ ] Ссылается на `tvoy-hod-release-guardrails.mdc` и ADR-012.
- [ ] Не требует Telegram-only smoke как обязательный блокер.

---

## Test Case 2: Deprecated alias

**Skill:** `/release-tma` → redirect на `release-web` без отдельного checklist.
