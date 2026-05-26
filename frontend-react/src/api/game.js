import { apiCall } from './client.js';

export const gameApi = {
  getGameProfiles() {
    return apiCall('/api/game/profiles');
  },
  createGameProfile(payload) {
    return apiCall('/api/game/profiles', 'POST', payload);
  },
  activateGameProfile(id) {
    return apiCall(`/api/game/profiles/${id}/activate`, 'POST');
  },
  listGameTemplates(forSaveKind = null) {
    const q = forSaveKind ? `?for_save_kind=${encodeURIComponent(forSaveKind)}` : '';
    return apiCall(`/api/game/templates${q}`);
  },
  startNewGame(payload) {
    return apiCall('/api/game/start', 'POST', payload);
  },
  patchOnboarding(payload) {
    return apiCall('/api/game/profile/onboarding', 'PATCH', payload);
  },
  getGameBootstrap() {
    return apiCall('/api/game/bootstrap');
  },
  getTimeStatus() {
    return apiCall('/api/game/time');
  },
  setTimePlay() {
    return apiCall('/api/game/time/play', 'POST');
  },
  setTimePause() {
    return apiCall('/api/game/time/pause', 'POST');
  },
  setTimeNext() {
    return apiCall('/api/game/time/next', 'POST');
  },
  getPeriodStatus() {
    return apiCall('/api/game/period/status');
  },
  getPendingEvent() {
    return apiCall('/api/game/events/pending');
  },
  chooseEvent(eventId, choiceId) {
    return apiCall(`/api/game/events/${eventId}/choose`, 'POST', { choice_id: choiceId });
  },
  getAchievements() {
    return apiCall('/api/game/achievements');
  },
  claimSalary() {
    return apiCall('/api/game/period/claim-salary', 'POST');
  },
  contributeToSafetyFund(payload) {
    return apiCall('/api/game/period/contribute-to-safety-fund', 'POST', payload);
  },
  withdrawFromSafetyFund(payload) {
    return apiCall('/api/game/period/withdraw-from-safety-fund', 'POST', payload);
  },
  treatSelf(payload) {
    return apiCall('/api/game/period/treat-self', 'POST', payload);
  },
  getNeedsGuide() {
    return apiCall('/api/game/needs/guide');
  },
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
