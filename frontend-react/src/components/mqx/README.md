# MQX — UI kit ТВОЙ ХОД

Канонические React-компоненты финансового UI (метрики с иконками, карточки портфеля, формы инвестиций, страховки, примитивы).

**Обязательный FLOW (для агента и людей):** новые или существенно меняющие вид паттерны — **только** по циклу в [`DESIGN_WORKFLOW.md`](./DESIGN_WORKFLOW.md): `design-lab/` → выбор → **явное утверждение** → `mqx/` + `#/dev/mqx` → prod. Не пропускать этапы без согласования (исключение: минимальный багфикс/hotfix без смены дизайна). То же зафиксировано в `.cursor/rules/tvoy-hod-frontend-mqx.mdc`, скилле **frontend-ui-engineering** и [`docs/agents/CURSOR_SKILLS.md`](../../../../docs/agents/CURSOR_SKILLS.md).

## Как смотреть все компоненты

**Рекомендуемый способ (living catalog):** в dev-сборке откройте

```text
http://localhost:5173/#/dev/mqx
```

(или ваш `VITE` URL + `#/dev/mqx`). Маршрут **не попадает в production** (`import.meta.env.DEV`).

**Статические эксперименты до переноса в код:** `design-lab/asset-cards`, `design-lab/invest-forms`, `design-lab/finance-insurance`, `design-lab/primitives`.

## Структура

```text
mqx/
  primitives/                         — кнопки, пилюли, чипы, прогресс
  icons/FinanceMetricIcons.jsx        — монеты, ↓ ↑ %, срок (term), корзина (trash) для `MqxRowAction`
  metrics/
    MetricInlineItem, MetricsRow
    Asset*Metrics, Liability*Metrics, InvestPositionMetrics
    InsurancePlanMetrics, InsurancePolicyMetrics
  layout/
    MqxCard, MqxCardHeader            — оболочка карточки и шапка
    MqxGoalBadge, MqxBlockSection     — бейдж цели, секция с заголовком
    MqxStatMini                       — плитка stat 2×2
    MqxGoalDash, VictoryGoalItem — цели победы v2 (G1 ★)
    CapitalPositionCard               — asset | liability | insurance
    InsuranceCatalogGrid              — сетка 2×2 типов
    InsurancePlanCard                 — тариф (+)
    InsurancePolicyRow                — активный полис (строка)
    InsuranceProductPicker            — каталог + список тарифов
    InsuranceSection                  — полный блок для Finance
    InvestPositionRow
  events/
    EventCard, EventChoiceButton
    EventCarouselOverlay, EventCarouselDots, EventCarouselNav
    EventOverlayToolbar, useEventCarousel
  brand/
    MonetkaAvatar
    PersonaPortrait, personaPortraits.js  — 4 персонажа (pick/md/dash)
  catalog/MqCatalogScreen.jsx
  index.js
```

## События (prod)

| Компонент | Назначение |
|-----------|------------|
| `MqxPill` + `events` | Кнопка «События» с badge на дашборде |
| `EventCard` | L3 ★: domain band + pill, Монетка + пузырь; E2 halo (страховка); E5 clamp/scroll |
| `EventChoiceButton` | Одна кнопка выбора |
| `EventCarouselOverlay` | Полноэкранный оверлей с каруселью |
| `EventCarouselDots` / `EventCarouselNav` | Навигация |
| `BrandLogo` / `BrandMark` | PNG G1/G2: `full` — старт по центру + tagline; `compact` — hero/табы, без фона |
| `PersonaPortrait` | Растровые портреты 4 жизней (★ persona-portraits-round): pick на `GameTemplatePickScreen`, dash в `MqxNeedsDash` |
| `useEventCarousel` | Состояние свайпа/слайдов |

## Персонажи (prod, 2026-06)

| Компонент | Назначение |
|-----------|------------|
| `PersonaPortrait` | `<picture>` webp/png по `template_key` и `size` (`pick` \| `md` \| `dash`) |
| `personaPortraits.js` | Маппинг `mq_game_*` → slug + импорты из `src/assets/character-portraits/` |
| `MqxStarterScenarioPicker` | `usePersonaPortraits` (default `true`) |
| `MqxNeedsDash` | `templateKey` → портрет `dash` |

