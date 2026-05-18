import { forwardRef } from 'react';

const VARIANT_CLASS = {
  'hero-filled': 'mqx-btn mqx-btn--filled',
  'hero-outline': 'mqx-btn mqx-btn--outline',
  primary: 'mqx-btn mqx-btn--primary',
  secondary: 'mqx-btn mqx-btn--secondary',
};

/** Кнопка MQX: компакт D, типографика C. */
export const MqxButton = forwardRef(function MqxButton(
  { variant = 'hero-outline', className = '', type = 'button', ...props },
  ref,
) {
  const base = VARIANT_CLASS[variant] ?? VARIANT_CLASS['hero-outline'];
  return <button ref={ref} type={type} className={[base, className].filter(Boolean).join(' ')} {...props} />;
});
