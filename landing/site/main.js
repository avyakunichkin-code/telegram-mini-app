const outcomes = {
  trip: ['−12 000 ₽ со счёта', 'Ты провёл время вместе. На подушку в этом месяце осталось меньше. Впечатления тоже могут быть осознанным выбором.'],
  save: ['12 000 ₽ остаются на счёте', 'Можно направить их в подушку. Поездку ты пропустил — стоит найти другой повод увидеться с друзьями.'],
  meet: ['−3 000 ₽ со счёта', 'В этом примере встреча в городе стоит 3 000 ₽. Ты увиделся с друзьями, а 9 000 ₽ от бюджета поездки остались на счёте.']
};
const result = document.querySelector('#result');
const reset = document.querySelector('#reset');
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
  const [title, body] = outcomes[button.dataset.choice];
  result.replaceChildren();
  const strong = document.createElement('strong'); strong.textContent = title;
  const paragraph = document.createElement('p'); paragraph.textContent = body;
  const play = document.createElement('a'); play.className = 'play small result-cta';
  play.href = document.querySelector('.hero-actions .play').href; play.textContent = 'Сыграть всю партию ↗';
  result.append(strong, paragraph, play); result.hidden = false; reset.hidden = false;
  document.querySelector('.choices').hidden = true;
  // The pressed button is now hidden: keep keyboard and screen-reader users on the outcome.
  result.tabIndex = -1; result.focus();
}));
reset.addEventListener('click', () => {
  result.hidden = true; reset.hidden = true; document.querySelector('.choices').hidden = false;
  document.querySelector('[data-choice]').focus();
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
