---
name: frontend-implementation
description: Implement approved MQX React 18 UI or small layout-neutral fixes with project state, API and accessibility conventions.
---

# frontend-implementation

Пример: «внедри утверждённый вариант B», «исправь aria-label». Не primary: новый неутверждённый layout ($mqx-design).
Прочитай frontend-react/ARCHITECTURE.md и DESIGN_WORKFLOW, по задаче [frontend references](../../../docs/ai/FRONTEND-REFERENCES.md). Новый flow-screen в screens/<flow>, паттерн в mqx/ со styles/mqx и экспортом/витриной #/dev/mqx; API в src/api/<domain>.js, состояние через существующие hooks. Русский UI, MoneyText, loading/empty/error, кнопки/labels/фокус/touch 44px; legacy Section не расширять. React 19 use/ref-as-prop/Activity/useEffectEvent, RSC/Next API и beta Vite-рецепты не требования проекта. Выполни unit/build/guardrails, критичный путь — Playwright; крупное UI требует lab/prod/approval/canon вместе. Мелкое допускает названный canon follow-up по DESIGN_WORKFLOW.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
