---
layer: idea
status: draft
last_reviewed: 2026-06-01
related:
  - ../../specs/features/SPEC_onboarding-o2.md
  - onboarding-o2-progressive-guidance.md
  - ../../ux/screens/character-needs-help.md
  - ../../foundation/PRE_ALPHA_PLAYTEST_FEEDBACK.md
---

# Контекстная помощь: справочник по блокам без шума

## Problem Statement

**How Might We** дать игроку **понятные подсказки по нужному блоку** (потребности, финансы периода, цель, закрытие месяца…) **в момент сомнения**, но **не** перегружать интерфейс постоянными «?», coach marks и дублирующими статусами («Есть просадка»), которые игрок уже видит в данных?

**Контекст ТВОЙ ХОД:**

- **O2** (`MqxGuidanceStrip`) — **проактивный curriculum** первых периодов; не заменяет справочник.
- **Needs guide** (`MqxNeedsHelpSheet`, `GET needs/guide`) — **один** тематический sheet; не масштабируется на весь дашборд.
- **α-FB-17:** spotlight ломает layout → **не** возвращаем O1-стиль overlay.
- **v7-A:** в шапке Z-NEEDS — **«Подсказки»** (справка) и **«Улучшить»** (действие treat-self), разные intent.

---

## Что делают сильные продукты (2024–2026)

| Паттерн | Примеры / смысл | Когда уместно |
|---------|-----------------|---------------|
| **Progressive disclosure** | Notion «?» на блоке → короткий текст; Settings «Advanced» | Справка по запросу, не в потоке |
| **Contextual panel / bottom sheet** | Monzo, банки — «What is this?» под KPI | Один экран, 1–3 абзаца + ссылка |
| **Help hub + якоря** | Figma Learn, Linear docs in-app | Много разделов; поиск + «вы здесь» |
| **Reactive nudge (не tour)** | Duolingo, Stripe — одна полоска после ошибки | Только после сигнала (3× fail, streak) |
| **Inline microcopy** | Подпись под полем, empty state | Один факт; не энциклопедия |
| **Coach marks / spotlight** | Старые туры | **Избегать** в TMA (layout shift, α-FB-17) |

**Best practice (сводка):**

1. **Помощь по запросу** (pull), не навязанная (push), кроме короткого curriculum O2.
2. **Один канал проактивности** — bottom strip; не конкурировать с баннерами в каждой секции.
3. **Привязка к `help_topic_id`** — не к DOM; контент с API/CMS.
4. **Короткий первый слой** (2–4 предложения + 3 bullet); «Подробнее» — второй уровень.
5. **Не дублировать** числа и статусы, которые уже на экране (шкалы, подписи зон).
6. **Доступность:** не только цвет; `aria-expanded`, focus trap в sheet.

---

## Recommended Direction — «Справочник 2.0»

### Три слоя (не смешивать)

```text
L0  Тихий UI          Данные + короткие подписи (зоны шкал, риск streak)
L1  Curriculum O2     MqxGuidanceStrip — только первые периоды / gate
L2  Справочник        Pull: «Подсказки» → hub или sheet по topic
L3  Действие          «Улучшить» / CTA периода — не справка, а mutation
```

### L2 — два режима входа (один backend)

| Вход | UX | Пример |
|------|-----|--------|
| **A. Точечный** | `?` или «Подсказки» **в шапке секции** → sheet **только про этот блок** | Z-NEEDS → `topic: needs` |
| **B. Общий** | «Справка» в меню / long-press на hero → **оглавление** экрана | Dashboard → список: Потребности, Финансы периода, Цель… |

**MVP 2.0 (после v7-A):**

1. Унифицировать API: `GET /api/game/help?topic=needs|finance_period|goal|close_month` (или один JSON с map).
2. `MqxHelpSheet` — один компонент; заголовок и bullets из `topic`.
3. На дашборде: **только** кнопки в шапках секций (без `?` на каждой строке).
4. Контент needs — миграция из текущего `needs/guide`.

**v2:**

- Оглавление «Помощь по главной» (sheet с якорями).
- «Показать на экране» — **подсветка секции** без fullscreen scrim (тонкая рамка + scroll-into-view), не O1 spotlight.
- Персона **soft/hard** — разные bullet в `critical`, не разный UI.

### Affordance на секции (согласовано с v7-A)

```text
Потребности          [Подсказки]  [Улучшить]
├─ risk banner (если streak)
├─ portrait + 4 bars
```

- **Подсказки** → L2, `topic=needs`.
- **Улучшить** → `MqxTreatSelfSheet` (L3), не путать со справкой.

Другие секции дашборда — **только «Подсказки»** (ghost pill), без второй кнопки, пока нет действия.

---

## Альтернативы (отклонены или позже)

| Вариант | Почему нет сейчас |
|---------|-------------------|
| Tooltip на каждой шкале | Шум; палец ≠ hover |
| Вечный «?» в углу карточки | Визуальный мусор на 4 секциях |
| AI-чат в TMA | Дорого, риск галлюцинаций в финансах |
| Полный Notion-wiki в приложении | Вне MVP; лендинг / handbook для людей |
| Coach mark на каждый новый таб | Конфликт с O2 |

---

## Key Assumptions

- Игрок **умеет** читать шкалы; справка объясняет **что делать**, не пересказывает «Истощение».
- 80% вопросов покрываются **5–7 topics** на дашборде + finance tab.
- Подсказки редко меняются → можно отдавать статический JSON с BE, без CMS в MVP.

## MVP Scope (после утверждения)

1. Spec `SPEC_contextual-help` — topics, API, компонент `MqxHelpSheet`.
2. Refactor `MqxNeedsHelpSheet` → generic + `topic=needs`.
3. Шапки: `MqxSectionHead` (title + optional actions) для Needs, Finance period, Goal.
4. Lab round: hub sheet vs per-topic only.

## Not Doing

- Проактивные баннеры в каждой секции («Проверь потребности») — только streak critical + O2.
- Замена O2 curriculum справочником.
- Подсказки на каждом chip финансов.

## Open Questions

1. Одна кнопка **«Справка»** в меню vs только sectional «Подсказки»?
2. Нужен ли поиск по справке в TMA?
3. Показывать ли badge «новое» на Подсказках после апдейта контента?

---

## Handoff

После **APPROVED** направления → `spec-driven-development` → `SPEC_contextual-help.md` → design-lab `help-hub-round/` → prod.
