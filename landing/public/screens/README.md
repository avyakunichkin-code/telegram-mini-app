# Скрины UI для лендинга

| Файл | Тема UI | Использование на лендинге |
|------|---------|---------------------------|
| `dashboard-light.png` | светлая | Тёмные секции (hero, peek, features) |
| `dashboard-dark.png` | тёмная | Светлые секции (#how, #learn) |
| `events-light.png` | светлая | Лента «Интерфейс», features |
| `events-dark.png` | тёмная | Светлые секции (опционально) |
| `capital-light.png` | светлая | Лента «Интерфейс», features |
| `capital-dark.png` | тёмная | Светлые секции (опционально) |

**Пересъём** после смены MQX в design-lab:

```bash
cd landing
node scripts/capture-screens.mjs
```

Источник: `design-lab/dashboard` (S5), `design-lab/events/layout-round` (L1), `design-lab/capital-page` (#phone-demo).
