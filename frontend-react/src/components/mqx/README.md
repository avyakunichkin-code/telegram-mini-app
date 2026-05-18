# MQX — UI kit Money Quest

Канонические React-компоненты финансового UI (метрики с иконками, карточки портфеля, формы инвестиций).

**Процесс работы:** сначала варианты в `design-lab/` → выбор → утверждение → MQX → prod. Подробно: [`DESIGN_WORKFLOW.md`](./DESIGN_WORKFLOW.md).

## Как смотреть все компоненты

**Рекомендуемый способ (living catalog):** в dev-сборке откройте

```text
http://localhost:5173/#/dev/mqx
```

(или ваш `VITE` URL + `#/dev/mqx`). Маршрут **не попадает в production** (`import.meta.env.DEV`).

**Статические эксперименты до переноса в код:** `design-lab/asset-cards`, `design-lab/invest-forms`.

## Структура

```text
mqx/
  icons/FinanceMetricIcons.jsx   — монеты, ↓ ↑ %
  metrics/                       — MetricInlineItem, *Metrics
  layout/                        — CapitalPositionCard, InvestPositionRow
  catalog/MqCatalogScreen.jsx    — витрина (dev)
  index.js                       — barrel export
```

## Правила

| Контекст | Иконки |
|----------|--------|
| Шаблоны / позиции активов | монеты, ↓ обслуживание, ↑ доход |
| Шаблоны / позиции долгов | монеты (тело), ↓ платёж, **% красный** |
| Позиции депозита/облигации | монеты, **% зелёный**, ↑ доход за период |
| Формы депозита/облигации | без иконок метрик; chip ставки справа |

Импорт в экранах: `import { AssetTemplateMetrics, ... } from './mqx';`

## Best practice для проекта

1. **Источник правды** — `components/mqx/` + стили `mqx-*` в `index.css`.
2. **Витрина** — `#/dev/mqx` (React, всегда синхронна с prod-кодом).
3. **Design-lab** — быстрые A/B макеты без сборки; после выбора перенос в `mqx/`.
4. Storybook — опционально позже, если команда вырастет; для TMA сейчас избыточен.
