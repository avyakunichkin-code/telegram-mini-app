# Шаблоны сценария — варианты

## Layout (карточки)

| ID | Идея | Статус |
|----|------|--------|
| **T1** | Сетка 2×2 + абзац description (legacy) | архив |
| **T2** ★ | **Strips** — иконка + название + bullets + compare | **prod** |
| **T3** | Strips без compare, только bullets | альтернатива |
| **T4** | Grid 2×2, bullets вместо абзаца | компакт |

## Иконки ситуации (SI)

| ID | Стиль | Когда |
|----|-------|-------|
| **SI1** ★ | Outline SVG по типу жизни | **prod** |
| **SI2** | Эмодзи в gradient-плитке | быстрый прототип |
| **SI3** | Крупная сцена 72px слева | T4 layout |

Ключи `scenario_icon`: `fresh_start` · `car_loan` · `home_mortgage` · `debt_stack`

## Данные

Bullets в `blueprint_json.highlights`; fallback — derive в `starter_template_presentation.py`.
Миграция: `0022_game_template_scenario_highlights.sql`.
