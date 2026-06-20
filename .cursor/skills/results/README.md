# Skill test results

Сюда пишутся отчёты `/skill-test`:

| Режим | Имя файла |
|-------|-----------|
| audit | `skill-test-audit-{YYYY-MM-DD}.md` |
| static all | `skill-test-static-all-{YYYY-MM-DD}.md` |
| category all | `skill-test-category-all-{YYYY-MM-DD}.md` |
| spec | `skill-test-spec-{skill-name}-{YYYY-MM-DD}.md` |
| context | `skill-test-context-{YYYY-MM-DD}.md` |

Каталог обновляется в `.cursor/skills/catalog.yaml` (`last_static`, `last_spec`, `last_context`, …).

**Retention:** после нового прогона удалять старые файлы с тем же `{skill-name}` / режимом (см. [`LEGACY_NOISE_AUDIT_2026-06-20.md`](../../docs/agents/LEGACY_NOISE_AUDIT_2026-06-20.md)).
