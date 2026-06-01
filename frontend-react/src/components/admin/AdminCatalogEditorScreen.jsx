import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { adminApi } from '../../api';
import { formatApiErrorDetail } from '../../api/client';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminEventChoicesEditorPersisted } from './AdminEventChoicesEditor';

const SCALAR_FIELDS = {
  liabilities: [
    { key: 'template_key', label: 'Ключ', type: 'text' },
    { key: 'title', label: 'Название', type: 'text' },
    { key: 'total_debt', label: 'Сумма долга', type: 'number' },
    { key: 'annual_rate_percent', label: 'Ставка %', type: 'number' },
    { key: 'sort_order', label: 'Порядок', type: 'number' },
    { key: 'is_active', label: 'Активен', type: 'checkbox' },
  ],
  assets: [
    { key: 'template_key', label: 'Ключ', type: 'text' },
    { key: 'title', label: 'Название', type: 'text' },
    { key: 'kind', label: 'Тип', type: 'text' },
    { key: 'asset_value', label: 'Стоимость', type: 'number' },
    { key: 'monthly_maintenance_cost', label: 'Обслуживание/мес', type: 'number' },
    { key: 'monthly_income', label: 'Доход/мес', type: 'number' },
    { key: 'estate_role', label: 'estate_role', type: 'text' },
    { key: 'sort_order', label: 'Порядок', type: 'number' },
    { key: 'is_active', label: 'Активен', type: 'checkbox' },
  ],
  starters: [
    { key: 'template_key', label: 'Ключ', type: 'text' },
    { key: 'title', label: 'Название', type: 'text' },
    { key: 'difficulty_rank', label: 'Сложность', type: 'number' },
    { key: 'base_monthly_lifestyle_expense', label: 'База расходов', type: 'number' },
    { key: 'applies_to_save_kind', label: 'Режим (game/plan)', type: 'text' },
    { key: 'sort_order', label: 'Порядок', type: 'number' },
    { key: 'is_active', label: 'Активен', type: 'checkbox' },
  ],
  events: [
    { key: 'key', label: 'Ключ', type: 'text' },
    { key: 'title', label: 'Название', type: 'text' },
    { key: 'description', label: 'Описание', type: 'textarea' },
    { key: 'mode', label: 'mode', type: 'text' },
    { key: 'weight', label: 'Вес', type: 'number' },
    { key: 'event_tier', label: 'Tier', type: 'number' },
    { key: 'repeat_policy', label: 'repeat_policy', type: 'text' },
    { key: 'cooldown_periods', label: 'cooldown_periods', type: 'number' },
    { key: 'content_class', label: 'content_class', type: 'text' },
    { key: 'event_slot', label: 'event_slot', type: 'text' },
    { key: 'category', label: 'category', type: 'text' },
    { key: 'mandatory_gate', label: 'mandatory_gate', type: 'text' },
    { key: 'is_active', label: 'Активен', type: 'checkbox' },
    { key: 'mandatory', label: 'mandatory', type: 'checkbox' },
  ],
};

const JSON_FIELDS = {
  starters: [
    { key: 'blueprint_json', label: 'blueprint_json' },
    { key: 'victory_config_json', label: 'victory_config_json' },
  ],
  events: [
    { key: 'metadata_json', label: 'metadata_json' },
    { key: 'prerequisites_json', label: 'prerequisites_json' },
    { key: 'audience_template_keys', label: 'audience_template_keys' },
  ],
};

