---
name: telegram-mini-app-runtime
description: >-
  Telegram Mini App runtime — WebApp SDK, initData, viewport, theme, and TMA-specific
  UX. Use when integrating Telegram APIs, debugging in WebView, or shell/navigation issues.
argument-hint: "[WebApp SDK, initData, viewport, or TMA shell]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.


# Telegram Mini App Runtime

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/specs/SPEC_APP_SHELL.md`](../../../docs/specs/SPEC_APP_SHELL.md)
- [`docs/specs/SPEC_FRONTEND_UI.md`](../../../docs/specs/SPEC_FRONTEND_UI.md)
- [`docs/foundation/TMA_USER_FLOWS.md`](../../../docs/foundation/TMA_USER_FLOWS.md)
- [`frontend-react/src/api.js`](../../../frontend-react/src/api.js) — auth / init

**Satellite:** `browser-testing-with-devtools` для DOM и сети в WebView.

**Дальше:** `browser-testing-with-devtools` (см. `catalog.yaml` → `next_skill`).

## Overview

TMA — не обычный браузер: viewport, safe area, `Telegram.WebApp`, theme, back button, haptic. Не дублировать разбор ошибок API — `apiCall` / `ApiError`.

**Safety:** не логировать и не коммитить `initData`/JWT; не ослаблять auth/валидацию без ADR; в WebView — осторожно с shell-изменениями, влияющими на security и UX закрытия.

## When to Use

- Инициализация WebApp, `initData`, theme params
- Fullscreen / expand / closing confirmation
- Проблемы только в Telegram (не в desktop dev)
- MainButton / BackButton / HapticFeedback

**When NOT to use:** чистая игровая экономика — `game-economy-and-victory`; MQX-визуал — `frontend-ui-engineering`.

## Verify

- Проверка в реальном Telegram или DevTools с эмуляцией TMA
- Нет `alert` — `showNotification` / toasts

## Verdict

**PASS** / **CONCERNS** / **FAIL** с шагами воспроизведения в TMA.

## Согласование

Перед записью в репо: **Могу записать эти изменения?**

## Следующий шаг

- [`browser-testing-with-devtools`](../browser-testing-with-devtools/SKILL.md)
- [`frontend-ui-engineering`](../frontend-ui-engineering/SKILL.md)
