import { apiCall } from './client.js';

/** `/api/game/expenses` — снимок burn rate и статьи расходов игры. */
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
};
