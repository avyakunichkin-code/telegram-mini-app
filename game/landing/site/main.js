const outcomes = {
  trip: ['−12 000 ₽', '0 ₽', 'Поедешь с друзьями. Бюджет поездки уйдёт целиком.'],
  save: ['0 ₽', '12 000 ₽', 'Сможешь направить весь бюджет поездки в подушку.'],
  meet: ['−3 000 ₽', '9 000 ₽', 'Увидишься с друзьями, а часть бюджета останется.'],
};
const result = document.querySelector('#result');
const reset = document.querySelector('#reset');
const choices = document.querySelectorAll('[data-choice]');
const choicePrompt = document.querySelector('#choice-prompt');
choices.forEach(button => button.addEventListener('click', () => {
  const [spent, remaining, body] = outcomes[button.dataset.choice];
  result.replaceChildren();
  const metrics = document.createElement('dl');
  metrics.className = 'choice-impact';
  for (const [label, value] of [['Со счёта', spent], ['Остаток бюджета', remaining]]) {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const amount = document.createElement('dd');
    term.textContent = label;
    amount.textContent = value;
    if (value.startsWith('−')) amount.className = 'choice-impact-loss';
    row.append(term, amount);
    metrics.append(row);
  }
  const paragraph = document.createElement('p');
  paragraph.textContent = body;
  result.append(metrics, paragraph); result.hidden = false; reset.hidden = false;
  choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  choicePrompt.hidden = true;
}));
reset.addEventListener('click', () => {
  result.hidden = true; reset.hidden = true; choicePrompt.hidden = false;
  choices.forEach(choice => choice.setAttribute('aria-pressed', 'false'));
  choices[0].focus();
});

// Static, same-origin design examples size to their actual content and fonts.
// Frames remain script-disabled; no viewport-height padding or inner scrolling.
document.querySelectorAll('.example-grid iframe').forEach(frame => {
  let observer;
  const fit = () => {
    const doc = frame.contentDocument;
    if (!doc?.body || doc.URL === 'about:blank') return;
    observer?.disconnect();
    const measure = () => {
      frame.style.height = `${Math.ceil(doc.body.getBoundingClientRect().height) + 4}px`;
    };
    observer = new ResizeObserver(measure);
    observer.observe(doc.body);
    doc.fonts.ready.then(measure);
    measure();
  };
  frame.addEventListener('load', fit);
  fit();
});

// Phones have no menu or fixed header: keep the main action within reach between the hero and final CTAs.
const mobileCta = document.querySelector('#mobile-cta');
if (mobileCta && 'IntersectionObserver' in window) {
  const onScreen = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? onScreen.add(entry.target) : onScreen.delete(entry.target));
    mobileCta.classList.toggle('is-visible', onScreen.size === 0);
  });
  document.querySelectorAll('.hero, .choice-card, .final, footer').forEach(target => observer.observe(target));
}
