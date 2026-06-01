import { apiCall } from './client.js';

/** `/api/game/expenses` — снимок burn rate и строки бюджета Plan. */
export const expensesApi = {
  getExpenses() {
    return apiCall('/api/game/expenses');
  },
  listExpenseCategories() {
    return apiCall('/api/game/expenses/categories');
  },
  listExpenseLines() {
    return apiCall('/api/game/expenses/lines');
  },
  createExpenseLine(payload) {
    return apiCall('/api/game/expenses/lines', 'POST', payload);
  },
  patchExpenseLine(lineId, payload) {
    return apiCall(`/api/game/expenses/lines/${lineId}`, 'PATCH', payload);
  },
  deleteExpenseLine(lineId) {
    return apiCall(`/api/game/expenses/lines/${lineId}`, 'DELETE');
  },
};
