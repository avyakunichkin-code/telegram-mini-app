/**
 * Barrel: контракт HTTP к backend.
 * Реализация по доменам — `src/api/` (зеркало `backend/app/routers/`).
 */
export { setAuthToken, formatApiErrorDetail, ApiError, apiCall } from './api/client.js';
import { authApi } from './api/auth.js';
import { gameApi } from './api/game.js';
import { financeApi } from './api/finance.js';
import { investApi } from './api/invest.js';
import { insuranceApi } from './api/insurance.js';
import { adminApi } from './api/admin.js';

export { authApi, gameApi, financeApi, investApi, insuranceApi, adminApi };

/** Обратная совместимость: `import { API } from '../api'` */
export const API = Object.assign({}, authApi, gameApi, financeApi, investApi, insuranceApi);
