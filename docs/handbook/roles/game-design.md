---
layer: handbook
status: active
role: game-design
last_reviewed: 2026-05-30
---

# Геймдизайн — guide

## Зачем читать

Механики, баланс, события, потребности, тон — **что игрок чувствует и почему**.

## Маршрут

1. [`GAME.md`](GAME.md) — core loop, механики, потребности  
2. [`EVENTS.md`](EVENTS.md) — **события:** trade-off, потребности, повторы (публично)  
3. [`EVENTS_TERMS_RU.md`](EVENTS_TERMS_RU.md) — коды полей и слоты (spec/партнёр)  
4. [`../../foundation/TARGET_PLAYER_AND_SESSION.md`](../../foundation/TARGET_PLAYER_AND_SESSION.md) — ЦА 30+, язык, табу §3  
3. [`../ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md) — **только** маппинг шаблон → мотивация (не копировать маркетинговые профили в события)  
4. [`../../specs/features/SPEC_mvp-11-progression-events.md`](../../specs/features/SPEC_mvp-11-progression-events.md)  
5. [`../../ux/CHARACTER_NEEDS_UX.md`](../../ux/CHARACTER_NEEDS_UX.md) + [`../../ux/screens/`](../../ux/screens/)  
6. [`../../decisions/ADR-009-metrics-dictionary-tb1.md`](../../decisions/ADR-009-metrics-dictionary-tb1.md) — **не путать** cashflow и burn  
7. Каталог: [`data/events/mvp11/`](../../../data/events/mvp11/)  
8. Authoring / анализ: [`../../agents/EVENTS_AGENT.md`](../../agents/EVENTS_AGENT.md)  
9. Баланс симуляции: [`../../balance/README.md`](../../balance/README.md), [`../../balance/THRESHOLDS.md`](../../balance/THRESHOLDS.md)  

## Шаблон старта ↔ мотивация (для сегментации, гип.)

| Игровой шаблон (прокси) | Типичный сигнал в advisor-воронке |
|-------------------------|-----------------------------------|
| Профессионал / ипотека | «Архитектор порядка» — картина, 75k |
| Долги / просрочка | «После шока» — стабилизация, 45k |
| Много партий, высокий доход (опрос) | «Второе мнение» |

Персонализация оффера по game over cash vs needs — §9.2 [`ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md).

## Инструменты агента

- `/create-event` — новые события  
- `/event-analysis` — аудит каталога  
- `/balance-playtest` — симуляция 30–40 периодов  

## TBD

- Единый doc «тон событий» (сейчас размазан: TARGET_PLAYER, brandbook, event briefs)  
- Карта цепочек событий (partial в YAML)  
