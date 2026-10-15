import { useEffect, useMemo, useState } from 'react';
import { API } from '../api';
import { MqxSaveCard } from './mqx/pregame/MqxSaveCard';
import { MqxBoardButton } from './mqx/pregame/MqxBoardButton';
import { buildGoalChainView } from './mqx/utils/goalChainDisplay';
import { goalStepCaption } from './mqx/utils/boardDashDisplay';
import { savesCountHint } from './mqx/utils/pregameDisplay';

/**
 * Меню ★ BG-2 (вкладка игры): игра на паузе — карта текущего сохранения с «Продолжить игру»,
 * спокойные кнопки «Новая игра» / «Все сохранения», текстовая «Выйти из аккаунта».
 * Канон: design-lab/board-game/screens-round/ (Меню), design-lab/pre-game-shell/APPROVED.md.
 */
export function MenuPremium({ overview, onContinue, onLogout, onNewGame, onLoadGame }) {
  const [savesCount, setSavesCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    API.getGameProfiles()
      .then((rows) => {
        if (!cancelled) setSavesCount(Array.isArray(rows) ? rows.length : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const goalView = useMemo(() => buildGoalChainView(overview?.victory, null), [overview?.victory]);
  const step = goalStepCaption(goalView);
  const goalNote = step ? `Цель: ${step}` : null;
  const templateKey = overview?.victory?.template_key ?? overview?.starter_template_key;

  return (
    <div className="mqx-tab-page mqx-tab-page--board">
      <main className="mqx-content mqx-tab-page__scroll">
        <div className="mqx-bg-stack">
          <header className="mqx-pg-head">
            <h1>Меню</h1>
            <small>Игра на паузе</small>
          </header>

          {overview ? (
            <MqxSaveCard
              templateKey={templateKey}
              periodIndex={overview.period_index}
              cash={overview.cash_balance}
              note={goalNote}
              onContinue={onContinue}
            />
          ) : null}

          <div className="mqx-pg-actions">
            <MqxBoardButton hint="другая жизнь" onClick={() => onNewGame?.()}>
              Новая игра
            </MqxBoardButton>
            <MqxBoardButton hint={savesCountHint(savesCount)} onClick={onLoadGame}>
              Все сохранения
            </MqxBoardButton>
          </div>
          <MqxBoardButton variant="link" onClick={onLogout}>
            Выйти из аккаунта
          </MqxBoardButton>
        </div>
      </main>
    </div>
  );
}
