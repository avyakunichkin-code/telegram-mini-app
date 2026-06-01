# Period close — итог месяца

Статичная витрина: **5 вариантов** UI + демо **механики** (авто до 3-го периода, хвостик с 4-го).

```bash
cd design-lab/period-close
npx serve .
```

Открыть `http://localhost:3000/` (или порт serve).

## Управление

- **Слайдер «Закрыт период №»** — переключает авто-оверлей vs только хвостик.
- Кнопки **«Открыть итог»** / **«Закрыть»** на каждом варианте.
- Тема светлая / тёмная.

## Файлы

| Файл | Назначение |
|------|------------|
| [VARIANTS.md](./VARIANTS.md) | Таблица вариантов, механика, задел API |
| [index.html](./index.html) | Макеты A–E в phone frame |
| [styles.css](./styles.css) | Стили (MQ-токены) |
| [lab.js](./lab.js) | Слайдер периода, открытие панелей |

## Текущий prod

[`PeriodCloseModal.jsx`](../../frontend-react/src/components/PeriodCloseModal.jsx) — полноэкранный modal + длинные списки breakdown.
