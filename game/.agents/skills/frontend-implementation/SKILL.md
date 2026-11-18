---
name: frontend-implementation
description: Implement approved MQX React 18 UI or small layout-neutral fixes with project state, API and accessibility conventions.
---

# frontend-implementation

Только GAME. Пути к коду ниже указаны от Git root.

Пример: «подключи утверждённый экран из Lab», «исправь aria-label». Не primary: новый неутверждённый layout ($mqx-design).
Подключай тот же MQX, стили и ассеты. Сравни скриншоты Lab и игры на одинаковых тестовых данных. Прочитай game/ARCHITECTURE.md и game/web/src/components/mqx/DESIGN_WORKFLOW.md, по задаче [frontend references](../../../../docs/engineering/FRONTEND-REFERENCES.md). Новый flow-screen в screens/<flow>, паттерн в mqx/ со styles/mqx и экспортом/витриной #/dev/mqx; API в src/api/<domain>.js, состояние через существующие hooks. Русский UI, MoneyText, loading/empty/error, кнопки/labels/фокус/touch 44px; legacy Section не расширять. React 19 use/ref-as-prop/Activity/useEffectEvent, RSC/Next API и beta Vite-рецепты не требования проекта. Выполни unit/build/guardrails, критичный путь — Playwright; крупное UI требует lab/prod/approval/canon вместе. Мелкое допускает названный canon follow-up по DESIGN_WORKFLOW.

Перед показом открой игровой экран в браузере и сравни его с утверждённым превью на тех же данных, ширине и в том же состоянии. Исправь ошибки и заметные визуальные расхождения, затем перепроверь. Подробности в разделе «Проверка перед показом» в DESIGN_WORKFLOW.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
