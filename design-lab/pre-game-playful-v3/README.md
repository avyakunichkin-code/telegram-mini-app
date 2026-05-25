# Pre-game playful v3 ★ FINAL

**Статус:** итоговый макет (2026-05-25)

## Идея раунда

| # | Решение |
|---|---------|
| Auth | `pg-auth-panel`, logo сверху, email-only, подсказки в тексте Монетки (11px) |
| P3 | `mqx-fin-row` + compact «Продолжить» справа внизу |
| P4/P5 | Prod-иконки + **T-B glass** (`--tb-glass`) |
| Заголовки секций | Чёрные, margin 20px / 12px |
| P4 copy | Игра (жизни, инвестиции, квартира) · План — с новой строки |

Сравнение: [`../pre-game-shell/`](../pre-game-shell/) (v2 — Монетка над пузырём).

## Запуск

```powershell
cd design-lab/pre-game-playful-v3
.\sync-lab.ps1
npx serve .
```

`index.html` подключает **lab-base.css** + **styles.css** (оверрайды раунда). Если правишь только `styles.css`, достаточно обновить страницу; после правок в родительских `auth-flow` / `game-templates` — снова `.\sync-lab.ps1`.

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
