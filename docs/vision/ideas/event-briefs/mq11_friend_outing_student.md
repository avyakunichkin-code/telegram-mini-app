---
layer: idea
status: approved
owner: product
last_reviewed: 2026-05-29
tracks: events, student-persona
definition_key: mq11_friend_outing_student
tags:
  - tvoy-hod/layer/idea
  - tvoy-hod/status/approved
  - tvoy-hod/topic/events
  - tvoy-hod/topic/student-persona
aliases:
  - "Event brief: Подруга зовёт погулять (Студент)"
  - mq11_friend_outing_student
---
# Event brief: Подруга зовёт погулять (Студент)

## Суть

Подруга приглашает куда-нибудь сходить. Можно отказаться без траты денег.

## Персона

- **Студент** — `mq_game_basic_v1`
- Фильтр до `audience_json`: `forbid_active_asset_kinds_any: [car_personal, car_taxi]`

## Кнопки

| Выбор | cash | needs_delta |
|-------|------|-------------|
| Сходить в кино | −3200 | social +20, health +10, comfort +8 |
| Погулять и кофе | −1400 | social +14, health +6, comfort +4 |
| Отложить — учёба | 0 | social −5 |

## Канон в коде

`data/events/mvp11/social_family.yaml` — [ADR-008](../../decisions/ADR-008-events-catalog-single-source.md).
