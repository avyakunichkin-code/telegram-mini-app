# Трассировка: идея → spec → plan → backlog

Живая матрица эпиков. Обновляйте при смене статуса spec или появлении `PLAN_*` / задач MQ-*.

| ID | Название | Idea | Spec | Plan | Backlog | Статус |
|----|----------|------|------|------|---------|--------|
| **G1** | Game Mode E2E, save_kind (Plan → 2.0) | [evolution §II](vision/ideas/money-quest-evolution-after-mvp.md) | [SPEC_game-plan](specs/features/SPEC_game-plan.md) **implemented** | [PLAN_game-plan](plans/PLAN_game-plan.md) | [MQ-101–108](backlog/PRODUCT_BACKLOG.md) выполнены | код и доки синхронизированы; [ADR-001](decisions/ADR-001-save-kind-remove-light-hardcore.md); [audit](foundation/MVP_AUDIT_VS_SPEC.md) обновлён под merge G1 → **`implemented`** для вертикали Game; victory v2 и Plan UI — следующая волна |
| **M11** | MVP 1.1 — события по tier + XP + UI меты | [mvp-1-1-product-direction](vision/ideas/mvp-1-1-product-direction.md) | [SPEC_mvp-11-progression-events](specs/features/SPEC_mvp-11-progression-events.md) **approved** \| норматив прогресса: [LEVEL_XP_SYSTEM](specs/gameplay/LEVEL_XP_SYSTEM.md) | [PLAN_mvp-11-progression-events](plans/PLAN_mvp-11-progression-events.md) \| [PLAN_level-xp-progression](plans/PLAN_level-xp-progression.md) | [MQ-111–116](backlog/PRODUCT_BACKLOG.md) | **implemented** + MQ-116 приёмка (`test_mq116_acceptance.py`, 2026-05-19) |
| **M12** | Достижения — цепочки tier, XP | GAME §5, [GAME.md](../GAME.md) | [SPEC_achievements](specs/features/SPEC_achievements.md) **approved** | PLAN TBD | [M12 в backlog](backlog/PRODUCT_BACKLOG.md) | **in dev**: движок + API ✅; UI «Развитие» ⬜ |
| **V2** | Victory M из N из шаблона | [evolution §II](vision/ideas/money-quest-evolution-after-mvp.md) | [SPEC_victory-v2](specs/features/SPEC_victory-v2.md) **approved** | — | [V2 в backlog](backlog/PRODUCT_BACKLOG.md) | **implemented** backend; UI — backlog |
| **Q1** | Качество и релиз (API) | — | [SPEC_quality-release](specs/features/SPEC_quality-release.md) **approved** | — | [PRODUCT_BACKLOG](backlog/PRODUCT_BACKLOG.md) | **implemented** backend: idempotency `0011`, валидация старта, pytest API/MQ-116 |
| **I1** | Страховки: продукт + объект | GAME §1.3 | ⚠ SPEC_insurance-catalog — нет | — | [I1 в backlog](backlog/PRODUCT_BACKLOG.md) | миграция 0008; UI design-lab → prod |
| **A1** | Аналитика (фазы B–C) | — | [SPEC_ANALYTICS](specs/SPEC_ANALYTICS.md) | — | UI/API в backlog | spec active |
| **U1** | Frontend MQX / a11y | — | [SPEC_FRONTEND_UI](specs/SPEC_FRONTEND_UI.md) | — | Tasks в spec §Plan | spec active |
| **E1** | Расходы жизнеобеспечения — категории, статьи, burn | [expenses-mechanic](vision/ideas/expenses-mechanic.md) | [EXPENSES_SYSTEM](specs/gameplay/EXPENSES_SYSTEM.md) + [SPEC_expenses](specs/features/SPEC_expenses.md) **draft** | [PLAN_expenses](plans/PLAN_expenses.md) | [E1 в backlog](backlog/PRODUCT_BACKLOG.md) | **spec draft**; код — legacy aggregate only |
| **O1** | Онбординг TMA — Mission Brief | [onboarding-tma-mission-brief](vision/ideas/onboarding-tma-mission-brief.md) | [SPEC_onboarding-tma](specs/features/SPEC_onboarding-tma.md) **draft** | [PLAN_onboarding-tma](plans/PLAN_onboarding-tma.md) | [O1 в backlog](backlog/PRODUCT_BACKLOG.md) | **spec draft**; поле `onboarding_state` в БД, UI ⬜ |

**Статусы:** `idea` → `spec draft` → `spec approved` → `in dev` → `implemented`

---

## После G1

1. Продуктовая приёмка при необходимости (sign-off).
2. **Эпик M11:** MQ-116 приёмка ✅; обновить GAME.md §0.2 (cooldown ✅) при следующем проходе GAME.md.
3. **Эпик M12:** экран «Развитие» + unlock feedback; плейтест §16 spec.
4. **Plan Mode:** мастер, префилл **`starter_params_json`**, активация плитки Plan — см. бэклог.
5. **Victory v2 (V2):** UI прогресса целей из `overview.victory`; плейтест порогов.
6. **Level gates (M11/M12):** фронт — `character_unlocks`, обработка 403 `level_gate`.
7. **Pre-Alpha (α):** протокол плейтеста 10–20 игроков — [`GAME.md`](../GAME.md) раздел 11.1; черновик протокола — [`foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md).
8. Бейджи **`game`/`plan`** и метка сложности шаблона в списке сохранений.
