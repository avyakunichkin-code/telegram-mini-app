# Money Quest — лендинг (отдельный модуль)

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

## Деплой (отдельно от игры)

Варианты:

1. **Отдельный репозиторий** — только содержимое `landing/dist/` на GitHub Pages / Netlify / Beget static.
2. **Поддомен** — `landing.example.com` → корень `dist/`.
3. **Другая ветка `gh-pages`** — только артефакт лендинга (не смешивать с `frontend-react` deploy).

Для GitHub Pages в подпапке репозитория:

```bash
BASE_PATH=/имя-репо/ npm run build
```

Для корня домена: `npm run build` (base `/` по умолчанию).

## Бренд

Палитра и тон: [`docs/reference/brandbook/BRANDBOOK.md`](../docs/reference/brandbook/BRANDBOOK.md).
