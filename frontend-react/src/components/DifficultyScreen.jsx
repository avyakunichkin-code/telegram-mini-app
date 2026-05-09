import { useState } from 'react';
import { Button, Input, Select } from '@telegram-apps/telegram-ui';
import { showNotification } from './notifications';
import { MqxShell } from './MqxShell';

export function DifficultyScreen({ onNext, onBack }) {
  const [profileName, setProfileName] = useState('');
  const [mode, setMode] = useState('light');
  const [periodDuration, setPeriodDuration] = useState(300);

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
          profile_name: profileName,
          mode,
          period_duration_seconds: periodDuration,
        });
  };

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
          <div className="mqx-hero__title mqx-hero__title--tab">Сложность и темп</div>
          <div className="mqx-hero__sub">Название слота, режим экономики и длительность «месяца».</div>
        </header>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="mqx-card">
          <div className="mqx-card__title">Параметры</div>
          <div className="mqx-card__sub">Минимум настроек — максимум контроля.</div>

          <div className="mqx-form" style={{ marginTop: 12 }}>
            <Input
              header="Название сохранения"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Мой первый профиль"
              required
            />
            <Select header="Режим" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="light">Light — мягкий старт</option>
              <option value="hardcore">Hardcore — больше контроля</option>
            </Select>
            <Input
              header="Длительность периода (сек)"
              type="number"
              value={periodDuration}
              onChange={(e) => setPeriodDuration(Number(e.target.value))}
              placeholder="300"
            />
          </div>

          <div className="mq-actions-stack" style={{ marginTop: 12 }}>
            <Button type="submit" mode="filled" stretched>
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