---
layer: index
status: active
last_reviewed: 2026-11-10
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
aliases:
  - "Роадмапы направлений"
  - ROADMAPS
---
# Роадмапы направлений

В репозитории три направления ([ADR-016](decisions/ADR-016-two-products-shared-fincore.md)). У каждого свои документы и свой роадмап; общие между ними только ядро и платформа. Что уже сделано по датам — [`CHANGELOG.md`](../game/docs/CHANGELOG.md) (журнал доработок).

| Направление | Цель сейчас | Роадмап | Документы |
|-------------|-------------|---------|-----------|
| **Game** — «ТВОЙ ХОД», игра по финансовой грамотности | Pre-Alpha gate: «можно звать людей». P0 по коду — 10/10; следующий P1 — PR-16, волна 10–20. Владелец подтвердил, что новую волну не проводили; PR-15 материалы есть, но канал/форма/трекер/модератор и pin билда не заполнены; PR-09 freeze нужно проверить. Детали и текущие gates — [`PRE_ALPHA_WAVE1_OPS`](../game/docs/foundation/PRE_ALPHA_WAVE1_OPS.md). Победа: калибровка A в `main` (PR #16; `action_once` — PR #19); два акта — spec/plan [`PLAN_victory-acts`](../game/docs/plans/PLAN_victory-acts.md) DRAFT, цель акта 2 требует решения. GO-02…04 реализованы локально; до выкладки нужен SQL-аудит старых Plan-профилей, GO-05 опционален. Дизайн: ★ «Чернильный край» и маскоты ink утверждены 2026-11-02 (`game/design-lab/board-game/APPROVED.md`); перенос утверждённых маскотов в prod в работе | [`plans/PLAN_production-ready.md`](../game/docs/plans/PLAN_production-ready.md) · дальний горизонт — [`vision/GAME_DESIGN_ROADMAP_2026.md`](../game/docs/vision/GAME_DESIGN_ROADMAP_2026.md) · приоритеты — [`backlog/PRODUCT_BACKLOG.md`](../game/docs/backlog/PRODUCT_BACKLOG.md) | `game/docs/`; канон — [`foundation/SPEC_PRODUCT.md`](../game/docs/foundation/SPEC_PRODUCT.md) |
| **Plan** — «ТВОЙ ПЛАН», семейный финансовый чекап | Продуктовый каркас P2 (с 2026-11-02, [ADR-017](decisions/ADR-017-plan-p2-without-game-gate.md)): `platform`, БД `plan`, вход, ui-kit, CI; P0 закрыт 2026-10-28 | [`plan/ROADMAP.md`](../plan/docs/ROADMAP.md) | [`plan/`](../plan/docs/README.md) |
| **Ядро** — `shared/packages/fincore`, `shared/packages/platform` | Фазы 0–2 ✅ (fincore, SPL-101…208); `platform`: SPL-302 ✅ 2026-11-02 (аддитивно, потребитель — plan-api); SPL-301 (игра на `platform`) ⬜ | [`plans/PLAN_game-plan-split.md`](plans/PLAN_game-plan-split.md) (фазы 0–3) | [ADR-016](decisions/ADR-016-two-products-shared-fincore.md), [`shared/packages/fincore/README.md`](../shared/packages/fincore/README.md) |

## Как направления связаны

- **Game → Plan:** с 2026-11-02 продуктовый каркас Plan (P2) gate игры не ждёт ([ADR-017](decisions/ADR-017-plan-p2-without-game-gate.md), поправка D4). Plan не импортирует и не меняет `game/api/` и `game/web/`, кроме выноса примитивов MQX в `shared/packages/ui-kit` (SPL-403) с зелёными проверками игры. Реальные пользователи и деплой Plan — после юриста по ПДн и решения PO.
- **Ядро → оба:** изменение `fincore` проверяется golden-тестами и balance diff игры; Plan добавляет в ядро только аддитивные поля.
- **Plan → Ядро:** `platform` (JWT, БД, health) нужен Plan в P2 (SPL-402), поэтому SPL-302 — предусловие P2.

## Куда класть новое

| Что | Куда |
|-----|------|
| Идея, spec или план игры | `game/docs/vision/ideas/`, `game/docs/specs/features/`, `docs/plans/` — как раньше ([`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)) |
| Идея, spec или план Plan | `plan/docs/vision/`, `plan/docs/specs/`, `plan/docs/plans/`; этапы — в [`plan/ROADMAP.md`](../plan/docs/ROADMAP.md) |
| Решение, затрагивающее оба продукта или ядро | ADR в `docs/decisions/` + срез в [`PLAN_game-plan-split`](plans/PLAN_game-plan-split.md) |

## Дизайн: что в работе

| Что | Статус | Где |
|-----|--------|-----|
| Канон игры — ★ BG-1…BG-3, превью конца хода (PR-07) | ✅ в prod | [`game/design-lab/board-game/APPROVED.md`](../game/design-lab/board-game/APPROVED.md) |
| «Чернильный край» (необрутализм A) | ✅ ★ 2026-11-02, единственный стиль prod: правила влиты в CSS блоков, переключатель `?style=classic` и слой `ink.css` сняты; экраны до партии — ★ BG-2 | там же, раздел «★ Стиль «Чернильный край»» и инварианты |
| Маскоты: Монетка на ободе, Квитя, напарники персонажей, Монетка до выбора роли | 🟡 review в lab | [`game/design-lab/mascots/`](../game/design-lab/mascots), idea [`persona-companions`](../game/docs/vision/ideas/persona-companions.md) |
| Дизайн-система MQX v3 | 🟡 цель; в prod перенесены токены движения, алиасы legacy, храповик стилевого долга | [`game/design/classic-v3/`](../game/design/README.md) |
| Plan — «Бенто» | ✅ в прототипе | [`plan/web/src/styles.css`](../plan/web/src/styles.css) |

Решения, которые ждут PO: утвердить маскотов и напарников (перенос `pregame-monetka` меняет канон BG-2).
