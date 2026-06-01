import { apiCall } from './client.js';

/** `/api/game/events` */
export const eventsApi = {
  getPendingEvent() {
    return apiCall('/api/game/events/pending');
  },
  chooseEvent(eventId, choiceId) {
    return apiCall(`/api/game/events/${eventId}/choose`, 'POST', { choice_id: choiceId });
  },
};
