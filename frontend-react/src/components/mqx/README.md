# MQX — UI kit ТВОЙ ХОД

Канонические React-компоненты финансового UI (метрики с иконками, карточки портфеля, формы инвестиций, страховки, примитивы).

Графика ★ B «Мягкий объём» (03.11.2026): `PersonaPortrait` — `pick` 56,
`md` 72, `dash` 108, `avatar` 40 px; `PersonaCompanion` — предмет по `templateKey`.
Оба возвращают `null` для неизвестного ключа/размера. Напарник по умолчанию имеет
русский alt, `decorative` скрывает его из озвучивания. Мастера B — в
`design/system/illustrations/soft-volume/`, потребители зарегистрированы в карте экспортов.

**Обязательный FLOW (для агента и людей):** новые или существенно меняющие вид паттерны — **только** по циклу в [`DESIGN_WORKFLOW.md`](DESIGN_WORKFLOW.md): `design-lab/` → выбор → **явное утверждение** → `mqx/` + `#/dev/mqx` → prod. Не пропускать этапы без согласования (исключение: минимальный багфикс/hotfix без смены дизайна). Действующий процесс: [frontend-implementation](../../../../.agents/skills/frontend-implementation/SKILL.md); история миграции не является параллельным источником правил.

## Как смотреть все компоненты

Текущий вид главной зафиксирован 04.11.2026: [канонический lab](../../../../design-lab/dashboard/current-page-round/README.md)
и [структурированный контракт](../../../../design-lab/dashboard/canon.manifest.json).
`CurrentDashboardDemo` показывает этот же набор React-компонентов и source CSS:
карта K1 с рамкой; четыре шкалы 6 px без обводки; доходы/расходы/подушка и цель
без рамок/подложек/теней; зарплата и действия — заливки с нижней кромкой.
Состояние полученной зарплаты — пунктир. Смысловые монеты/точки пути и фокус
сохраняются. Раунд A/B/C закрыт 04.11.2026: владелец оставил текущий вид; альтернативы архивированы.
Заменённые lab-раунды скрыты из основной навигации и доступны в
[архиве design-lab](../../../../design-lab/index.html?archive=1).
Исторические утверждения в архиве не задают текущий вид MQX.
Регрессия: `node frontend-react/scripts/check-current-mqx-browser.mjs` из корня.

Актуальные примеры 03.11.2026: примитивы BG-4 на поле без прежнего градиентного
hero; список A в настоящем `MqxCapitalSheet` с покупкой/удалением и confirm;
`MqxCapitalPageModeSeg` («Детали / Действия») отдельно от `MqxSectionSeg`
(«Добавить / Мои»); дашборд BG-3/BG-4 с одной зарплатой и локальным сбросом.
Реализация: `catalog/MqxCurrentCatalogDemos.jsx`. Данные синтетические,
действия не вызывают игровой API.

Полный проход 04.11.2026 охватывает все 29 секций. Финансовые примеры
(форма суммы, страховки, шаблоны и позиции) используют `context="sheet"`:
это статичное превью нативного `.mqx-sheet`, поэтому применяются те же ink-правила,
что в окне капитала. Форма депозита содержит одну ставку и рабочую локальную
отправку; нулевая сумма блокирует действие. Разрозненные кнопки, вкладки,
меню, выбор жизни и состояния имеют адаптер витрины под `.mqx-catalog` в
каноническом `design/system/runtime/styles/mqx/ink.css`. Он не распространяет
стиль на ещё не перенесённые production-потоки автоматически.
Каталог ограничен шириной экрана; метрики переносятся, для их подсказок
сохраняются native `title` и `aria-label` без переполняющего CSS-псевдоэлемента.
Проверка всех секций: `node frontend-react/scripts/check-mqx-catalog-all.mjs`
из корня; артефакты — `design-lab/board-game/qa-mqx-all/`.

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
  icons/FinanceMetricIcons.jsx        — монеты, ↓ ↑ %, срок (term), shield, wallet, goal, warn, корзина (trash)
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
    EventCarouselOverlay, EventCarouselNav
    useEventCarousel
  brand/
    MonetkaAvatar, KvityaMascot, guideMascots.js — A «Чистый объём»
    PersonaPortrait, personaPortraits.js  — B (pick/md/dash/avatar)
    PersonaCompanion, personaCompanions.js — 4 предмета-напарника
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
| `EventCarouselNav` | Стрелки ← → |
| `BrandLogo` / `BrandMark` | PNG G1/G2: `full` — старт по центру + tagline; `compact` — hero/табы, без фона |
| `PersonaPortrait` | B «Мягкий объём», портреты 4 жизней: pick на `GameTemplatePickScreen`, dash в `MqxNeedsDash` |
| `useEventCarousel` | Состояние свайпа/слайдов |

## Персонажи и напарники · B (03.11.2026)

