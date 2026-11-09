import { getPersonaCompanion } from './personaCompanions';

/** Утверждённый предмет-напарник. Не меняет сценарий или голос онбординга. */
export function PersonaCompanion({ templateKey, size = 'md', decorative = false, className = '' }) {
  const art = getPersonaCompanion(templateKey, size);
  if (!art) return null;
  return (
    <picture className={['mqx-persona-companion', className].filter(Boolean).join(' ')} data-persona={art.slug} data-size={size}>
      <source type="image/webp" srcSet={art.webp} />
      <img src={art.png} height={art.height} alt={decorative ? '' : art.label} decoding="async" draggable={false} />
    </picture>
  );
}
