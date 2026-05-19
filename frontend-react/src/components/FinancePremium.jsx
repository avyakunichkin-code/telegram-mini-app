import { useState } from 'react';
import { FinanceSection, FINANCE_TABS } from './FinanceSection';
import { MqxTabHero } from './MqxTabHero';

export function FinancePremium({ overview, refreshOverview }) {
  const [financeTab, setFinanceTab] = useState('portfolio');

  if (!overview) return null;

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        sectionLabel="Финансы"
        rightPill="3 вкладки"
        title="Управление капиталом"
        titleClassName="mqx-hero__title--capital"
        subtitleClassName="mqx-hero__sub--capital"
        subtitle="Инвестиции, страховки, активы и долги."
      />

      <main className="mqx-content mqx-tab-page__scroll mqx-capital-page">
        <section className="mqx-card mqx-capital-card">
          <h2 className="mqx-capital-card__title">Разделы</h2>
          <div className="mqx-fin-tabs mqx-capital-tabs" role="tablist" aria-label="Разделы финансов">
            {FINANCE_TABS.map((t) => (
              <button
                key={t.id}
                id={`finance-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={financeTab === t.id}
                aria-controls={`finance-panel-${t.id}`}
                className={`mqx-fin-tab mqx-capital-tab ${financeTab === t.id ? 'mqx-fin-tab--active mqx-capital-tab--active' : ''}`}
                onClick={() => setFinanceTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <FinanceSection
          overview={overview}
          refreshOverview={refreshOverview}
          premium
          capitalLayout
          financeTab={financeTab}
          onFinanceTabChange={setFinanceTab}
          hideSectionsCard
        />
      </main>
    </div>
  );
}
