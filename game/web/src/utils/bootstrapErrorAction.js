/**
 * Что делать экрану партии, если загрузка упала.
 * 410 — сохранение снятого режима (ADR-013): партию не открыть, ведём в меню сохранений.
 */
export function bootstrapErrorAction(status) {
  return status === 410 ? 'menu' : 'retry';
}
