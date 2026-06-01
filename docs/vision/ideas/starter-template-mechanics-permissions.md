---
layer: idea
status: implemented
owner: product
last_reviewed: 2026-05-26
implemented: 2026-05-25
related_specs:
  - ../../foundation/SPEC_PRODUCT.md
  - remove-character-xp-and-levels.md
  - ../../decisions/ADR-004-mechanics-unlock-victory-chain.md
---

# Разрешения механик в blueprint шаблона

## Решение

Стартовый шаблон задаёт, какие разделы **«Капитала»** доступны игроку. Дашборд (период, зарплата, подушка) и информационные блоки **Доходы / Расходы** — во всех Game-шаблонах.

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

## Прогрессивная разблокировка `blueprint.mechanics_unlock` (prod)

Помимо статического cap в `mechanics`, шаблон может задать **цепочку выдачи** флагов после выполнения **ключей целей победы** (`victory_config` chain). См. [ADR-004](../../decisions/ADR-004-mechanics-unlock-victory-chain.md).

| Шаблон | Старт | После `tutorial_cushion` | После `tutorial_invest` | После `tutorial_insurance` |
|--------|-------|--------------------------|-------------------------|----------------------------|
| `mq_game_basic_v1` | flows + **invest** | — | — | — |
| Остальные Game | **flows** only | liabilities + invest | insurance | property |

Сиды: `game_starter_templates.py`; prod-БД: `0037_harder_invest_unlock_after_cushion.sql`.

## API

- `GET /api/finance/overview` и `/api/game/bootstrap` → `mechanics: { capital_invest, … }`
- Мутации при выключенной механике → **403** `{ "code": "mechanic_disabled", "mechanic": "…" }`

## Frontend

- `FinancePremium` — скрывает аккордеоны по `overview.mechanics`
- Переход с дашборда «Расходы» → раскрывает блок расходов (локальный state в `CapitalPeriodFlowsBlock`)
