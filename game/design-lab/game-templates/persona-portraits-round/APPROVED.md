# APPROVED: Портреты персонажей (4 жизни)

**Дата:** 2026-06-01  
**Раунд:** `game/design-lab/game-templates/persona-portraits-round/`  
**Prod:** `MqxStarterScenarioPicker` (`usePersonaPortraits`), `MqxNeedsDash`, `game/web/src/assets/character-portraits/`

## Утверждено

| Персонаж | template_key | Атрибуты |
|----------|--------------|----------|
| Студент | `mq_game_basic_v1` | худи, рюкзак |
| Профессионал | `mq_game_tight_budget_v1` | рубашка, сумка; причёска с пробором |
| Руководитель | `mq_game_mortgage_stress_v1` | пиджак, планшет; деловая стрижка |
| Предприниматель | `mq_game_debt_stack_v1` | 6 рук: телефон, кофе, ноут, папка, ручка, портфель |

## Размеры (pipeline)

`game/web/scripts/process-persona-portraits.py` — trim, **normalize silhouette height**, export:

- `*-mascot-pick` — 56px
- `*-mascot-md` — 72px
- `*-mascot-dash` — 108px
- `*-mascot.png` / `.webp` — master

## Инварианты

- Один стиль MQX; **разные** лица/причёски/реквизит.
- Прозрачный фон, без лишних полей.
- SVG I-Scene на шаге 2 — архив; портреты — канон иконки карточки.

## Текущие портреты игры

Макеты этого раунда фиксируют исторический набор `*-mascot`. Компоненты на базе
`personaPortraits.js` используют [портреты v3 с лендинга](../../../design/archive/landing-v3-portraits/README.md).
В стартовом потоке B выбор роли и знакомство с напарником используют
[актуальные портреты для медиа](../../../design/system/CURRENT_STYLE.md#портреты-ролей-для-медиа).
