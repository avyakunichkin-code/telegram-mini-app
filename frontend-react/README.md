# Money Quest — фронтенд (React + Vite)

Клиент Telegram Mini App для [Money Quest](../README.md). UI на React 18 и [`@telegram-apps/telegram-ui`](https://github.com/Telegram-Mini-Apps/TelegramUI).

---

## Скрипты

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Разработка (Vite dev server, HMR) |
| `npm run build` | Production-сборка в `dist/` |
| `npm run preview` | Локальный просмотр собранного `dist/` |
| `npm run lint` | ESLint по проекту |
| `npm run build:pages` | Игра в `dist/` + лендинг из [`../landing/`](../landing/) в `dist/landing/` |
| `npm run deploy` | `build:pages` + публикация на GitHub Pages (`gh-pages -d dist`) |
| `npm run deploy:game-only` | Только игра, без лендинга |

Перед первым деплоем: `npm install` здесь и `npm install` в `landing/`.

**URL на GitHub Pages** (репозиторий `telegram-mini-app`):

| Что | Путь |
|-----|------|
| Mini App (игра) | `https://avyakunichkin-code.github.io/telegram-mini-app/#/` — [`HashRouter`](src/App.jsx), для GitHub Pages без history API |
| Лендинг | `https://avyakunichkin-code.github.io/telegram-mini-app/landing/` — обычный статический URL |

Домашняя страница и base path игры: поле **`homepage`** и `base` в [`vite.config.js`](./vite.config.js).

---

## Backend API

В режиме разработки базовый URL для `fetch` пустой (запросы идут на тот же origin, обычно с прокси Vite к backend или через настройку dev).

Для production в [`src/api.js`](src/api.js) задан URL API по умолчанию (Render). Если понадобятся несколько окружений, вынесите базовый URL в переменную с префиксом **`VITE_`** (читает Vite через `import.meta.env`), измените [`src/api.js`](src/api.js) и задайте значение в CI или в `.env` (локально файл не коммитить — см. корневой `.gitignore`).

---

## Документация продукта

- UI/поведение клиента: [`../docs/specs/SPEC_FRONTEND_UI.md`](../docs/specs/SPEC_FRONTEND_UI.md)
- Бренд и тон: [`../docs/reference/brandbook/BRANDBOOK.md`](../docs/reference/brandbook/BRANDBOOK.md)
- Карта всей документации: [`../docs/README.md`](../docs/README.md)
- Описание концепции: [`../GAME.md`](../GAME.md)

---

## Каталог (важнее для разработчиков)

- [`src/main.jsx`](src/main.jsx), [`src/App.jsx`](src/App.jsx) — вход и роутинг
- [`src/api.js`](src/api.js) — HTTP-обёртка и ошибки API
- [`src/hooks/useGame.js`](src/hooks/useGame.js) — состояние игры, период, события
- [`src/components/`](src/components/) — экраны и секции (игра, финансы, аналитика, старт профиля)