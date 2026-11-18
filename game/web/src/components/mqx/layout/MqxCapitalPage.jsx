import { BrandLogo } from '../../BrandLogo';
import { CapitalPeriodFlowsBlock } from './CapitalPeriodFlowsBlock';
import { MqxCapitalPageModeSeg } from './MqxCapitalPageModeSeg';
import '../../../styles/mqx/capital-pocket.css';

export function MqxCapitalPage({ overview, investPositions, policies, mode, onModeChange, openFlowsSection, children }) {
  return (
    <main className="mqx-capital-pocket">
      <header className="mqx-capital-pocket__heading">
        <BrandLogo variant="finance-game" />
        <h1>Капитал</h1>
      </header>
      <section className="mqx-capital-pocket__board" aria-label="Деньги за ход">
        <span className="mqx-capital-pocket__turn">Ход {String(overview?.period_index ?? 0).padStart(2, '0')}</span>
        <CapitalPeriodFlowsBlock
          overview={overview}
          investPositions={investPositions}
          policies={policies}
          openFlowsSection={openFlowsSection}
          showNet={mode === 'details'}
        />
      </section>
      <MqxCapitalPageModeSeg mode={mode} onModeChange={onModeChange} />
      {children}
    </main>
  );
}
