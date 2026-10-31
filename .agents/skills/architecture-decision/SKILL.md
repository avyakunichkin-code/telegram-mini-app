---
name: architecture-decision
description: Document consequential architecture or ownership decisions as project ADRs, preserving Game/Plan shared-kernel boundaries and existing decision hierarchy.
---

# architecture-decision

Пример: «куда вынести общий расчёт», «почему меняем API». Не primary: опечатка README или обычный локальный баг.
Прочитай CONVENTIONS.md, docs/DOCUMENTATION_SYSTEM.md, ADR-016 и затронутые spec/plan. ADR отвечает почему: контекст, варианты, решение, последствия, проверка/откат; spec отвечает что, plan — как. Не вводи второй backlog. packages/platform пока отсутствует — не считать план выполненным. Выносить только общий код при реальном потребителе, не игровые needs/events/victory. Подтверждение владельца не подменяется карточкой роли. Для текущего прототипа Plan см. [профиль](../../../docs/ai/CODEX-PROCESSES.md).

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
