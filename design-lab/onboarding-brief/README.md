# Onboarding — Mission Brief

**Статус:** **★ A утверждён** (layout 2026-05-19, **копирайт** 2026-05-20) → внедрение в MQX. См. [`APPROVED.md`](./APPROVED.md), тексты — [`CONTENT.md`](./CONTENT.md).

## Утверждённый UI

- Оверлей на `GameScreen` после `overview`.
- **Монетка** сверху ([`assets/monetka-mascot.png`](./assets/monetka-mascot.png)).
- **Заголовок** → **текст** → **«Посмотреть»** → **видео** (плейсхолдер «тут будет видео»).
- Три темы: **«Далее»**; на последнем — **«Начать первый месяц»**.
- **«Пропустить»** сверху.

Запуск:

```bash
cd design-lab/onboarding-brief
npx serve .
```

## Следующий шаг (prod)

1. `MissionBriefOverlay` + `MonetkaAvatar` в `mqx/`
2. `#/dev/mqx`
3. API `onboarding_state` + `GameScreen`
