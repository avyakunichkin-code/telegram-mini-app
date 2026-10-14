# Skill-test scripts (ТВОЙ ХОД)

Проверки (CI + локально):

```bash
node .claude/skills/skill-test/_static-check.mjs
node .claude/skills/skill-test/_context-check.mjs
node .claude/skills/skill-test/_category-check.mjs
node .claude/skills/skill-test/_archived-check.mjs
```

Maintenance (единая точка входа):

```bash
node .claude/skills/skill-test/_maintain.mjs help
node .claude/skills/skill-test/_maintain.mjs sync-smoke-specs
node .claude/skills/skill-test/_maintain.mjs check-archived
```

| Command | Назначение |
|---------|------------|
| `inject-quality` | Блок «Стандарт качества» в product skills |
| `patch-workflow` | delivery-workflow в устаревших блоках |
| `sync-smoke-specs` | Dedup smoke behavioral specs |
| `check-archived` | `_archived/` frontmatter gate |

Утилиты без `_maintain`: `_resolve-read-if.mjs <skill>` — read_if для MQ-*.

Процедура skill: [`SKILL.md`](SKILL.md) · Specs: [`../specs/README.md`](../specs/README.md)
