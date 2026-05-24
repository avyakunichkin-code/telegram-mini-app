# Компактный hero дашборда

## Problem statement

**Как сделать шапку главной информативной, но не «съедающей» экран?**

Игроку на TMA нужны: оставшееся время периода, play/pause, прогресс «месяца», быстрый доступ к «Следующий период» и «События». Маркетинговый слоган и крупный Lottie-блок отнимают ~50% viewport до игрового контента.

## Recommended direction

**H1 — Command strip** (см. `design-lab/dashboard/`):

- Одна control-строка: `Период #N` · `MM:SS` · ▶ ⏸
- Вторая строка: мини-Lottie (48×32) + тонкий progress bar периода
- Третья: pills (без изменений)
- Целевая высота hero: **~110–120px** (vs ~240px сейчас)

## Key assumptions

- Бренд «ТВОЙ ХОД» в hero не обязателен — контекст есть в Telegram и меню.
- Lottie остаётся как индикатор прогресса периода, не как отдельная «сцена».
- Таймер — tabular-nums, 20–22px достаточно для читаемости.

## MVP scope

- Новый компонент `MqxDashboardHero` + вариант `compact`
- `PeriodJourneyLottie` — prop `variant="inline"` (уменьшенная обёртка)
- CSS: `mqx-hero--compact`, не ломать `MqxTabHero` на других вкладках

## Not doing (v1)

- Сворачиваемый hero по тапу
- Перенос pills в нижний таббар
- Отдельный спринт hero для Finance/Analytics (у них уже `MqxTabHero` компактнее)
