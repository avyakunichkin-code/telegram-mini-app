---
tags:
  - tvoy-hod/layer/trace
aliases:
  - TRACEABILITY
---
﻿# Трассировка: идея → spec → plan → backlog

Живая матрица эпиков. Обновляйте при смене статуса spec или появлении `PLAN_*` / задач MQ-*.

| ID | Название | Idea | Spec | Plan | Backlog | Статус |
|----|----------|------|------|------|---------|--------|
| **G1** | Game Mode E2E, `save_kind` (light/hardcore сняты) | [evolution §II](vision/ideas/tvoy-hod-evolution-after-mvp.md) (исторический Plan) | [SPEC_game-plan](specs/features/SPEC_game-plan.md) **implemented** | [PLAN_game-plan](plans/PLAN_game-plan.md) | [MQ-101–108](backlog/PRODUCT_BACKLOG.md) выполнены | **`implemented`**; [ADR-001](decisions/ADR-001-save-kind-remove-light-hardcore.md); Plan как 2.0 **снят** [ADR-013](decisions/ADR-013-game-only-drop-plan-mode.md) |
| **M11** | MVP 1.1 — события по tier, cooldown | [mvp-1-1-product-direction](vision/ideas/mvp-1-1-product-direction.md) | [SPEC_mvp-11-progression-events](specs/features/SPEC_mvp-11-progression-events.md) **approved** \| прогрессия: [remove-character-xp](vision/ideas/remove-character-xp-and-levels.md) | [PLAN_mvp-11-progression-events](plans/PLAN_mvp-11-progression-events.md) | [MQ-111–116](backlog/PRODUCT_BACKLOG.md) | **`implemented`**; MQ-116 doc приёмка 2026-05-26 ([MVP_AUDIT](foundation/MVP_AUDIT_VS_SPEC.md) §M11); Pre-Alpha плейтест ⬜ |
| **M12** | Достижения — цепочки tier | GAME §5, [GAME.md](../GAME.md) | [SPEC_achievements](specs/features/SPEC_achievements.md) **approved** §11 B+C | [design-lab/achievements-progress](../design-lab/achievements-progress/) | [M12 в backlog](backlog/PRODUCT_BACKLOG.md) | **in dev**: BE+тосты ✅; UI: lab → каталог |
| **V2** | Victory v2 (chain tutorial + legacy parallel) | [evolution §II](vision/ideas/tvoy-hod-evolution-after-mvp.md) | [SPEC_victory-v2](specs/features/SPEC_victory-v2.md) **approved** | — | [V2 в backlog](backlog/PRODUCT_BACKLOG.md) | **`implemented`**: [ADR-002](decisions/ADR-002-victory-engine-and-template-config.md), [ADR-004](decisions/ADR-004-mechanics-unlock-victory-chain.md), `MqxGoalDash`; плейтест/баланс целей |
| **Q1** | Качество и релиз (API) | — | [SPEC_quality-release](specs/features/SPEC_quality-release.md) **approved** | — | [PRODUCT_BACKLOG](backlog/PRODUCT_BACKLOG.md) | **implemented** backend: idempotency `0011`, валидация старта, pytest API/MQ-116 |
| **I1** | Страховки: продукт + объект | GAME §1.3 | ⚠ SPEC_insurance-catalog — нет | — | [I1 в backlog](backlog/PRODUCT_BACKLOG.md) | **`implemented` MVP:** buy/claim/cancel + `insured_asset_id` (DL1-130); метрики в UI — backlog |
| **AN1** | Финансовая аналитика игрока (вкладка «Аналитика») | [player-financial-analytics-an1](vision/ideas/player-financial-analytics-an1.md) **approved** | [SPEC_ANALYTICS](specs/SPEC_ANALYTICS.md) **active** | ⚠ `PLAN_analytics` — нет | [AN1 в backlog](backlog/PRODUCT_BACKLOG.md) | **approved** 2026-06-21; стандарты PF/банк; insights BE; без gate E1 |
| **A1** | *(устаревший ID)* | — | → **AN1** | — | — | **renamed → AN1** (коллизия с A0 sub-phase «A1 guidance») |
| **U1** | Frontend MQX / a11y | — | [SPEC_FRONTEND_UI](specs/SPEC_FRONTEND_UI.md) | — | Tasks в spec §Plan | spec active |
| **E1** | Расходы жизнеобеспечения — категории, статьи, burn | [expenses-mechanic](vision/ideas/expenses-mechanic.md) | [EXPENSES_SYSTEM](specs/gameplay/EXPENSES_SYSTEM.md) + [SPEC_expenses](specs/features/SPEC_expenses.md) **draft** | [PLAN_expenses](plans/PLAN_expenses.md) · [PLAN_backlog_may2026](plans/PLAN_backlog_may2026.md) §E1-R | [E1 в backlog](backlog/PRODUCT_BACKLOG.md) | **analytics** (E1-R); реализация после go |
| **T1** | Turn-based период без таймера (TB1) | [turn-based-period-no-timer](vision/ideas/turn-based-period-no-timer.md) | [dashboard UX](ux/screens/dashboard.md) | [PLAN_turn-based-period-no-timer](plans/PLAN_turn-based-period-no-timer.md) | [T1 в backlog](backlog/PRODUCT_BACKLOG.md) | **`implemented`** (hero H2, backend sync_time); TB1.1 чипы плана — backlog |
| **O1** | Онбординг Guided coach (архив) | [onboarding-o1 archive](archive/onboarding-o1/README.md) | → O2 | → O2 | [O1 в backlog](backlog/PRODUCT_BACKLOG.md) | **superseded** → **O2** |
| **O2** | Progressive Guidance (архив) | [onboarding-o2 archive](archive/onboarding-o2/README.md) | → O3 | → O3 | [O2 в backlog](backlog/PRODUCT_BACKLOG.md) | **superseded** → **O3**; core в prod |
| **O3** | Hybrid guidance — spine + триггеры | [onboarding-o3-hybrid-guidance](vision/ideas/onboarding-o3-hybrid-guidance.md) | [SPEC_onboarding-o3](specs/features/SPEC_onboarding-o3.md) **approved** | — | backlog | spec approved 2026-06-05 |
| **PW1** | PWA / standalone + resume (lock/unlock) | [pwa-standalone-channel](vision/ideas/pwa-standalone-channel.md) | ⚠ SPEC_pwa-standalone — нет | [PLAN_pwa-standalone](plans/PLAN_pwa-standalone.md) · [PWA_INSTALL](foundation/PWA_INSTALL.md) | [PW1 в backlog](backlog/PRODUCT_BACKLOG.md) | **in dev** фаза 1 install ✅; PW1-004 ✅ |
| **WD1** | Полноразмерный веб (desktop / wide layout) | [desktop-wide-web-channel](vision/ideas/desktop-wide-web-channel.md) **approved** | ⚠ SPEC_desktop-wide-web — нет | [PLAN_desktop-wide-web](plans/PLAN_desktop-wide-web.md) | [WD1 в backlog](backlog/PRODUCT_BACKLOG.md) | **idea approved** → lab + spec; CA **50–100** |
| **AC1** | Связка аккаунтов TG ↔ email | — | ⚠ нет | [TELEGRAM_BACKLOG](backlog/TELEGRAM_BACKLOG.md) TG-2xx | AC1 в backlog | **отложено**; в фокусе после WD1 v1 |
| **DL1** | Реалистичный долг: граф актив↔долг↔страховка, аннуитет, prepay | [debt-liability-capital-graph](vision/ideas/debt-liability-capital-graph.md) **approved** | [SPEC_debt-liability-capital-graph](specs/features/SPEC_debt-liability-capital-graph.md) **approved** | [PLAN_debt-liability-capital-graph](plans/PLAN_debt-liability-capital-graph.md) | [DL1 в backlog](backlog/PRODUCT_BACKLOG.md) | **`implemented` MVP**; DL1-143 [REVIEW](balance/reports/DL1-143_balance_playtest_2026-06-02.md); manifest baseline не обновлялся |
| **EVT1** | События v2: слоты, informational, global | [event-types-and-taxonomy](vision/ideas/event-types-and-taxonomy.md) | [SPEC_event-system-v2-slots-and-taxonomy](specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) **draft** | — | [EVT1 в backlog](backlog/PRODUCT_BACKLOG.md) | taxonomy `0041` + rebalance ✅; мульти-слот планировщик ⬜ |
| **PLT** | Platform: host, product analytics, TG player, auth | [post-playtest-wave1-two-directions](vision/ideas/post-playtest-wave1-two-directions.md) **approved** | ⚠ PA2 — нет | [PLAN_PLT](plans/PLAN_PLT.md) **approved** · [PLAN_INFRA](plans/PLAN_INFRA.md) draft | [PLT в backlog](backlog/PRODUCT_BACKLOG.md) | **in dev** фаза 1 funnel ✅ |
| **M1.2** | MVP 1.2 — Game для своих | [post-playtest §1.2](vision/ideas/post-playtest-wave1-two-directions.md) | EVT1, V2-BAL (частично) | [PLAN_production-ready](plans/PLAN_production-ready.md) **draft**; [PR-14](plans/PLAN_pr-14-events-spawn-failed.md) · [PR-02](plans/PLAN_pr-02-salary-choose-lock.md) **approved** | [M1.2 в backlog](backlog/PRODUCT_BACKLOG.md) | **approved**; production-ready план DRAFT |
| **M2.0** | ~~MVP 2.0 — Plan для своих~~ | [post-playtest](vision/ideas/post-playtest-wave1-two-directions.md) (баннер ADR-013) | — | — | — | **`cancelled`** 2026-09-07 — [ADR-013](decisions/ADR-013-game-only-drop-plan-mode.md). AN1/E1 A–C живут в Game, не как второй save |
| **GO** | Только Game: снять Plan UI/API | [game-only-drop-plan-mode](vision/ideas/game-only-drop-plan-mode.md) **refined** | канон = ADR-013 | **Очередь:** [PLAN_production-ready](plans/PLAN_production-ready.md); **детали срезов:** [PLAN_game-only](plans/PLAN_game-only.md) | [GO в backlog](backlog/PRODUCT_BACKLOG.md) | **approved**; GO-01/02 = P1 до WAVE1 |

