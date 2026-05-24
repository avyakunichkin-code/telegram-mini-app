# ТВОЙ ХОД — лендинг (отдельный модуль)

Статический маркетинговый сайт **не связан** с `frontend-react/` и URL Mini App. Игру по-прежнему открывают по адресу GitHub Pages приложения (`/telegram-mini-app/`).

## Запуск локально

```bash
cd landing
npm install
npm run dev
```

Откройте URL из терминала Vite (обычно `http://localhost:5173`).

## Сборка

```bash
npm run build
npm run preview
```

Артефакт: `landing/dist/`.

## Языки (RU / EN)

- Тексты: [`public/locales/ru.json`](public/locales/ru.json), [`public/locales/en.json`](public/locales/en.json)
- Переключатель в шапке; выбор сохраняется в `localStorage` (`mq-landing-lang`)
- Новые ключи добавляйте в **оба** файла с одинаковой структурой

## Контакты для партнёров

Замените email в [`src/scripts/main.js`](src/scripts/main.js) (`CONTACT_EMAIL`) и при необходимости `href` в `index.html`.

Ссылка на бота **намеренно отсутствует** (статус «Скоро в Telegram»). Когда будете готовы — добавьте CTA в локали и hero, не трогая модуль игры.

## Деплой на GitHub Pages (вместе с игрой)

Основной способ — из `frontend-react/`:

```bash
cd ../frontend-react
npm run deploy
```

Скрипт [`scripts/build-pages.mjs`](../frontend-react/scripts/build-pages.mjs) собирает лендинг с `BASE_PATH=/telegram-mini-app/landing/`, игру с `/telegram-mini-app/`, копирует лендинг в `dist/landing/` и выкладывает один `dist/` на ветку `gh-pages`.

Локальная сборка без публикации: `cd frontend-react && npm run build:pages`.

Отдельный деплой только лендинга (другой хостинг): `BASE_PATH=/путь/ npm run build` в каталоге `landing/`.

## Бренд

Палитра и тон: [`docs/reference/brandbook/BRANDBOOK.md`](../docs/reference/brandbook/BRANDBOOK.md).
