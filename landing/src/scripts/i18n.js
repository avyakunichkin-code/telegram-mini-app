const STORAGE_KEY = 'mq-landing-lang';
const SUPPORTED = ['ru', 'en'];

let messages = {};
let lang = 'ru';

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function getLang() {
  return lang;
}

export async function loadLocale(next) {
  const code = SUPPORTED.includes(next) ? next : 'ru';
  const res = await fetch(`/locales/${code}.json`);
  if (!res.ok) throw new Error(`Locale ${code} not found`);
  messages = await res.json();
  lang = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* private mode */
  }
  return messages;
}

export function initLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  const browser = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  return SUPPORTED.includes(browser) ? browser : 'ru';
}

export function t(path) {
  const value = getByPath(messages, path);
  return value == null ? path : value;
}

/** Текстовые узлы: data-i18n="hero.title" */
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (typeof value === 'string') el.textContent = value;
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (!attr || !key) return;
      const value = t(key);
      if (typeof value === 'string') el.setAttribute(attr, value);
    });
  });
}

export function setLangButtons(active) {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-lang') === active);
  });
}
