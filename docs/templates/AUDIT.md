---
layer: audits
kind: product | engineering | ux | content | ops | qa | liveops | ai
status: draft
last_reviewed: YYYY-MM-DD
audience:
doc_type: audit
verdict: DRAFT
supersedes:
tags:
  - tvoy-hod/layer/template
  - tvoy-hod/layer/audits
aliases:
  - AUDIT
---
# Аудит: [название]

**Kind:** `product` | `engineering` | `ux` | `content` | `ops` | `qa` | `liveops` | `ai`  
**Дата снимка:** YYYY-MM-DD  
**Канон адреса:** [`docs/audits/README.md`](../audits/README.md)

Не канон реализации. Выводы → spec / ADR / backlog только после утверждения человеком.

## Сводка

- Объект:
- Зрелость (0–10) и почему:
- 🔴 Critical N · 🟡 Major N · 🟢 Minor N
- Главный риск:
- Топ-3 приоритета:

## Источники и пробелы в данных

Что читали (пути). Чего **нет** (метрики, плейтест, прогон) — не выдумывать.

## Находки

Для каждой:

- ID (`C1` / `M1` / `m1`)
- Критичность
- Где (файл, механика, метрика)
- Почему это проблема (Retention / Eng / Monetization / DX / Security)
- Решение, effort, ожидаемый эффект

Сортировка: Critical → Major → Minor внутри секций kind.

## План

Фазы с вход/выход критериями. P0–P3. Зависимости. Плейтест / A/B / sim — явно.

## Метрики готовности

Таблица: метрика | сейчас | таргет | как мерить. Нет цифры — «нет данных».

## Риски и гипотезы

Риск → проверяемая гипотеза → способ валидации → фейл-критерий.

## Не делаем (в этом снимке)

Чтобы аудит не расползался в другой kind и не подменял spec.
