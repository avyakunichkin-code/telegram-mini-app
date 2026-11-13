import { useCallback, useState } from 'react';
import { Button } from '@telegram-apps/telegram-ui';

const EMPTY_CHOICE = () => ({
  id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  description: '',
  cash_delta: 0,
  chainEnabled: false,
  chain_key: '',
  followup_definition_key: '',
  after_periods: 2,
  contextJson: '{}',
  requires_chain_branch: '',
});

export function effectsToChoiceDraft(effects) {
  const fx = effects && typeof effects === 'object' ? effects : {};
  const enqueue = fx.enqueue_event;
  return {
    ...EMPTY_CHOICE(),
    title: '',
    cash_delta: fx.cash_delta ?? 0,
    chainEnabled: Boolean(enqueue),
    chain_key: enqueue?.chain_key ?? '',
    followup_definition_key: enqueue?.followup_definition_key ?? '',
    after_periods: enqueue?.after_periods ?? 2,
    contextJson: JSON.stringify(enqueue?.context ?? {}, null, 2),
    requires_chain_branch: fx.requires_chain_branch ?? '',
  };
}

export function choiceDraftToEffects(draft) {
  const effects = {
    cash_delta: Number(draft.cash_delta) || 0,
  };
  if (draft.requires_chain_branch?.trim()) {
    effects.requires_chain_branch = draft.requires_chain_branch.trim();
  }
  if (draft.chainEnabled && draft.chain_key?.trim() && draft.followup_definition_key?.trim()) {
    let context = {};
    try {
      context = JSON.parse(draft.contextJson || '{}');
    } catch {
      context = {};
    }
    effects.enqueue_event = {
      chain_key: draft.chain_key.trim(),
      followup_definition_key: draft.followup_definition_key.trim(),
      after_periods: Number(draft.after_periods) || 2,
      context,
    };
  }
  return effects;
}

