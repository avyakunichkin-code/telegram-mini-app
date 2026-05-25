# Лендинг — превью продукта (MQX)

**Статус:** в работе (вариант A)  
**Дата:** май 2026  
**Операционная спека:** [`specs/LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md)

## Problem Statement

**How Might We** за несколько секунд показать, что лендинг — это тот же Telegram Mini App «ТВОЙ ХОД», а не корпоративный финтех-сайт, и при этом сохранить блок для партнёров?

## Решения (зафиксировано)

| Вопрос | Решение |
|--------|---------|
| Аудитория | Игровой hero + отдельный нейтральный блок «Партнёрам» |
| Скрины | `capture-screens.mjs`: **app** (prod UI) → fallback **lab**; **RU UI** в EN-локали тоже |
| Контраст тем | **Тёмный блок → светлый скрин; светлый блок → тёмный скрин** |
| Layout | **A** (скролл + витрина); **C** (табы) — только если A не зайдёт |

## Recommended Direction (A)

1. **Hero** — G1, Монетка, рамка 480px, скрин дашборда (светлая тема на тёмном hero).
2. **#peek** — горизонтальная лента 3 скринов (дашборд, события, капитал), светлые на тёмном фоне.
3. **#features** — 3 пары «скрин + механика» вместо emoji-сетки.
4. **Светлые секции** (#how, #learn, #modes) — карточки MQX + при необходимости тёмные скрины в рамке.
5. **#partners** — без скринов, edutainment-тон.

Источник скринов: [`landing/scripts/capture-screens.mjs`](../../../landing/scripts/capture-screens.mjs) → [`landing/public/screens/`](../../../landing/public/screens/). Подробно: [`specs/LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md).

## Key Assumptions to Validate

- [ ] Скрин дашборда (финансы + цель) узнаётся без подписи «это игра» (5-секундный тест).
- [ ] Контраст light-on-dark / dark-on-light не режет глаз на мобиле.
- [x] Пайплайн пересъёма задокументирован; дата последнего кадра — `landing/public/screens/README.md` (2026-05-25).
- [ ] Перед публичным запуском — пересъём в **app**-режиме (не только lab-fallback).

## MVP Scope

**In:** hero device, лента peek, features showcase, токены MQX (subset), скрипт пересъёма.  
**Out:** табы (C), React/MQX в лендинге, демо-оверлей поверх скрина (пока статичный кадр).

## Not Doing

- Вариант C (табы как в игре) — до оценки A.
- Отдельные EN-скрины — дублируем RU.
- design-lab раунд целого лендинга — только пересъём при смене UI.
- Съём с устаревших lab-витрин (`dashboard/index`, `capital-page/#phone-demo`) — см. антипаттерны в `LANDING_SCREENSHOTS.md`.

## Open Questions

- Обновлять скрины автоматически в CI или вручную перед релизом? (**сейчас:** вручную по чеклисту в `LANDING_SCREENSHOTS.md` § «Перед публикацией»)
