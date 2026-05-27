-- CN1-012: needs_delta в effects_json выборов событий (контент для playtest)

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -14900, "xp_delta": 3, "needs_delta": {"health": 12, "comfort": 5, "status": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Продлить на год';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -4500, "xp_delta": 2, "needs_delta": {"health": 6, "comfort": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Продлить на квартал';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": 0, "xp_delta": 1, "needs_delta": {"health": -3}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_gym_membership'
  AND ec.title = 'Не продлевать';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -15000, "xp_delta": 5, "needs_delta": {"social": 14, "comfort": -3}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Помочь полностью';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": -7000, "xp_delta": 4, "needs_delta": {"social": 8, "health": 2}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Помочь частично';

UPDATE event_choices ec
SET effects_json = '{"cash_delta": 0, "xp_delta": 1, "needs_delta": {"social": -6, "comfort": -2}, "enqueue_event": {"chain_key": "family_money_refusal", "followup_definition_key": "mq11_family_money_callback", "after_periods": 1, "context": {"branch": "refused_once"}}}'
FROM event_definitions ed
WHERE ed.id = ec.definition_id
  AND ed.key = 'mq11_family_money_request'
  AND ec.title = 'Отказаться вежливо';
