import monetka from '../../../assets/monetka/monetka-soft-volume.webp';

export function Monetka({ size, label, className = '' }) {
  return (
    <img
      className={['mqx-monetka', className].filter(Boolean).join(' ')}
      src={monetka}
      width={size}
      alt={label ?? ''}
    />
  );
}
