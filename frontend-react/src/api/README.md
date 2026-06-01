# API client

Зеркало `backend/app/routers/`.

| Модуль | Роуты |
|--------|--------|
| `auth.js` | `/api/register`, `/api/login`, `/api/user/me` |
| `game.js` | `/api/game/*`, period, achievements (+ re-export expenses, events) |
| `events.js` | `/api/game/events/*` |
| `expenses.js` | `/api/game/expenses/*` |
| `finance.js` | `/api/finance/*` |
| `invest.js` | `/api/invest/*` |
| `insurance.js` | `/api/insurance/*` |
| `admin.js` | `/api/admin/*` |

Импорт в приложении: `import { API } from '../api'` (агрегат в `src/api.js`, домены в `src/api/`).

Добавление метода: доменный файл + при необходимости поле в `API` в `index.js`.
