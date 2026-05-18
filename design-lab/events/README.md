# Events — оверлей и карточка события

**Статус:** внедрено в `frontend-react/src/components/mqx/events/` (prod-стили `mqx-events-*` уже были в `index.css`).

## Утверждённый паттерн (текущий prod)

| Блок | MQX |
|------|-----|
| Кнопка «События» на hero | `MqxPill` + `events` + `badge` |
| Карточка события | `EventCard` |
| Кнопка выбора | `EventChoiceButton` |
| Оверлей + карусель | `EventCarouselOverlay` |
| Точки / стрелки | `EventCarouselDots`, `EventCarouselNav` |
| Шапка оверлея | `EventOverlayToolbar` |

Логика свайпа и слайдов: хук `useEventCarousel`.

## Витрина

`#/dev/mqx` → **События — pill и карточка**.

## Не делаем (v1)

- Отдельный HTML design-lab (UI уже стабилен в prod)
- Замена `EventsTriggerButton` (legacy TGUI) — используйте `MqxPill`
- Превью анимации карусели в каталоге (только в игре)
