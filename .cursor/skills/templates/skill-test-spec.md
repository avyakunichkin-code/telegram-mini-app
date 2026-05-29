# Skill Test Spec: /{skill-name}

**Skill:** `.cursor/skills/{skill-name}/SKILL.md`  
**Category:** {category}  
**Priority:** {priority}

---

## Test Case 1: Happy Path — {title}

### Fixture

{Describe repo state, user request, and files that exist.}

### Expected behavior

1. {Step}
2. {Step}
3. Agent states **Verdict** (PASS / COMPLETE / APPROVED as appropriate).

### Assertions

- [ ] {Assertion}
- [ ] {Assertion}
- [ ] Recommends next skill from SKILL.md «Следующий шаг».

---

## Test Case 2: Edge Case — {title}

### Fixture

{Edge condition.}

### Expected behavior

1. {Step}
2. Agent states **FAIL** or **CONCERNS** with clear reason (or defers without writing).

### Assertions

- [ ] Does not skip collaborative protocol when Write is allowed.
- [ ] Does not implement out of scope when spec/task boundary exists.

---

## Protocol Compliance

- [ ] Uses «Могу записать» / ask-before-write when `allowed-tools` includes Write (unless user said «делай»).
- [ ] Presents plan or findings before bulk file writes.
- [ ] Ends with explicit verdict keyword and follow-up path.
- [ ] Does not auto-commit or auto-push unless user asked.
