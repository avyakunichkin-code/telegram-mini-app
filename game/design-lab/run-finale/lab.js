(function () {
  const root = document.documentElement;
  const outcomeSelect = document.getElementById('outcome-select');
  const templateSelect = document.getElementById('template-select');
  const toast = document.getElementById('lab-toast');

  const SCENARIO_COPY = {
    student: {
      winTitle: 'Ты вывел студенческий бюджет в плюс',
      winLine: 'Сценарий «Студент» — ты закрыл цепочку целей.',
      gazetaLead: 'Цепочка целей закрыта — сценарий «Студент» пройден.',
      personaSrc: './assets/student-mascot-cup-dash.webp',
      lossTitle: 'Бюджет не выдержал три месяца',
      lossLine: 'В учебном сценарии важнее ритм: зарплата, подушка, обязательства.',
    },
    professional: {
      winTitle: 'Бюджет сошёлся',
      winLine: 'Сценарий «Профессионал» — цепочка целей закрыта.',
      gazetaLead: 'Цепочка целей закрыта — сценарий «Профессионал» пройден.',
      personaSrc: './assets/professional-mascot-cup-dash.webp',
      lossTitle: 'Расходы перебили доход',
      lossLine: 'В этом сценарии важно держать дисциплину по обязательствам.',
    },
    manager: {
      winTitle: 'Ипотека под контролем',
      winLine: 'Сценарий «Руководитель» — все шаги выполнены.',
      gazetaLead: 'Цепочка целей закрыта — сценарий «Руководитель» пройден.',
      personaSrc: './assets/manager-mascot-cup-dash.webp',
      lossTitle: 'Давление обязательств не снялось',
      lossLine: 'Ипотека и платежи требуют запаса на счёте каждый месяц.',
    },
    entrepreneur: {
      winTitle: 'Бизнес-модель сошлась',
      winLine: 'Сценарий «Предприниматель» — все шаги цепочки выполнены.',
      gazetaLead: 'Все шаги цепочки выполнены — сценарий «Предприниматель» пройден.',
      personaSrc: './assets/entrepreneur-mascot-cup-dash.webp',
      lossTitle: 'Кассовый разрыв не закрылся',
      lossLine: 'В этом сценарии cashflow и обязательства бьют сильнее.',
    },
  };

  const GAZETA_GLYPHS = {
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V7"/><path d="m7 12 5-5 5 5"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v12"/><path d="m7 10 5 5 5-5"/></svg>',
    coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9 12h6"/></svg>',
    term: '<svg viewBox="0 0 24 24"><path d="M7 4v16"/><path d="M17 4v16"/><path d="M7 8h10"/><path d="M7 16h6"/></svg>',
    goal: '<svg viewBox="0 0 24 24"><path d="M6 12 10 16 18 8"/></svg>',
  };

  const GAZETA_SECTIONS = [
    {
      title: 'Доходы, расходы и подушка',
      metrics: [
        { glyph: 'term', headline: 'Периодов сыграно', name: 'До исхода', value: '38' },
        { glyph: 'up', headline: 'Доходы', name: 'В среднем за период', value: '92 000 ₽' },
        { glyph: 'down', headline: 'Расходы', name: 'В среднем за период', value: '78 400 ₽' },
        { glyph: 'coin', headline: 'Подушка', name: 'В месяцах обязательств', value: '4,2 мес.' },
      ],
    },
    {
      title: 'Вложения, имущество и долги',
      dividerBefore: true,
      metrics: [
        { glyph: 'coin', headline: 'Инвестиции', name: 'Сумма позиций', value: '120 000 ₽' },
        { glyph: 'coin', headline: 'Недвижимость и авто', name: 'Оценка активов', value: '2,1 млн ₽' },
        { glyph: 'coin', headline: 'Страховки', name: 'Активные полисы', value: '3 шт.' },
        { glyph: 'down', headline: 'Кредиты и ипотека', name: 'Тело долга', value: '340 000 ₽' },
        { glyph: 'up', headline: 'Пассивный поток', name: 'Активы и купоны', value: '18 500 ₽ / мес' },
        { glyph: 'goal', headline: 'Цели сценария', name: 'Chain', value: '6 / 6' },
      ],
    },
  ];

  function renderStat(row) {
    return `
      <article class="lab-gazeta-stat">
        <h5 class="lab-gazeta-stat__headline">${row.headline}</h5>
        <div class="lab-gazeta-stat__line">
          <span class="lab-gazeta-stat__glyph lab-gazeta-stat__glyph--${row.glyph}" aria-hidden="true">
            ${GAZETA_GLYPHS[row.glyph] || GAZETA_GLYPHS.coin}
          </span>
          <span class="lab-gazeta-stat__name">${row.name}</span>
          <span class="lab-gazeta-stat__value">${row.value}</span>
        </div>
      </article>`;
  }

  function renderGazetaMetrics() {
    document.querySelectorAll('[data-gazeta-metrics]').forEach((host) => {
      host.innerHTML = GAZETA_SECTIONS.map((section, idx) => {
        const divider = section.dividerBefore
          ? '<div class="lab-gazeta-metrics__divider" role="presentation"></div>'
          : '';
        const block = `
          <section class="lab-gazeta-metrics__group">
            <h4 class="lab-gazeta-metrics__title">${section.title}</h4>
            ${section.metrics.map(renderStat).join('')}
          </section>`;
        return idx === 0 ? block : divider + block;
      }).join('');
    });
  }

  function setOutcome(value) {
    root.dataset.outcome = value;
    document.querySelectorAll('[data-scenario-title]').forEach((el) => {
      const key = templateSelect?.value || 'student';
      const copy = SCENARIO_COPY[key] || SCENARIO_COPY.student;
      const isWin = value === 'win';
      if (el.dataset.scenarioTitle === 'title') {
        el.textContent = isWin ? copy.winTitle : copy.lossTitle;
      }
      if (el.dataset.scenarioTitle === 'line') {
        el.textContent = isWin ? copy.winLine : copy.lossLine;
      }
    });
    document.querySelectorAll('.lab-badge--dynamic').forEach((badge) => {
      badge.classList.remove('lab-badge--win', 'lab-badge--loss');
      badge.classList.add(value === 'win' ? 'lab-badge--win' : 'lab-badge--loss');
      badge.textContent = value === 'win' ? 'Победа' : 'Поражение';
    });
  }

  function setTemplate(value) {
    root.dataset.template = value;
    const copy = SCENARIO_COPY[value] || SCENARIO_COPY.student;
    document.querySelectorAll('[data-persona-img]').forEach((img) => {
      img.src = copy.personaSrc;
    });
    document.querySelectorAll('[data-gazeta-lead]').forEach((el) => {
      el.textContent = copy.gazetaLead;
    });
    setOutcome(outcomeSelect?.value || 'win');
  }

  outcomeSelect?.addEventListener('change', (e) => setOutcome(e.target.value));
  templateSelect?.addEventListener('change', (e) => setTemplate(e.target.value));

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn;
      root.dataset.theme = theme;
      document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  document.querySelectorAll('[data-feedback-form]').forEach((form) => {
    const textarea = form.querySelector('textarea');
    const submit = form.querySelector('[data-feedback-submit]');
    const updateDisabled = () => {
      if (submit) submit.disabled = !textarea?.value.trim();
    };
    textarea?.addEventListener('input', updateDisabled);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!textarea?.value.trim()) return;
      if (toast) {
        toast.textContent = 'Спасибо! В prod уйдёт в API feedback.';
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 2800);
      }
      textarea.value = '';
      updateDisabled();
    });
    updateDisabled();
  });

  renderGazetaMetrics();
  setTemplate(templateSelect?.value || 'student');
  setOutcome(outcomeSelect?.value || 'win');
})();