export function AdminEventChoicesEditor({ choices, onChange, disabled }) {
  const updateChoice = useCallback(
    (id, patch) => {
      onChange(choices.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [choices, onChange],
  );

  const addChoice = () => onChange([...choices, EMPTY_CHOICE()]);
  const removeChoice = (id) => onChange(choices.filter((c) => c.id !== id));

  return (
    <section className="admin-event-choices mq-card">
      <header className="admin-event-choices__header">
        <div>
          <h2 className="admin-watchtower__block-title">Варианты ответа</h2>
          <p className="mq-muted admin-watchtower__block-hint">
            Цепочка: включите «Следующее событие» и укажите followup_definition_key (как в YAML
            chains/).
          </p>
        </div>
        <Button size="s" mode="bezeled" type="button" disabled={disabled} onClick={addChoice}>
          + Вариант
        </Button>
      </header>

      {choices.length === 0 ? (
        <p className="mq-muted">Добавьте хотя бы один вариант.</p>
      ) : (
        <ul className="admin-event-choices__list">
          {choices.map((choice, index) => (
            <li key={choice.id} className="admin-event-choices__item">
              <div className="admin-event-choices__item-head">
                <strong>Вариант {index + 1}</strong>
                <Button
                  size="s"
                  mode="plain"
                  type="button"
                  disabled={disabled}
                  onClick={() => removeChoice(choice.id)}
                >
                  Удалить
                </Button>
              </div>
              <label className="admin-form-field">
                <span>Заголовок кнопки</span>
                <input
                  className="mq-field__input"
                  value={choice.title}
                  disabled={disabled}
                  onChange={(e) => updateChoice(choice.id, { title: e.target.value })}
                />
              </label>
              <label className="admin-form-field">
                <span>Описание</span>
                <textarea
                  className="mq-field__input admin-form-field__textarea"
                  rows={2}
                  value={choice.description}
                  disabled={disabled}
                  onChange={(e) => updateChoice(choice.id, { description: e.target.value })}
                />
              </label>
              <label className="admin-form-field admin-form-field--inline">
                <span>cash_delta</span>
                <input
                  className="mq-field__input"
                  type="number"
                  value={choice.cash_delta}
                  disabled={disabled}
                  onChange={(e) => updateChoice(choice.id, { cash_delta: e.target.value })}
                />
              </label>

              <fieldset className="admin-event-choices__chain">
                <label className="admin-filter-bar__check">
                  <input
                    type="checkbox"
                    checked={choice.chainEnabled}
                    disabled={disabled}
                    onChange={(e) => updateChoice(choice.id, { chainEnabled: e.target.checked })}
                  />
                  <span>Следующее событие (enqueue_event)</span>
                </label>
                {choice.chainEnabled ? (
                  <div className="admin-event-choices__chain-fields">
                    <label className="admin-form-field">
                      <span>chain_key</span>
                      <input
                        className="mq-field__input"
                        placeholder="used_car_deal"
                        value={choice.chain_key}
                        disabled={disabled}
                        onChange={(e) => updateChoice(choice.id, { chain_key: e.target.value })}
                      />
                    </label>
                    <label className="admin-form-field">
                      <span>followup_definition_key</span>
                      <input
                        className="mq-field__input"
                        placeholder="mq11_used_car_deadline"
                        value={choice.followup_definition_key}
                        disabled={disabled}
                        onChange={(e) =>
                          updateChoice(choice.id, { followup_definition_key: e.target.value })
                        }
                      />
                    </label>
                    <label className="admin-form-field admin-form-field--inline">
                      <span>after_periods</span>
                      <input
                        className="mq-field__input"
                        type="number"
                        min={0}
                        value={choice.after_periods}
                        disabled={disabled}
                        onChange={(e) =>
                          updateChoice(choice.id, { after_periods: e.target.value })
                        }
                      />
                    </label>
                    <label className="admin-form-field">
                      <span>context (JSON)</span>
                      <textarea
                        className="mq-field__input admin-form-field__textarea admin-form-field__textarea--mono"
                        rows={3}
                        value={choice.contextJson}
                        disabled={disabled}
                        onChange={(e) => updateChoice(choice.id, { contextJson: e.target.value })}
                      />
                    </label>
                  </div>
                ) : null}
                <label className="admin-form-field">
                  <span>requires_chain_branch (для follow-up)</span>
                  <input
                    className="mq-field__input"
                    placeholder="deposit / thinking"
                    value={choice.requires_chain_branch}
                    disabled={disabled}
                    onChange={(e) =>
                      updateChoice(choice.id, { requires_chain_branch: e.target.value })
                    }
                  />
                </label>
              </fieldset>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Редактор сохранённых choices (после создания события). */
export function AdminEventChoicesEditorPersisted({
  eventId,
  initialChoices,
  disabled,
  onReload,
}) {
  const [choices, setChoices] = useState(() =>
    (initialChoices ?? []).map((c) => ({
      ...effectsToChoiceDraft(c.effects),
      id: String(c.id),
      title: c.title,
      description: c.description ?? '',
    })),
  );
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  const persistChoice = async (choice) => {
    const { adminApi } = await import('../../api');
    const body = {
      title: choice.title,
      description: choice.description,
      effects: choiceDraftToEffects(choice),
    };
    const isNew = String(choice.id).startsWith('new-');
    if (isNew) {
      await adminApi.eventChoiceCreate(eventId, body);
    } else {
      await adminApi.eventChoicePatch(eventId, choice.id, body);
    }
  };

  const handleSaveAll = async () => {
    setError(null);
    setSavingId('all');
    try {
      for (const choice of choices) {
        if (!choice.title?.trim()) continue;
        await persistChoice(choice);
      }
      if (onReload) await onReload();
      else {
        const { adminApi } = await import('../../api');
        const res = await adminApi.eventChoices(eventId);
        setChoices(
          (res.choices ?? []).map((c) => ({
            ...effectsToChoiceDraft(c.effects),
            id: String(c.id),
            title: c.title,
            description: c.description ?? '',
          })),
        );
      }
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось сохранить варианты');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (choiceId) => {
    if (String(choiceId).startsWith('new-')) {
      setChoices((prev) => prev.filter((c) => c.id !== choiceId));
      return;
    }
    const { adminApi } = await import('../../api');
    await adminApi.eventChoiceDelete(eventId, choiceId);
    setChoices((prev) => prev.filter((c) => c.id !== choiceId));
  };

  return (
    <>
      {error ? (
        <p className="admin-inspector__error" role="alert">
          {error}
        </p>
      ) : null}
      <AdminEventChoicesEditor
        choices={choices}
        onChange={setChoices}
        disabled={disabled || savingId != null}
      />
      <div className="admin-event-choices__footer">
        <Button size="s" mode="bezeled" disabled={disabled || savingId != null} onClick={handleSaveAll}>
          {savingId ? 'Сохранение…' : 'Сохранить варианты'}
        </Button>
      </div>
      <p className="mq-muted admin-event-choices__hint">
        Для удаления сохранённого варианта снимите галочку в списке выше или используйте «Удалить»
        (новые — только локально; сохранённые — через API после перезагрузки списка).
      </p>
      <ul className="admin-event-choices__saved-actions">
        {choices
          .filter((c) => !String(c.id).startsWith('new-'))
          .map((c) => (
            <li key={`del-${c.id}`}>
              <Button size="s" mode="plain" onClick={() => handleDelete(c.id)}>
                Удалить #{c.id} «{c.title}»
              </Button>
            </li>
          ))}
      </ul>
    </>
  );
}
