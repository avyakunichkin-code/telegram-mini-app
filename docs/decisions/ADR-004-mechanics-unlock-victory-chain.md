---
status: accepted
date: 2026-05-25
deciders: продукт / разработка (синхронизация docs ↔ prod)
---

# ADR-004: Разблокировка механик по цепочке целей победы

## Context

После Victory v2 (ADR-002) и tutorial-цепочки (`action_once` в `victory_config_json`) игрокам нужен **предсказуемый порядок** открытия разделов «Управление капиталом»: сначала потоки, затем подушка → инвестиции → страховки → недвижимость.

Ранее документация описывала только статический `blueprint.mechanics` (все флаги сразу на `mq_game_basic_v1`) или гейты по **character level** (сняты в ADR-003).

## Decision

1. В **`blueprint_json.mechanics_unlock`** хранить упорядоченный список шагов:
   ```json
   { "after_goal": "<goal_key>|null", "grant": ["capital_flows", "capital_invest", ...] }
   ```
2. Эффективные флаги `overview.mechanics` считает **`starter_mechanics.compute_mechanics_effective`**: базовый cap из `blueprint.mechanics` ∩ выданные `grant` по **уже выполненным** ключам целей (`chain_met_keys` из движка победы).
3. Для шаблонов **Профессионал / Руководитель / Предприниматель** (не `mq_game_basic_v1`):
   - старт: только **`capital_flows`**;
   - после **`tutorial_cushion`**: `capital_liabilities`, `capital_invest`;
   - после **`tutorial_invest`**: `capital_insurance`;
   - после **`tutorial_insurance`**: `capital_property`.
4. **`mq_game_basic_v1`:** инвестиции доступны с первого периода (`capital_flows` + `capital_invest` на `after_goal: null`) — упрощённый онбординг «Студент».
5. Миграция **`0037_harder_invest_unlock_after_cushion.sql`** приводит prod-БД к п.3; сиды в **`game_starter_templates.py`** — источник для новых окружений.

## Consequences

- UI и API 403 `mechanic_disabled` согласованы с **прогрессом целей**, а не с уровнем персонажа.
- Порядок целей в `victory_config` и шаги `mechanics_unlock` должны меняться **вместе** (контент-пакет).
- Документы про «MVP AND победа» и «инвестиции с уровня N» устарели — см. ADR-002, [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md).

## Alternatives considered

1. **Все механики сразу на всех шаблонах** — отклонено: перегруз L3 на старте жёстких сценариев.
2. **Отдельная таблица unlock_steps** — отклонено на v2: JSON в blueprint достаточен.
3. **Гейты только на фронте** — отклонено: сервер обязан отклонять мутации (ADR-003).

## Связанные артефакты

- Code: `backend/app/starters/mechanics.py`, `backend/app/victory/mechanics_progression.py`, `victory/engine.py` (`chain_met_keys`)
- Seeds: `backend/app/seeds/game_starter_templates.py`
- Migrations: `0036_victory_invest_goal_order.sql`, `0037_harder_invest_unlock_after_cushion.sql`
- Idea: [`starter-template-mechanics-permissions.md`](../vision/ideas/starter-template-mechanics-permissions.md)
- Spec: [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md) (tutorial chain)
