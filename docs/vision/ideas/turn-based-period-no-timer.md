---
layer: vision
status: draft
last_reviewed: 2026-05-25
---

# Пошаговый месяц без таймера (turn-based period)

## Problem Statement

**Как сделать игровой «месяц» понятным и напряжённым в TMA, если 5-минутный обратный отсчёт не даёт смысла, ломает синхронизацию WebView и противоречит тому, как игроки уже играют (кнопка «Следующий период»)?**

## Recommended Direction

**Убрать реальное время из UX и логики прогресса.** Период = открытый ход игрока; месяц закрывается только явным действием **«Закрыть месяц»** (текущее «Следующий период»), с уже существующими гейтами (обязательные события, предупреждение о зарплате).

В hero вместо секундомера — **номер периода**, статус «месяц открыт» и **колонка действий справа** (layout **H2**): сверху primary **«Закрыть месяц»**, ниже pill «События». Напряжение переносится на:

- зарплату до закрытия месяца;
- обязательные события;
- последствия `process_period_end` (просрочка, поражение).

На сервере: **`sync_time` не увеличивает `period_index` по elapsed** — только `POST /api/game/time/next` (или эквивалент) вызывает `process_period_end`. Это закрывает латентный баг «период сдвинулся без экономики».

Play/Pause и `period_duration_seconds` в MVP **не показываем**; поле в БД можно оставить deprecated для обратной совместимости API.

**Design-lab ★ FINAL:** [`design-lab/dashboard/hero-no-timer-round/`](../../../design-lab/dashboard/hero-no-timer-round/) — **H2**, CTA **«Закрыть месяц»**.

## Key Assumptions to Validate

- [ ] Игроки в основном закрывают месяц кнопкой, а не дожидаются нуля — опрос/аналитика 5–10 партий.
- [ ] Без таймера не падает понимание «границы месяца» при онбординге — A/B копирайта шага 1.
- [ ] Primary CTA «Закрыть месяц» не путается с «События» и не давит новичка — 3–5 юзабилити-прогонов в TMA.

## MVP Scope

**В scope**

- Backend: `sync_time` — no auto `period_index` bump; переход периода только через `process_period_end`.
- Frontend: удалить клиентский `setInterval`, авто-`setTimeNext`, ▶/⏸; упростить `useGame` / resync (без таймер-логики).
- Hero MQX (**H2**): период слева, справа колонка — primary «Закрыть месяц» + pill «События»; перенос из lab в prod.
- Онбординг: шаг `period_timer` → «Период / месяц» без упоминания секунд и play/pause.
- Docs: `SPEC_PRODUCT` §3.1, `dashboard.md`, `TMA_USER_FLOWS` №2, `GLOSSARY`.

**Вне scope (MVP)**

- Чипы «план месяца» в hero — **эпик TB1.1** (макет H3 в lab как референс).
- Штраф за раннее закрытие месяца.
- Удаление колонки `period_duration_seconds` из БД и шаблонов.
- Выбор длительности периода при старте игры.

## Not Doing (and Why)

- **Idle/FOMO «месяц сам тикает»** — конфликт с [`TARGET_PLAYER_AND_SESSION.md`](../foundation/TARGET_PLAYER_AND_SESSION.md).
- **Сохранение play/pause «на будущее»** — без тика нечего паузить; лишняя когнитивная нагрузка.
- **Новые API `close_period`** — переиспользуем `POST /api/game/time/next`, меняем только семантику и UI-лейблы.
- **Полный рефактор `time_state` в первом PR** — достаточно always-pause или игнор play; глубокая чистка — follow-up.

## Open Questions

- [x] Лейбл CTA: **«Закрыть месяц»**
- [x] Hero layout: **H2** (кнопки справа)
- [x] Чипы плана месяца: **TB1.1**, не TB1
- [ ] Mood-фон страницы без play — один нейтральный или «месяц открыт» (решить в Task 6)

## Связанные документы

- План: [`docs/plans/PLAN_turn-based-period-no-timer.md`](../../plans/PLAN_turn-based-period-no-timer.md)
- UX: [`docs/ux/screens/dashboard.md`](../../ux/screens/dashboard.md)
