---
layer: vision
status: superseded
last_reviewed: 2026-05-26
superseded_by: turn-based-period-no-timer.md
---

# Компактный hero дашборда

**Superseded (2026-05-26):** канон hero — **TB1**, layout **H2** в [`design-lab/dashboard/hero-no-timer-round/`](../../../design-lab/dashboard/hero-no-timer-round/) · [`turn-based-period-no-timer.md`](turn-based-period-no-timer.md) · [`dashboard.md`](../../ux/screens/dashboard.md).

Ниже — исторический черновик (MM:SS, play/pause, H1 command strip). Не использовать для реализации.

## Problem statement (архив)

**Как сделать шапку главной информативной, но не «съедающей» экран?**

Игроку на TMA нужны: оставшееся время периода, play/pause, прогресс «месяца», быстрый доступ к «Следующий период» и «События». Маркетинговый слоган и крупный Lottie-блок отнимают ~50% viewport до игрового контента.

## Recommended direction (архив)

**H1 — Command strip** (см. `design-lab/dashboard/`):

- Одна control-строка: `Период #N` · `MM:SS` · ▶ ⏸
- Вторая строка: мини-Lottie (48×32) + тонкий progress bar периода
- Третья: pills (без изменений)
