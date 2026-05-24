# UI Consistency Audit — ТВОЙ ХОД TMA

**Дата:** 2026-05-23  
**Цель:** карта экранов и компонентов для эпика [mqx-ui-unification](../vision/ideas/mqx-ui-unification.md).  
**Легенда:** ★ prod MQX · ⚠ hybrid · 🗑 удалить/архив · 📋 lab открыт

---

## Игровые вкладки (GameScreen)

| Экран | Файл | Статус | Комментарий |
|-------|------|--------|-------------|
| Главная | `DashboardPremium.jsx` | ★ | S5 Unified, `MqxDashStack`, `MqxLevelDash` |
| Финансы | `FinancePremium.jsx` → `FinanceSection.jsx` | ⚠ | Обёртка MQX, тело legacy — **главная боль** |
| Аналитика | `AnalyticsPremium.jsx` | ⚠ | Hero MQX; строки `MqStatRow`, бары `MqxMetricBars` |
| Меню | `MenuPremium.jsx` | ★ | В основном MQX |
| События (оверлей) | `EventDeck` → `EventCarouselOverlay` | ★ M2 | Доделки: E2–E6 в one-pager |
| Итог периода | `MqxPeriodCloseSheet` / `Tail` | ★ | Иконки строк — 📋 lab |
| Онбординг | `GameOnboardingLayer` + coach | ★ | Guided ★ |

---

## Поток вне игры

| Экран | Статус | Комментарий |
|-------|--------|-------------|
| Вход / регистрация | ★ B | `AuthMonetkaScreen` |
| Стартовое меню | ★ B | `MenuPremium` / start flow |
| Новая игра шаг 1 | ★ R1 | `MqxSaveKindPicker` |
| Новая игра шаг 2 | ★ I-Scene | `MqxStarterScenarioPicker` |
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
| `MqxPeriodDashboard` | `MqxFinancePeriodBlock` + `MqxLevelDash` | Удалён |
| `MqxBlockSection` | `mqx-capital-card` / dash stack | Удалён |
| `MqxStatMini` | `mqx-dash-link` 2×2 | Удалён |
| `MqxLevelBlock` | `MqxLevelDash` | Удалён |

**Остаётся в MQX (prod):** см. `#/dev/mqx` после чистки — секции с пометкой ★ в каталоге.

---

## design-lab — статус папок

| Папка | Статус | Следующий шаг |
|-------|--------|---------------|
| `dashboard/` | ★ S5 в prod | B1, B3, B4 по необходимости |
| `period-close/` | ★ в prod | B2 иконки |
| `events/` | ★ M2 в prod | E2–E6 полировка |
| `capital-page/` | IA ★, A/B выбор | Этап C |
| `onboarding-brief/` | superseded | — |
| `dashboard-dual-accordion/` | не утверждалось | не внедрять |

---

## Гибриды — очередь (не этап A)

| Место | Проблема | Эпик |
|-------|---------|------|
| `FinanceSection` | Смешение классов, старые табы | C |
| `AnalyticsPremium` | `MqStatRow` | D |
| `InvestProductForm` | Вне `mqx/` | C (инвестиции) |

---

## Smoke после чистки

```bash
cd frontend-react && npm run build
# Ручной: #/dev/mqx, игра — 4 вкладки, события, закрытие периода, новая игра
```
