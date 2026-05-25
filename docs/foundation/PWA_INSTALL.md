---
layer: foundation
status: active
last_reviewed: 2026-05-25
epic: PW1
---

# Как установить ТВОЙ ХОД как PWA

PWA — **тот же** фронт, что и Mini App, но открытый **вне Telegram** и (опционально) закреплённый на домашнем экране. Вход: **email + пароль** (как в браузере), те же сохранения на API.

---

## Куда зайти

| Среда | URL |
|--------|-----|
| **Prod (GitHub Pages)** | Игра: https://avyakunichkin-code.github.io/telegram-mini-app/#/ |
| **Лендинг** | https://avyakunichkin-code.github.io/telegram-mini-app/landing/ (без `#/`, отдельный сайт) |
| **Локально** | http://localhost:5173/telegram-mini-app/#/ после `npm run dev` |

> Из **чата Telegram** пункт «Установить приложение» обычно **не появляется** — откройте ссылку в **Chrome** (Android) или **Safari** (iOS).

---

## Android / desktop Chrome

1. Откройте URL в **Chrome**.
2. Войдите в аккаунт (регистрация при первом заходе).
3. Меню (⋮) → **«Установить приложение»** / **Install app** — или иконка «+» в адресной строке.
4. Запуск с домашнего экрана — отдельное окно без панели браузера.

---

## iPhone / iPad (Safari)

1. Откройте URL в **Safari** (не во встроенном браузере Telegram).
2. **Обязательно с `#/` в конце:**  
   `https://avyakunichkin-code.github.io/telegram-mini-app/#/`  
   Без `#/` экран может остаться **пустым** (особенность HashRouter).
3. Войдите в аккаунт (email + пароль).
4. **Поделиться** → **«На экран Домой»**.
5. Подтвердите название «ТВОЙ ХОД».

### Если белый экран или «не открывается»

1. Проверьте, что в адресной строке есть **`#/`** после `telegram-mini-app/`.
2. **Настройки Safari** → «Дополнения» → отключите блокировщики для сайта (или попробуйте приватное окно наоборот).
3. **Настройки** → Safari → «Дополнения» → **Очистить историю и данные сайтов** для github.io (старый service worker).
4. Откройте снова с полным URL с `#/`, подождите 10–15 с (первый заход + API).
5. Не открывайте игру из **встроенного** браузера Telegram — только системный Safari.

Push-уведомления и полноценный offline **пока не** поддерживаются — только кэш оболочки и быстрый повторный старт.

---

## Локальная проверка PWA

```bash
cd frontend-react
npm run build
npm run preview
```

Откройте адрес из вывода `preview` (с путём `/telegram-mini-app/`). В Chrome DevTools → **Application** → Manifest / Service workers.

В `npm run dev` SW включён (`devOptions.enabled`) — удобно для отладки install prompt.

---

## Деплой

После изменений:

```bash
cd frontend-react
npm run deploy
# или полный сайт с лендингом:
npm run build:pages && npx gh-pages -d dist
```

API: `VITE_API_BASE_URL` при сборке prod; CORS — origin GitHub Pages уже в дефолте бэкенда (`*.github.io`).

---

## Связанные документы

- [PLAN_pwa-standalone.md](../plans/PLAN_pwa-standalone.md)
- [PW1_RESUME_PLAYTEST_CHECKLIST.md](PW1_RESUME_PLAYTEST_CHECKLIST.md)
- [DEPLOY.md](../ops/DEPLOY.md)
