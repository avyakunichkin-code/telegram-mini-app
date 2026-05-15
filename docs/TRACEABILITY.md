# Трассировка: идея → spec → plan → backlog

Живая матрица эпиков. Обновляйте при смене статуса spec или появлении `PLAN_*` / задач MQ-*.

| ID | Название | Idea | Spec | Plan | Backlog | Статус |
|----|----------|------|------|------|---------|--------|
| **G1** | Game Mode E2E, save_kind (Plan → 2.0) | [evolution §II](vision/ideas/money-quest-evolution-after-mvp.md) | [SPEC_game-plan](specs/features/SPEC_game-plan.md) **approved** | [PLAN_game-plan](plans/PLAN_game-plan.md) | [MQ-101–108](backlog/PRODUCT_BACKLOG.md) | backlog готов; [ADR-001](decisions/ADR-001-save-kind-remove-light-hardcore.md); [audit подписан](foundation/MVP_AUDIT_VS_SPEC.md) → `in dev` |
| **A1** | Аналитика (фазы B–C) | — | [SPEC_ANALYTICS](specs/SPEC_ANALYTICS.md) | — | UI/API в backlog | spec active |
| **U1** | Frontend MQX / a11y | — | [SPEC_FRONTEND_UI](specs/SPEC_FRONTEND_UI.md) | — | Tasks в spec §Plan | spec active |

**Статусы:** `idea` → `spec draft` → `spec approved` → `in dev` → `implemented`

---

## Следующие шаги по G1

1. Взять **MQ-101** в работу (см. [бэклог](backlog/PRODUCT_BACKLOG.md)); по завершении отмечать `[x]` и при необходимости строку в [MVP audit](foundation/MVP_AUDIT_VS_SPEC.md) (статус GAP → закрыт).
2. После **MQ-108** — приёмка G1, SPEC_game-plan → `implemented`, обновить audit и README эпика.
