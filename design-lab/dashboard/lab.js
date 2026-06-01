const MONETKA_KEY = 'mq-dash-finance-monetka-v1';

/** @typedef {'l3' | 'v0'} LayoutId */
/** @typedef {'s1' | 's2' | 's3' | 's4' | 's5'} SkinId */

const SKIN_NOTES = {
  s1: 'S1 Flat — без рамок, тинт chip, чистая ссылка и ×.',
  s2: 'S2 Air — метрики без коробок, больше воздуха.',
  s3: 'S3 Soft — мягкие панели, тень вместо border.',
  s4: 'S4 Strip — кнопки без рамок; финансы-лента (устарело).',
  s5: 'S5 Unified ★ — 2×2 финансы, inset-линии, единая страница, уровень градиентом.',
};

const SKIN_LABELS = {
  s1: 'Flat',
  s2: 'Air',
  s3: 'Soft',
  s4: 'Strip',
  s5: 'Unified ★',
};

const DEMO_VALUES = {
  normal: ['42 150', '18 000', '+3 200', '9 600'],
  long: ['9 876 543', '1 250 000', '+428 900', '876 540'],
};

function initTheme() {
  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme-btn');
      document.documentElement.setAttribute('data-theme', theme);
      document.querySelectorAll('[data-theme-btn]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
    });
  });
}

function initLevelAccordion(root = document) {
  root.querySelectorAll('[data-level-toggle]').forEach((btn) => {
    if (btn.dataset.levelBound) return;
    btn.dataset.levelBound = '1';
    btn.addEventListener('click', () => {
      const section = btn.closest('.mqx-level-dash');
      if (!section) return;
      const expanded = section.classList.toggle('mqx-level-dash--expanded');
      btn.setAttribute('aria-expanded', String(expanded));
    });
  });
}

function showFinanceMonetkaIfNeeded(root = document) {
  if (localStorage.getItem(MONETKA_KEY) === '1') return;
  const panel = root.querySelector('[data-finance-monetka]');
  if (panel) panel.removeAttribute('hidden');
}

function dismissFinanceMonetka(btn) {
  localStorage.setItem(MONETKA_KEY, '1');
  const panel = btn.closest('[data-finance-monetka]');
  if (panel) panel.setAttribute('hidden', '');
}

/** Подгонка шрифта суммы под ширину chip */
function fitChipValues(root = document) {
  root.querySelectorAll('.mqx-finance-chip__value').forEach((el) => {
    const max = 13;
    const min = 9;
    el.style.fontSize = `${max}px`;
    let size = max;
    const parent = el.parentElement;
    if (!parent) return;
    while (el.scrollWidth > parent.clientWidth && size > min) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  });
}

/** @param {LayoutId} id */
function applyLayout(id) {
  document.querySelectorAll('[data-dash-stack]').forEach((stack) => {
    stack.dataset.layout = id;
  });
  document.querySelectorAll('[data-layout-btn]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-layout-btn') === id);
  });
}

function highlightSkin(id) {
  document.querySelectorAll('[data-skin-btn]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-skin-btn') === id);
  });
  document.querySelectorAll('.lab-phone--tile').forEach((phone) => {
    const skin = phone.querySelector('[data-dash-stack]')?.dataset.skin;
    phone.classList.toggle('lab-phone--focus', skin === id);
  });
  const note = document.getElementById('layout-note');
  if (note) {
    const layout = document.querySelector('[data-dash-stack]')?.dataset.layout || 'l3';
    note.textContent = `${SKIN_NOTES[id]} · ${layout === 'l3' ? 'L3' : 'V0'}.`;
  }
}

function initLayoutSwitcher() {
  document.querySelectorAll('[data-layout-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyLayout(/** @type {LayoutId} */ (btn.getAttribute('data-layout-btn')));
      const skin =
        document.querySelector('.lab-phone--focus [data-dash-stack]')?.dataset.skin || 's1';
      highlightSkin(/** @type {SkinId} */ (skin));
    });
  });
  applyLayout('l3');
}

function initSkinSwitcher() {
  document.querySelectorAll('[data-skin-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {SkinId} */ (btn.getAttribute('data-skin-btn'));
      highlightSkin(id);
      const tile = document.querySelector(`[data-dash-stack][data-skin="${id}"]`)?.closest('.lab-phone--tile');
      tile?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  });
  highlightSkin('s5');
}

function initMonetkaDismiss(root = document) {
  root.querySelectorAll('[data-monetka-dismiss]').forEach((btn) => {
    if (btn.dataset.monetkaBound) return;
    btn.dataset.monetkaBound = '1';
    btn.addEventListener('click', () => dismissFinanceMonetka(btn));
  });
}

