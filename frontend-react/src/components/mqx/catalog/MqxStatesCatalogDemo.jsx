import { useState } from 'react';
import { IconMetricCoins } from '../icons/FinanceMetricIcons';
import { MqxCapitalEmpty } from '../primitives/MqxCapitalEmpty';
import { MqxStateError } from '../primitives/MqxStateError';
import { MqxStateSkeleton } from '../primitives/MqxStateSkeleton';
import { MqxPeriodCloseRitual } from '../juice/MqxPeriodCloseRitual';
import { MqxButton } from '../primitives/MqxButton';
import { CATALOG_PERIOD_CLOSE_RITUAL } from './catalogStatesDemo';

/** Витрина ★ ui-states-unified для #/dev/mqx */
export function MqxStatesCatalogDemo() {
  const [ritualOpen, setRitualOpen] = useState(false);

  return (
    <div className="mqx-catalog-states">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        ★ <code>design-lab/ui-states-unified/</code> — S1 C′ empty · S2 B error · S3 B/C skeleton · S4 A ritual icons ·
        S5 D0 chips (см. блок «Дашборд S5»).
      </p>

      <div className="mqx-catalog-states__grid">
        <div className="mqx-catalog-states__item">
          <h3 className="mqx-catalog-states__label">S1 — Empty (C′)</h3>
          <div className="mqx-catalog-states__panel">
            <MqxCapitalEmpty
              message="Пока нет открытых позиций"
              actionLabel="Открыть депозит"
              onAction={() => {}}
              icon={IconMetricCoins}
            />
          </div>
        </div>

        <div className="mqx-catalog-states__item">
          <h3 className="mqx-catalog-states__label">S2 — Error (B)</h3>
          <div className="mqx-catalog-states__panel">
            <MqxStateError
              title="Не удалось загрузить данные"
              message="Проверьте сеть и попробуйте снова"
              onRetry={() => {}}
            />
          </div>
        </div>

        <div className="mqx-catalog-states__item">
          <h3 className="mqx-catalog-states__label">S3 — Loading rows (B)</h3>
          <div className="mqx-catalog-states__panel">
            <MqxStateSkeleton variant="rows" rows={3} label="Позиции" />
          </div>
        </div>

        <div className="mqx-catalog-states__item">
          <h3 className="mqx-catalog-states__label">S3 — Loading chips (C)</h3>
          <div className="mqx-catalog-states__panel">
            <MqxStateSkeleton variant="chips" label="Финансы периода" />
          </div>
        </div>
      </div>

      <div className="mqx-catalog-states__ritual" style={{ marginTop: 20 }}>
        <h3 className="mqx-catalog-states__label">S4 — Ritual beats (A)</h3>
        <p className="mqx-catalog__note" style={{ margin: '0 0 10px' }}>
          SVG <code>FinanceMetricIcons</code> в <code>MqxPeriodCloseRitual</code> (не символы + / !).
        </p>
        <MqxButton variant="secondary" onClick={() => setRitualOpen(true)}>
          Показать ритуал закрытия
        </MqxButton>
        <div className="mqx-catalog-states__ritual-host">
          <MqxPeriodCloseRitual summary={CATALOG_PERIOD_CLOSE_RITUAL} open={ritualOpen} onClose={() => setRitualOpen(false)} />
        </div>
      </div>
    </div>
  );
}
