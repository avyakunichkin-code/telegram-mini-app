# Design-lab: Шаблоны игры (шаг 2)

**Статус:** **B · Монетка** внедрён в prod (`GameTemplatePickScreen`).

| Документ | Назначение |
|----------|------------|
| [`../../frontend-react/src/components/new-game/GameTemplatePickScreen.jsx`](../../frontend-react/src/components/new-game/GameTemplatePickScreen.jsx) | Prod |
| [`../../frontend-react/src/components/GameStarterPicker.jsx`](../../frontend-react/src/components/GameStarterPicker.jsx) | Сетка карточек |

## Prod (утверждено)

- **Монетка** + пузырь; имя слота в подзаголовке, не в заголовке
- Сетка шаблонов (`GameStarterPicker`) с метками сложности
- **Начать игру** — выбранный шаблон
- **Быстрый старт** — самый простой сценарий из каталога
- **Назад** — к шагу 1

## Варианты IA (история)

| ID | Идея | Статус |
|----|------|--------|
| **F** | Полный каталог + кнопка старта | **★ prod** |
| **Q** | Только быстрый старт (без каталога) | доступен как вторичная кнопка |
| **A** | Premium hero + каталог в карточке | superseded |

## Запуск prod

`npm run dev` → меню → **Новая игра** → **Игра** → экран шаблонов.
