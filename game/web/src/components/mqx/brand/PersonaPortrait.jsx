import { getPersonaPortrait } from './personaPortraits';

/**
 * Портрет персонажа v3.
 * @param {'pick'|'dash'} size
 */
export function PersonaPortrait({ templateKey, size = 'pick', className = '' }) {
  const portrait = getPersonaPortrait(templateKey, size);
  if (!portrait) return null;

  const cls = ['mqx-persona-portrait', className].filter(Boolean).join(' ');

  return (
    <picture className={cls} data-persona={portrait.slug} data-size={size}>
      <source type="image/webp" srcSet={portrait.webp} />
      <img
        src={portrait.png ?? portrait.webp}
        alt=""
        height={portrait.height}
        className="mqx-persona-portrait__img"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
