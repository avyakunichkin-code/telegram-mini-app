---
layer: index
status: active
last_reviewed: 2026-11-03
tags:
  - tvoy-hod/layer/index
  - tvoy-hod/status/active
aliases:
  - "Роадмапы направлений"
  - ROADMAPS
---
# Роадмапы направлений

**Задачи владельца:** [ТВОЙ ХОД](game/tasks/index.html) ·
[ТВОЙ ПЛАН](plan/tasks/index.html). Каталоги раздельны; отметки — личная очередь,
не approval или изменение исходного roadmap.

В репозитории три направления ([ADR-016](decisions/ADR-016-two-products-shared-fincore.md)). У каждого свои документы и свой роадмап; общие между ними только ядро и платформа. Что уже сделано по датам — [`CHANGELOG.md`](CHANGELOG.md) (журнал доработок).

| Направление | Цель сейчас | Роадмап | Документы |
|-------------|-------------|---------|-----------|
| **Game** — «ТВОЙ ХОД», игра по финансовой грамотности | Pre-Alpha gate: «можно звать людей». PR-04 required checks подтверждены 2026-11-03; волна 10–20 (PR-16) не закрыта. Временная победа A реализована; C (два акта) — draft. До выкладки остаётся GO SQL-аудит. Дизайн: «Чернильный край» и маскоты B утверждены; новые улучшения — review в lab | [`ROADMAP_GAME.md`](game/ROADMAP.md) (текущая очередь и вопросы) · [`plans/PLAN_production-ready.md`](game/plans/PLAN_production-ready.md) (детали PR-*) · дальний горизонт — [`vision/GAME_DESIGN_ROADMAP_2026.md`](game/vision/GAME_DESIGN_ROADMAP_2026.md) · приоритеты — [`backlog/PRODUCT_BACKLOG.md`](game/backlog/PRODUCT_BACKLOG.md) | весь `docs/`, кроме `docs/plan/`; канон — [`foundation/SPEC_PRODUCT.md`](game/foundation/SPEC_PRODUCT.md) |
| **Plan** — «ТВОЙ ПЛАН», семейный финансовый чекап | Продуктовый каркас P2 (с 2026-11-02, [ADR-017](decisions/ADR-017-plan-p2-without-game-gate.md)): `platform`, БД `plan`, вход, ui-kit, CI; P0 закрыт 2026-10-28 | [`plan/ROADMAP.md`](plan/ROADMAP.md) | [`plan/`](plan/README.md) |
| **Ядро** — `packages/fincore`, `packages/platform` | Фазы 0–2 ✅ (fincore, SPL-101…208); `platform`: SPL-302 ✅ 2026-11-02 (аддитивно, потребитель — plan-api); SPL-301 (игра на `platform`) ⬜ | [`plans/PLAN_game-plan-split.md`](plans/PLAN_game-plan-split.md) (фазы 0–3) | [ADR-016](decisions/ADR-016-two-products-shared-fincore.md), [`packages/fincore/README.md`](../packages/fincore/README.md) |

## Как направления связаны

- **Game → Plan:** с 2026-11-02 продуктовый каркас Plan (P2) gate игры не ждёт ([ADR-017](decisions/ADR-017-plan-p2-without-game-gate.md), поправка D4). Plan не импортирует и не меняет `backend/` и `frontend-react/`, кроме выноса примитивов MQX в `packages/ui-kit` (SPL-403) с зелёными проверками игры. Реальные пользователи и деплой Plan — после юриста по ПДн и решения PO.
- **Ядро → оба:** изменение `fincore` проверяется golden-тестами и balance diff игры; Plan добавляет в ядро только аддитивные поля.
- **Plan → Ядро:** `platform` (JWT, БД, health) нужен Plan в P2 (SPL-402), поэтому SPL-302 — предусловие P2.

## Куда класть новое

| Что | Куда |
|-----|------|
| Идея, spec или план игры | `docs/game/vision/ideas/`, `docs/game/specs/features/`, `docs/plans/` — как раньше ([`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)) |
| Идея, spec или план Plan | `docs/plan/vision/`, `docs/plan/specs/`, `docs/plan/plans/`; этапы — в [`plan/ROADMAP.md`](plan/ROADMAP.md) |
| Решение, затрагивающее оба продукта или ядро | ADR в `docs/decisions/` + срез в [`PLAN_game-plan-split`](plans/PLAN_game-plan-split.md) |

## Дизайн: что в работе

| Что | Статус | Где |
|-----|--------|-----|
| Канон игры — ★ BG-1…BG-3, превью конца хода (PR-07) | ✅ в prod | [`design-lab/board-game/APPROVED.md`](../design-lab/board-game/APPROVED.md) |
| «Чернильный край» (необрутализм A) | ✅ утверждён 2026-11-03; существующий слой `ink.css`, покрытие не расширяется автоматически | там же, ★ BG-4 (история — «Пробное внедрение») |
| Портреты персонажей и предметы-напарники B «Мягкий объём» | ✅ утверждены и внедрены; другие предложения по Монетке/Квите не получают approval автоматически | [`design-lab/mascots/`](../design-lab/mascots/), idea [`persona-companions`](game/vision/ideas/persona-companions.md) |
| Дизайн-система MQX v3 | 🟡 цель; в prod перенесены токены движения, алиасы legacy, храповик стилевого долга | [`design/claude-design-system/`](../design/README.md) |
| Plan — «Бенто» | ✅ в прототипе | [`apps/plan-web/src/styles.css`](../apps/plan-web/src/styles.css) |

Сверка 2026-11-03: «Чернильный край» утверждён PO, пары B «Мягкий объём» уже внедрены ([канон](../design-lab/mascots/APPROVED.md)). Это не утверждает автоматически отдельные предложения по Монетке до выбора роли. Новые варианты улучшения интерфейса — [review](../design-lab/board-game/ink-refinement-round/README.md).
