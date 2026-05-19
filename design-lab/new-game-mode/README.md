# Design-lab: Новая игра — режим (шаг 1)

**Статус:** **B · Монетка** внедрён в prod (`NewProfileKindScreen`).

| Документ | Назначение |
|----------|------------|
| [`../../frontend-react/src/components/new-game/NewProfileKindScreen.jsx`](../../frontend-react/src/components/new-game/NewProfileKindScreen.jsx) | Prod |
| [`../auth-flow/`](../auth-flow/) | Тот же skin пузыря |

## Prod (утверждено)

- **Монетка** + пузырь (`MonetkaBubbleScreen`); без повторного «я Монетка» — контекстная реплика
- Поле «Название сохранения»
- Плитки **Игра** / **План** (План — «Скоро»)
- **Игра** → шаг 2 (каталог шаблонов), без автостарта

## Варианты (история обсуждения)

| ID | Идея | Статус |
|----|------|--------|
| **A** | Hero MQX + две карточки в stack | superseded |
| **B** | Монетка + пузырь, имя и режим в одном экране | **★ prod** |
| **C** | Stepper: сначала имя, потом режим | не выбран |

## Следующая тема

[`../game-templates/`](../game-templates/) — шаг 2, карточки шаблонов.
