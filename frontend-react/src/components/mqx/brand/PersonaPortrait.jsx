import { getPersonaPortrait } from './personaPortraits';

/**
 * Растровый портрет персонажа (прозрачный PNG/WebP).
 * @param {'pick'|'dash'|'md'} size
 */
export function PersonaPortrait({ templateKey, size = 'pick', className = '' }) {
  const portrait = getPersonaPortrait(templateKey, size);
  if (!portrait) return null;

  const cls = ['mqx-persona-portrait', className].filter(Boolean).join(' ');

  return (
    <picture className={cls} data-persona={portrait.slug} data-size={size}>
      <source type="image/webp" srcSet={portrait.webp} />
      <img
        src={portrait.png}
        alt=""
        height={portrait.height}
        className="mqx-persona-portrait__img"
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
