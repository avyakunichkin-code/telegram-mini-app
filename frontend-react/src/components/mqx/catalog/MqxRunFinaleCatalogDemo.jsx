import { useState } from 'react';
import { MqxRunFinale } from '../layout/MqxRunFinale';
import { MqxButton } from '../primitives/MqxButton';
import {
  CATALOG_RUN_FINALE_DEFEAT_CASH,
  CATALOG_RUN_FINALE_DEFEAT_NEEDS,
  CATALOG_RUN_FINALE_WIN,
} from './catalogRunFinaleDemo';

const VARIANTS = [
  { key: 'win', label: 'Победа', payload: CATALOG_RUN_FINALE_WIN },
  { key: 'cash', label: 'Поражение · минус на счёте', payload: CATALOG_RUN_FINALE_DEFEAT_CASH },
  { key: 'needs', label: 'Поражение · потребности', payload: CATALOG_RUN_FINALE_DEFEAT_NEEDS },
];

/** Финал партии ★ BG-2 — открывается поверх каталога, как в игре. */
export function MqxRunFinaleCatalogDemo() {
  const [payload, setPayload] = useState(null);
  const close = () => setPayload(null);

  return (
    <>
      <p className="mqx-catalog__lead">
        Канон: <code>design-lab/board-game/screens-round/</code> («Финал · Победа», «Финал · Поражение»),{' '}
        <code>design-lab/run-finale/APPROVED.md</code>. Любая кнопка финала закрывает демо.
      </p>
      <div className="mqx-run-finale-demo">
        {VARIANTS.map((v) => (
          <MqxButton key={v.key} variant="ghost" onClick={() => setPayload(v.payload)}>
            {v.label}
          </MqxButton>
        ))}
      </div>
      <MqxRunFinale
        open={Boolean(payload)}
        payload={payload}
        onDismissVictory={close}
        onNewGame={close}
        onMenu={close}
        onSubmitFeedback={async () => {}}
      />
    </>
  );
}
