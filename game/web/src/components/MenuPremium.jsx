import { useEffect, useMemo, useState } from 'react';
import { API } from '../api';
import { MqxMenuPage } from './mqx/layout/MqxMenuPage';
import { personaRoleTitle } from './mqx/brand/personaRoles';
import { buildGoalChainView } from './mqx/utils/goalChainDisplay';
import { goalStepCaption } from './mqx/utils/boardDashDisplay';
import { savesCountHint } from './mqx/utils/pregameDisplay';

export function MenuPremium({ overview, onContinue, onLogout, onNewGame, onLoadGame, onClaimGuest }) {
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
  const templateKey = overview?.victory?.template_key ?? overview?.starter_template_key;
  const save = overview ? {
    templateKey,
    persona: personaRoleTitle(templateKey),
    turn: String(Number(overview.period_index) || 0).padStart(2, '0'),
    cash: Number(overview.cash_balance) || 0,
    goal: goalView.phase === 'active' && goalView.currentGoal?.title
      ? goalView.currentGoal.title
      : goalStepCaption(goalView),
  } : null;

  return (
    <MqxMenuPage
      save={save}
      savesHint={savesCountHint(savesCount)}
      onContinue={onContinue}
      onNewGame={onNewGame}
      onLoadGame={onLoadGame}
      onLogout={onLogout}
      onClaimGuest={onClaimGuest}
    />
  );
}
