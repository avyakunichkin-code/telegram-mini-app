import {
  CATALOG_EVENTS_TAILS_CONSUMPTION,
  CATALOG_EVENTS_TAILS_INSURANCE,
} from './catalogEventsTailsDemo';
import { EventCard } from '../events/EventCard';

/** E2 + E5 в #/dev/mqx — parity с design-lab/events/tails-round/ */
export function MqxEventsTailsCatalogDemo() {
  return (
    <div className="mqx-catalog-events-tails">
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        ★ <code>design-lab/events/tails-round/</code> — E2-B halo, E5-B clamp/scroll.
        Фикстуры: <code>catalogEventsTailsDemo.js</code>.
      </p>
      <div className="mqx-stack" style={{ gap: 16, maxWidth: 420 }}>
        <EventCard event={CATALOG_EVENTS_TAILS_INSURANCE} busyId={null} onPick={() => {}} />
        <EventCard event={CATALOG_EVENTS_TAILS_CONSUMPTION} busyId={null} onPick={() => {}} />
      </div>
    </div>
  );
}
