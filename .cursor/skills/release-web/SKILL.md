---
name: release-web
description: >-
  Pre-release checklist for PWA and web (primary channels) — guardrails,
  design-lab parity, pytest, PWA/web smoke. Use before merge to release branch,
  deploy, or when user says ready to ship or PR. TMA regression optional.
argument-hint: "[release or PR readiness]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Shell
---

## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.

**Каналы (ADR-012):** primary = **PWA + web**; TMA — secondary, smoke только при правках TMA shell.

# Release Web / PWA (ТВОЙ ХОД)

## Прочитай сначала (ТВОЙ ХОД)

- [`.cursor/rules/tvoy-hod-release-guardrails.mdc`](../../rules/tvoy-hod-release-guardrails.mdc)
- [`.cursor/rules/tvoy-hod-canon-sync.mdc`](../../rules/tvoy-hod-canon-sync.mdc)
- [`docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md`](../../../docs/decisions/ADR-012-primary-channels-pwa-web-over-tma.md)
- [`docs/foundation/SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md) — §1.1 Каналы доставки
- [`docs/foundation/PWA_INSTALL.md`](../../../docs/foundation/PWA_INSTALL.md)
- [`docs/foundation/DOC_SYNC_LOG.md`](../../../docs/foundation/DOC_SYNC_LOG.md)

**Дальше:** `code-review-and-quality` (см. `catalog.yaml` → `next_skill`).

**Куда писать:** по умолчанию только чтение — отчёт в чат. **May I write** / **Могу записать** правки в репо — только после явного согласования пользователя.

## Checklist

### 1. Guardrails (из `frontend-react/`)

```bash
npm run check:guardrails
```

### 2. Design-lab parity

```bash
npm run design-lab:build
```

### 3. Backend (если менялся `backend/` в ветке)

```bash
cd backend && python -m pytest -q
```

### 4. Canon sync (если в ветке был утверждённый UI)

- `design-lab/<theme>/APPROVED.md` актуален
- prod parity round соответствует prod

### 4b. Design QA — PWA / web (primary)

См. также `frontend-ui-engineering` → Definition of Done.

| # | Проверка |
|---|----------|
| W1 | **320px** и **~390px** — нет обрезания таббара / hero |
| W2 | **Тёмная тема** (system / app) — нет «белого острова» на MQX-карточках |
| W3 | **JWT login** (email/пароль) → меню → новая игра → 4 вкладки + события + закрытие периода |
| W4 | **`#/` hash router** — refresh на deep link не ломает маршрут |
| W5 | **PWA install** (Chrome Android или Safari «На экран Домой») — standalone открывается, resume после lock/unlock resync — [`PWA_INSTALL.md`](../../../docs/foundation/PWA_INSTALL.md) |
| W6 | `#/dev/mqx` — новые компоненты в каталоге (если не hotfix) |
| W7 | **Капитал:** Details \| Actions, hero «Капитал», нет legacy-аккордеонов без lab |
| W8 | **Z-NEEDS:** help sheet грузит `sections[]`; treat-self affordance |
| W9 | **Desktop wide** (если в ветке DW1): layout mode ≥768px без горизонтального overflow |

**Env:** `VITE_API_BASE_URL` / CORS на staging совпадают с prod-планом ([`PLAN_pwa-standalone.md`](../../../docs/plans/PLAN_pwa-standalone.md)).

### 4c. TMA regression (optional — только если менялся TMA shell)

| # | Проверка |
|---|----------|
| T1 | WebApp initData / theme / back button — skill **`telegram-mini-app-runtime`** |
| T2 | Resume после сворачивания чата — overview совпадает с сервером |

**Не блокирует READY**, если в ветке не было правок `telegram-ui` / WebApp SDK / TMA-only routing.

### 5. Docs (если менялось поведение)

- `DOC_SYNC_LOG.md` или ADR при необходимости

## Verdict

**READY** / **BLOCKED** / **CONCERNS** — с перечислением упавших команд.

Блокеры primary: guardrails, design-lab:build, pytest (при backend diff), **W1–W5** при UI-релизе.

## Согласование

Этот скилл **не пишет** в репо по умолчанию — только отчёт. Если чеклист требует правок, спроси: **Могу записать исправления в репо?**

## Следующий шаг

- [`code-review-and-quality`](../code-review-and-quality/SKILL.md)
- [`documentation-and-adrs`](../documentation-and-adrs/SKILL.md)
- [`telegram-mini-app-runtime`](../telegram-mini-app-runtime/SKILL.md) — только при T1/T2
