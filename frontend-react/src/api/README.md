# API client

Зеркало `backend/app/routers/`.

| Модуль | Роуты |
|--------|--------|
| `auth.js` | `/api/register`, `/api/login`, `/api/user/me` |
| `game.js` | `/api/game/*`, period, events, achievements, expenses |
| `finance.js` | `/api/finance/*` |
| `invest.js` | `/api/invest/*` |
| `insurance.js` | `/api/insurance/*` |
| `admin.js` | `/api/admin/*` |

Импорт в приложении: `import { API } from '../api'` (barrel `src/api.js`).

Добавление метода: доменный файл + при необходимости поле в `API` в `index.js`.
