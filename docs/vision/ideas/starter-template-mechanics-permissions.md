---
layer: idea
status: implemented
owner: product
last_reviewed: 2026-05-24
related_specs:
  - ../../foundation/SPEC_PRODUCT.md
  - remove-character-xp-and-levels.md
---

# Разрешения механик в blueprint шаблона

## Решение

Стартовый шаблон задаёт, какие разделы **«Управление капиталом»** доступны игроку. Дашборд (период, зарплата, подушка) и информационные блоки **Доходы / Расходы** — во всех Game-шаблонах.

## Контракт `blueprint.mechanics`

```json
{
  "mechanics": {
    "capital_invest": true,
    "capital_insurance": false,
    "capital_property": false,
    "capital_liabilities": false
  }
}
```

Отсутствующие ключи для неизвестных шаблонов → все `true`. Preset `mq_game_basic_v1` в `starter_mechanics.TEMPLATE_MECHANICS_PRESETS`.

## API

- `GET /api/finance/overview` и `/api/game/bootstrap` → `mechanics: { capital_invest, … }`
- Мутации при выключенной механике → **403** `{ "code": "mechanic_disabled", "mechanic": "…" }`

## Frontend

- `FinanceSection` — скрывает аккордеоны по `overview.mechanics`
- Переход с дашборда «Расходы» → раскрывает блок расходов (локальный state в `CapitalPeriodFlowsBlock`)
