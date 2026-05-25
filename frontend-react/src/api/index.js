export { setAuthToken, formatApiErrorDetail, ApiError, apiCall } from './client.js';
export { authApi } from './auth.js';
export { gameApi } from './game.js';
export { financeApi } from './finance.js';
export { investApi } from './invest.js';
export { insuranceApi } from './insurance.js';
export { adminApi } from './admin.js';

/** Единый объект API (обратная совместимость с `import { API } from '../api'`) */
export const API = {
  ...authApi,
  ...gameApi,
  ...financeApi,
  ...investApi,
  ...insuranceApi,
};
