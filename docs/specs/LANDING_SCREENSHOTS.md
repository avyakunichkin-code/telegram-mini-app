---
layer: spec
status: active
last_reviewed: 2026-05-25
audience: frontend, marketing, agents
---

# Лендинг — скриншоты UI (MQX)

**Связано:** [`landing/README.md`](../../landing/README.md) · [`vision/ideas/landing-mqx-product-preview.md`](../vision/ideas/landing-mqx-product-preview.md) · [`landing/public/screens/README.md`](../../landing/public/screens/README.md) · [`landing/src/scripts/screens.js`](../../landing/src/scripts/screens.js)

---

## Назначение

Статические PNG в `landing/public/screens/` показывают **тот же MQX**, что в Mini App: дашборд (финансы 2×2, цель, действия), капитал (аккордеоны), события (карточка L3). На лендинге одна вертикальная PNG на экран обрезается через `UI_FOCUS` (`object-position`), без отдельных файлов на каждый фрагмент.

**Контраст тем на лендинге:** тёмная секция → PNG `*-light.png` (светлый UI); светлая секция → `*-dark.png`.

---

## Инвентарь файлов

| Файл | Содержимое кадра |
|------|------------------|
| `dashboard-light.png` / `dashboard-dark.png` | Hero + «Финансы периода» (chips) + «Цель» + «Действия периода» |
| `capital-light.png` / `capital-dark.png` | Вкладка «Финансы»: аккордеоны (доходы/расходы/…) |
| `events-light.png` / `events-dark.png` | Карточка события L3 (пузырь Монетки, выборы) |

**Локали:** тексты в `landing/public/locales/*.json`; **картинки общие** для RU и EN.

---

## Пересъём

```bash
cd landing
npm install
npx playwright install chromium   # один раз
npm run capture-screens
```

### Режим по умолчанию — живое приложение

Скрипт [`landing/scripts/capture-screens.mjs`](../../landing/scripts/capture-screens.mjs):

1. `POST /api/login` → токен в `localStorage`
2. Продолжить сохранение → `GameScreen`
3. Снять дашборд и вкладку «Финансы»
4. Карточка события — `#/dev/mqx` (только **dev**, не production build)

| Переменная | По умолчанию |
|------------|--------------|
| `CAPTURE_APP_URL` | `http://127.0.0.1:5173/telegram-mini-app/` |
| `CAPTURE_API_URL` | `http://127.0.0.1:8000` |
| `CAPTURE_USERNAME` | `pytest_user` |
| `CAPTURE_PASSWORD` | `secret` |

**Требования:** `npm run dev` в `frontend-react`, backend с пользователем и активным профилем.

### Fallback — design-lab

При недоступном dev-сервере скрипт переключается на lab автоматически. Явно:

```bash
node scripts/capture-screens.mjs --source=lab
```

| PNG | Lab-источник | Селектор |
|-----|--------------|----------|
| dashboard | [`design-lab/dashboard/goal-chain-round/`](../../design-lab/dashboard/goal-chain-round/) | `.lab-states:first-of-type .mqx-dash-stack--unified` |
| capital | [`design-lab/capital-page/flows-round/`](../../design-lab/capital-page/flows-round/) | `.phone` |
| events | [`design-lab/events/layout-round/`](../../design-lab/events/layout-round/) | `#l1 .ev-card-shell:first-child` |

**Не использовать для лендинга:** `design-lab/dashboard/index.html` (галерея S1–S5 с устаревшим блоком «Уровень»), `capital-page/index.html` `#phone-demo` (старые табы).

---

## Кроп на лендинге (`UI_FOCUS`)

Определено в [`landing/src/scripts/screens.js`](../../landing/src/scripts/screens.js):

| `focus` | Фрагмент | `y` (примерно) |
|---------|----------|----------------|
| `dashboard.period` | Hero + финансы периода | 6% |
| `dashboard.cash` | Chips 2×2 | 18% |
| `dashboard.goal` | Блок «Цель» (между финансами и действиями) | 38% |
| `capital.summary` | Доходы / расходы | 8% |
| `capital.invest` | Инвестиции / страховки | 46% |
| `events.card` | Карточка события | 50%, `fit: cover` |

После смены вертикальной компоновки в prod — подправить `y` / `ratio` и пересобрать лендинг.

---

## Чеклист перед публикацией лендинга

1. [ ] UI в игре изменился → `npm run capture-screens` (предпочтительно app-режим)
2. [ ] Визуально проверить hero, `#peek`, `#features` на `landing` dev/preview
3. [ ] Обновить `last_capture` в [`landing/public/screens/README.md`](../../landing/public/screens/README.md)
4. [ ] `npm run build:pages` в `frontend-react` → деплой Pages (см. [`ops/DEPLOY.md`](../ops/DEPLOY.md))

---

## Антипаттерны (история)

| Проблема | Причина | Решение |
|---------|---------|---------|
| Старые chips «Доходы/Расходы» | Съём с `design-lab/dashboard` S5 + `mqx-level-dash` | `goal-chain-round` или app |
| На капитале нет целей / неверная зона | Кроп `dashboard.goal` при старой высоте кадра | Обновить `UI_FOCUS.y` |
| События — чёрный прямоугольник | Кроп `.ev-m2` + `object-fit: contain` на тёмном фоне | Весь `.ev-card-shell` или `EventCard`, `fit: cover` |
| Lab ≠ prod | Макет не перенесён в `mqx/` | Сначала prod, потом пересъём |

---

## Review (2026-05-25)

| Ось | Вердикт |
|-----|---------|
| Correctness | Скрипт и `UI_FOCUS` соответствуют текущему prod (цель, аккордеоны, L3) |
| Architecture | Один пайплайн PNG + кроп; app-first, lab-fallback |
| Security | Учётные данные только через env / локальный pytest |
| Maintenance | Спека + дата пересъёма в `public/screens/README.md` |

**Approve** для документации и артефактов пересъёма; при следующем крупном UI — повторить app-capture перед deploy.
