---
layer: idea
status: draft
last_reviewed: 2026-06-02
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
- **Needs guide** (`MqxNeedsHelpSheet`, `GET /api/game/needs/guide`) — **prod:** `title` + `sections[]` (4 раздела); вход — **иконка книги + бейдж «?»** (v7-e2).
- **α-FB-17:** spotlight ломает layout → **не** возвращаем O1-стиль overlay.
- **v7-e2e3 (prod):** в шапке Z-NEEDS — **книга+?** (справка, L2) и **сердце** (treat-self, L3); разные intent.

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
L2  Справочник        Pull: иконка справки → sheet по topic
L3  Действие          «Улучшить» (сердце) / CTA периода — mutation, не справка
```

### L2 — два режима входа (один backend)

| Вход | UX | Пример |
|------|-----|--------|
| **A. Точечный** | Иконка **книга+?** **в шапке секции** → sheet **только про этот блок** | Z-NEEDS → `needs/guide` |
| **B. Общий** | «Справка» в меню / long-press на hero → **оглавление** экрана | Dashboard → список: Потребности, Финансы периода, Цель… |

**MVP 2.0 (после v7-e2e3):**

1. Унифицировать API: `GET /api/game/help?topic=needs|finance_period|goal|close_month` (или один JSON с map).
2. `MqxHelpSheet` — один компонент; заголовок и bullets из `topic`.
3. На дашборде: **только** affordance в шапках секций (без `?` на каждой строке).
4. Контент needs — уже в `guide_content.py` + `sections[]`.

**v2:**

- Оглавление «Помощь по главной» (sheet с якорями).
- «Показать на экране» — **подсветка секции** без fullscreen scrim (тонкая рамка + scroll-into-view), не O1 spotlight.
- Персона **soft/hard** — разные bullet в `critical`, не разный UI.

### Affordance на секции (согласовано с v7-e2e3)

```text
Потребности          [книга+?]  [сердце]
├─ risk banner (если streak)
├─ portrait + 4 bars
```

- **Книга+?** → L2, `MqxNeedsHelpSheet`.
- **Сердце** → `MqxTreatSelfSheet` (L3), UI «Улучшить».

Другие секции дашборда — **только** affordance справки, без второй кнопки, пока нет действия.

---

## Альтернативы (отклонены или позже)

| Вариант | Почему нет сейчас |
|---------|-------------------|
| Tooltip на каждой шкале | Шум; палец ≠ hover |
| Вечный «?» в углу карточки | Визуальный мусор на 4 секциях |
| Текстовая кнопка «Подсказки» (v7-A) | Заменена иконкой e2 в prod |
| Текстовая «Улучшить» (v7-A) | Заменена сердцем e3 в prod |
| AI-чат в TMA | Дорого, риск галлюцинаций в финансах |
| Полный Notion-wiki в приложении | Вне MVP; лендинг / handbook для людей |
| Coach mark на каждый новый таб | Конфликт с O2 |

---

## Key Assumptions

- Игрок **умеет** читать шкалы; справка объясняет **что делать**, не пересказывает «Истощение».
- 80% вопросов покрываются **5–7 topics** на дашборде + вкладка «Капитал».
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

1. Одна кнопка **«Справка»** в меню vs только sectional affordance?
2. Нужен ли поиск по справке в TMA?
3. Показывать ли badge «новое» на справке после апдейта контента?

---

## Handoff

После **APPROVED** направления → `spec-driven-development` → `SPEC_contextual-help.md` → design-lab `help-hub-round/` → prod.
