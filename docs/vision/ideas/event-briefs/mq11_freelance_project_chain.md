---
tags:
  - tvoy-hod/layer/idea
aliases:
  - "Event Brief — цепочка `mq11_freelance_project_*` (эталон «История»)"
  - mq11_freelance_project_chain
---
# Event Brief — цепочка `mq11_freelance_project_*` (эталон «История»)

**Статус:** реализовано в `data/events/mvp11/chains/freelance_project.yaml`  
**Персона:** студент (`mq_game_basic_v1`)  
**chain_key:** `freelance_project`

## Сюжет

Миша (одногруппник) просит помочь с лендингом к защите стартапа. Контракт **22 000 ₽**: аванс **8 000** или оплата целиком после защиты. Игрок не получает денег на шагах 2–3 — только needs; выплата в informational-эпилоге.

## Расписание (периоды от старта цепочки)

| Шаг | key | `after_periods` | Период (от N) | mandatory |
|-----|-----|-----------------|---------------|-----------|
| 1 | `mq11_freelance_project_offer` | — | N (пул) | нет |
| 2 | `mq11_freelance_project_midperiod` | 2 | N+2 | **blocks_period_end** |
| 3a/3b | `deadline_rush` / `deadline_steady` | 2 | N+4 | **blocks_period_end** |
| 4a/4b | `epilogue_rush` / `epilogue_steady` | 1 | N+5 | нет |

## Ветки

- **payment:** `advance` | `deferred` (шаг 1)
- **prep:** `grill` (шашлыки) → rush deadline | `grind` (проект) → steady deadline
- **context.branch:** `advance_grill`, `deferred_grind`, … — для `requires_chain_branch` в effects

## Экономика

| Параметр | ₽ |
|----------|---|
| Контракт | 22 000 |
| Аванс | 8 000 |
| Остаток | 14 000 |
| Бонус качества (steady epilogue) | 7 700 (35%) |
| Инструмент rush | 6 600 (30% контракта), `purpose: mitigation` |
| Удержание из аванса (rush + advance) | 4 000 → эпилог 10 000, итог 18 000 |

**Разбор 2026-10-21 (PO):** аванс — риск: при спешке Миша удерживает 4 000 ₽, без аванса — 22 000 ₽ целиком;
при качестве итог одинаков (29 700 ₽), аванс просто раньше. Цена «времени» 0.5: путь «шашлыки» ≈ +9 needs
к пути «работа» (0.5 · needs_points(7 700 / 62 500)). Кнопки эпилога внутри ветки одинаковы; «откат» причины —
в `description` первой кнопки («Пять периодов назад вы …»).

## lifecycle

- Шаг 1: **A** (`once_per_profile`)
- Follow-ups: **A** (`once_per_profile`, weight 1)

## needs_axis_map

income_work → **status**, **social**; отдых vs работа — **health**, **comfort**

## Not doing

- Срыв на шаге 3 (удержание из аванса — только в эпилоге rush)
- Отказ после шага 1
- Автопровал

## Движок

- `CHAIN_KEY_BY_DEFINITION`, `active_chain_context` — фильтр кнопок и choose
- `requires_chain_branch` только внутри `effects`
- Pareto: пары с `requires_chain_branch` не сравниваются (`balance_contract.py`)
