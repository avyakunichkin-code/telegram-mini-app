---
layer: vision
status: draft
last_reviewed: 2026-06-20
drivers: TMA lifecycle, screen lock, resume, ADR-012 primary channel
tags:
  - tvoy-hod/layer/idea
  - tvoy-hod/layer/vision
  - tvoy-hod/status/draft
aliases:
  - "Идея: PWA / standalone-канал (веб вне Telegram)"
  - pwa-standalone-channel
---
# Идея: PWA / standalone-канал (веб вне Telegram)

## Проблема

В **Telegram Mini App** при **блокировке экрана**, сворачивании чата и возврате в игру наблюдается нестабильное поведение:

- UI **застывает** или расходится с сервером (баланс, `period_index`, события, зарплата в периоде);
- WebView клиента Telegram может **перезагружать** мини-приложение при долгом фоне.

**Корневая причина (2026-05, до PW1-001):** клиент **не делал resync** при `visibilitychange`. **TB1 (2026-05-26):** локальный секундомер и auto-next сняты; период не тикает по времени — при resume важны **overview/bootstrap**, а не `seconds_until_next_period`. Фаза 0: `appLifecycle.js` + `refreshGameState()` в `useGame.js`.

PWA — **primary channel** доставки (с web-браузером), см. [ADR-012](../../decisions/ADR-012-primary-channels-pwa-web-over-tma.md) и [`SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md) §1.1. Даёт:

1. **Установку на домашний экран** — игра в отдельном окне, меньше конфликтов с жизненным циклом чата Telegram.
2. **Более предсказуемый lifecycle** в Chrome/Safari standalone (всё ещё нужен resync — см. фазу 0 плана).
3. **Основной вход** для пользователей вне Telegram / при блокировках; тот же аккаунт JWT, тот же API.

**TMA** остаётся **secondary**: опциональная регрессия при правках WebApp shell, не единственный release gate (`release-web`).

## Цели

| Цель | Критерий |
|------|----------|
| Стабильный resume | После lock/unlock `period_index`, балансы и overview совпадают с сервером (TB1: без сверки секундомера) |
| Installable PWA | Lighthouse PWA + manifest + иконки на prod-домене |
| Один продукт | Те же сохранения и JWT; без форка экономики |

## Не-цели (MVP PWA)

- Полный offline-режим игры.
- Web Push (отдельная фаза).
- Замена Telegram Login — на первом этапе достаточно email/пароль как сейчас.
- Отдельное нативное приложение (App Store / Google Play).

## Связанные артефакты

| Документ | Роль |
|----------|------|
| [`PLAN_pwa-standalone.md`](../../plans/PLAN_pwa-standalone.md) | Фазы работ |
| [`PRODUCT_BACKLOG.md`](../../backlog/PRODUCT_BACKLOG.md) | Эпик **PW1** |
| [`TRACEABILITY.md`](../../TRACEABILITY.md) | Трассировка |
| [`TMA_USER_FLOWS.md`](../../foundation/TMA_USER_FLOWS.md) | Боль «resume» в таблице рисков |

## Открытые вопросы

1. **Домен:** остаёмся на GitHub Pages или выделяем `app.*` под PWA и CORS?
2. **Связка аккаунтов:** нужен ли Telegram Login Widget для тех, кто начал в TMA?
3. **Коммуникация:** баннер в TMA «Открыть в браузере / Установить» — когда показывать?

## Решение по приоритету

**Primary (2026-06):** PWA + web — продуктовый и QA фокус ([ADR-012](../../decisions/ADR-012-primary-channels-pwa-web-over-tma.md)).

**Сначала** фаза 0 (resync lifecycle) — улучшает **PWA, web и TMA**.  
**Затем** фаза 1 (manifest + service worker + иконки).
