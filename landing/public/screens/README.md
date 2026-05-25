# Скрины UI для лендинга

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

**По умолчанию** — из **живого приложения** (как на проде): логин, партия, вкладки «Главная» / «Финансы», карточка события из `#/dev/mqx`.

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

Источники lab: `design-lab/dashboard/goal-chain-round`, `capital-page/flows-round`, `events/layout-round` (L1).
