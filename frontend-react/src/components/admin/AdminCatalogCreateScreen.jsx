import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { formatApiErrorDetail } from '../../api/client';
import {
  AdminEventChoicesEditor,
  choiceDraftToEffects,
  effectsToChoiceDraft,
} from './AdminEventChoicesEditor';
import { AdminPageHeader } from './AdminPageHeader';
import { CATALOG_CREATE_DEFAULTS, CATALOG_CREATE_FIELDS } from './catalogCreateConfig';

function buildInitialDraft(catalogKey) {
  const defaults = { ...(CATALOG_CREATE_DEFAULTS[catalogKey] ?? {}) };
  if (catalogKey === 'events' && !defaults.key) {
    defaults.key = `draft_event_${Date.now().toString(36).slice(-6)}`;
  }
  return defaults;
}

function FieldInput({ field, value, onChange, disabled }) {
  const id = `create-${field.key}`;
  if (field.type === 'checkbox') {
    return (
      <label className="admin-filter-bar__check admin-form-field--full">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === 'textarea' || field.type === 'json') {
    return (
      <label className="admin-form-field admin-form-field--full">
        <span>{field.label}</span>
        <textarea
          id={id}
          className={`mq-field__input admin-form-field__textarea${field.type === 'json' ? ' admin-form-field__textarea--mono' : ''}`}
          rows={field.type === 'json' ? 4 : 3}
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <label className="admin-form-field admin-form-field--full">
        <span>{field.label}</span>
        <select
          id={id}
          className="mq-field__input"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <label className="admin-form-field admin-form-field--full">
      <span>{field.label}</span>
      <input
        id={id}
        className="mq-field__input"
        type={field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) =>
          onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)
        }
      />
    </label>
  );
}

export function AdminCatalogCreateScreen() {
  const { catalogKey } = useParams();
  const navigate = useNavigate();
  const fields = CATALOG_CREATE_FIELDS[catalogKey] ?? [];
  const [draft, setDraft] = useState(() => buildInitialDraft(catalogKey));
  const [eventChoices, setEventChoices] = useState(() => [
    { ...effectsToChoiceDraft({}), id: 'new-1', title: 'Вариант 1' },
    { ...effectsToChoiceDraft({}), id: 'new-2', title: 'Вариант 2' },
  ]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    const labels = {
      liabilities: 'Новое обязательство',
      assets: 'Новый актив',
      starters: 'Новый стартер',
      events: 'Новое событие',
    };
    return labels[catalogKey] ?? 'Новая запись';
  }, [catalogKey]);

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!catalogKey) return;
    setSubmitting(true);
    setError(null);
    const row = { ...draft };
    if (catalogKey === 'events') {
      row.choices = eventChoices
        .filter((c) => c.title?.trim())
        .map((c) => ({
          title: c.title.trim(),
          description: (c.description || '').trim(),
          effects: choiceDraftToEffects(c),
        }));
      if (!row.choices.length) {
        setError('Добавьте хотя бы один вариант ответа');
        setSubmitting(false);
        return;
      }
    }
    try {
      const result = await adminApi.catalogCreate(catalogKey, { row });
      const id = result.id;
      navigate(`/admin/catalogs/${catalogKey}/edit/${id}`, { replace: true });
    } catch (err) {
      const detail = err?.detail;
      if (detail && typeof detail === 'object' && detail.errors) {
        setError(detail.message || 'Ошибки валидации');
      } else {
        setError(formatApiErrorDetail(detail, err?.message || 'Не удалось создать запись'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!catalogKey || !fields.length) {
    return (
      <div className="mq-section">
        <p className="mq-muted">Неизвестный справочник</p>
        <Link to="/admin/catalogs">← Справочники</Link>
      </div>
    );
  }

  return (
    <div className="admin-catalog-create mq-section">
      <AdminPageHeader
        title={title}
        subtitle={`Создание · ${catalogKey} · черновик с is_active=0`}
      >
        <Button
          size="s"
          mode="plain"
          onClick={() => navigate(`/admin/catalogs/${catalogKey}`)}
        >
          Отмена
        </Button>
      </AdminPageHeader>

      <form className="admin-catalog-create__form" onSubmit={handleSubmit}>
        <section className="mq-card admin-watchtower__block admin-catalog-create__fields">
          <h2 className="admin-watchtower__block-title">Поля записи</h2>
          <div className="admin-catalog-create__grid">
            {fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={draft[field.key]}
                disabled={submitting}
                onChange={(v) => setField(field.key, v)}
              />
            ))}
          </div>
        </section>

        {catalogKey === 'events' ? (
          <AdminEventChoicesEditor
            choices={eventChoices}
            onChange={setEventChoices}
            disabled={submitting}
          />
        ) : null}

        {error ? (
          <div className="mq-card admin-watchtower__error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        <div className="admin-catalog-create__actions">
          <Button size="m" type="submit" disabled={submitting}>
            {submitting ? 'Создание…' : 'Создать и открыть редактор'}
          </Button>
        </div>
      </form>
    </div>
  );
}
