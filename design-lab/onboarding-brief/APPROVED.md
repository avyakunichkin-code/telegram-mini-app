# Onboarding Mission Brief — утверждено

> **SUPERSEDED (2026-05-20):** актуальный UX — [`../onboarding-guided/APPROVED.md`](../onboarding-guided/APPROVED.md).

**Дата layout:** 2026-05-19 · **Копирайт:** 2026-05-20  
**Вариант:** **A** (простой бриф + Монетка + «Посмотреть» + видео)  
**Тексты:** [`CONTENT.md`](./CONTENT.md)

## Утверждённый UI

- Оверлей на `GameScreen` после загрузки `overview`.
- **Монетка** — PNG [`assets/monetka-mascot.png`](./assets/monetka-mascot.png) (канон: [`docs/reference/assets/monetka-mascot.png`](../../docs/reference/assets/monetka-mascot.png)).
- Без счётчика «шаг 2/3».
- **Заголовок** → **текст** → **«Посмотреть»** → раскрывается **видео** (плейсхолдер до ролика).
- **«Далее»** между 3 темами; на последнем — **«Начать первый месяц»**.
- **«Пропустить»** сверху.
- Повтор: меню «Повторить обучение» (фаза 2 плана).

## Следующий шаг

MQX `MissionBriefOverlay` + `#/dev/mqx` → API `onboarding_state` → `GameScreen`.

Прототип: `npx serve .` в этой папке.