**Статусы:** `idea` → `spec draft` → `spec approved` → `in dev` → `implemented`

### Задачи и `phase` (для агентов)

При появлении `PLAN_*` или `TASKS_*` для эпика:

1. В frontmatter плана: `epic_id` = ID из таблицы выше (`E1`, `M11`, …), `spec`, `next_skill: incremental-implementation`.
2. В каждой задаче MQ-*: `phase` + `skill` + `next_skill` — шаблон [`templates/TASK_SLICE.md`](templates/TASK_SLICE.md).
3. После нарезки — проверить, что колонка **Plan** в этой таблице ссылается на актуальный `PLAN_*.md`.

---

## После G1

1. Продуктовая приёмка при необходимости (sign-off).
2. ~~**Эпик M11:** MQ-116 doc + GAME §0.2~~ — ✅ 2026-05-26 (Task 0.1).
3. **Эпик M12:** design-lab `achievements-progress` → collapsible «Уровень» + страница каталога + Меню; плейтест §16 spec.
4. ~~**Plan Mode**~~ — **cancelled** [ADR-013](decisions/ADR-013-game-only-drop-plan-mode.md); вырезание — эпик **GO**.
5. **Victory v2 (V2):** плейтест порогов и баланс целей в шаблонах (базовый UI целей — ✅).
6. ~~Level gates~~ — сняты; ограничения механик — шаблоны старта ([remove-character-xp](vision/ideas/remove-character-xp-and-levels.md)).
7. **Pre-Alpha (α):** протокол плейтеста 10–20 игроков — [`GAME.md`](../GAME.md) раздел 11.1; черновик протокола — [`foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md).
8. Метка сложности **шаблона** в списке сохранений (без бейджа второго режима).
