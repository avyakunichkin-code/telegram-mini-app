import { Button } from '@telegram-apps/telegram-ui';
import { findInsuranceCatalogItem, insuranceAccentClass } from '../../../constants/insuranceProducts';
import { InsurancePolicyMetrics } from '../metrics/InsurancePolicyMetrics';

/** Активный полис: accent H + метрики + отмена. */
export function InsurancePolicyRow({ policy, onCancel, busy }) {
  const catalog = findInsuranceCatalogItem(policy.kind);
  const accent = insuranceAccentClass(policy.product ?? catalog.product);
  const kicker = `${catalog.product_label} · ${catalog.object_label}`;

  return (
    <article className="mqx-ins-policy">
      <div className={`mqx-ins-policy__accent mqx-ins-policy__accent--${accent}`} aria-hidden="true" />
      <div className="mqx-ins-policy__body">
        <div className="mqx-ins-policy__kicker">{kicker}</div>
        <div className="mqx-ins-policy__title">{policy.title}</div>
        <InsurancePolicyMetrics policy={policy} />
      </div>
      <Button size="s" mode="outline" disabled={busy} onClick={() => onCancel(policy.id)}>
        Отменить
      </Button>
    </article>
  );
}
