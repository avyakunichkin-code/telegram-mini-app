# Skill Test Spec: /telegram-mini-app-runtime

**Skill:** `.claude/skills/telegram-mini-app-runtime/SKILL.md`  
**Category:** verify · **Priority:** medium

---

## Test Case 1: Happy Path — WebApp viewport

### Expected behavior

1. Читает SPEC_APP_SHELL / TMA_USER_FLOWS.
2. Не ломает `apiCall` контракт.
3. **Verdict: PASS** с шагами проверки в TMA.

### Assertions

- [ ] Handoff на release-web (smoke) или проверку во встроенном браузере при необходимости DOM.
