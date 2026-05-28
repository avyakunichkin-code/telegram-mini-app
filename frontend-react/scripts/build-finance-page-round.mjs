import fs from 'node:fs'
import path from 'node:path'

function posixPath(p) {
  return p.replaceAll('\\', '/')
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'))
}

function isDirLockedError(err) {
  return err && (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES')
}

function rmSafe(absPath) {
  try {
    fs.rmSync(absPath, { recursive: true, force: true })
    return true
  } catch (err) {
    if (isDirLockedError(err)) return false
    throw err
  }
}

function listChildDirNames(absDir) {
  if (!fs.existsSync(absDir)) return []
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name)
}

function prepareOutputDir(outRoundDir, outBlocksDir, blockIds) {
  if (rmSafe(outRoundDir)) {
    fs.mkdirSync(outBlocksDir, { recursive: true })
    return { mode: 'fresh' }
  }

  fs.mkdirSync(outBlocksDir, { recursive: true })

  const keep = new Set(blockIds)
  const stale = listChildDirNames(outBlocksDir).filter((name) => !keep.has(name))
  const warnings = []

  for (const name of stale) {
    const blockDir = path.join(outBlocksDir, name)
    if (!rmSafe(blockDir)) {
      warnings.push(
        `Не удалось удалить устаревший блок "${name}" (папка занята?). Остановите serve или закройте файлы.`,
      )
    }
  }

  return { mode: 'in-place', warnings }
}

function copyDir(srcAbs, dstAbs) {
  fs.cpSync(srcAbs, dstAbs, {
    recursive: true,
    force: true,
    filter: (src) => {
      const base = path.basename(src)
      if (base === 'node_modules') return false
      if (base === '.DS_Store') return false
      return true
    },
  })
}

function pickCanonicalRound(block) {
  const rounds = Array.isArray(block?.canonical_rounds) ? block.canonical_rounds : []
  const approved = rounds.find((r) => (r?.status ?? 'approved') === 'approved')
  return approved ?? rounds[0] ?? null
}

function iframeHeightForBlockId(blockId) {
  switch (blockId) {
    case 'finance-page':
      return 760
    case 'invest-forms':
      return 760
    case 'asset-cards':
      return 760
    case 'row-actions':
      return 760
    case 'capital-page':
      return 760
    default:
      return 760
  }
}

