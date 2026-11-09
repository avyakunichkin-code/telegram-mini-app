import { getGuideMascot } from './guideMascots';

/** Decorative receipt guide; amounts and totals always remain native text. */
export function KvityaMascot({ pose = 'default', size = 56, className = '' }) {
  const art = getGuideMascot('kvitya', pose);
  return <picture data-mascot="kvitya" data-pose={pose}>
    <source type="image/webp" srcSet={art.webp} />
    <img src={art.png} width={size} height={size} className={`mqx-kvitya-image ${className}`.trim()} alt="" aria-hidden="true" draggable={false} decoding="async" />
  </picture>;
}
