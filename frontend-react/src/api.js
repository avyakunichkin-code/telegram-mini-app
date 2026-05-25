/**
 * Barrel: контракт HTTP к backend.
 * Реализация по доменам — `src/api/` (зеркало `backend/app/routers/`).
 */
export {
  API,
  adminApi,
  ApiError,
  apiCall,
  authApi,
  financeApi,
  formatApiErrorDetail,
  gameApi,
  insuranceApi,
  investApi,
  setAuthToken,
} from './api/index.js';
