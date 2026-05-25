import { initHeroDemo, stopHeroDemo } from './demo-hero.js';
import {
  applyStaticI18n,
  getLang,
  initLang,
  loadLocale,
  setLangButtons,
  t,
} from './i18n.js';

const CONTACT_EMAIL = 'hello@moneyquest.app';

function renderHowSteps() {
  const list = document.getElementById('how-steps');
  if (!list) return;
  const steps = t('how.steps');
  if (!Array.isArray(steps)) return;
  list.innerHTML = steps
    .map(
      (step, i) => `
    <li class="mq-step mq-reveal" style="--mq-delay:${i * 80}ms">
      <span class="mq-step__num" aria-hidden="true">${i + 1}</span>
      <div>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.text)}</p>
      </div>
    </li>`
    )
    .join('');
}

function renderLearnCards() {
  const grid = document.getElementById('learn-cards');
  if (!grid) return;
  const cards = t('learn.cards');
  if (!Array.isArray(cards)) return;
  grid.innerHTML = cards
    .map(
      (card, i) => `
    <article class="mq-card mq-reveal" style="--mq-delay:${i * 60}ms">
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.text)}</p>
    </article>`
    )
    .join('');
}

function renderFeatures() {
  const grid = document.getElementById('features-grid');
  if (!grid) return;
  const items = t('features.items');
  if (!Array.isArray(items)) return;
  grid.innerHTML = items
    .map(
      (item, i) => `
    <article class="mq-feature mq-reveal" style="--mq-delay:${i * 50}ms">
      <span class="mq-feature__icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </article>`
    )
    .join('');
}

function renderPeekPanels() {
  const grid = document.getElementById('peek-grid');
  if (!grid) return;
  const panels = t('peek.panels');
  if (!Array.isArray(panels)) return;
  grid.innerHTML = panels
    .map(
      (panel, i) => `
    <article class="mq-peek-card mq-reveal" style="--mq-delay:${i * 80}ms">
      <span class="mq-peek-card__label">${escapeHtml(panel.label)}</span>
      <h3>${escapeHtml(panel.title)}</h3>
      <p>${escapeHtml(panel.text)}</p>
      ${
        Array.isArray(panel.chips)
          ? `<div class="mq-peek-card__chips">${panel.chips
              .map((chip) => `<span class="mq-chip">${escapeHtml(chip)}</span>`)
              .join('')}</div>`
          : ''
      }
    </article>`
    )
    .join('');
}

function renderCoachPoints() {
  const list = document.getElementById('coach-points');
  if (!list) return;
  const points = t('coach.points');
  if (!Array.isArray(points)) return;
  list.innerHTML = points
    .map((text, i) => `<li class="mq-reveal" style="--mq-delay:${i * 60}ms">${escapeHtml(text)}</li>`)
    .join('');
}

function renderModeLists() {
  const gameList = document.getElementById('mode-game-points');
  const planList = document.getElementById('mode-plan-points');
  const gamePoints = t('modes.game.points');
  const planPoints = t('modes.plan.points');
  if (gameList && Array.isArray(gamePoints)) {
    gameList.innerHTML = gamePoints.map((text) => `<li>${escapeHtml(text)}</li>`).join('');
  }
  if (planList && Array.isArray(planPoints)) {
    planList.innerHTML = planPoints.map((text) => `<li>${escapeHtml(text)}</li>`).join('');
  }
}

function renderVictory() {
  const list = document.getElementById('victory-points');
  if (!list) return;
  const points = t('victory.points');
  if (!Array.isArray(points)) return;
  list.innerHTML = points
    .map(
      (text, i) => `
    <li class="mq-victory__item mq-reveal" style="--mq-delay:${i * 70}ms">
      <span class="mq-victory__check" aria-hidden="true">✓</span>
      <span>${escapeHtml(text)}</span>
    </li>`
    )
    .join('');
}

function renderPartners() {
  const grid = document.getElementById('partners-points');
  if (!grid) return;
  const points = t('partners.points');
  if (!Array.isArray(points)) return;
  grid.innerHTML = points
    .map(
      (item, i) => `
    <article class="mq-partner mq-reveal" style="--mq-delay:${i * 70}ms">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.text)}</p>
    </article>`
    )
    .join('');
}

function renderFaq() {
  const list = document.getElementById('faq-list');
  if (!list) return;
  const items = t('faq.items');
  if (!Array.isArray(items)) return;
  list.innerHTML = items
    .map(
      (item, i) => `
    <details class="mq-faq__item mq-reveal" style="--mq-delay:${i * 40}ms">
      <summary>${escapeHtml(item.q)}</summary>
      <p>${escapeHtml(item.a)}</p>
    </details>`
    )
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wireContact() {
  const link = document.querySelector('[data-contact-href]');
  if (link) link.setAttribute('href', `mailto:${CONTACT_EMAIL}`);
}

function wireLangSwitcher(onChange) {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-lang');
      if (next && next !== getLang()) onChange(next);
    });
  });
}

function wireReveal() {
  const nodes = document.querySelectorAll('.mq-reveal');
  if (!nodes.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    nodes.forEach((n) => n.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  );
  nodes.forEach((n) => io.observe(n));
}

async function setLocale(code) {
  stopHeroDemo();
  await loadLocale(code);
  applyStaticI18n();
  renderHowSteps();
  renderFeatures();
  renderLearnCards();
  renderPeekPanels();
  renderCoachPoints();
  renderModeLists();
  renderVictory();
  renderPartners();
  renderFaq();
  setLangButtons(code);
  wireReveal();
  initHeroDemo();
}

async function boot() {
  wireContact();
  const initial = initLang();
  await setLocale(initial);
  wireLangSwitcher(setLocale);
}

boot().catch((err) => {
  console.error('[landing]', err);
});
