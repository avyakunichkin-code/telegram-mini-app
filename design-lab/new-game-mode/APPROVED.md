# New game mode pick — утверждено

**Дата:** 2026-05-20  
**Вариант:** **R1 · Unified strips**

## UX

- `MonetkaBubbleScreen`: Монетка + пузырь
- Поле «Название сохранения»
- `MqxSaveKindPicker`: ряд **Игра** (клик → шаблоны), ряд **План** («Скоро», disabled)
- «Назад» — outline внизу пузыря

## Копирайт

- Заголовок: «Как назовём сохранение?»
- Подзаголовок: про имя слота и шаг шаблона для «Игры»

## Prod

- [`MqxSaveKindPicker.jsx`](../../frontend-react/src/components/mqx/layout/MqxSaveKindPicker.jsx)
- [`NewProfileKindScreen.jsx`](../../frontend-react/src/components/new-game/NewProfileKindScreen.jsx)
- Стили: `.mqx-save-kind*` в `index.css`
