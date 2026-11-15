document.querySelectorAll('[data-open]').forEach(button => {
  const dialog = button.nextElementSibling;
  const feedback = dialog.nextElementSibling;
  const amount = dialog.querySelector('input[type="number"]');

  button.addEventListener('click', () => {
    dialog.returnValue = '';
    feedback.textContent = '';
    dialog.showModal();
  });

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'confirm') {
      const value = amount.valueAsNumber.toLocaleString('ru-RU');
      feedback.textContent = `Демо: пополнение на ${value} ₽ подтверждено.`;
    }
  });
});

document.querySelectorAll('.tabs').forEach(nav => {
  nav.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    nav.querySelector('[aria-current]').removeAttribute('aria-current');
    button.setAttribute('aria-current', 'page');
  });
});

document.querySelectorAll('[data-retry]').forEach(button => {
  button.addEventListener('click', () => {
    button.nextElementSibling.textContent = 'Демо: ошибка соединения сохраняется.';
  });
});
