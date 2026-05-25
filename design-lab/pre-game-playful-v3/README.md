# Pre-game playful v3

**Статус:** раунд на утверждение (2026-05-25)

## Идея раунда

| # | Запрос | Решение в lab |
|---|--------|----------------|
| 1 | Монетка внутрь формы, логотип сверху | `pg-auth-logo` + `pg-auth-panel` с `pg-auth-panel__head` |
| 2 | Шрифт чуть меньше | Заголовок `--mq-fs-heading` (14px), текст `--mq-fs-caption` (12px), подсказки `--mq-fs-small` (11px) |
| 3 | Игривые подсказки | `pg-auth-hint` / `pg-flow-hint` |
| 4 | Режим и шаблоны — chip, полоса слева | `mqx-pick-chip` (+ модификаторы `--violet`, `--green` …) |
| 5 | Продолжение — выбор по названию | Copy в P3 + hint про «Все сохранения» |

Сравнение: [`../pre-game-shell/`](../pre-game-shell/) (v2 — Монетка над пузырём).

## Запуск

```powershell
cd design-lab/pre-game-playful-v3
.\sync-lab.ps1
npx serve .
```

`sync-lab.ps1` собирает: `type-scale-round` + `auth-flow` + `new-game-mode` + `styles.css`.

## Экраны

| ID | Экран |
|----|-------|
| P1 | Вход |
| P2 | Регистрация |
| P3 | Стартовое меню |
| P4 | Режим Игра/План |
| P5 | Шаблоны |
| P6 | Проверка сессии |

## После ★

1. Новый layout-компонент или вариант `MonetkaBubbleScreen` → `AuthPanelScreen`.
2. `mqx-pick-chip` в `flows.css`, замена/дополнение `mqx-save-kind` и карточек шаблонов.
3. Copy в `LoginForm`, `RegisterForm`, `StartMenuScreen`, `menuCopy()`.
