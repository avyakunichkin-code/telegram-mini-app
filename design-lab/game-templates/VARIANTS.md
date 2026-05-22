# Шаг 2 — утверждено (раунд 3)

## Экран ★

| Параметр | Значение |
|----------|----------|
| Layout | **B** compact, 2 bullets, без compare |
| Заголовок Монетки | **Четыре ритма** |
| Реплика | Ух ты, четыре жизни… Старт / Драйв в тексте (не в бейджах) |
| Бейджи | **нет** — только цвет полоски + подложка иконки |
| Цвета | green → amber → orange → red |
| Иконки | **I2** flat chip (как финансы периода) |

## Иконки

| ID | Стиль | Статус |
|----|-------|--------|
| I1 | Outline 72px | архив |
| **I2 ★** | 24px белый штрих на градиенте | **prod** |
| I3 | Filled glyph | альтернатива (`icons-variants.html`) |

Ключи: `fresh_start` (студент) · `car_loan` · `home_mortgage` · `factory` (предприниматель)

## Prod

- `GameTemplatePickScreen` — copy + `layout="compact"`
- `MqxStarterScenarioPicker` — compact по умолчанию
- `ScenarioSceneIcons.jsx` — I2
- `starterTemplateTier.js` — slug: green/amber/orange/red
- Миграция `0024_scenario_icon_factory.sql`

## Архив раундов 1–2

Старые макеты A–F, M1–M3 — в git history.
