---
name: codex-config-audit
description: Audit repository Codex skills, roles, hooks and source drift, validate adapters and report actual activation evidence without changing retired tooling or global permissions.
---

# codex-config-audit

Пример: «проверь Codex контур», «измени hook». Не primary: продуктовая фича.
Прочитай [архитектуру](../../../docs/engineering/CODEX-ARCHITECTURE.md), [карту процессов](../../../docs/engineering/CODEX-PROCESSES.md) и [HOOKS](../../../docs/engineering/CODEX-HOOKS.md). Сначала git status и diff текущего Codex-контура. Исторические migration manifests — provenance; не открывать исходники из них и не вычислять protected snapshot старого контура. Используй официальный OpenAI Docs и skill-creator/quick_validate при изменении навыка. Выполни check.mjs, behavioral tests и safe smoke; отдели реализован/зарегистрирован/доверен/runtime/blocked. Проверяй все patch add/update/delete/move, Windows/traversal/unknown payload, timeout/error, секреты в выводе и коды выхода. Не переносить чужие permissions, модели, неподдерживаемые поля ответа хуков. Отчёты в docs/engineering, состояние .codex-state; без глобального trust/full access.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
