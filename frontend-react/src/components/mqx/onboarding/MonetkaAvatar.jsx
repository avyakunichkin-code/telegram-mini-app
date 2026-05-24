import monetkaDefault from '../../../assets/monetka-mascot.webp';
import monetkaSitEdge from '../../../assets/monetka-poses/monetka-sit-edge.webp';

const POSE_SRC = {
  default: monetkaDefault,
  'sit-edge': monetkaSitEdge,
};

/**
 * @param {'default' | 'sit-edge'} [pose]
 * sit-edge — сидит на краю блока, ноги свисают (WebP с alpha).
 */
export function MonetkaAvatar({ size = 72, className = '', pose = 'default' }) {
  const src = POSE_SRC[pose] ?? POSE_SRC.default;
  const sitEdge = pose === 'sit-edge';

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={sitEdge ? undefined : size}
      height={sitEdge ? undefined : size}
      className={[
        'mqx-onboarding-monetka',
        sitEdge && 'mqx-onboarding-monetka--sit-edge',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        sitEdge
          ? { width: size, maxWidth: '34vw', height: 'auto', minWidth: 0 }
          : undefined
      }
      draggable={false}
      decoding="async"
    />
  );
}
