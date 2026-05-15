import { useState } from 'react';
import { FinanceSection, FINANCE_TABS } from './FinanceSection';

export function FinancePremium({ overview, refreshOverview }) {
  const [financeTab, setFinanceTab] = useState('portfolio');

  if (!overview) return null;

  return (
    <>
      <header className="mqx-hero mqx-hero--tab mqx-hero--capital">
        <div className="mqx-hero__glow" aria-hidden />

        <div className="mqx-hero__top">
          <div className="mqx-hero-pills">
            <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
            <span className="mqx-hero-pill">Финансы</span>
          </div>
          <span className="mqx-hero-pill mqx-hero-pill--ghost">3 вкладки</span>
        </div>

        <h1 className="mqx-hero__title mqx-hero__title--capital">Управление капиталом</h1>
        <p className="mqx-hero__sub mqx-hero__sub--capital">Инвестиции, страховки, активы и долги.</p>
      </header>

      <main className="mqx-content mqx-capital-page">
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
    </>
  );
}