/** Панель подушки — как prod DashboardPremium (inline + закрытие по клику снаружи) */
function initSafetyPanel(root = document) {
  const panel = root.querySelector('[data-safety-panel]');
  if (!panel) return;

  const form = panel.querySelector('[data-safety-form]');
  const slider = panel.querySelector('.mqx-invest-slider');
  const input = panel.querySelector('.mqx-invest-amount__input');
  const submit = panel.querySelector('.mqx-invest-form__submit');
  const chipVal = panel.querySelector('.mqx-invest-rate__val');
  const chipHint = panel.querySelector('.mqx-invest-rate__hint');
  const maxHint = panel.querySelector('.mqx-invest-amount__max');

  let mode = null;

  const closePanel = () => {
    mode = null;
    panel.setAttribute('hidden', '');
    if (slider) slider.value = '0';
    if (input) input.value = '0';
  };

  const openPanel = (nextMode) => {
    mode = nextMode;
    panel.removeAttribute('hidden');
    const isIn = mode === 'in';
    form?.classList.toggle('mqx-invest-form--safety-in', isIn);
    form?.classList.toggle('mqx-invest-form--safety-out', !isIn);
    if (submit) submit.textContent = isIn ? 'Перевести в подушку' : 'Снять на счёт';
    if (chipVal) chipVal.textContent = isIn ? '18к' : '42к';
    if (chipHint) chipHint.textContent = isIn ? 'в подушке' : 'на счёте';
    if (maxHint) maxHint.textContent = isIn ? 'На счёте: 42 150' : 'В подушке: 18 000';
    if (slider) {
      slider.max = isIn ? '42150' : '18000';
      slider.value = '0';
    }
  };

  root.querySelectorAll('[data-money-trigger]').forEach((btn) => {
    if (btn.dataset.safetyBound) return;
    btn.dataset.safetyBound = '1';
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-money-trigger');
      if (mode === next) closePanel();
      else openPanel(next);
    });
  });

  if (slider && input) {
    slider.addEventListener('input', () => {
      input.value = Number(slider.value).toLocaleString('ru-RU');
    });
  }

  if (!root.dataset.safetyDismissBound) {
    root.dataset.safetyDismissBound = '1';
    root.addEventListener(
      'pointerdown',
      (e) => {
        if (panel.hasAttribute('hidden')) return;
        if (panel.contains(e.target)) return;
        if (e.target.closest('[data-money-trigger]')) return;
        closePanel();
      },
      true,
    );
  }
}

function initLongSumsDemo() {
  const btn = document.querySelector('[data-demo-long-sums]');
  if (!btn) return;
  let long = false;
  btn.addEventListener('click', () => {
    long = !long;
    btn.classList.toggle('is-active', long);
    btn.textContent = long ? 'Обычные суммы' : 'Длинные суммы';
    const vals = long ? DEMO_VALUES.long : DEMO_VALUES.normal;
    document.querySelectorAll('[data-dash-stack] .mqx-finance-chip__value').forEach((el, i) => {
      const tone = el.classList.contains('mqx-finance-chip__value--pos') ? 'pos' : el.classList.contains('mqx-finance-chip__value--out') ? 'out' : '';
      el.textContent = vals[i] ?? vals[0];
      el.className = `mqx-finance-chip__value${tone ? ` mqx-finance-chip__value--${tone}` : ''}`;
    });
    requestAnimationFrame(() => fitChipValues());
  });
}

function buildDashStackMarkup() {
  return document.getElementById('dash-stack-template')?.innerHTML?.trim() || '';
}

function initGallery() {
  const gallery = document.getElementById('lab-gallery');
  const templateHtml = buildDashStackMarkup();
  if (!gallery || !templateHtml) return;

  /** @type {SkinId[]} */
  const skins = ['s5', 's1', 's2', 's3'];
  const heroHtml = document.getElementById('hero-template')?.innerHTML?.trim() || '';
  const footerHtml = document.getElementById('footer-template')?.innerHTML?.trim() || '';

  gallery.innerHTML = '';
  skins.forEach((skin) => {
    const article = document.createElement('article');
    article.className = `lab-phone lab-phone--tile${skin === 's5' ? ' lab-phone--featured' : ''}`;
    article.setAttribute('aria-label', `Скин ${skin.toUpperCase()}`);
    article.innerHTML = `
      <div class="lab-phone__tag">${skin.toUpperCase()} · ${SKIN_LABELS[skin]}</div>
      <div class="lab-phone__shell${skin === 's5' ? ' lab-phone__shell--unified' : ''}">
        ${heroHtml}
        <div class="mqx-content mqx-content--dash-flat mqx-tab-page__scroll">
          <div class="mqx-dash-stack${skin === 's5' ? ' mqx-dash-stack--unified' : ''}" data-dash-stack data-layout="l3" data-skin="${skin}">
            ${templateHtml}
          </div>
        </div>
        ${skin === 's5' ? footerHtml : ''}
      </div>
    `;
    gallery.appendChild(article);
    initLevelAccordion(article);
    initMonetkaDismiss(article);
    showFinanceMonetkaIfNeeded(article);
    if (skin === 's5') initSafetyPanel(article);
  });

  requestAnimationFrame(() => fitChipValues(gallery));
  window.addEventListener('resize', () => fitChipValues(gallery));
}

window.labResetMonetka = () => {
  localStorage.removeItem(MONETKA_KEY);
  document.querySelectorAll('[data-finance-monetka]').forEach((panel) => {
    panel.removeAttribute('hidden');
  });
};

initTheme();
initGallery();
initLayoutSwitcher();
initSkinSwitcher();
initLongSumsDemo();
