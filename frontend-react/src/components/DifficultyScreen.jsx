import { useEffect, useState } from 'react';
import { Button, Input, Select, Spinner } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';
import { MqxShell } from './MqxShell';

const MANUAL_VALUE = '__manual__';

export function DifficultyScreen({ onNext, onBack }) {
  const [profileName, setProfileName] = useState('');
  const [periodDuration, setPeriodDuration] = useState(300);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  /** Выбранный ключ шаблона или null — ручной ввод на следующем шаге */
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await API.listGameTemplates();
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedTemplateKey(list[0].template_key);
        } else {
          setSelectedTemplateKey('mq_game_basic_v1');
        }
      } catch {
        if (!cancelled) {
          setTemplates([]);
          setSelectedTemplateKey('mq_game_basic_v1');
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showNotification('Введите название профиля', 'error');
      return;
    }
    if (periodDuration < 10) {
      showNotification('Длительность периода должна быть не менее 10 секунд', 'error');
      return;
    }
    onNext({
      profile_name: profileName.trim(),
      save_kind: 'game',
      template_key: selectedTemplateKey,
      period_duration_seconds: periodDuration,
    });
  };

  const selectValue = selectedTemplateKey == null ? MANUAL_VALUE : selectedTemplateKey;

  return (
    <MqxShell
      header={
        <header className="mqx-hero mqx-hero--tab">
          <div className="mqx-hero__glow" aria-hidden />
          <div className="mqx-hero__top">
            <div className="mqx-hero-pills">
              <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
              <span className="mqx-hero-pill">Новая игра</span>
            </div>
            <span className="mqx-hero-pill mqx-hero-pill--ghost">Шаг 1/2</span>
          </div>
          <div className="mqx-hero__title mqx-hero__title--tab">Старт и темп</div>
          <div className="mqx-hero__sub">Название слота, шаблон Game или ручная экономика, длительность «месяца».</div>
        </header>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mqx-card">
          <div className="mqx-card__title">Параметры</div>
          <div className="mqx-card__sub">Шаблон подставляет старт из каталога; вручную — задаёте кошелёк на шаге 2.</div>

          <div className="mqx-form" style={{ marginTop: 12 }}>
            <Input
              header="Название сохранения"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Мой первый профиль"
              required
            />
            {templatesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                <Spinner />
              </div>
            ) : (
              <Select
                header="Тип старта"
                value={selectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === MANUAL_VALUE) setSelectedTemplateKey(null);
                  else setSelectedTemplateKey(v);
                }}
              >
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.title}
                  </option>
                ))}
                {templates.length === 0 ? (
                  <option value="mq_game_basic_v1">Базовый старт (встроенный)</option>
                ) : null}
                <option value={MANUAL_VALUE}>Вручную — задать на следующем шаге</option>
              </Select>
            )}
            <Input
              header="Длительность периода (сек)"
              type="number"
              value={periodDuration}
              onChange={(e) => setPeriodDuration(Number(e.target.value))}
              placeholder="300"
            />
          </div>

          <div className="mq-actions-stack" style={{ marginTop: 12 }}>
            <Button type="submit" mode="filled" stretched disabled={templatesLoading}>
              Далее: базовые параметры
            </Button>
            <Button type="button" mode="plain" stretched onClick={onBack}>
              Назад
            </Button>
          </div>
        </div>
      </form>
    </MqxShell>
  );
}
