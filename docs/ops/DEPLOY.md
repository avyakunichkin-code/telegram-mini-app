---
layer: ops
status: active
last_reviewed: 2026-05-24
audience_note: Pre-Alpha и Closed Alpha — один prod-стенд с своим доменом, API без cold start.
---

# Деплой: Pre-Alpha → Closed Alpha

Целевая схема на ближайшие две волны плейтеста (**10–20** и **50–100** игроков по [`GAME.md`](../../GAME.md) §11):

| Компонент | Где | Зачем |
|-----------|-----|--------|
| **Mini App (SPA + лендинг)** | GitHub Pages + **свой домен** | HTTPS, стабильная ссылка для BotFather и приглашений |
| **API** | Render **Starter** (не Free) | Без засыпания → нет 30–60 с ожидания при открытии TMA |
| **PostgreSQL** | Render (managed) | Одна БД prod; миграции из `backend/migrations/` |

Чеклист готовности волны: [`foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md`](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md) §3.

---

## 1. Домены (подставьте свои)

Рекомендуемая схема:

| Имя | Назначение | Пример |
|-----|------------|--------|
| `app.` | Mini App + лендинг `/landing/` | `https://app.example.com/#/game` |
| `api.` | FastAPI | `https://api.example.com` |

До переноса DNS можно оставить **GitHub Pages** (`*.github.io/telegram-mini-app/`) — CORS и fallback API это поддерживают.

---

## 2. Backend (Render)

### 2.1 Новый стенд (Blueprint)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → репозиторий → файл [`render.yaml`](../../render.yaml).
2. Дождаться деплоя `tvoy-hod-api` и БД `tvoy-hod-db`.
3. **Environment** сервиса API (обязательно):

| Переменная | Значение |
|------------|----------|
| `SECRET_KEY` | длинная случайная строка (если не сгенерировался) |
| `PUBLIC_APP_URL` | `https://app.YOUR_DOMAIN/#` |
| `ADMIN_WEB_BASE_URL` | то же, что `PUBLIC_APP_URL` |
| `CORS_ALLOW_ORIGINS` | `https://app.YOUR_DOMAIN` |
| `ADMIN_USER_IDS` | ваш numeric user id (через запятую) |
| `OPS_TELEGRAM_BOT_TOKEN` / `OPS_TELEGRAM_CHAT_ID` | по желанию (Watchtower) |

4. **Custom Domain** на Web Service: `api.YOUR_DOMAIN` → CNAME из панели Render.
5. Миграции на prod (Windows, из `backend/`):

```powershell
$env:DATABASE_URL = "<Internal Database URL из Render>"
.\migrate.ps1
```

6. Smoke: `GET https://api.YOUR_DOMAIN/api/health` → `200`.

### 2.2 Уже есть сервис `telegram-mini-app-zwfs`

Не создавайте второй API без нужды:

1. План **Starter** (или выше) — отключить sleep.
2. Добавить env из таблицы выше.
3. Привязать custom domain `api.*` в Render.

Шаблон env: [`backend/.env.example`](../../backend/.env.example).

### CORS

- Явные origins: `CORS_ALLOW_ORIGINS` + origin из `PUBLIC_APP_URL` автоматически.
- Старый GitHub Pages: regex `*.github.io` по умолчанию; отключить: `CORS_ALLOW_ORIGIN_REGEX=none`.

---

## 3. Frontend (GitHub Pages + домен)

### 3.1 Переменные сборки

| Переменная | Свой домен (корень) | Старый GitHub Pages |
|------------|---------------------|---------------------|
| `VITE_BASE_PATH` | `/` | `/telegram-mini-app/` |
| `VITE_API_BASE_URL` | `https://api.YOUR_DOMAIN` | URL Render API |

Пример локально: скопируйте [`frontend-react/.env.example`](../../frontend-react/.env.example) → `.env.production.local`.

### 3.2 CI (рекомендуется)

В GitHub → **Settings → Secrets and variables → Actions → Variables**:

