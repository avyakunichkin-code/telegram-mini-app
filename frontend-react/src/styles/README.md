# Стили frontend-react

Раньше всё лежало в одном `index.css` (~9k строк). Сейчас — модули + barrel `src/index.css` (только `@import`).

## Порядок загрузки

| Файл | Содержимое |
|------|------------|
| `tokens.css` | `:root` палитра, `body`, dark scheme |
| `tma-base.css` | `#root` токены MQX/TGUI, поля `.mq-field`, overrides telegram-ui |
| `mqx/layout.css` | `mqx-screen`, hero, кнопки, tab-page, карточки (до дашборда) |
| `mqx/dashboard.css` | Unified dashboard S5, period actions, goal/level dash |
| `mqx/flows.css` | Auth, new game, save kind, templates, onboarding coach |
| `mqx/finance.css` | Capital / Finance premium, инвестиции, страховки |
| `mqx/analytics.css` | Analytics premium |
| `shell.css` | `app-shell`, legacy `h1/h2`, `bottom-nav`, game shell padding |
| `mqx/events.css` | Оверлей событий, carousel, game header |
| `page.css` | `mq-page` декор, анимации появления, эмоциональный фон |
| `admin.css` | Admin Watchtower |

## Правила

- Новые стили MQX — в файл по **экрану/домену**, не обратно в монолит.
- Токены типографики и цвета — только в `tokens.css` / `#root` в `tma-base.css`.
- `main.jsx` по-прежнему импортирует `./index.css`.

## Сборка

Vite склеивает `@import` в один CSS-бандл; порядок каскада сохраняется.
