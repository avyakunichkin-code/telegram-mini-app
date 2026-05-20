# Design lab

Статичные HTML-витрины для **этапа 1** процесса MQX: рисуем варианты → выбираем → утверждаем → только потом React в приложении.

Правила: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).

## Папки

| Папка | Статус | Содержание |
|-------|--------|------------|
| [asset-cards/](asset-cards/) | внедрено в prod | Карточки активов |
| [invest-forms/](invest-forms/) | внедрено в prod | Формы депозита / облигаций |
| [primitives/](primitives/) | **утверждено → prod** | Гибрид D+C+B/A; в `mqx/primitives/` |
| [finance-insurance/](finance-insurance/) | **внедрено в prod** | B: каталог 2×2 + тарифы; карточки asset H |
| [dashboard/](dashboard/) | **этап 1** | Main: V0 = prod, L1–L3 раскладка; `cd dashboard && npx serve .` |
| [events/](events/) | **внедрено в prod** | EventCard, EventCarouselOverlay, MqxPill |
| [row-actions/](row-actions/) | **B + F2 → prod** | MqxRowAction (корзина по умолчанию), MqxFinListRow, confirm; порядок метрик — в spec |
| [capital-page/](capital-page/) | **IA утверждена → вариант A/B на выбор** | 5 табов, бюджет №2, имущество/обязательства строками |
| [onboarding-guided/](onboarding-guided/) | **★ утверждён** → MQX | Guided coach, 5 шагов, spotlight |
| [auth-flow/](auth-flow/) | **★ B → prod** | Вход / регистрация (Монетка) |
| [new-game-mode/](new-game-mode/) | **★ B → prod** | Шаг 1: имя + Игра / План |
| [game-templates/](game-templates/) | **★ B → prod** | Шаг 2: каталог + быстрый старт |
| [start-menu/](start-menu/) | **★ B → prod** | Меню сохранений после входа |
| [onboarding-brief/](onboarding-brief/) | superseded | ~~Mission Brief 3 карточки + видео~~ |

## Как работать

```bash
cd design-lab/<тема>
npx serve .
```

В `README.md` каждой темы — таблица вариантов A, B, C… и что утверждено.

**Живой каталог после утверждения:** `npm run dev` → `#/dev/mqx`.
