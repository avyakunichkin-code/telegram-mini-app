import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { formatTime } from '../utils';

export function GameHUD({ timeStatus, setPlay, setPause, nextPeriod }) {
  if (!timeStatus) return null;
  const remaining = timeStatus.remainingLocal ?? timeStatus.seconds_until_next_period;

  return (
    <Section header="Игровое время">
      <Cell multiline>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Период #{timeStatus.period_index}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '1.5rem' }}>{formatTime(remaining)}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="s" onClick={setPlay} disabled={timeStatus.time_state === 'play'}>Play</Button>
            <Button size="s" onClick={setPause} disabled={timeStatus.time_state === 'pause'}>Pause</Button>
            <Button size="s" onClick={nextPeriod}>Next</Button>
          </div>
        </div>
      </Cell>
    </Section>
  );
}