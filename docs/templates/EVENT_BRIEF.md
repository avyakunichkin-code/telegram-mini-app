# Event Brief — одно событие (шаблон)

Скопируйте блок в `docs/vision/ideas/event-briefs/<definition_key>.md` или в описание задачи перед `/create-event`.

```yaml
definition_key: mq11_<domain>_<slug>     # уникальный; вариант B = новый key
persona: student | professional | both   # см. create-event/persona-profiles.md
title: ""
description: ""
event_domain: consumption                # taxonomy
scenario_shape: soft_offer | mandatory | chain
interaction_kind: choice
event_tier: 1
mode: game
repeat_policy: repeatable
cooldown_periods: 3

prerequisites:                           # опционально; пока нет audience_json в prod
  active_asset_kinds_any: []
  requires_insurance_any: []

choices:
  - title: ""
    effects:
      cash_delta: 0
      needs_delta: { comfort: 0, status: 0, social: 0, health: 0 }
      # monthly_burn_delta_pct: 0.05     # осторожно: от текущего burn профиля

balance_notes: |
  Зарплата персоны, % от salary, влияние на burn, needs_axes приоритет

variant_of: null                         # или mq11_other_key — механика копируется, key новый
approved_in_chat: false
```

## Чеклист перед merge

- [ ] Отдельный `definition_key` (не variants[] в одной записи)
- [ ] Запись в `data/events/mvp11/<domain>.yaml` (`events:`)
- [ ] `prerequisites` / persona: студент не видит «автокредит» без актива
- [ ] `needs_delta` согласован с осями персоны
- [ ] `pytest -q` зелёный (`test_event*`, `test_mvp11_yaml_catalog`)
