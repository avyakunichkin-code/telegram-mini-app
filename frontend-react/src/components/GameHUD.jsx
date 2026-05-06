import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { formatTime } from '../utils';

export function GameHUD({ timeStatus, setPlay, setPause, onRequestNextPeriod }) {
  if (!timeStatus) return null;
  const remaining = timeStatus.remainingLocal ?? timeStatus.seconds_until_next_period;

  return (
    <Section header="Игровое время">
      <Cell multiline>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Период #{timeStatus.period_index}</span>
          <span
            style={{
              fontFamily: 'var(--telegram-font-monospace, ui-monospace), monospace',
              fontSize: '1.2rem',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}
          >
            {formatTime(remaining)}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button size="s" onClick={setPlay} disabled={timeStatus.time_state === 'play'}>Играть</Button>
            <Button size="s" onClick={setPause} disabled={timeStatus.time_state === 'pause'}>Пауза</Button>
            <Button size="s" onClick={onRequestNextPeriod}>Дальше</Button>
          </div>
        </div>
      </Cell>
    </Section>
  );
}