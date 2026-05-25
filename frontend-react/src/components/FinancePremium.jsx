import { useEffect, useMemo } from 'react';
import { FinanceSection } from './FinanceSection';
import { MqxTabHero } from './MqxTabHero';
import { capitalPageSubtitle, getMechanicsFromOverview } from '../utils/starterMechanics';

export function FinancePremium({
  overview,
  refreshOverview,
  openFlowsSection = null,
  onFlowsSectionOpened,
}) {
  useEffect(() => {
    if (!openFlowsSection) return undefined;
    const sectionId =
      openFlowsSection === 'expense' ? 'capital-flows-expense' : 'capital-flows-income';
    const frame = requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      onFlowsSectionOpened?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [openFlowsSection, onFlowsSectionOpened]);

  const mechanics = useMemo(() => getMechanicsFromOverview(overview), [overview]);
  const capitalSectionsCount =
    2 +
    (mechanics.capital_invest ? 1 : 0) +
    (mechanics.capital_insurance ? 1 : 0) +
    (mechanics.capital_property ? 1 : 0) +
    (mechanics.capital_liabilities ? 1 : 0);

  if (!overview) return null;

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        sectionLabel="Финансы"
        rightPill={`${capitalSectionsCount} разделов`}
        title="Управление капиталом"
        titleClassName="mqx-hero__title--capital"
        subtitleClassName="mqx-hero__sub--capital"
        subtitle={capitalPageSubtitle(mechanics)}
      />

      <main className="mqx-content mqx-tab-page__scroll mqx-capital-page">
        <FinanceSection
          overview={overview}
          refreshOverview={refreshOverview}
          premium
          capitalLayout
          capitalAccordion
          hideSectionsCard
          openFlowsSection={openFlowsSection}
          mechanics={mechanics}
        />
      </main>
    </div>
  );
}
