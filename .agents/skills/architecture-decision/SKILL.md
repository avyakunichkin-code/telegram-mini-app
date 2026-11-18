---
name: architecture-decision
description: Document consequential architecture or ownership decisions in the applicable product or shared ADR.
---

# architecture-decision

Определи область: один продукт или межпродуктовый контракт. Читай CONVENTIONS,
docs/DOCUMENTATION_SYSTEM.md, ADR-016 и затронутые spec/plan по области. ADR отвечает
почему: контекст, варианты, решение, последствия, проверка/откат. Продуктовый ADR
принадлежит его docs/decisions, общий — корневому docs/decisions.
Не вводи второй backlog. Shared kernel остаётся без IO/ORM/HTTP и игровых понятий;
вынос кода оправдан реальным потребителем. Наличие platform не доказывает перевод
на него всех приложений. Структуру и команды сверяй с [маршрутом](../../../docs/engineering/CODEX-PROCESSES.md).
Не выдавай review роли за решение человека; согласованное решение исполняй в его границах.

Общие границы: [AGENTS.md](../../../AGENTS.md).
