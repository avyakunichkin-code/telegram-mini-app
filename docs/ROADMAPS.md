---
layer: index
status: active
last_reviewed: 2026-10-29
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
aliases:
  - "Роадмапы направлений"
  - ROADMAPS
---
# Роадмапы направлений

В репозитории три направления ([ADR-016](decisions/ADR-016-two-products-shared-fincore.md)). У каждого свои документы и свой роадмап; общие между ними только ядро и платформа. Что уже сделано по датам — [`CHANGELOG.md`](CHANGELOG.md) (журнал доработок).

| Направление | Цель сейчас | Роадмап | Документы |
|-------------|-------------|---------|-----------|
| **Game** — «ТВОЙ ХОД», игра по финансовой грамотности | Pre-Alpha gate: «можно звать людей». P0 — 9 из 10 по коду (осталось включить required checks в GitHub, PR-04); дальше P1: волна 10–20 (PR-16), акт 1 победы и INV-1 (PR-18), хвост GO-02…05. Дизайн: пробный стиль «Чернильный край» и маскоты — до решения после игры | [`plans/PLAN_production-ready.md`](plans/PLAN_production-ready.md) (P0–P2 до α) · дальний горизонт — [`vision/GAME_DESIGN_ROADMAP_2026.md`](vision/GAME_DESIGN_ROADMAP_2026.md) · приоритеты — [`backlog/PRODUCT_BACKLOG.md`](backlog/PRODUCT_BACKLOG.md) | весь `docs/`, кроме `docs/plan/`; канон — [`foundation/SPEC_PRODUCT.md`](foundation/SPEC_PRODUCT.md) |
| **Plan** — «ТВОЙ ПЛАН», семейный финансовый чекап | Рабочий прототип: P0 закрыт 2026-10-28 (дизайн-система прототипа — «Бенто»), дальше — решение по P1 (проверка на людях) | [`plan/ROADMAP.md`](plan/ROADMAP.md) | [`plan/`](plan/README.md) |
| **Ядро** — `packages/fincore`, `packages/platform` | Фазы 0–2 ✅ (fincore, SPL-101…208); `platform` (SPL-301/302) — после P0 игры, предусловия PR-05/PR-08 выполнены | [`plans/PLAN_game-plan-split.md`](plans/PLAN_game-plan-split.md) (фазы 0–3) | [ADR-016](decisions/ADR-016-two-products-shared-fincore.md), [`packages/fincore/README.md`](../packages/fincore/README.md) |

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

## Дизайн: что в работе

| Что | Статус | Где |
|-----|--------|-----|
| Канон игры — ★ BG-1…BG-3, превью конца хода (PR-07) | ✅ в prod | [`design-lab/board-game/APPROVED.md`](../design-lab/board-game/APPROVED.md) |
| «Чернильный край» (необрутализм A) | 🟡 пробно в prod слоем `ink.css`, по умолчанию включён; не тронуты Аналитика, Меню, онбординг | там же, раздел «Пробное внедрение» |
| Маскоты: Монетка на ободе, Квитя, напарники персонажей, Монетка до выбора роли | 🟡 review в lab | [`design-lab/mascots/`](../design-lab/mascots/), idea [`persona-companions`](vision/ideas/persona-companions.md) |
| Дизайн-система MQX v3 | 🟡 цель; в prod перенесены токены движения, алиасы legacy, храповик стилевого долга | [`design/claude-design-system/`](../design/README.md) |
| Plan — «Бенто» | ✅ в прототипе | [`apps/plan-web/src/styles.css`](../apps/plan-web/src/styles.css) |

Решения, которые ждут PO: ★ или откат «Чернильного края» после игры; утвердить маскотов и напарников (перенос `pregame-monetka` меняет канон BG-2).
