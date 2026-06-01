# APPROVED: Портреты персонажей (4 жизни)

**Дата:** 2026-06-01  
**Раунд:** `design-lab/game-templates/persona-portraits-round/`  
**Prod:** `MqxStarterScenarioPicker` (`usePersonaPortraits`), `MqxNeedsDash`, `frontend-react/src/assets/character-portraits/`

## Утверждено

| Персонаж | template_key | Атрибуты |
|----------|--------------|----------|
| Студент | `mq_game_basic_v1` | худи, рюкзак |
| Профессионал | `mq_game_tight_budget_v1` | рубашка, сумка; причёска с пробором |
| Руководитель | `mq_game_mortgage_stress_v1` | пиджак, планшет; деловая стрижка |
| Предприниматель | `mq_game_debt_stack_v1` | 6 рук: телефон, кофе, ноут, папка, ручка, портфель |

## Размеры (pipeline)

`frontend-react/scripts/process-persona-portraits.py` — trim, **normalize silhouette height**, export:

- `*-mascot-pick` — 56px
- `*-mascot-md` — 72px
- `*-mascot-dash` — 108px
- `*-mascot.png` / `.webp` — master

## Инварианты

- Один стиль MQX; **разные** лица/причёски/реквизит.
- Прозрачный фон, без лишних полей.
- SVG I-Scene на шаге 2 — архив; портреты — канон иконки карточки.
