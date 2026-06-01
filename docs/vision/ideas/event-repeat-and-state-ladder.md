---
layer: idea
status: approved
owner: product
last_reviewed: 2026-05-30
tracks: events, balance, content-pipeline
---

# Повтор событий, cooldown и state ladder

## Problem Statement

На плейтесте одна и та же карточка (**тариф интернета**, **переезд в квартиру меньше**) выпадала многократно; игрок мог многократно удешевлять жизнь без правдоподобного потолка — баланс и immersion ломаются, расходы «уезжают» в lifestyle-delta без явного пола по категории жилья.

## Recommended Direction

1. **Классификация lifecycle** в авторинге (A/B/C/D) — канон в [`.cursor/skills/create-event/event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) §10.
2. **Контент-фикс (EVT1-105):** `mq11_downsize_flat`, `mq11_home_internet`, `mq11_relocation_bonus` — cooldown / `once_per_profile` / `max_per_profile`.
3. **Движок (EVT1 backlog):** флаги партии `housing_tier`, `internet_tier` + prereq в `prerequisites_json` для класса **C**.
4. **Пол расходов:** floor 0 на `profile_expense_lines` по категории; опционально prereq «уже minimal_housing».

## Классы (кратко)

| Класс | Пример |
|-------|--------|
| A once | релокация с бонусом |
| B cap | downgrade тарифа 1–2 раза за партию, cooldown 12+ |
| C ladder | downsize только если до этого был upgrade |
| D new key | тот же домен, другой текст — anti-fatigue |

## Key Assumptions to Validate

- [ ] После B на downsize событие не выпадает 5+ раз за 15 периодов.
- [ ] Игрок понимает comfort− при повторном downgrade.
- [ ] State ladder C окупает сложность vs только B.

## Not Doing (and Why)

- **Автогенерация YAML из формулы** — отдельная idea MCE; не смешивать с lifecycle.
- **Штраф за пропуск pending** — [`event-engagement-anti-fatigue.md`](event-engagement-anti-fatigue.md) Out.

## Open Questions

- Имена флагов в `GameProfile` / `metadata_json` vs отдельная таблица `event_profile_state`.
- Одна ветка choice с разным `repeat_max` (интернет: upgrade repeatable, downgrade max 1) — отдельные keys или EVT1 choice-level policy.

## Связанные документы

- [`event-choice-balance-tradeoffs.md`](event-choice-balance-tradeoffs.md)
- [`event-engagement-anti-fatigue.md`](event-engagement-anti-fatigue.md)
- [`SPEC_mvp-11-progression-events.md`](../../specs/features/SPEC_mvp-11-progression-events.md) §6 repeat/cooldown
- [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md)
