# UI Consistency Audit — ТВОЙ ХОД TMA

**Дата:** 2026-06-02  
**Цель:** карта экранов и компонентов для эпика [mqx-ui-unification](../vision/ideas/mqx-ui-unification.md).  
**Легенда:** ★ prod MQX · ⚠ hybrid · 🗑 удалить/архив · 📋 lab открыт

---

## Игровые вкладки (GameScreen)

| Экран | Файл | Статус | Комментарий |
|-------|------|--------|-------------|
| Главная | `DashboardPremium.jsx` | ★ | S5 Unified, `MqxFinancePeriodBlock`, `MqxGoalDash`, `MqxPeriodActions` |
| Капитал | `FinancePremium.jsx` | ★ | Title «Капитал»; Details \| Actions v2; нейтральные детали, liabilities muted red |
| Аналитика | `AnalyticsPremium.jsx` | ⚠ | Hero MQX; строки `MqStatRow`, бары `MqxMetricBars` |
| Меню | `MenuPremium.jsx` | ★ | В основном MQX |
| События (оверлей) | `EventDeck` → `EventCarouselOverlay` | ★ L3 | `EventCard`, domain band; лендинг: [`LANDING_SCREENSHOTS.md`](LANDING_SCREENSHOTS.md) |
| Итог периода | `MqxPeriodCloseSheet` / `Tail` | ★ | Иконки строк — 📋 lab |
| Онбординг | `MqxGuidanceStrip` (O2) | ★ | Progressive Guidance ★ |

---

## Поток вне игры

| Экран | Статус | Комментарий |
|-------|--------|-------------|
| Вход / регистрация | ★ D | `MonetkaBubbleScreen`, `MqxButton` — [`SPEC_APP_SHELL.md`](SPEC_APP_SHELL.md) |
| Проверка сессии | ★ D | `AuthGuard` → Bubble (не TabHero) |
| Стартовое меню | ★ D | `MonetkaBubbleScreen` + `MqxButton` |
| Новая игра шаг 1 | ★ D | `MqxMonetkaDialogScreen` + `MqxSaveKindPicker` |
| Новая игра шаг 2 | ★ D | `MqxMonetkaDialogScreen` + `MqxStarterScenarioPicker` + **портреты** (`PersonaPortrait`, lab ★) |
| Plan / Base params | 🗑 hold | Вне scope 2 недель |

---

## Legacy — удалено (этап A)

| Файл | Причина |
|------|---------|
| `DashboardSection.jsx` | Не импортировался |
| `AnalyticsSection.jsx` | Не импортировался |
| `MenuSection.jsx` | Не импортировался |
| `PeriodCloseModal.jsx` | Заменён `MqxPeriodCloseSheet` |

---

## MQX — архивировано (не prod)

| Компонент | Замена | Действие |
|-----------|--------|----------|
| `MqxPeriodDashboard` | `MqxFinancePeriodBlock` + `MqxGoalDash` | Удалён |
| `MqxBlockSection` | `mqx-capital-card` / dash stack | Удалён |
| `MqxStatMini` | `mqx-dash-link` 2×2 | Удалён |
| `MqxLevelBlock` | `MqxGoalDash` (ранее level-dash) | Удалён |

**Остаётся в MQX (prod):** см. `#/dev/mqx` после чистки — секции с пометкой ★ в каталоге.

---

## design-lab — статус папок

| Папка | Статус | Следующий шаг |
|-------|--------|---------------|
| `dashboard/` | ★ S5 в prod | B1, B3, B4 по необходимости |
| `period-close/` | ★ в prod | B2 иконки |
| `events/` | ★ M2 в prod | E2–E6 полировка |
| `capital-page/details-actions-round/` | ★ v2 в prod | Поддержка parity; `sync-lab.sh` |
| `game-templates/persona-portraits-round/` | ★ в prod | pick 56 / dash 108; `npm run persona-portraits:process` |
| `game-templates/scenario-icons/` | архив | Заменены портретами; SVG в коде — fallback |
| `onboarding-brief/` | superseded | — |
| `dashboard-dual-accordion/` | не утверждалось | не внедрять |

---

## Гибриды — очередь (не этап A)

| Место | Проблема | Эпик |
|-------|---------|------|
| `AnalyticsPremium` | `MqStatRow` | D |
| `InvestProductForm` | Вне `mqx/` | C (инвестиции) |

---

## Smoke после чистки

```bash
cd frontend-react && npm run build
# Ручной: #/dev/mqx, игра — 4 вкладки, события, закрытие периода, новая игра
```