function buildIndexHtml({ title, blocks }) {
  const cardsHtml = blocks
    .map((b) => {
      const h = iframeHeightForBlockId(b.id)
      const safeLabel = (b.label ?? b.id).toUpperCase()
      return `
        <section class="pgx-card" data-block="${b.id}">
          <header class="pgx-card__header">
            <div class="pgx-kicker">${safeLabel}</div>
            <a class="pgx-link" href="./blocks/${b.id}/index.html" target="_blank" rel="noreferrer">Открыть отдельно</a>
          </header>
          <iframe class="pgx-frame" title="${safeLabel}" src="./blocks/${b.id}/index.html?embed=1" style="height:${h}px"></iframe>
        </section>
      `.trim()
    })
    .join('\n')

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        background: #0f0f14;
        color: rgba(255,255,255,.92);
      }
      .pgx-wrap { max-width: 980px; margin: 0 auto; padding: 18px 14px 42px; }
      .pgx-title { margin: 8px 0 14px; font-size: 16px; font-weight: 700; letter-spacing: .02em; }
      .pgx-sub { margin: 0 0 14px; font-size: 12px; opacity: .72; line-height: 1.4; max-width: 740px; }
      .pgx-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 12px; }
      .pgx-card {
        grid-column: span 6;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        overflow: hidden;
      }
      @media (max-width: 900px) { .pgx-card { grid-column: span 12; } }
      .pgx-card__header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255,255,255,.10);
        background: rgba(0,0,0,.18);
      }
      .pgx-kicker { font-size: 11px; font-weight: 800; letter-spacing: .12em; opacity: .86; }
      .pgx-link { font-size: 12px; color: rgba(180, 200, 255, .92); text-decoration: none; }
      .pgx-link:hover { text-decoration: underline; }
      .pgx-frame { display: block; width: 100%; border: 0; background: transparent; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>
    <div class="pgx-wrap">
      <div class="pgx-title">${title}</div>
      <p class="pgx-sub">
        Сгенерировано из <code>design-lab/finance/canon.manifest.json</code>. Каждый блок — отдельная витрина в <code>iframe</code>,
        без склейки CSS, чтобы конфликты стилей не ломали страницу.
      </p>
      <div class="pgx-grid">
        ${cardsHtml}
      </div>
    </div>
  </body>
</html>
`
}

function patchBlockForEmbed(blockDirAbs) {
  const indexPath = path.join(blockDirAbs, 'index.html')
  if (!fs.existsSync(indexPath)) return

  let html = fs.readFileSync(indexPath, 'utf8')
  if (!/<base\s/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <base href="./" />`)
  }

  // Add prod-like embed mode: hide lab chrome when `?embed=1` is present.
  if (!/data-embed-style/i.test(html)) {
    html = html.replace(
      /<\/head>/i,
      [
        '    <style data-embed-style>',
        '      html[data-embed="1"] .lab-header,',
        '      html[data-embed="1"] .lab-round-note,',
        '      html[data-embed="1"] .lab-variant-card__label,',
        '      html[data-embed="1"] .lab-variant-card__idea,',
        '      html[data-embed="1"] .lab-variant-grid > *:not(:first-child) { display: none !important; }',
        '      html[data-embed="1"] .lab-main { padding: 0 !important; }',
        '      html[data-embed="1"] body { padding: 0 !important; }',
        '    </style>',
        '    <script>',
        '      (function(){',
        "        try {",
        "          var p = new URLSearchParams(location.search);",
        "          if (p.get('embed') === '1') document.documentElement.setAttribute('data-embed','1');",
        "        } catch (e) {}",
        '      })();',
        '    </script>',
        '  </head>',
      ].join('\n'),
    )
  }

  fs.writeFileSync(indexPath, html, 'utf8')
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const manifestPath = path.join(repoRoot, 'design-lab', 'finance', 'canon.manifest.json')
  const outRoundDir = path.join(repoRoot, 'design-lab', 'finance', 'parity-generated-page-round')
  const outBlocksDir = path.join(outRoundDir, 'blocks')

  if (!fs.existsSync(manifestPath)) {
    // eslint-disable-next-line no-console
    console.error(`Missing manifest: ${manifestPath}`)
    process.exit(1)
  }

  const manifest = readJson(manifestPath)
  const blocks = Array.isArray(manifest?.blocks) ? manifest.blocks : []

  const plan = blocks
    .map((b) => {
      const picked = pickCanonicalRound(b)
      if (!picked?.path) return null
      return {
        id: b.id,
        label: b.id,
        src: path.join(repoRoot, picked.path),
        rel: picked.path,
      }
    })
    .filter(Boolean)

  const blockIds = plan.map((p) => p.id)
  const prep = prepareOutputDir(outRoundDir, outBlocksDir, blockIds)

  if (prep.mode === 'in-place') {
    // eslint-disable-next-line no-console
    console.warn(
      'WARN: parity-generated-page-round занят (часто из-за `npx serve .`). Пересобираем содержимое без удаления корня.',
    )
    for (const w of prep.warnings) {
      // eslint-disable-next-line no-console
      console.warn(`WARN: ${w}`)
    }
  }

  for (const item of plan) {
    const src = item.src
    const dst = path.join(outBlocksDir, item.id)
    if (!fs.existsSync(src)) {
      // eslint-disable-next-line no-console
      console.error(`Missing canonical round for "${item.id}": ${item.rel}`)
      process.exit(1)
    }
    rmSafe(dst)
    copyDir(src, dst)
    patchBlockForEmbed(dst)
  }

  const html = buildIndexHtml({
    title: 'Финансы — prod parity (generated)',
    blocks: plan,
  })

  fs.mkdirSync(outRoundDir, { recursive: true })
  fs.writeFileSync(path.join(outRoundDir, 'index.html'), html, 'utf8')
  fs.writeFileSync(
    path.join(outRoundDir, 'serve.json'),
    `${JSON.stringify({ cleanUrls: false, directoryListing: false }, null, 2)}\n`,
    'utf8',
  )

  fs.writeFileSync(
    path.join(outRoundDir, 'README.md'),
    [
      '# Финансы — prod parity (generated)',
      '',
      'Эта папка генерируется скриптом и используется как “страница целиком” без склейки CSS.',
      '',
      'Запуск:',
      '',
      '```bash',
      'cd design-lab/finance/parity-generated-page-round',
      'npx serve .',
      '```',
      '',
      'Пересборка:',
      '',
      '```bash',
      'cd frontend-react',
      'npm run design-lab:build-finance-page-round',
      '```',
      '',
      'Источник правды:',
      '',
      `- \`${posixPath(path.relative(repoRoot, manifestPath))}\``,
      '',
    ].join('\n'),
    'utf8',
  )

  // eslint-disable-next-line no-console
  console.log(
    `OK: built ${posixPath(path.relative(repoRoot, outRoundDir))} from finance canon manifest.`,
  )
}

main()

