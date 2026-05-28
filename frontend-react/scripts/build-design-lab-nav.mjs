import fs from 'node:fs'
import path from 'node:path'

function posixPath(p) {
  return p.replaceAll('\\', '/')
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'))
}

function stripDesignLabPrefix(p) {
  const norm = posixPath(p).replace(/^\.\//, '')
  return norm.startsWith('design-lab/') ? norm.slice('design-lab/'.length) : norm
}

function themeTitle(theme) {
  if (!theme) return 'Канон'
  if (theme === 'dashboard') return 'Dashboard'
  if (theme === 'finance') return 'Финансы'
  return theme
}

function expandCanonSource(repoRoot, designLabRoot, manifestRel) {
  const abs = path.join(designLabRoot, manifestRel)
  if (!fs.existsSync(abs)) return null

  const canon = readJson(abs)
  const theme = canon.theme ?? path.dirname(manifestRel)
  const items = []
  const sectionTitle = `${themeTitle(theme)} — канон (prod parity)`

  const pageRound = canon.page_parity?.canonical_page_round
  if (pageRound?.path) {
    const href = stripDesignLabPrefix(pageRound.path)
    items.push({
      id: `${theme}-page-parity`,
      sectionId: `${theme}-canon`,
      sectionTitle,
      label: canon.page_parity?.name ?? 'Страница целиком (generated parity)',
      href: `${href.replace(/\/$/, '')}/index.html`,
      kind: 'page-parity',
      status: pageRound.status ?? 'approved',
      hint: canon.page_parity?.prod_entry,
    })
  }

  const blocks = Array.isArray(canon.blocks) ? canon.blocks : []
  for (const block of blocks) {
    const rounds = Array.isArray(block.canonical_rounds) ? block.canonical_rounds : []
    for (const round of rounds) {
      if (!round?.path) continue
      const href = stripDesignLabPrefix(round.path)
      items.push({
        id: `${theme}-block-${block.id}-${href}`,
        sectionId: `${theme}-canon`,
        sectionTitle,
        label: `${block.prod_component ?? block.id} — ${path.basename(href.replace(/\/$/, ''))}`,
        href: `${href.replace(/\/$/, '')}/index.html`,
        kind: 'block',
        status: round.status ?? block.status ?? 'approved',
        hint: block.id,
      })
    }
  }

  return items
}

function discoverLabs(designLabRoot, excludeContains) {
  const found = []

  function walk(absDir) {
    const entries = fs.readdirSync(absDir, { withFileTypes: true })
    for (const ent of entries) {
      const abs = path.join(absDir, ent.name)
      if (ent.isDirectory()) {
        walk(abs)
        continue
      }
      if (ent.name !== 'index.html') continue

      const rel = posixPath(path.relative(designLabRoot, abs))
      if (rel === 'index.html') continue
      if (excludeContains.some((part) => rel.includes(part))) continue

      const parts = rel.split('/')
      const theme = parts[0] ?? 'root'
      const label = parts.slice(0, -1).join(' / ') || theme

      found.push({
        id: `discover-${rel}`,
        sectionId: 'discover',
        sectionTitle: 'Все витрины (авто-индекс)',
        label,
        href: rel,
        kind: 'lab',
        status: '',
        hint: theme,
      })
    }
  }

  walk(designLabRoot)
  found.sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  return found
}

function manifestSectionsToItems(sections) {
  const items = []
  for (const section of sections ?? []) {
    for (const item of section.items ?? []) {
      if (!item?.path) continue
      items.push({
        id: `${section.id}-${item.path}`,
        sectionId: section.id,
        sectionTitle: section.title ?? section.id,
        label: item.label ?? item.path,
        href: stripDesignLabPrefix(item.path),
        kind: item.kind ?? 'lab',
        status: item.status ?? '',
        hint: item.hint ?? '',
      })
    }
  }
  return items
}

function dedupeItems(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = item.href
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildHtml({ title, subtitle, items }) {
  const payload = JSON.stringify(items)
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: system-ui, "Segoe UI", Roboto, sans-serif;
        background: #0f1115;
        color: #f3f4f6;
        line-height: 1.45;
      }
      .wrap { max-width: 980px; margin: 0 auto; padding: 20px 16px 48px; }
      h1 { margin: 0 0 8px; font-size: 22px; }
      .sub { margin: 0 0 16px; color: #9ca3af; font-size: 14px; }
      .toolbar {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 18px;
      }
      .search {
        flex: 1 1 240px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        color: inherit;
        font-size: 15px;
      }
      .pill {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .06em;
        padding: 2px 7px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,.16);
        opacity: .9;
      }
      .pill--page-parity { color: #a7f3d0; border-color: rgba(16,185,129,.35); }
      .pill--block { color: #bae6fd; border-color: rgba(14,165,233,.35); }
      .pill--lab { color: #e9d5ff; border-color: rgba(168,85,247,.35); }
      .pill--doc { color: #fde68a; border-color: rgba(245,158,11,.35); }
      .quick {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 10px;
        margin: 14px 0 18px;
      }
      .quick__card {
        grid-column: span 6;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,.10);
        background: rgba(255,255,255,.04);
        overflow: hidden;
      }
      .quick__head {
        padding: 10px 12px;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        background: rgba(0,0,0,.18);
      }
      .quick__title { font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .92; }
      .quick__actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      .btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        color: inherit;
        padding: 6px 10px;
        border-radius: 10px;
        font-size: 12px;
        text-decoration: none;
        cursor: pointer;
      }
      .btn:hover { border-color: rgba(109,40,217,.55); background: rgba(109,40,217,.12); }
      .quick__frame { display: block; width: 100%; border: 0; background: transparent; height: 440px; }
      @media (max-width: 860px) {
        .quick__card { grid-column: span 12; }
        .quick__frame { height: 520px; }
      }
      .section { margin: 18px 0 22px; }
      .section h2 {
        margin: 0 0 10px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: #9ca3af;
      }
      .grid { display: grid; gap: 8px; }
      .card {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px 12px;
        align-items: center;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.04);
        text-decoration: none;
        color: inherit;
      }
      .card:hover { border-color: rgba(109,40,217,.55); background: rgba(109,40,217,.12); }
      .card__title { font-weight: 600; font-size: 14px; }
      .card__meta { font-size: 12px; color: #9ca3af; grid-column: 1 / -1; }
      .card__badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      .arch { font-size: 11px; color: #fbbf24; }
      .empty { padding: 24px; text-align: center; color: #9ca3af; }
      .gen { margin-top: 20px; font-size: 12px; color: #6b7280; }
      code { font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>${title}</h1>
      <p class="sub">${subtitle}</p>
      <div class="toolbar">
        <input class="search" id="q" type="search" placeholder="Поиск: hero, needs, events, parity…" autofocus />
        <button class="btn" type="button" data-quick-filter="page">Page parity</button>
        <button class="btn" type="button" data-quick-filter="canon">Канон blocks</button>
        <button class="btn" type="button" data-quick-filter="all">Все витрины</button>
        <span class="pill">npm run design-lab:build</span>
      </div>
      <div id="quick"></div>
      <div id="root"></div>
      <p class="gen">Сгенерировано <code>frontend-react/scripts/build-design-lab-nav.mjs</code> · источник <code>design-lab/nav.manifest.json</code></p>
    </div>
    <script>
      function escapeHtml(s) {
        return String(s)
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#039;');
      }
      const ITEMS = ${payload};
      const root = document.getElementById('root');
      const quick = document.getElementById('quick');
      const input = document.getElementById('q');

      function groupBySection(items) {
        const map = new Map();
        for (const it of items) {
          const key = it.sectionId + '::' + it.sectionTitle;
          if (!map.has(key)) map.set(key, { title: it.sectionTitle, items: [] });
          map.get(key).items.push(it);
        }
        return [...map.values()];
      }

      function firstPageParity(themeHint) {
        const pick = ITEMS.find(it =>
          it.kind === 'page-parity' &&
          (it.sectionId || '').includes(themeHint)
        );
        return pick || null;
      }

      function renderQuick() {
        const dash = firstPageParity('dashboard');
        const fin = firstPageParity('finance');

        const mkCard = (title, item) => {
          if (!item) {
            return '<div class=\"quick__card\"><div class=\"quick__head\"><div class=\"quick__title\">' + title + '</div><div class=\"quick__actions\"></div></div><div class=\"empty\">Нет ссылки в каноне</div></div>';
          }
          return '' +
            '<div class=\"quick__card\">' +
              '<div class=\"quick__head\">' +
                '<div class=\"quick__title\">' + title + '</div>' +
                '<div class=\"quick__actions\">' +
                  '<span class=\"pill pill--page-parity\">PAGE</span>' +
                  '<a class=\"btn\" href=\"./' + item.href + '\" target=\"_blank\" rel=\"noreferrer\">Открыть</a>' +
                  '<button class=\"btn\" type=\"button\" data-set-q=\"' + escapeHtml(item.sectionTitle) + '\">Фильтр</button>' +
                '</div>' +
              '</div>' +
              '<iframe class=\"quick__frame\" title=\"' + escapeHtml(title) + '\" src=\"./' + item.href + '\"></iframe>' +
            '</div>';
        };

        quick.innerHTML =
          '<div class=\"quick\">' +
            mkCard('Dashboard — default', dash) +
            mkCard('Финансы — default', fin) +
          '</div>';
      }

      function render(items) {
        if (!items.length) {
          root.innerHTML = '<div class="empty">Ничего не найдено</div>';
          return;
        }
        const groups = groupBySection(items);
        root.innerHTML = groups.map(g => {
          const cards = g.items.map(it => {
            const arch = it.status === 'superseded' ? '<span class="arch">архив</span>' : (it.status === 'approved' ? '<span class="arch">★</span>' : '');
            const hint = it.hint ? '<div class="card__meta">' + it.hint + '</div>' : '';
            return '<a class="card" href="./' + it.href + '" target="_blank" rel="noreferrer">' +
              '<div class="card__title">' + it.label + '</div>' +
              '<div class="card__badges"><span class="pill pill--' + it.kind + '">' + it.kind.toUpperCase() + '</span>' + arch + '</div>' +
              hint +
            '</a>';
          }).join('');
          return '<section class="section"><h2>' + g.title + '</h2><div class="grid">' + cards + '</div></section>';
        }).join('');
      }

      function filter() {
        const q = (input.value || '').trim().toLowerCase();
        if (!q) return render(ITEMS);
        const hit = ITEMS.filter(it =>
          (it.label + ' ' + it.href + ' ' + it.sectionTitle + ' ' + it.hint).toLowerCase().includes(q)
        );
        render(hit);
      }

      document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('[data-set-q]');
        if (btn) {
          input.value = btn.getAttribute('data-set-q') || '';
          filter();
          input.focus();
          return;
        }
        const f = e.target && e.target.closest && e.target.closest('[data-quick-filter]');
        if (f) {
          const kind = f.getAttribute('data-quick-filter');
          if (kind === 'page') input.value = 'page parity';
          else if (kind === 'canon') input.value = 'канон';
          else input.value = '';
          filter();
          input.focus();
        }
      });

      input.addEventListener('input', filter);
      renderQuick();
      render(ITEMS);
    </script>
  </body>
</html>
`
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const designLabRoot = path.join(repoRoot, 'design-lab')
  const navManifestPath = path.join(designLabRoot, 'nav.manifest.json')
  const outIndex = path.join(designLabRoot, 'index.html')

  if (!fs.existsSync(navManifestPath)) {
    // eslint-disable-next-line no-console
    console.error(`Missing: ${navManifestPath}`)
    process.exit(1)
  }

  const nav = readJson(navManifestPath)
  const items = []

  for (const rel of nav.canon_sources ?? []) {
    const expanded = expandCanonSource(repoRoot, designLabRoot, rel)
    if (expanded) items.push(...expanded)
  }

  items.push(...manifestSectionsToItems(nav.sections))

  if (nav.discover?.enabled) {
    const exclude = nav.discover.exclude_path_contains ?? []
    items.push(...discoverLabs(designLabRoot, exclude))
  }

  const deduped = dedupeItems(items)
  const finalItems = []
  for (const it of deduped) {
    const abs = path.join(designLabRoot, it.href)
    if (!fs.existsSync(abs)) {
      // eslint-disable-next-line no-console
      console.warn(`WARN: skip missing link: ${it.href}`)
      continue
    }
    finalItems.push(it)
  }

  const html = buildHtml({
    title: nav.title ?? 'Design Lab',
    subtitle:
      nav.subtitle ??
      'Запуск: cd design-lab && npx serve . — откройте корневой index.html',
    items: finalItems,
  })

  fs.writeFileSync(outIndex, html, 'utf8')
  // Make hub root always render `index.html` (avoid directory listing).
  // Filesystem still has precedence for static assets.
  fs.writeFileSync(
    path.join(designLabRoot, 'serve.json'),
    `${JSON.stringify(
      {
        cleanUrls: false,
        directoryListing: false,
        rewrites: [
          { source: '/', destination: '/index.html' },
          { source: '/**', destination: '/index.html' },
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  // eslint-disable-next-line no-console
  console.log(`OK: design-lab hub (${finalItems.length} links) → ${posixPath(path.relative(repoRoot, outIndex))}`)
}

main()
