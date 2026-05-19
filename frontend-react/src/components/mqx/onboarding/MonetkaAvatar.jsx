import monetkaSrc from '../../../assets/monetka-mascot.png';

/** Портрет Монетки для coach-пузыря. */
export function MonetkaAvatar({ size = 72, className = '' }) {
  return (
    <img
      src={monetkaSrc}
      alt=""
      width={size}
      height={size}
      className={['mqx-onboarding-monetka', className].filter(Boolean).join(' ')}
      draggable={false}
    />
  );
}