| Компонент | Назначение |
|-----------|------------|
| `PersonaPortrait` | `<picture>` webp/png по `template_key` и `size` (`pick` \| `md` \| `dash` \| `avatar`) |
| `personaPortraits.js` | Маппинг `mq_game_*` → slug + импорты из `src/assets/character-portraits/` |
| `MqxStarterScenarioPicker` | `usePersonaPortraits` (default `true`) |
| `MqxNeedsDash` | `templateKey` → портрет `dash` |

Пересборка из корня: `.venv/Scripts/python.exe frontend-react/scripts/process-soft-volume-mascots.py`, затем `node scripts/design-assets.mjs`.
Lab: [pet-style-round](../../../../design-lab/mascots/pet-style-round/README.md). Прежняя серия — история; кубковые позы финала остаются отдельной архивной серией.
`PersonaCompanion` доступен в MQX/каталоге и на лендинге; новый сценарий онбординга с ним не вводился.

Импорт: `import { EventCarouselOverlay } from './mqx';`  
События: `EventCarouselOverlay` из `mqx/events/` (в `GameScreen` — прямой импорт).

## Монетка и Квитя · A (03.11.2026)

[Решение владельца и места внедрения](../../../../design-lab/mascots/APPROVED.md).
Надписи с обода удалены; ситуация и суммы объясняются текстом интерфейса.

| Компонент | Контракт |
|---|---|
| `MonetkaAvatar` | `size` в px, `pose`, `full`; до 48 px — лицо, от 49 — фигура; `full` принудительно показывает фигуру |
| `guideMascots.js` | 7 поз: welcome, wink, surprised, think, joy, worried, victory; WebP + PNG |
| Совместимость | `default` → welcome; `sit-edge` → welcome с прежним размещением у заголовка |
| `KvityaMascot` | `pose`: default / joy / think; `size` в px; декоративный образ квитанции |
| `MqxPeriodCloseSheet` | cash delta > 0 → joy, < 0 → think, 0 → default; данные и строки не запекаются в изображение |

Монетка: приветствие в подсказках/входе, wink в подсказке хода,
surprised в событии, worried в предупреждении о зарплате. think/joy/victory
доступны в компоненте и каталоге; это не утверждение автоматических игровых триггеров.
Изображения обоих компонентов декоративные: озвучивается окружающий текст.
Статичные позы не являются анимационным atlas.

Мастера: `design/system/illustrations/soft-volume/guides/`;
экспорт из корня: `.venv/Scripts/python.exe frontend-react/scripts/process-guide-mascots.py`,
затем `node scripts/design-assets.mjs`. Редактируются источники design/system,
CSS приложения — проверяемый экспорт из `design/system/runtime/`.

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
| `MqxChip` | Универсальный чип; XP персонажа в игре не используется |
| `MqxProgress` | 6px; emerald-градиент цели |
| `MqxSubtab` | Вкладки финансов / капитала |
| `MqxModeButton` | Переход к списку позиций («Позиции»), режимы портфеля, submit инвестиций |
| `MqxRowAction` | **+** add / **корзина** remove по умолчанию (`removeVisual="minus"` — символ **−**) |
| `MqxFinListRow` | Компактная строка позиции (title, sub, metrics, trailing) |
| `MqxConfirmDialog` | Подтверждение удаления / отмены |
| `useMqxConfirm` | `await confirm({ title, message })` → boolean |

Канон действий: [`design-lab/row-actions/`](../../../../design-lab/row-actions/), [`SPEC_FRONTEND_UI.md`](../../../../docs/game/specs/SPEC_FRONTEND_UI.md) § Row Actions.

## Правила метрик

Порядок в `MetricsRow`: **coin (сумма)** → **down негативные платежи** → **up доход** → **percent (только число, без `%`; цвет: платим — красный, получаем — зелёный)** → **страховки / term**. Суммы в ₽ **без** `/мес`; пояснение периода — в `tip` (`MetricInlineItem`). Подробно: [`SPEC_FRONTEND_UI.md`](../../../../docs/game/specs/SPEC_FRONTEND_UI.md) § Row Actions и блок «Порядок и формат метрик».

| Контекст | Иконки |
|----------|--------|
| Активы | монеты, ↓ обслуживание, ↑ доход |
| Долги | монеты, ↓ платёж, **% красный** |
| Инвестиции | монеты, **% зелёный**, ↑ доход за период |
| **Страховки** | **↓** премия за период, **монеты** выплата, **⏱** срок |

Импорт: `import { InsuranceSection, InsurancePlanCard, ... } from './mqx';`
# Продуктовые подсказки · 06.11.2026

Утверждены и внедряются локально Events B / Goal A / Needs A:
`MqxChoiceConsequences`, `MqxGoalNextStep`, `MqxNeedsRecovery`.
Канон и выбор владельца: `design-lab/player-decisions/clear-next-step-round/APPROVED.md`.
Каталог: «Понятный выбор B · цель A · потребности A». Будущие платежи —
условные альтернативы из API, а не суммы для автоматического сложения.

