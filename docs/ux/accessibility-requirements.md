---
layer: ux
status: active
last_reviewed: 2026-05-25
tier: basic
platform: Telegram Mini App
---

# Требования доступности — ТВОЙ ХОД (TMA)

**Уровень:** **Basic** (MVP TMA, touch-first).  
**Не в scope:** полноценная поддержка клавиатуры/геймпада; screen reader как основной канал.

Связанные документы: [`specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md), per-screen specs в [`ux/screens/`](screens/).

---

## Basic tier — обязательно

| # | Требование | Проверка |
|---|------------|----------|
| B1 | **Touch target** ≥ 44×44 px для интерактивных элементов (chips, pills, icon buttons, row actions) | Ручной / инспектор на 320px |
| B2 | **Не только цвет:** статус (плюс/минус, риск, выполнено) дублируется текстом, знаком, иконкой или паттерном | Ч/б скриншот читается |
| B3 | **Контраст текста** на hero и карточках: основной текст на фоне ≥ 4.5:1 (ориентир WCAG AA для body) | Spot-check с токенами `--mq-ink` / hero |
| B4 | **Семантика:** вкладки игры **без `h1`** (hero/chips); секции — `h2` + `section` с `aria-label` | Согласовано с [`ux/screens/dashboard.md`](screens/dashboard.md) |
| B5 | **Формы:** поля с `label` / `aria-label`; ошибки — текст + toast, не только цвет border |
| B6 | **Progress:** `role="progressbar"` + `aria-valuenow` для таймера периода и fill подушки |
| B7 | **Диалоги:** modal/sheet с `aria-modal`, заголовок связан с `aria-labelledby` |
| B8 | **Табы:** `role="tablist"` / `tab` / `aria-selected` / `aria-controls` где используются подтабы |
| B9 | **Язык UI:** видимые подписи на русском (латиница только в терминах бренда/API при необходимости) |

---

## Рекомендуется (не блокер MVP)

- `aria-live="polite"` для таймера и тостов с важным состоянием.
- Текстовые дубли для bar-chart в аналитике (сумма + %).
- `prefers-reduced-motion`: уважать для крупных анимаций входа (если добавляются).

---

## Исключения TMA

- Telegram WebView: часть a11y делегируется клиенту TG.
- Coach onboarding: spotlight не обязан быть идеальным для SR в v1; не блокировать релиз O1.

---

## Эскалация tier

Переход на **Standard** (focus order документирован, SR для смены цели/периода) — отдельное решение продукта после Pre-Alpha.
