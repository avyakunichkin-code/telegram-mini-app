# APPROVED — events tails-round

**Дата:** 2026-05-29  
**Раунд:** `design-lab/events/tails-round/`

## Решения

| Хвост | Вариант | В prod |
|-------|---------|--------|
| **E2** | **E2-B** — M6 halo на L3 (`mqx-events-card--insurance`) | `events.css`, `EventCard` pulse badge |
| **E5** | **E5-B** — clamp + scroll в пузыре | `events.css`, `EventChoiceButton` без truncate desc |

## Критерии приёмки

- Страховое событие визуально отличимо от обычного L3 без смены слотов.
- Длинный title/description не ломают оверлей; пузырь скроллится внутри.
- `prefers-reduced-motion`: без pulse.
