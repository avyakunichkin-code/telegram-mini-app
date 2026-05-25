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
3. **`GET /api/finance/overview`** (сборка в `finance_overview_build.py`) возвращает блок **`victory`** и **`win_reached`** из движка, не из MVP-хардкода.
4. Формула: `win_reached = period_gate_open AND met_count >= required_goals_met` среди `enabled` целей; `min_period_index_for_victory` по умолчанию **7**.
5. Сиды и fallback — **`victory_seeds.py`**; для `mq_game_basic_v1` допустима **tutorial chain** (`action_once`, `requires_mechanics`).
6. Legacy `evaluate_mvp_victory` остаётся **только для unit-тестов** совместимости MVP.

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
- Code: `backend/app/victory_engine.py`, `finance_overview_build.py`, `profile_victory.py`, `victory_seeds.py`
- Idea: [evolution §II](../vision/ideas/money-quest-evolution-after-mvp.md)
