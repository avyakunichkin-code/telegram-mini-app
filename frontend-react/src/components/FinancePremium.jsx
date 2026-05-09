import { FinanceSection } from './FinanceSection';

export function FinancePremium({ overview, refreshOverview }) {
  if (!overview) return null;

  return (
    <>
      <header className="mqx-hero mqx-hero--tab">
        <div className="mqx-hero__glow" aria-hidden />

        <div className="mqx-hero__top">
          <div className="mqx-hero-pills">
            <span className="mqx-hero-pill mqx-hero-pill--brand">MQ</span>
            <span className="mqx-hero-pill">Финансы</span>
          </div>
          <span className="mqx-hero-pill mqx-hero-pill--ghost">3 вкладки</span>
        </div>

        <div className="mqx-hero__title mqx-hero__title--tab">Управление капиталом</div>
        <div className="mqx-hero__sub">
          Инвестиции, страховки, активы и долги.
        </div>
      </header>

      <main className="mqx-content">
        <FinanceSection overview={overview} refreshOverview={refreshOverview} premium />
      </main>
    </>
  );
}

