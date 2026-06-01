---
status: accepted
date: 2026-05-24
deciders: проект (architecture-review retroactive, 2026-05-25)
---

# ADR-002: Движок победы v2 и `victory_config_json` в шаблонах

## Context

После G1 победа MVP была захардкожена в `evaluate_mvp_victory` (AND трёх условий). Продукт требует **разные планки победы по шаблонам Game** (M из N целей, ранний запрет периодов 1–6, учебная цепочка на базовом шаблоне).

Поля `avg_net_cashflow_6p` в overview уже отдавались, но не участвовали в `win_reached` единообразно.

## Decision

1. Хранить конфигурацию победы в **`game_starter_templates.victory_config_json`** (`schema_version: 1`).
2. Единый движок **`victory_engine.evaluate_victory`** + сбор снимка **`victory_snap.build_victory_evaluation_input`**.
3. **`GET /api/finance/overview`** (сборка в `finance/overview_build.py`) возвращает блок **`victory`** и **`win_reached`** из движка, не из MVP-хардкода.
4. **Два режима оценки** (`progression_mode` в JSON):
   - **`parallel`** (legacy / откат): `win_reached = period_gate_open AND met_count >= required_goals_met` среди `enabled` целей.
   - **`chain`** (prod, `playtest_mode: tutorial`): цели идут **цепочкой** — шаг *n* засчитывается только после *n−1*; `win_reached = period_gate_open AND все enabled-цели цепочки выполнены`. Поле `required_goals_met` в chain-режиме **не** ограничивает победу (длина цепочки = знаменатель).
5. `min_period_index_for_victory` по умолчанию **7** (`MIN_PERIOD_INDEX_FOR_WIN` в `backend/app/game/rules.py`).
6. Сиды и fallback — **`victory/seeds.py`**; prod-конфиги: tutorial chain на всех четырёх шаблонах; откат — `VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY` (`progression_mode: parallel`).
7. Legacy `evaluate_mvp_victory` (AND подушка + просрочка + cashflow) — **только unit-тесты**, не overview.
8. Миграции контента: `0036_victory_invest_goal_order.sql`, связка с [ADR-004](ADR-004-mechanics-unlock-victory-chain.md).

## Consequences

- Баланс меняется правкой JSON в шаблоне без изменения Python (кроме новых `type` целей).
- Нужны миграции сидов (`0010_*`, `0027_*`, …) и тесты `test_victory_engine.py`.
- UI должен читать **`overview.victory`** — отдельный backlog (не блокирует backend).
- **Breaking:** клиенты, ожидавшие только три MVP-флага, должны учитыть переменное число целей.

## Alternatives considered

1. **Оставить MVP AND в `finance.py`** — отклонено: не масштабируется на 4+ шаблона.
2. **Отдельная таблица victory_goals** — отклонено на v2.0: JSON в шаблоне достаточен для MVP объёма контента.
3. **Победа только на фронте** — отклонено: сервер — источник правды.

## Связанные артефакты

- Spec: [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md)
- Code: `backend/app/victory/engine.py`, `backend/app/finance/overview_build.py`, `backend/app/victory/profile.py`, `backend/app/victory/seeds.py` — структура [ADR-007](ADR-007-backend-domain-packages.md)
- ADR: [ADR-004](ADR-004-mechanics-unlock-victory-chain.md) — `mechanics_unlock` ↔ цели цепочки
- Idea: [evolution §II](../vision/ideas/tvoy-hod-evolution-after-mvp.md)
