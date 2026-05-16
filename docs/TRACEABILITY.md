# Трассировка: идея → spec → plan → backlog

Живая матрица эпиков. Обновляйте при смене статуса spec или появлении `PLAN_*` / задач MQ-*.

| ID | Название | Idea | Spec | Plan | Backlog | Статус |
|----|----------|------|------|------|---------|--------|
| **G1** | Game Mode E2E, save_kind (Plan → 2.0) | [evolution §II](vision/ideas/money-quest-evolution-after-mvp.md) | [SPEC_game-plan](specs/features/SPEC_game-plan.md) **implemented** | [PLAN_game-plan](plans/PLAN_game-plan.md) | [MQ-101–108](backlog/PRODUCT_BACKLOG.md) выполнены | код и доки синхронизированы; [ADR-001](decisions/ADR-001-save-kind-remove-light-hardcore.md); [audit](foundation/MVP_AUDIT_VS_SPEC.md) обновлён под merge G1 → **`implemented`** для вертикали Game; victory v2 и Plan UI — следующая волна |
| **M11** | MVP 1.1 — события по tier + XP + UI меты | [mvp-1-1-product-direction](vision/ideas/mvp-1-1-product-direction.md) | [SPEC_mvp-11-progression-events](specs/features/SPEC_mvp-11-progression-events.md) **approved** \| норматив прогресса: [LEVEL_XP_SYSTEM](specs/gameplay/LEVEL_XP_SYSTEM.md) | [PLAN_mvp-11-progression-events](plans/PLAN_mvp-11-progression-events.md) \| [PLAN_level-xp-progression](plans/PLAN_level-xp-progression.md) | [MQ-111–116](backlog/PRODUCT_BACKLOG.md) | код: см. PLAN_mvp-11 \| ревью: §10 LEVEL_XP |
| **A1** | Аналитика (фазы B–C) | — | [SPEC_ANALYTICS](specs/SPEC_ANALYTICS.md) | — | UI/API в backlog | spec active |
| **U1** | Frontend MQX / a11y | — | [SPEC_FRONTEND_UI](specs/SPEC_FRONTEND_UI.md) | — | Tasks в spec §Plan | spec active |

**Статусы:** `idea` → `spec draft` → `spec approved` → `in dev` → `implemented`

---

## После G1

1. Продуктовая приёмка при необходимости (sign-off).
2. **Эпик M11:** выполнить [`PLAN_mvp-11-progression-events`](plans/PLAN_mvp-11-progression-events.md); spec [`SPEC_mvp-11-progression-events`](specs/features/SPEC_mvp-11-progression-events.md) — **approved**; задачи MQ-111+.
3. **Plan Mode:** мастер, префилл **`starter_params_json`**, активация плитки Plan — см. бэклог P1.
4. **Victory v2:** движок **M из N** и использование **`avg_net_cashflow_6p`** в условиях победы.
5. Бейджи **`game`/`plan`** и метка сложности шаблона в списке сохранений.
