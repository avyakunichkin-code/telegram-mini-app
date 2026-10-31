import { UI_FOCUS, screenPath } from './screens.js';

export function uiCropHtml(focusKey, theme, { alt = '', className = '', loading = 'lazy' } = {}) {
  const spec = UI_FOCUS[focusKey];
  if (!spec) return '';
  const src = screenPath(spec.id, theme);
  const fit = spec.fit || 'cover';
  const ratio = spec.ratio || '1.6';
  const y = spec.y || '50%';
  const classes = ['mq-ui-crop', fit === 'contain' ? 'mq-ui-crop--contain' : '', className]
    .filter(Boolean)
    .join(' ');
  return `
    <figure class="${classes}" style="--ui-ratio:${ratio};--ui-y:${y}">
      <img src="${src}" alt="${escapeAttr(alt)}" loading="${loading}" decoding="async" />
    </figure>`;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
