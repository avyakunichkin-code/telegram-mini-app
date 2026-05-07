import { Button, Cell, Section } from '@telegram-apps/telegram-ui';
import { formatTime } from '../utils';

export function GameHUD({
  className = '',
  timeStatus,
  setPlay,
  setPause,
  onRequestNextPeriod,
}) {
  if (!timeStatus) return null;
  const remaining = timeStatus.remainingLocal ?? timeStatus.seconds_until_next_period;

  return (
    <div className={className}>
      <div className="mq-hud">
        <Section header="Игровое время">
          <div className="mq-slot-intro">Один период — один «месяц»: таймер паузы и кнопки как в остальном интерфейсе.</div>
          <Cell multiline>
            <div className="mq-hud__row">
              <span className="mq-period-label">Период #{timeStatus.period_index}</span>
              <span className="mq-timer-chip">{formatTime(remaining)}</span>
              <div className="mq-hud-actions">
                <Button size="s" onClick={setPlay} disabled={timeStatus.time_state === 'play'}>
                  Играть
                </Button>
                <Button size="s" onClick={setPause} disabled={timeStatus.time_state === 'pause'}>
                  Пауза
                </Button>
                <Button size="s" mode="filled" onClick={onRequestNextPeriod}>
                  Дальше
                </Button>
              </div>
            </div>
          </Cell>
        </Section>
      </div>
    </div>
  );
}