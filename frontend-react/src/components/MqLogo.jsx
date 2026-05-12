import { useId } from 'react';

/**
 * Мини-лого Money Quest под TMA: монограмма MQ (бренд Quest Violet как акцент, фон через тему Telegram).
 */
export function MqLogo({ size = 36 }) {
  const gid = useId().replace(/:/g, '');
  const gradId = `mq-${gid}-vv`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="mq-logo"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect
        width="40"
        height="40"
        rx="10"
        fill="color-mix(in srgb, var(--tg-theme-button-color, #6D28D9) 12%, transparent)"
      />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={`url(#${gradId})`}
        fontSize="17"
        fontWeight="680"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      >
        MQ
      </text>
    </svg>
  );
}