Пересборка ассетов: `npm run persona-portraits:process` · lab: [`design-lab/game-templates/persona-portraits-round/`](../../../design-lab/game-templates/persona-portraits-round/). SVG `ScenarioIllustrations` — архив/fallback.

Импорт: `import { EventCarouselOverlay } from './mqx';`  
События: `EventCarouselOverlay` из `mqx/events/` (в `GameScreen` — прямой импорт).

## Shell (prod)

| Компонент | Назначение |
|-----------|------------|
| `MqxCard` | `variant`: default \| goal \| character |
| `MqxCardHeader` | kicker + title + sub + `trailing`; `layout`: stack \| split |
| `MqxGoalBadge` | Статус цели на дашборде |
| `MqxBlockSection` | Секция с заголовком и ссылкой действия (напр. «Финансы периода» на главной) |
| `MqxStatMini` | Иконка + подпись + значение в `mqx-grid2` |
| `MqxGoalDash` | Цель на дашборде: stepper + Монетка (G1 ★) |

Утилиты: `utils/victoryGoalDisplay.js` (без React).

## Страховки (prod, design-lab B + card H)

| Компонент | Назначение |
|-----------|------------|
| `InsuranceCatalogGrid` | Плитки 2×2: продукт × объект (ипотека, авто…) |
| `InsurancePlanCard` | Готовый тариф: accent H, метрики, кнопка **+** |
| `InsurancePolicyRow` | Активный полис: **`MqxFinListRow`** + метрики + корзина |
| `InsuranceProductPicker` | Сетка типов + список тарифов (без ручного ввода) |
| `InsuranceSection` | Picker + **«Позиции (N)»** → список полисов (как инвестиции) |
| `InsurancePlanMetrics` | **монеты** выплата · **↓** премия · **⏱** срок (порядок: сумма → платёж → специфика) |
| `InsurancePolicyMetrics` | То же для активного полиса |

Данные: `constants/insuranceProducts.js` (синхрон с `backend/app/starters/insurance_catalog.py`), покупка через `plan_key` в API.

Карточки: `CapitalPositionCard` с `variant="insurance"`, `accentTone`: `auto` | `mortgage` | `default`.

## Примитивы (prod)

| Компонент | Назначение |
|-----------|------------|
| `MqxButton` | Hero filled/outline, primary/secondary на светлом |
| `MqxPill` | Пилюли hero, badge событий |
| `MqxPeriodChip` | «Период» + номер в hero |
| `MqxChip` | XP outline |
| `MqxProgress` | 6px; emerald-градиент цели; `xp` — sky-градиент |
| `MqxSubtab` | Вкладки финансов / капитала |
| `MqxModeButton` | Переход к списку позиций («Позиции»), режимы портфеля, submit инвестиций |
| `MqxRowAction` | **+** add / **корзина** remove по умолчанию (`removeVisual="minus"` — символ **−**) |
| `MqxFinListRow` | Компактная строка позиции (title, sub, metrics, trailing) |
| `MqxConfirmDialog` | Подтверждение удаления / отмены |
| `useMqxConfirm` | `await confirm({ title, message })` → boolean |

Канон действий: [`design-lab/row-actions/`](../../../design-lab/row-actions/), [`SPEC_FRONTEND_UI.md`](../../../docs/specs/SPEC_FRONTEND_UI.md) § Row Actions.

## Правила метрик

Порядок в `MetricsRow`: **coin (сумма)** → **down негативные платежи** → **up доход** → **percent (только число, без `%`; цвет: платим — красный, получаем — зелёный)** → **страховки / term**. Суммы в ₽ **без** `/мес`; пояснение периода — в `tip` (`MetricInlineItem`). Подробно: [`SPEC_FRONTEND_UI.md`](../../../docs/specs/SPEC_FRONTEND_UI.md) § Row Actions и блок «Порядок и формат метрик».

| Контекст | Иконки |
|----------|--------|
| Активы | монеты, ↓ обслуживание, ↑ доход |
| Долги | монеты, ↓ платёж, **% красный** |
| Инвестиции | монеты, **% зелёный**, ↑ доход за период |
| **Страховки** | **↓** премия за период, **монеты** выплата, **⏱** срок |

Импорт: `import { InsuranceSection, InsurancePlanCard, ... } from './mqx';`
