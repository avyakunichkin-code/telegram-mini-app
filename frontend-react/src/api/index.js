/** Доменные клиенты API (без агрегата API — он в `src/api.js`). */
export { setAuthToken, formatApiErrorDetail, ApiError, apiCall } from './client.js';
export { authApi } from './auth.js';
export { gameApi } from './game.js';
export { financeApi } from './finance.js';
export { investApi } from './invest.js';
export { insuranceApi } from './insurance.js';
export { adminApi } from './admin.js';
