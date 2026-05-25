# pre-game-shell — варианты

## Утверждённое направление (2026-05-25)

- Login и Register — **раздельные экраны** (P1 + P2), не unified tabs.
- Pre-game: **Monetka Bubble** (auth, menu) + **Monetka Flow flat** (new game).
- Кнопки: **`mqx-btn`** — `primary` | `secondary` | `ghost` | `link` | `compact`.

## Матрица кнопок

| Роль | Класс | Пример |
|------|-------|--------|
| Главный CTA | `mqx-btn mqx-btn--primary mqx-btn--stretched` | Войти, Новая игра |
| Вторичный | `mqx-btn mqx-btn--secondary mqx-btn--stretched` | Все сохранения, Назад |
| Третичный | `mqx-btn mqx-btn--ghost mqx-btn--stretched` | Выйти |
| В строке | `mqx-btn mqx-btn--primary mqx-btn--compact` | Продолжить |
| Ссылка | `mqx-btn mqx-btn--link` | Создать / Войти |

## Не делаем

- Вариант C (табы login|register на одном экране).
- TabHero на auth loading.
- TGUI `Button` в user flows.
