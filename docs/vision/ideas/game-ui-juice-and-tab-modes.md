# Game UI: juice + tab modes

**Статус:** A/C/D в prod (2026-05-26); B Risk — backlog; волна 2 tab-modes — отложена  
**Lab:** [`design-lab/game-ui/juice-round/`](../../../design-lab/game-ui/juice-round/)

---

## Problem Statement

**Как сделать интерфейс ТВОЙ ХОД игровым (bold juice + разный характер вкладок), а не единым «банковским отчётом», не ломая честность цифр и TB1?**

---

## Recommended Direction

**Волна 1 — Juice:** четыре паттерна отклика (A Gain, B Risk, C Turn ritual, D Warning) в design-lab → ★ → `mqx-juice-*` в prod на дашборде и закрытии периода.

**Волна 2 — Tab modes:** после ★ juice — разный тон вкладок (ход / инвентарь / дневник), без перерисовки S5 hero без lab.

---

## Key Assumptions to Validate

- [ ] Bold-анимации не тормозят WebView Telegram на mid-range Android
- [ ] ЦА **30+** воспринимает juice как «умная игра», не как несерьёзный банк
- [ ] `prefers-reduced-motion` достаточно для доступности

---

## MVP Scope (волна 1)

**In:** A на зарплате, D на modal без зарплаты, C на tail периода (или гибрид с period-close).  
**Out:** tab modes, звук, полный редизайн FinancePremium.

---

## Not Doing (and Why)

- **Сказочная валюта вместо ₽** — ломает обучение
- **Tab modes до juice ★** — два больших визуальных сдвига сразу
- **Монетка на каждом клике** — шум

---

## Open Questions

- Утверждаем все A–D или подмножество?
- C заменяет текущий period-close sheet или дополняет?
