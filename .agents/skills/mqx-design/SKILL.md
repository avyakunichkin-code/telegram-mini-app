---
name: mqx-design
description: Design new or changed MQX layouts in design-lab and obtain explicit human approval before production implementation.
---

# mqx-design

Пример: «новая карточка Dashboard», «сменить CTA». Не primary: опечатка, существующий токен или a11y-label без layout.
Следуй [DESIGN_WORKFLOW](../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) и docs/agents/DESIGN_LAB_NAVIGATION.md. Сделай 2–5 вариантов с одинаковыми реалистичными данными и русским UI; loading/empty/error/disabled по области. Round index.html/styles.css редактируемы, только ./ CSS/assets; lab-base.css и корневой index.html генерируются. Источник хаба nav.manifest.json; точные команды в [COMMANDS](../../../docs/ai/COMMANDS.md). Покажи lab и дождись явного «утверждаем вариант X» до MQX/prod. Утверждение агента не заменяет человека; frontend-design не обходит gate. После approval → $frontend-implementation, крупный diff → mqx-ui-reviewer и canon sync в том же срезе.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
