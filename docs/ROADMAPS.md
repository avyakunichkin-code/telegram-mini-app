---
layer: index
status: active
last_reviewed: 2026-10-27
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
aliases:
  - "Роадмапы направлений"
  - ROADMAPS
---
# Роадмапы направлений

В репозитории три направления ([ADR-016](decisions/ADR-016-two-products-shared-fincore.md)). У каждого свои документы и свой роадмап; общие между ними только ядро и платформа.

| Направление | Цель сейчас | Роадмап | Документы |
|-------------|-------------|---------|-----------|
| **Game** — «ТВОЙ ХОД», игра по финансовой грамотности | Pre-Alpha gate: «можно звать людей» | [`plans/PLAN_production-ready.md`](plans/PLAN_production-ready.md) (P0–P2 до α) · дальний горизонт — [`vision/GAME_DESIGN_ROADMAP_2026.md`](vision/GAME_DESIGN_ROADMAP_2026.md) · приоритеты — [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) | весь `docs/`, кроме `docs/plan/`; канон — [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) |
| **Plan** — «ТВОЙ ПЛАН», семейный финансовый чекап | Рабочий прототип: P0 закрыт 2026-10-28, дальше — решение по P1 (проверка на людях) | [`plan/ROADMAP.md`](plan/ROADMAP.md) | [`plan/`](plan/README.md) |
| **Ядро** — `packages/fincore`, `packages/platform` | `platform` (SPL-301/302) после P0 игры | [`plans/PLAN_game-plan-split.md`](plans/PLAN_game-plan-split.md) (фазы 0–3) | [ADR-016](decisions/ADR-016-two-products-shared-fincore.md), [`packages/fincore/README.md`](../packages/fincore/README.md) |

## Как направления связаны

- **Game → Plan:** продуктовые этапы Plan (P2+) ждут Pre-Alpha gate игры. Прототип Plan (P0–P1) gate не ждёт, но и не трогает `backend/` и `frontend-react/` (D4, ред. 2026-10-27).
- **Ядро → оба:** изменение `fincore` проверяется golden-тестами и balance diff игры; Plan добавляет в ядро только аддитивные поля.
- **Plan → Ядро:** `platform` (JWT, БД, health) нужен Plan в P2 (SPL-402), поэтому SPL-302 — предусловие P2.

## Куда класть новое

| Что | Куда |
|-----|------|
| Идея, spec или план игры | `docs/vision/ideas/`, `docs/specs/features/`, `docs/plans/` — как раньше ([`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)) |
| Идея, spec или план Plan | `docs/plan/vision/`, `docs/plan/specs/`, `docs/plan/plans/`; этапы — в [`plan/ROADMAP.md`](plan/ROADMAP.md) |
| Решение, затрагивающее оба продукта или ядро | ADR в `docs/decisions/` + срез в [`PLAN_game-plan-split`](plans/PLAN_game-plan-split.md) |
