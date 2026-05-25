export { setAuthToken, formatApiErrorDetail, ApiError, apiCall } from './client.js';
import { authApi } from './auth.js';
import { gameApi } from './game.js';
import { financeApi } from './finance.js';
import { investApi } from './invest.js';
import { insuranceApi } from './insurance.js';
import { adminApi } from './admin.js';

export { authApi, gameApi, financeApi, investApi, insuranceApi, adminApi };

/** Единый объект API (обратная совместимость с `import { API } from '../api'`) */
export const API = {
  ...authApi,
  ...gameApi,
  ...financeApi,
  ...investApi,
  ...insuranceApi,
};
