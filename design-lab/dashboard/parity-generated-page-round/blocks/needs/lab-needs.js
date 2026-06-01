(function () {
  const AVATAR_SRC = './assets/student-mascot-dash.png';

  const AXES = [
    { key: 'comfort', label: 'Комфорт' },
    { key: 'status', label: 'Статус' },
    { key: 'social', label: 'Связи' },
    { key: 'health', label: 'Здоровье' },
  ];

  const PRESETS = {
    distressed: { comfort: 72, status: 41, social: 28, health: 65, streak: 1 },
    low: { comfort: 55, status: 48, social: 38, health: 52, streak: 0 },
    ok: { comfort: 76, status: 58, social: 62, health: 74, streak: 0 },
    zero: { comfort: 64, status: 52, social: 0, health: 58, streak: 2 },
  };

  function zone(v) {
    if (v <= 0) return 'zero';
    if (v < 30) return 'distressed';
    if (v < 40) return 'low';
    return 'ok';
  }

  function zoneLabel(z) {
    if (z === 'zero') return 'Критично';
    if (z === 'distressed') return 'Истощение';
    if (z === 'low') return 'Низко';
    return 'Норма';
  }

  function minAxis(values) {
    let min = AXES[0];
    AXES.forEach((a) => {
      if (values[a.key] < values[min.key]) min = a;
    });
    return min;
  }

  function renderBarRow(axis, value) {
    const z = zone(value);
    const pct = Math.max(0, Math.min(100, value));
    return `
      <div class="mqx-needs-bar-row">
        <span class="mqx-needs-bar-label">${axis.label}</span>
        <div class="mqx-needs-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <span class="mqx-needs-bar-fill" data-zone="${z}" style="width:${pct}%"></span>
        </div>
        <span class="mqx-needs-zone-text" data-zone="${z}">${zoneLabel(z)}</span>
      </div>`;
  }

  function renderBars(host, values) {
    if (!host) return;
    host.innerHTML = AXES.map((a) => renderBarRow(a, values[a.key])).join('');
  }

  function updateRisk(section, preset) {
    const risk = section.querySelector('.mqx-needs-risk');
    if (!risk) return;
    const min = minAxis(preset);
    const show = preset.streak > 0;
    risk.classList.toggle('is-visible', show);
    risk.hidden = !show;
    if (show) {
      risk.textContent = `Риск поражения: ${preset.streak} из 3 месяцев с нулём на «${min.label}»`;
    }
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.distressed;
    document.querySelectorAll('[data-needs-section]').forEach((section) => {
      renderBars(section.querySelector('[data-needs-bars]'), preset);
      updateRisk(section, preset);
    });
  }

  document.querySelectorAll('[data-state-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-state-btn]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      applyPreset(btn.getAttribute('data-state-btn'));
    });
  });

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.documentElement.setAttribute('data-theme', btn.getAttribute('data-theme-btn'));
      document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  document.querySelectorAll('[data-needs-avatar]').forEach((img) => {
    img.src = AVATAR_SRC;
  });

  applyPreset('distressed');
})();
