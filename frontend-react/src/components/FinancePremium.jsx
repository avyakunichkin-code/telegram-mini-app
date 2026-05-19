import { useState } from 'react';
import { FinanceSection, FINANCE_TABS_CAPITAL } from './FinanceSection';
import { MqxTabHero } from './MqxTabHero';

export function FinancePremium({ overview, refreshOverview }) {
  const [financeTab, setFinanceTab] = useState('invest');

  if (!overview) return null;

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        sectionLabel="Финансы"
        rightPill="5 разделов"
        title="Управление капиталом"
        titleClassName="mqx-hero__title--capital"
        subtitleClassName="mqx-hero__sub--capital"
        subtitle="Инвестиции, бюджет, страховки, имущество и обязательства."
      />

      <main className="mqx-content mqx-tab-page__scroll mqx-capital-page">
        <section className="mqx-card mqx-capital-card">
          <div
            className="mqx-fin-tabs mqx-capital-tabs mqx-capital-tabs--wrap"
            role="tablist"
            aria-label="Разделы капитала"
          >
            {FINANCE_TABS_CAPITAL.map((t) => (
              <button
                key={t.id}
                id={`finance-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={financeTab === t.id}
                aria-controls={`finance-panel-${t.id}`}
                className={`mqx-fin-tab mqx-capital-tab ${financeTab === t.id ? 'mqx-fin-tab--active mqx-capital-tab--active' : ''}`}
                title={t.label}
                onClick={() => setFinanceTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <FinanceSection
            overview={overview}
            refreshOverview={refreshOverview}
            premium
            capitalLayout
            capitalInline
            financeTab={financeTab}
            onFinanceTabChange={setFinanceTab}
            hideSectionsCard
          />
        </section>
      </main>
    </div>
  );
}
