import { Monetka } from '../brand/Monetka';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { MqxCompanionCard } from '../brand/MqxCompanionCard';

const COMPANION_TEMPLATES = ['mq_game_basic_v1', 'mq_game_tight_budget_v1', 'mq_game_mortgage_stress_v1', 'mq_game_debt_stack_v1'];

/** Маскоты ★ ink-mascots-round, companions-round (PO 2026-11-02). */
export function MqxMascotsCatalogDemo() {
  return (
    <>
      <p className="mqx-catalog__lead">Объёмная Монетка и аватар.</p>
      <div className="mqx-catalog-mascots">
        <Monetka size={140} label="Монетка" />
      </div>
      <div className="mqx-catalog-mascots mqx-catalog-mascots--sizes">
        {[56, 40, 24].map((size) => (
          <figure key={size} className="mqx-catalog-mascots__cell">
            <MonetkaAvatar size={size} />
            <figcaption>{size} px</figcaption>
          </figure>
        ))}
      </div>
      <p className="mqx-catalog__lead">
        <code>MqxCompanionCard</code> — знакомство с напарником (★ companions-round B), экран между выбором жизни и
        первым ходом.
      </p>
      <div className="mqx-catalog-mascots mqx-catalog-mascots--cards">
        {COMPANION_TEMPLATES.map((key) => (
          <MqxCompanionCard key={key} templateKey={key} titleId={`mqx-catalog-companion-${key}`} headingLevel="h3" />
        ))}
      </div>
    </>
  );
}