| Variable | Пример |
|----------|--------|
| `VITE_API_BASE_URL` | `https://api.example.com` |
| `VITE_BASE_PATH` | `/` |

Push в `main` запускает [`.github/workflows/deploy-app.yml`](../../.github/workflows/deploy-app.yml) → артефакт на **GitHub Pages**.

Первый раз: **Settings → Pages → Source: GitHub Actions**.

### 3.3 Свой домен на Pages

1. **Settings → Pages → Custom domain** → `app.YOUR_DOMAIN`.
2. У регистратора DNS: `CNAME` `app` → `<user>.github.io` (точное значение — в подсказке GitHub).
3. Дождаться SSL (обычно до 24 ч, часто быстрее).
4. Пересобрать с `VITE_BASE_PATH=/` и `VITE_API_BASE_URL` на prod API.

### 3.4 Ручной деплой (как раньше)

```bash
cd frontend-react
# Windows PowerShell:
$env:VITE_BASE_PATH="/"
$env:VITE_API_BASE_URL="https://api.YOUR_DOMAIN"
npm run build:pages
npx gh-pages -d dist
```

---

## 4. Telegram BotFather

1. **Menu Button / Web App URL** → `https://app.YOUR_DOMAIN/#` (или путь с base, если не корень).
2. После смены домена — обновить ссылку в приглашении Pre-Alpha ([протокол §5](../foundation/PRE_ALPHA_PLAYTEST_PROTOCOL.md)).

HashRouter (`#/game`) менять не нужно.

---

## 5. Зафиксировать билд для волны (Pre-Alpha §3)

Перед набором 10–20 человек:

1. Записать **commit SHA** `main` после успешного workflow Deploy.
2. Записать **тег API** (Render deploy id или commit, если деплой с ветки).
3. В канале тестеров одна строка: «стенд от `2026-05-24`, commit `abc1234`».

При hotfix — коротко сообщить «билд обновлён», не менять механику mid-session без нужды.

---

## 6. Smoke перед «кнопкой старт»

| # | Проверка |
|---|----------|
| 1 | Открыть Web App URL в Telegram (Android + один desktop) |
| 2 | Регистрация / логин |
| 3 | Новая игра из шаблона → зарплата → событие → конец периода |
| 4 | В DevTools Network нет CORS errors на `api.*` |
| 5 | `GET /api/health` → 200 |
| 6 | (опционально) admin Watchtower открывается по `#/admin` |

---

## 7. Closed Alpha (следующая ступень)

Та же инфраструктура; добавить:

- отдельная **когорта** или флаг в БД не обязателен на старте;
- при росте нагрузки — апгрейд плана Render DB/API;
- метрики D1/D7 — по [`GAME.md`](../../GAME.md) и эпику admin/analytics.

Отдельный staging (`staging.app.*`) — по желанию, дублирует Variables в GitHub (`VITE_*` на preview workflow).

---

## 8. Ориентир по бюджету (Render, 2026)

| Ресурс | План | Ориентир |
|--------|------|----------|
| Web Service | Starter | ~$7/мес, без sleep |
| PostgreSQL | Basic | от ~$6/мес |
| GitHub Pages + домен | — | Pages бесплатно; домен у регистратора |

Итого порядка **$15–20/мес** — достаточно для Pre-Alpha и начала Closed Alpha.

---

## 9. Troubleshooting

| Симптом | Причина | Действие |
|---------|---------|----------|
| Долгая загрузка после паузы | Render Free / sleep | План Starter+ |
| CORS error в консоли | Неверный origin | `PUBLIC_APP_URL`, `CORS_ALLOW_ORIGINS` |
| 404 на refresh без hash | BrowserRouter на static host | Оставляем HashRouter |
| API 401 после деплоя | другой `SECRET_KEY` | Тестерам перелогиниться |
| Пустая БД | миграции не прогнаны | `migrate.ps1` на prod `DATABASE_URL` |

---

*Связанные файлы: [`render.yaml`](../../render.yaml), [`frontend-react/.env.example`](../../frontend-react/.env.example), [`backend/.env.example`](../../backend/.env.example).*
