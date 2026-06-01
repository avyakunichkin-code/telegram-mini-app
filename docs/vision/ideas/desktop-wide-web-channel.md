---
layer: vision
status: approved
last_reviewed: 2026-06-01
product_phase: closed-alpha
drivers: desktop browser, wide layout, multi-channel
epic: WD1
---

# Идея: полноразмерный веб-канал (desktop / wide)

## Problem Statement

Сейчас игрок видит **тот же React-клиент** в трёх оболочках, но **визуально и по UX** продукт заточен под **вертикальную колонку ~480px** (TMA, PWA, браузер на телефоне) — см. [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) §layout.

Для **Closed Alpha (50–100)** и воронки «игра как lead magnet» нужен **четвёртый канал по смыслу** (третий по вебу после TMA и PWA):

- **полноразмерный сайт с игрой** — широкий viewport, не «узкая лента мини-приложения»;
- **дополнение** к TMA и PWA, **не замена**;
- тот же API, сохранения, экономика — **без форка backend**.

## Recommended Direction

1. **Один SPA**, второй **layout-режим** `wide` (breakpoint или явный entry), а не отдельный репозиторий.
2. **Приоритет экранов v1:** game shell (дашборд, нижняя/боковая навигация), финансы, старт/auth — как в TMA, но с **горизонтальной компоновкой** (lab → prod).
3. **Срок:** готовность к **Closed Alpha** на **своём домене** (`app.*`) — ops из [`DEPLOY.md`](../../ops/DEPLOY.md) общий с PWA/TMA.
4. **Лендинг** для первой волны **не блокер**: текущий `landing/` номинальный; FAQ / privacy / about — **после** CA, отдельный эпик маркетинга.
5. **Связка TG ↔ email** — **не в v1 WD1**, но в бэклоге и traceability (**AC1**), чтобы не потерять при росте каналов.

## Key Assumptions

| # | Допущение |
|---|-----------|
| A1 | Игроки CA часть сессий проведут на **ноутбуке / широком браузере** — wide даёт ценность, а не только «увеличенный телефон». |
| A2 | MQX-токены и компоненты **переиспользуются**; меняется shell и сетка, не движок игры. |
| A3 | TMA и PWA **не регрессируют**: узкая колонка остаётся default в WebView и на малых viewport. |
| A4 | Prod-стенд на **своём домене** к CA уже поднят (API Starter, CORS, CI). |
| A5 | Первый набор **50–100** без расширенного маркетингового сайта — достаточно **прямой ссылки на игру** + инструкция в протоколе. |

## MVP Scope (WD1 v1)

**В scope:**

- Design-lab раунд **wide shell** (дашборд + минимум finance/capital).
- Spec: breakpoints, `layout mode`, список экранов v1, a11y desktop (hover уже частично в SPEC).
- Реализация: layout provider / CSS (`data-mq-layout="wide"` или эквивалент), адаптация `BottomGameNav` → side/bottom hybrid на wide.
- Smoke: Chrome/Firefox/Safari desktop, 1280×720+; регрессия TMA/PWA на 390px.
- Док: URL для CA, пункт в playtest-протоколе.

**Критерии приёмки:**

- На viewport ≥ agreed breakpoint игра **читаема без «полосы по центру»** — контент использует ширину (KPI + hero + события не в одной 480px колонке).
- Логин → новая игра → закрытие периода — **тот же API**, что TMA/PWA.
- TMA в Telegram **без изменения** узкой вёрстки.

## Not Doing (v1)

| Тема | Почему |
|------|--------|
| Отдельный backend / экономика | Один продукт |
| Нативные приложения (Store) | Другой эпик |
| Полный redesign всех экранов | Только shell + P0 экраны; остальное — узкая колонка в wide до v2 |
| Расширенный лендинг (FAQ, privacy, blog) | После CA; не блокер 50–100 |
| **Связка TG + email** (merge аккаунтов) | Отложено; эпик **AC1** в фокусе |
| Web Push, offline | PW1 / отдельно |
| Plan Mode UI | MVP 2.0 |
| Отдельный subdomain только для wide | По умолчанию тот же `app.*`; отдельный URL — только если spec решит иначе |

## Open Questions

1. **Breakpoint:** 1024 vs 1280 vs `min-width` + `hover: hover`?
2. **Навигация wide:** боковая панель vs верхний таббар vs гибрид (lab)?
3. **Один URL** (responsive) vs отдельный hash (`#/wide`) для A/B и аналитики?
4. Нужен ли **явный переключатель** «Мобильный вид» на desktop для support?

## Связанные артефакты

| Документ | Роль |
|----------|------|
| [`PLAN_desktop-wide-web.md`](../../plans/PLAN_desktop-wide-web.md) | Фазы WD1 |
| [`PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) | Эпик **WD1** |
| [`TRACEABILITY.md`](../../TRACEABILITY.md) | Idea → plan → backlog |
| [`pwa-standalone-channel.md`](pwa-standalone-channel.md) | Узкий standalone; общий resync |
| [`TELEGRAM_BACKLOG.md`](../../backlog/TELEGRAM_BACKLOG.md) | TMA вход; **AC1** позже |
| [`DEPLOY.md`](../../ops/DEPLOY.md) | Домен CA |
| [`SPEC_FRONTEND_UI.md`](../../specs/SPEC_FRONTEND_UI.md) | Сейчас max-width 480px — будет дополнен spec WD1 |

## Решение продукта (2026-06-01)

- **Утверждено** направление: wide-канал в дополнение к TMA + PWA.
- **Фаза:** Closed Alpha, **50–100**, **свой домен**.
- **Лендинг** для первой волны не обязателен; контентные страницы — позже.

**Handoff:** `spec-driven-development` → черновик `SPEC_desktop-wide-web.md` после design-lab раунда.
