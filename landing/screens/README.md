# Скрины UI для лендинга

**Последняя пересъёмка:** 2026-05-25 (режим `lab`; app — при запущенных `frontend-react` dev + backend).

**Спека:** [`docs/specs/LANDING_SCREENSHOTS.md`](../../../docs/specs/LANDING_SCREENSHOTS.md)

| Файл | Тема UI | Использование на лендинге |
|------|---------|---------------------------|
| `dashboard-light.png` | светлая | Тёмные секции — **кроп** через `object-position` |
| `dashboard-dark.png` | тёмная | Резерв для светлых секций |
| `events-light.png` | светлая | Блок событий (карточка L3) |
| `events-dark.png` | тёмная | Резерв |
| `capital-light.png` | светлая | Блок капитала (аккордеоны) |
| `capital-dark.png` | тёмная | Резерв |

Кадрирование задаётся в `landing/src/scripts/screens.js` (`UI_FOCUS`: `dashboard.period`, `capital.summary`, …), не отдельными файлами.

## Пересъём

```bash
cd landing
npm run capture-screens
```

**По умолчанию** — из **живого приложения** (как на проде): логин → партия → «Главная» / «Финансы» → карточка из `#/dev/mqx`.

Нужны:

- `npm run dev` в `frontend-react`
- backend с тестовым пользователем и хотя бы одним сохранением

Переменные (опционально):

- `CAPTURE_APP_URL` — `http://127.0.0.1:5173/telegram-mini-app/`
- `CAPTURE_API_URL` — `http://127.0.0.1:8000`
- `CAPTURE_USERNAME` / `CAPTURE_PASSWORD` — по умолчанию `pytest_user` / `secret`

Только design-lab (без backend):

```bash
node scripts/capture-screens.mjs --source=lab
```

| PNG | Lab-источник |
|-----|----------------|
| dashboard | `design-lab/dashboard/goal-chain-round` |
| capital | `design-lab/capital-page/flows-round` |
| events | `design-lab/events/layout-round` (L1, `#l1 .ev-card-shell`) |

**Устаревшие источники (не использовать):** `design-lab/dashboard/index.html` (S5 + «Уровень»), `capital-page/#phone-demo`.
