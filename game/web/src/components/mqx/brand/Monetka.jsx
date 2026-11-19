import { monetkaPoses } from './monetkaPoses';

export function Monetka({ size, label, pose = 'welcome', className = '' }) {
  return (
    <img
      className={['mqx-monetka', className].filter(Boolean).join(' ')}
      src={monetkaPoses[pose] ?? monetkaPoses.welcome}
      width={size}
      alt={label ?? ''}
    />
  );
}
