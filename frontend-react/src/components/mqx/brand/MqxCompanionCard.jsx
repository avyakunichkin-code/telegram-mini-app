import { personaCompanion } from './personaCompanions';

/**
 * Карточка персонажа с напарником ★ companions-round, вариант B (PO 2026-11-02): как карта героя
 * в настольной игре — пара и строка «напарник проведёт тебя через первые шаги».
 */
export function MqxCompanionCard({ templateKey, titleId, headingLevel = 'h1' }) {
  const pair = personaCompanion(templateKey);
  const Heading = headingLevel;

  return (
    <article className="mqx-hero-card" aria-labelledby={titleId}>
      <header>
        <Heading id={titleId} className="mqx-hero-card__title">
          {pair.name}
        </Heading>
        <p className="mqx-hero-card__line">{pair.line}</p>
      </header>
      <div className="mqx-hero-card__art">
        <img className="mqx-hero-card__persona" src={pair.persona} alt={pair.name} />
        <img className="mqx-hero-card__companion" src={pair.companion} alt={`Напарник: ${pair.companionName}`} />
      </div>
      <p className="mqx-hero-card__mate">
        <b>{pair.companionName}</b> проведёт тебя через первые шаги.
      </p>
    </article>
  );
}
