import { useState } from 'react';
import { Button, Input, Cell, Section, Select } from '@telegram-apps/telegram-ui';
import { showNotification } from './notifications';

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
    <form
      className="mq-page mq-stack mq-stack-animate mq-stack--tight"
      onSubmit={handleSubmit}
      style={{ padding: '12px 12px calc(24px + env(safe-area-inset-bottom, 0))' }}
    >
      <div className="mq-page__decor" aria-hidden />
      <div className="mq-enter-item">
      <Section header="Выбор сложности">
        <div className="mq-screen-intro">
          Имя слота и темп игры (длительность «месяца»). Позже настроите деньги и долги на следующем шаге.
        </div>
        <Cell multiline subtitle="Отображается в списке сохранений и в шапке профиля">
          <Input
            header="Название сохранения"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Мой первый профиль"
            required
          />
        </Cell>
        <Cell multiline subtitle="Правила экономики и давление по событиям">
          <Select
            header="Режим"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="light">Light — мягкий старт</option>
            <option value="hardcore">Hardcore — больше контроля</option>
          </Select>
        </Cell>
        <Cell multiline subtitle="Сколько секунд длится один игровой период (например 300 = 5 мин)">
          <Input
            header="Длительность периода (секунд)"
            type="number"
            value={periodDuration}
            onChange={(e) => setPeriodDuration(Number(e.target.value))}
            placeholder="300"
          />
        </Cell>
        <Cell>
          <div className="mq-actions-stack">
            <Button type="submit" mode="filled" stretched>
              Далее: базовые параметры
            </Button>
            <Button type="button" mode="plain" stretched onClick={onBack}>
              Назад
            </Button>
          </div>
        </Cell>
      </Section>
      </div>
    </form>
  );
}