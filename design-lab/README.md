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
| [shell/](shell/) | **варианты A/B/C** — обсуждение | Дашборд main; `cd shell && npx serve .` |
| `dashboard/` | план | Герой, stat-блоки |
| [events/](events/) | **внедрено в prod** | EventCard, EventCarouselOverlay, MqxPill |

## Как работать

```bash
cd design-lab/<тема>
npx serve .
```

В `README.md` каждой темы — таблица вариантов A, B, C… и что утверждено.

**Живой каталог после утверждения:** `npm run dev` → `#/dev/mqx`.
