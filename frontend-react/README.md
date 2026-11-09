# ТВОЙ ХОД — фронтенд (React + Vite)

**Только ТВОЙ ХОД:** [документация](../docs/game/README.md) · [дизайн](../docs/game/DESIGN.md) · [локальные инструкции](AGENTS.md).

Браузерный/PWA клиент (Telegram — дополнительный канал) для [ТВОЙ ХОД](../README.md). UI на React 18 и [`@telegram-apps/telegram-ui`](https://github.com/Telegram-Mini-Apps/TelegramUI).

---

## Срез 07.11.2026

Публичный `#/` — гостевой старт; `/login` — существующий аккаунт; `/register` для гостя привязывает почту к текущей партии. `screens/game/DashboardScreen.jsx` — пульт, контекстная Монетка Б в hero, labels-only tickets. Гостевой v2 не показывает автоматическую полоску; прежний O3 сохранён. Контракт и ограничения: [CURRENT_GAME](../docs/game/handbook/CURRENT_GAME.md). Локальная PostgreSQL требует migration 0052. Публикация нового старта и баланс ещё не приняты.

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

Домашняя страница и base path игры: поле **`homepage`** и `base` в [`vite.config.js`](vite.config.js).

---

## Backend API

В режиме разработки базовый URL для `fetch` пустой (запросы идут на тот же origin, обычно с прокси Vite к backend или через настройку dev).

Prod API: **`VITE_API_BASE_URL`** (см. [`.env.example`](.env.example)); fallback — Render URL в [`src/api.js`](src/api.js).  
Деплой и домен: [`docs/game/ops/DEPLOY.md`](../docs/game/ops/DEPLOY.md). CI: GitHub Variables `VITE_API_BASE_URL`, `VITE_BASE_PATH`.

---

## Документация продукта

- UI/поведение клиента: [`../docs/game/specs/SPEC_FRONTEND_UI.md`](../docs/game/specs/SPEC_FRONTEND_UI.md)
- Бренд и тон: [`../docs/game/reference/brandbook/BRANDBOOK.md`](../docs/game/reference/brandbook/BRANDBOOK.md)
- Карта всей документации: [`../docs/README.md`](../docs/README.md)
- Описание концепции: [`GAME.md`](../docs/game/handbook/GAME.md)

---

## Каталог (важнее для разработчиков)

- [`src/main.jsx`](src/main.jsx), [`src/App.jsx`](src/App.jsx) — вход и роутинг
- [`src/api.js`](src/api.js) — HTTP-обёртка и ошибки API
- [`src/hooks/useGame.js`](src/hooks/useGame.js) — состояние игры, период, события
- [`src/components/`](src/components/) — экраны и секции (игра, финансы, аналитика, старт профиля)
