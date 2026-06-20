---
status: accepted
date: 2026-06-20
tags:
  - tvoy-hod/layer/adr
  - tvoy-hod/status/accepted
aliases:
  - "ADR-012: Primary channels PWA and web over TMA"
---
# ADR-012: Primary delivery — PWA и web; TMA вторичный

## Context

- **ТВОЙ ХОД** изначально позиционировался как **Telegram Mini App**; код и docs часто ставили TMA в центр smoke QA и release gate (`release-tma`).
- С **2026** доступ к Telegram в ряде регионов **нестабилен или заблокирован** — TMA перестаёт быть надёжным primary channel для привлечения и удержания.
- В репозитории уже есть **один SPA + один API**: PWA (эпик PW1), браузерный web, опционально wide desktop ([`PLAN_pwa-standalone.md`](../plans/PLAN_pwa-standalone.md), [`PLAN_desktop-wide-web.md`](../plans/PLAN_desktop-wide-web.md)).
- PW1 частично в коде: manifest, service worker, lifecycle resync — мотивация из lifecycle TMA, но **ценность канала** — standalone вне Telegram.

## Decision

1. **Primary channels (product + engineering focus):**
   - **PWA** — установка на домашний экран, standalone window, JWT login (email/пароль).
   - **Web** — тот же SPA в браузере (mobile + desktop); wide layout — отдельный режим, не отдельный продукт.
2. **Secondary channel:**
   - **Telegram Mini App (TMA)** — поддержка и **опциональная регрессия** при изменениях WebApp SDK / initData; **не** блокер новых фич и **не** единственный smoke перед релизом.
3. **Release gate:** skill **`release-web`** (замена `release-tma`) — guardrails, design-lab parity, pytest, **PWA/web smoke**; TMA smoke — подпункт «если менялся TMA shell».
4. **Agent priority:** `tier: core` остаётся на контенте, economy, MQX; **`telegram-mini-app-runtime`** и **`release-tma`** — archived/deferred; **`browser-testing-with-devtools`** — чаще при UI/PWA задачах.
5. **Документация:** [`SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md) §1.1 — канон каналов; vision/plans синхронизированы (PWA не «запасной вход», а **primary**).

## Consequences

### Positive

- Единый фокус QA и playtest на **Chrome/Safari + PWA install**.
- Меньше зависимости от политики Telegram и WebView lifecycle.
- Desktop-wide web становится естественным продолжением primary web, а не «обход TMA».

### Negative / trade-offs

- TMA-специфика (initData, theme, back button) **может деградировать** без явной регрессии — mitigated: optional TMA checklist в `release-web` при правках shell.
- Маркетинг/онбординг в Telegram — **не primary** до смены ADR; посты и deep links ведут на **web/PWA URL**.

### Follow-up (не блокирует ADR)

- Эпик **DW1** — `SPEC_desktop-wide-web`, layout mode.
- Закрыть **PW1-007** Lighthouse PWA на staging.
- Обновить landing и handbook под «игра в браузере / PWA», не «только Telegram».

## Alternatives considered

| Вариант | Почему нет |
|---------|------------|
| Оставить TMA primary, PWA «запасной» | Не соответствует блокировкам и стратегии 2026 |
| Отдельное native app | Out of scope MVP; тот же API/SPA достаточен |
| Fork frontend для web | Против принципа one SPA ([`PLAN_desktop-wide-web.md`](../plans/PLAN_desktop-wide-web.md)) |

## References

- [`PWA_INSTALL.md`](../foundation/PWA_INSTALL.md)
- [`pwa-standalone-channel.md`](../vision/ideas/pwa-standalone-channel.md)
- [`TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md) — secondary flows
- Skill: `.cursor/skills/release-web/SKILL.md`
