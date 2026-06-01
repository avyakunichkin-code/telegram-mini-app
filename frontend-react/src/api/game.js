import { apiCall } from './client.js';
import { expensesApi } from './expenses.js';
import { eventsApi } from './events.js';

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
  getGuidance() {
    return apiCall('/api/game/guidance');
  },
  patchGuidance(payload) {
    return apiCall('/api/game/guidance', 'PATCH', payload);
  },
  getGameBootstrap() {
    return apiCall('/api/game/bootstrap');
  },
  dismissRunFinale() {
    return apiCall('/api/game/run-finale/dismiss', 'POST');
  },
  submitRunFeedback(payload) {
    return apiCall('/api/game/run-feedback', 'POST', payload);
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
  ...eventsApi,
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
  ...expensesApi,
};
