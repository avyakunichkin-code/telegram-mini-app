# MQX — UI kit Money Quest

Канонические React-компоненты финансового UI (метрики с иконками, карточки портфеля, формы инвестиций, примитивы).

**Процесс работы:** сначала варианты в `design-lab/` → выбор → утверждение → MQX → prod. Подробно: [`DESIGN_WORKFLOW.md`](./DESIGN_WORKFLOW.md).

## Как смотреть все компоненты

**Рекомендуемый способ (living catalog):** в dev-сборке откройте

```text
http://localhost:5173/#/dev/mqx
```

(или ваш `VITE` URL + `#/dev/mqx`). Маршрут **не попадает в production** (`import.meta.env.DEV`).

**Статические эксперименты до переноса в код:** `design-lab/asset-cards`, `design-lab/invest-forms`, `design-lab/primitives`.

## Структура

```text
mqx/
  primitives/                    — кнопки, пилюли, чипы, прогресс (утверждённый гибрид D+C+B/A)
  icons/FinanceMetricIcons.jsx   — монеты, ↓ ↑ %, срок (term)
  layout/InsuranceProductPicker.jsx — страховки: сетка 2×2 + тарифы
  layout/InsurancePolicyRow.jsx     — активный полис (accent + метрики)
  metrics/                       — MetricInlineItem, *Metrics
  layout/                        — CapitalPositionCard, InvestPositionRow
  catalog/MqCatalogScreen.jsx    — витрина (dev)
  index.js                       — barrel export
```

## Примитивы (prod)

| Компонент | Назначение |
|-----------|------------|
| `MqxButton` | Hero filled/outline, primary/secondary на светлом |
| `MqxPill` | Пилюли hero, badge событий |
| `MqxPeriodChip` | «Период» + номер в hero |
| `MqxChip` | XP outline (`xp`, опционально `xpAmount` → «+120 XP») |
| `MqxProgress` | 6px; emerald-градиент цели; `xp` — sky-градиент |
| `MqxSubtab` | Вкладки финансов / капитала |
| `MqxModeButton` | Режимы «добавить / позиции», submit инвестиций |

Токены: `--mq-xp-sky`, `--mq-xp-accent` в `index.css`.

## Правила метрик

| Контекст | Иконки |
|----------|--------|
| Шаблоны / позиции активов | монеты, ↓ обслуживание, ↑ доход |
| Шаблоны / позиции долгов | монеты (тело), ↓ платёж, **% красный** |
| Позиции депозита/облигации | монеты, **% зелёный**, ↑ доход за период |
| Формы депозита/облигации | без иконок метрик; chip ставки справа |

Импорт: `import { MqxButton, AssetTemplateMetrics, ... } from './mqx';`
