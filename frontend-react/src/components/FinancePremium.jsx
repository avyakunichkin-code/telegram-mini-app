import { useEffect } from 'react';
import { FinanceSection } from './FinanceSection';
import { MqxTabHero } from './MqxTabHero';

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

  if (!overview) return null;

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        sectionLabel="Финансы"
        rightPill="6 разделов"
        title="Управление капиталом"
        titleClassName="mqx-hero__title--capital"
        subtitleClassName="mqx-hero__sub--capital"
        subtitle="Доходы и расходы за период · инвестиции, страховки, имущество, обязательства."
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
        />
      </main>
    </div>
  );
}
