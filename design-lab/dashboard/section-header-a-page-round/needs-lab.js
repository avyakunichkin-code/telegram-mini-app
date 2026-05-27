// Copied from design-lab/character-needs/dashboard-needs-round/lab.js
// This round uses it to render compact/expanded bars inside the needs block.
(function () {
  const AVATAR_SRC = './assets/student-mascot.png';

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


  function renderBarRow(axis, value) {
    const z = zone(value);
    const pct = Math.max(0, Math.min(100, value));
    return `
      <div class="mqx-needs-bar-row">
        <span class="mqx-needs-bar-label">${axis.label}</span>
        <div class="mqx-needs-bar-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${axis.label}, ${zoneLabel(z)}">
          <span class="mqx-needs-bar-fill" data-zone="${z}" style="width:${pct}%"></span>
        </div>
        <span class="mqx-needs-zone-text" data-zone="${z}">${zoneLabel(z)}</span>
      </div>`;
  }

  function renderPanels(block, values, improveStyle) {
    const expandedHost = block.querySelector('[data-needs-expanded]');
    if (expandedHost) {
      const bars = AXES.map((a) => renderBarRow(a, values[a.key])).join('');
      expandedHost.innerHTML = bars;
    }
  }

  function updateRisk(block, preset) {
    const risk = block.querySelector('[data-needs-risk]');
    if (!risk) return;
    const min = minAxis({
      comfort: preset.comfort,
      status: preset.status,
      social: preset.social,
      health: preset.health,
    });
    const show = preset.streak > 0;
    risk.classList.toggle('is-visible', show);
    block.classList.toggle('is-bleed-risk', show);
    if (show) {
      risk.textContent = `Риск поражения: ${preset.streak} из 3 месяцев с нулём на «${min.label}»`;
    }
  }

  function renderBlock(block, presetKey) {
    const preset = PRESETS[presetKey];
    const values = {
      comfort: preset.comfort,
      status: preset.status,
      social: preset.social,
      health: preset.health,
    };
    const improveStyle = block.dataset.improveStyle || 'link';
    renderPanels(block, values, improveStyle);
    updateRisk(block, preset);
  }

  function bindBlock(block) {
    const help = block.querySelector('[data-needs-help]');
    const improveLink = block.querySelector('[data-needs-improve-link]');
    const improveChip = block.querySelector('[data-needs-improve]');

    if (help) {
      help.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    if (improveLink) {
      improveLink.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    if (improveChip) {
      improveChip.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // No accordion in this round: needs are always visible.
  }

  let currentPreset = 'distressed';

  function renderAll() {
    document.querySelectorAll('[data-needs-block]').forEach((b) => renderBlock(b, currentPreset));
  }

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.documentElement.dataset.theme = btn.dataset.themeBtn;
      document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  document.querySelectorAll('[data-state-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPreset = btn.dataset.stateBtn;
      document.querySelectorAll('[data-state-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
      renderAll();
    });
  });

  document.querySelectorAll('[data-needs-block]').forEach((block) => {
    const img = block.querySelector('.mqx-needs-avatar img');
    if (img) img.src = AVATAR_SRC;
    bindBlock(block);
  });

  renderAll();
})();