function formatJsonField(value) {
  if (value == null) return '{}';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

export function AdminCatalogEditorScreen() {
  const { catalogKey, rowId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('basic');
  const [row, setRow] = useState(null);
  const [draft, setDraft] = useState(null);
  const [jsonDraft, setJsonDraft] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const scalarFields = SCALAR_FIELDS[catalogKey] ?? [];
  const jsonFields = JSON_FIELDS[catalogKey] ?? [];
  const hasJson = jsonFields.length > 0;
  const isEvents = catalogKey === 'events';
  const eventChoices = row?.choices ?? [];

  const load = useCallback(async () => {
    if (!catalogKey || !rowId) return;
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);
    try {
      const payload = await adminApi.catalogDetail(catalogKey, rowId);
      const data = payload.row ?? payload;
      setRow(data);
      setDraft({ ...data });
      const jd = {};
      for (const f of JSON_FIELDS[catalogKey] ?? []) {
        jd[f.key] = formatJsonField(data[f.key]);
      }
      setJsonDraft(jd);
    } catch (e) {
      setError(e?.detail || e?.message || 'Не удалось загрузить запись');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [catalogKey, rowId]);

  useEffect(() => {
    load();
  }, [load]);

  const titleLabel = useMemo(() => {
    if (!draft) return 'Редактор';
    return draft.title || draft.template_key || draft.key || `#${rowId}`;
  }, [draft, rowId]);

  const handleSave = async () => {
    if (!catalogKey || !rowId || !draft) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSaved(false);
    const body = { ...draft };
    delete body.id;
    delete body.catalog_key;
    for (const f of jsonFields) {
      body[f.key] = jsonDraft[f.key] ?? body[f.key];
    }
    try {
      const result = await adminApi.catalogPatch(catalogKey, rowId, body);
      setRow(result.row);
      setDraft({ ...result.row });
      setSaved(true);
    } catch (e) {
      const detail = e?.detail;
      if (detail && typeof detail === 'object' && detail.errors) {
        setFieldErrors(detail.errors);
        setError(detail.message || 'Ошибки валидации');
      } else {
        setError(formatApiErrorDetail(detail, e?.message || 'Не удалось сохранить'));
      }
    } finally {
      setSaving(false);
    }
  };

  const setScalar = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  if (!catalogKey || !rowId) {
    return (
      <div className="admin-catalog-editor mq-section">
        <p className="mq-muted">Не указана запись</p>
      </div>
    );
  }

  return (
    <div className="admin-catalog-editor mq-section">
      <AdminPageHeader title={titleLabel} subtitle={`C2 · ${catalogKey} · #${rowId}`}>
        <Button size="s" mode="bezeled" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
        <Button
          size="s"
          mode="plain"
          onClick={() => navigate(`/admin/catalogs/${catalogKey}`)}
        >
          Закрыть
        </Button>
      </AdminPageHeader>

      {loading ? (
        <div className="admin-watchtower__loading">
          <Spinner size="m" />
        </div>
      ) : null}

      {error ? (
        <div className="mq-card admin-watchtower__error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {saved ? (
        <p className="admin-catalog-editor__saved mq-muted" role="status">
          Сохранено
        </p>
      ) : null}

      {!loading && draft ? (
        <>
          {hasJson || isEvents ? (
            <div className="admin-catalog-editor__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={
                  tab === 'basic' ? 'admin-catalog-editor__tab--active' : 'admin-catalog-editor__tab'
                }
                onClick={() => setTab('basic')}
              >
                Основное
              </button>
              {isEvents ? (
                <button
                  type="button"
                  role="tab"
                  className={
                    tab === 'choices'
                      ? 'admin-catalog-editor__tab--active'
                      : 'admin-catalog-editor__tab'
                  }
                  onClick={() => setTab('choices')}
                >
                  Варианты ({eventChoices.length})
                </button>
              ) : null}
              {hasJson ? (
                <button
                  type="button"
                  role="tab"
                  className={
                    tab === 'json' ? 'admin-catalog-editor__tab--active' : 'admin-catalog-editor__tab'
                  }
                  onClick={() => setTab('json')}
                >
                  JSON
                </button>
              ) : null}
            </div>
          ) : null}

          {(tab === 'basic' || (!hasJson && !isEvents)) && (
            <section className="mq-card admin-catalog-editor__panel">
              <div className="admin-catalog-editor__fields">
                {scalarFields.map((field) => (
                  <label key={field.key} className="admin-catalog-editor__field">
                    <span className="admin-catalog-editor__label">{field.label}</span>
                    {field.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={!!draft[field.key]}
                        onChange={(e) => setScalar(field.key, e.target.checked)}
                      />
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="mq-field__input admin-catalog-editor__textarea"
                        rows={4}
                        value={draft[field.key] ?? ''}
                        onChange={(e) => setScalar(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className="mq-field__input"
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={draft[field.key] ?? ''}
                        onChange={(e) =>
                          setScalar(
                            field.key,
                            field.type === 'number'
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                    {fieldErrors[field.key]?.length ? (
                      <span className="admin-catalog-editor__field-error" role="alert">
                        {fieldErrors[field.key].join(' ')}
                      </span>
                    ) : null}
                  </label>
                ))}
              </div>
            </section>
          )}

          {tab === 'choices' && isEvents ? (
            <AdminEventChoicesEditorPersisted
              eventId={rowId}
              initialChoices={eventChoices}
              disabled={saving || loading}
              onReload={load}
            />
          ) : null}

          {tab === 'json' && hasJson ? (
            <section className="mq-card admin-catalog-editor__panel">
              {jsonFields.map((field) => (
                <label key={field.key} className="admin-catalog-editor__field admin-catalog-editor__field--json">
                  <span className="admin-catalog-editor__label">{field.label}</span>
                  <textarea
                    className="mq-field__input admin-catalog-editor__json"
                    spellCheck={false}
                    value={jsonDraft[field.key] ?? ''}
                    onChange={(e) =>
                      setJsonDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                  {fieldErrors[field.key]?.length ? (
                    <span className="admin-catalog-editor__field-error" role="alert">
                      {fieldErrors[field.key].join(' ')}
                    </span>
                  ) : null}
                </label>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
