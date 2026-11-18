import { buildImpactChips, buildNeedsChips } from './eventImpactChips';

/** ★ BG-2: чипы последствий выбора — деньги, затем потребности. Без XP. */
export function EventChoiceImpacts({ impacts, needsDelta }) {
  const chips = [...buildImpactChips(impacts), ...buildNeedsChips(needsDelta)];
  if (!chips.length) return null;

  return (
    <span className="mqx-events-impacts">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={[
            'mqx-events-impact',
            `mqx-events-impact--${chip.tone}`,
            chip.money && 'mqx-events-impact--money',
          ]
            .filter(Boolean)
            .join(' ')}
          title={chip.tip}
        >
          {chip.text}
        </span>
      ))}
    </span>
  );
}
