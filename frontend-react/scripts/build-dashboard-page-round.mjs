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

/**
 * Prepare output folder. On Windows the folder is often locked when `npx serve .`
 * runs from it — then we refresh contents in-place instead of deleting the root.
 */
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

/** Ensure relative assets (./lab-base.css) resolve inside iframe even if serve rewrites URLs. */
function patchBlockForEmbed(blockDirAbs) {
  const indexPath = path.join(blockDirAbs, 'index.html')
  if (!fs.existsSync(indexPath)) return

  let html = fs.readFileSync(indexPath, 'utf8')
  if (!/<base\s/i.test(html)) {
    html = html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <base href="./" />`)
    fs.writeFileSync(indexPath, html, 'utf8')
  }
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
  // Conservative defaults: each embedded round has its own scroll.
  // Adjust later if/when we add a postMessage auto-resizer.
  switch (blockId) {
    case 'hero':
      return 260
    case 'needs':
      return 420
    case 'finance':
      return 520
    case 'goal':
      return 520
    case 'actions':
      return 520
    default:
      return 520
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
          <iframe class="pgx-frame" title="${safeLabel}" src="./blocks/${b.id}/index.html" style="height:${h}px"></iframe>
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
      .pgx-wrap { max-width: 420px; margin: 0 auto; padding: 18px 14px 42px; }
      .pgx-title { margin: 8px 0 14px; font-size: 16px; font-weight: 700; letter-spacing: .02em; }
      .pgx-sub { margin: 0 0 14px; font-size: 12px; opacity: .72; line-height: 1.4; }
      .pgx-card {
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        overflow: hidden;
        margin: 12px 0;
      }
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
      .pgx-frame {
        display: block;
        width: 100%;
        border: 0;
        background: transparent;
      }
      .pgx-note {
        margin-top: 14px;
        font-size: 12px;
        opacity: .72;
        line-height: 1.4;
      }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>
    <div class="pgx-wrap">
      <div class="pgx-title">${title}</div>
      <p class="pgx-sub">
        Сгенерировано из <code>design-lab/dashboard/canon.manifest.json</code>.
        Каждый блок — отдельный round в <code>iframe</code> (без склейки CSS), чтобы не было конфликтов стилей.
      </p>
      ${cardsHtml}
      <p class="pgx-note">
        Если блок визуально “ок”, но на общей странице “плохо” — это сигнал на новый round/правку канона, а не на ручную склейку.
      </p>
    </div>
  </body>
</html>
`
}

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const manifestPath = path.join(repoRoot, 'design-lab', 'dashboard', 'canon.manifest.json')
  const outRoundDir = path.join(repoRoot, 'design-lab', 'dashboard', 'parity-generated-page-round')
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
    title: 'Dashboard — prod parity (generated)',
    blocks: plan,
  })

  fs.writeFileSync(path.join(outRoundDir, 'index.html'), html, 'utf8')
  fs.writeFileSync(
    path.join(outRoundDir, 'serve.json'),
    `${JSON.stringify(
      {
        cleanUrls: false,
        directoryListing: false,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(outRoundDir, 'README.md'),
    [
      '# Dashboard — prod parity (generated)',
      '',
      'Эта папка генерируется скриптом и используется как “страница целиком” без склейки CSS.',
      '',
      'Запуск:',
      '',
      '```bash',
      'cd design-lab/dashboard/parity-generated-page-round',
      'npx serve .',
      '```',
      '',
      'В папке есть `serve.json` (`cleanUrls: false`, `directoryListing: false`). Iframe грузят `blocks/*/index.html`.',
      '',
      'Пересборка:',
      '',
      '```bash',
      'cd frontend-react',
      'npm run design-lab:build-dashboard-page-round',
      '```',
      '',
      'Можно пересобирать при запущенном `npx serve .` (скрипт обновляет файлы in-place).',
      'Если Windows выдаёт EPERM — остановите serve в этой папке и повторите.',
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
    `OK: built ${posixPath(path.relative(repoRoot, outRoundDir))} from dashboard canon manifest.`,
  )
}

main()

