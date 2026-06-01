# Портреты персонажей (4 жизни)

Растровые аватары в стиле **Студента** для экрана выбора сценария и блока Z-NEEDS.

| Персонаж | template_key | Атрибуты |
|----------|--------------|----------|
| Студент | `mq_game_basic_v1` | худи, рюкзак, thumbs up |
| Профессионал | `mq_game_tight_budget_v1` | рубашка, сумка, карта; причёска с пробором (не как у студента) |
| Руководитель | `mq_game_mortgage_stress_v1` | пиджак, планшет, ключи; деловая стрижка |
| Предприниматель | `mq_game_debt_stack_v1` | 6 рук: телефон, кофе, ноут, папка, ручка, **портфель** |

## Запуск

```bash
cd design-lab/game-templates/persona-portraits-round
./sync-lab.sh
npx serve .
```

Хаб: `cd design-lab && npx serve .` → **Портреты персонажей**.

## Pipeline ассетов

1. Исходники в `assets/source/*-mascot-source.png` (или студент из prod).
2. Обработка (фон, trim, размеры):

```bash
cd frontend-react
python scripts/process-persona-portraits.py
# или
npm run persona-portraits:process
```

Выход: `design-lab/.../assets/` и `frontend-react/src/assets/character-portraits/`.

Размеры по высоте: **pick** 56 · **md** 72 · **dash** 108 · **master** (trim + **normalize silhouette height** — одинаковый визуальный масштаб).

## Prod

- `PersonaPortrait`, `personaPortraits.js`
- `MqxStarterScenarioPicker` (`usePersonaPortraits`, по умолчанию `true`)
- `MqxNeedsDash` — портрет по `templateKey`

SVG I-Scene остаётся в [`../scenario-icons/`](../scenario-icons/) как архив.
