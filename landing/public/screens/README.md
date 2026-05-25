# Скрины UI для лендинга

| Файл | Тема UI | Использование на лендинге |
|------|---------|---------------------------|
| `dashboard-light.png` | светлая | Тёмные секции — **кроп** через `object-position` |
| `dashboard-dark.png` | тёмная | Резерв для светлых секций |
| `events-light.png` | светлая | Блок событий (кроп карточки) |
| `events-dark.png` | тёмная | Резерв |
| `capital-light.png` | светлая | Блок капитала (кроп аккордеонов) |
| `capital-dark.png` | тёмная | Резерв |

Кадрирование задаётся в `landing/src/scripts/screens.js` (`UI_FOCUS`: `dashboard.period`, `capital.summary`, …), не отдельными файлами.

**Пересъём** после смены MQX в design-lab:

```bash
cd landing
node scripts/capture-screens.mjs
```

Источник: `design-lab/dashboard` (S5), `design-lab/events/layout-round` (L1), `design-lab/capital-page` (#phone-demo).
