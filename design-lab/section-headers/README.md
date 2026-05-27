# Section headers — заголовки секций + действия (Dashboard / Капитал)

Цель: унифицировать визуальный паттерн **заголовка секции** (kicker/title/subtitle/meta) и **действий** (иконка/кнопка справа)
для экранов **Dashboard** и **Управления капиталом**.

Это **design-lab** раунд: только HTML/CSS, без React. После утверждения — перенос в `frontend-react/src/components/mqx/`.

## Утверждения

| Дата | Решение |
|------|---------|
| — | — |

## Варианты

| ID | Идея |
|----|------|
| A | Split: слева текст, справа компактные chips (meta + action) |
| B | Card-head: шапка как у `MqxCardHeader`, но с action-слотом |
| C | Minimal: только title + trailing, без kicker (для плотных списков) |
| D | Emphasis: с подзаголовком и “hint” строкой, для обучающих блоков |

## Запуск

```bash
cd design-lab/section-headers
npx serve .
```

Проверка: переключить светлую/тёмную тему — читаемость, контраст, размеры клика.

