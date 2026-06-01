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

Контакт: `hello@tvoyhod.app` в [`src/scripts/main.js`](src/scripts/main.js) (`CONTACT_EMAIL`) и `href` в `index.html` (синхронизировать при смене домена).

**Игра (Pre-Alpha):** кнопки «Играть» ведут на  
`https://avyakunichkin-code.github.io/telegram-mini-app/#/` (браузер / PWA).  
Публичный бот в Telegram — в подготовке; в hero указан статус Pre-Alpha.

**Платные услуги / советник:** на лендинге **не показываем** (канон воронки — [`docs/handbook/ADVISOR_FUNNEL_AUDIENCE.md`](../docs/handbook/ADVISOR_FUNNEL_AUDIENCE.md), только handbook).

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

Логотипы на лендинге — те же, что в приложении (**G1** / **G2**):

| Файл | Назначение |
|------|------------|
| `public/brand/logo-full.webp` (+ `.png`) | Hero, CTA — с tagline |
| `public/brand/logo-compact.webp` (+ `.png`) | Шапка, футер — без tagline |

Источник истины: `frontend-react/src/assets/brand/`. Плоские SVG L1–L4 **не используются**.

## Скриншоты интерфейса (design-lab)

PNG лежат в [`public/screens/`](public/screens/). На лендинге **тёмный блок → светлая тема UI**, **светлый блок → тёмная** (контраст рамки).

| Файл | Экран |
|------|--------|
| `dashboard-light.png` / `dashboard-dark.png` | Дашборд: финансы 2×2, цель, действия |
| `capital-light.png` / `capital-dark.png` | Капитал: аккордеоны доходы/расходы/… |
| `events-light.png` / `events-dark.png` | События L3 (карточка) |

Пересъём (Playwright; по умолчанию — **живое приложение**, иначе lab):

```bash
cd landing
npm install
npx playwright install chromium
npm run capture-screens
```

Подробности: [`public/screens/README.md`](public/screens/README.md). Спеки: [`docs/specs/LANDING_SCREENSHOTS.md`](../docs/specs/LANDING_SCREENSHOTS.md), идея: [`docs/vision/ideas/landing-mqx-product-preview.md`](../docs/vision/ideas/landing-mqx-product-preview.md).

**EN** использует те же PNG, что и RU (тексты в локалях, картинки общие).
