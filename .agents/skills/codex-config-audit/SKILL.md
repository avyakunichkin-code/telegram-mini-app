---
name: codex-config-audit
description: Audit repository Codex skills, roles, hooks and source drift, validate adapters and report actual activation evidence without changing Claude or global permissions.
---

# codex-config-audit

Пример: «проверь Codex контур», «измени hook». Не primary: продуктовая фича.
Прочитай [AUDIT](../../../docs/ai/CODEX-AUDIT.md), [migration map](../../../docs/ai/CODEX-MIGRATION-MAP.md) и [HOOKS](../../../docs/ai/CODEX-HOOKS.md). Сначала git status и protected snapshot/drift. Не запускать after-edit-verify или отчёт в .claude. Используй официальный OpenAI Docs и skill-creator/quick_validate при изменении навыка. Выполни check.mjs, behavioral tests и safe smoke; отдели реализован/зарегистрирован/доверен/runtime/blocked. Проверяй все patch add/update/delete/move, Windows/traversal/unknown payload, timeout/error, секреты в выводе и коды выхода. Не переносить Claude permission allow, модели, неподдерживаемые поля ответа хуков. Отчёты в docs/ai, состояние .codex-state; без глобального trust/full access.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
