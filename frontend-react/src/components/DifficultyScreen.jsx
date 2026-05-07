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
        <Cell>
          <Input
            header="Название сохранения"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Мой первый профиль"
            required
          />
        </Cell>
        <Cell>
          <Select
            header="Режим"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="light">Light — мягкий старт</option>
            <option value="hardcore">Hardcore — больше контроля</option>
          </Select>
        </Cell>
        <Cell>
          <Input
            header="Длительность периода (секунд)"
            type="number"
            value={periodDuration}
            onChange={(e) => setPeriodDuration(Number(e.target.value))}
            placeholder="300"
          />
        </Cell>
        <Cell>
          <Button type="submit" mode="filled" stretched>Далее: базовые параметры</Button>
        </Cell>
        <Cell>
          <Button mode="plain" onClick={onBack} stretched>Назад</Button>
        </Cell>
      </Section>
      </div>
    </form>
  );
}