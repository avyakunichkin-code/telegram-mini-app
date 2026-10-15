# Design-lab: Меню сохранений

> **История (2026-10-15).** Канон экранов до партии — ★ BG-2: [`../pre-game-shell/APPROVED.md`](../pre-game-shell/APPROVED.md), макет [`../board-game/screens-round/`](../board-game/screens-round/).

**Статус:** **★ B · Монетка** внедрён в prod (`StartMenuScreen`).

| Файл | Назначение |
|------|------------|
| [`../../frontend-react/src/components/StartMenuScreen.jsx`](../../frontend-react/src/components/StartMenuScreen.jsx) | Prod |

## Prod

- `MonetkaBubbleScreen` — контекстные реплики (без «я Монетка»)
- Карточка активного/последнего слота + **Продолжить**
- **Новая игра** · **Все сохранения (N)** · **Выйти**
- Модалка: все слоты, бейдж «активен»

## Копирайт (примеры)

| Состояние | Заголовок |
|-----------|-----------|
| Загрузка | Секунду, листаю полки |
| Нет слотов | Пока пусто на полке |
| Есть слот | Продолжим с того же места? |
