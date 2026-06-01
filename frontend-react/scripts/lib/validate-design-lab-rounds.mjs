import fs from 'node:fs'
import path from 'node:path'

const MIN_LAB_BASE_BYTES = 200
const FORBIDDEN_CSS_HREF = /href\s*=\s*["']\.\.\/[^"']*\.css/i
const LAB_BASE_HREF = /href\s*=\s*["']\.\/lab-base\.css["']/i

function posix(p) {
  return p.replaceAll('\\', '/')
}

function readJson(absPath) {
  return JSON.parse(fs.readFileSync(absPath, 'utf8'))
}

function isParityBlockDir(absDir) {
  return posix(absDir).includes('/parity-generated-page-round/blocks/')
}

function isBaselineDir(absDir) {
  return posix(absDir).includes('/design-lab/_baseline/')
}

function hasSyncLabScript(roundDirAbs) {
  return ['sync-lab.sh', 'sync-lab.ps1', 'sync-lab.cmd'].some((name) =>
    fs.existsSync(path.join(roundDirAbs, name)),
  )
}

function findSyncLabRoundDirs(repoRoot, { skipParityBlocks = false } = {}) {
  const designLab = path.join(repoRoot, 'design-lab')
  const out = []

  function walk(dir) {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const ent of entries) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue
      const abs = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (!isBaselineDir(abs)) walk(abs)
        continue
      }
      if (ent.name === 'sync-lab.sh' || ent.name === 'sync-lab.ps1' || ent.name === 'sync-lab.cmd') {
        if (skipParityBlocks && isParityBlockDir(abs)) continue
        out.push(path.dirname(abs))
      }
    }
  }

  walk(designLab)
  return [...new Set(out.map((d) => posix(d)))].sort()
}

function canonicalRoundPaths(repoRoot) {
  const manifests = [
    path.join(repoRoot, 'design-lab', 'dashboard', 'canon.manifest.json'),
    path.join(repoRoot, 'design-lab', 'finance', 'canon.manifest.json'),
  ]
  const dirs = new Set()

  for (const manifestPath of manifests) {
    if (!fs.existsSync(manifestPath)) continue
    const manifest = readJson(manifestPath)
    const blocks = Array.isArray(manifest?.blocks) ? manifest.blocks : []
    for (const block of blocks) {
      const rounds = Array.isArray(block?.canonical_rounds) ? block.canonical_rounds : []
      for (const round of rounds) {
        if (!round?.path) continue
        const abs = path.join(repoRoot, round.path.replace(/\/$/, ''))
        dirs.add(posix(abs))
      }
    }
  }

  return [...dirs].sort()
}

function isProtectedRoundDir(roundDirAbs, repoRoot, protectedDirs) {
  const p = posix(roundDirAbs)
  if (isParityBlockDir(roundDirAbs)) return true
  return protectedDirs.has(p)
}

function validateRoundDir(roundDirAbs, repoRoot, { label, enforceFreshLabBase = false } = {}) {
  const errors = []
  const warnings = []
  const tag = label || posix(path.relative(repoRoot, roundDirAbs))

  if (isBaselineDir(roundDirAbs)) {
    return { errors, warnings }
  }

  const indexPath = path.join(roundDirAbs, 'index.html')
  const labBasePath = path.join(roundDirAbs, 'lab-base.css')
  const stylesPath = path.join(roundDirAbs, 'styles.css')
  const hasSyncLab = hasSyncLabScript(roundDirAbs)

  if (!fs.existsSync(indexPath)) {
    if (hasSyncLab) {
      errors.push(`${tag}: нет index.html (ожидается в раунде с sync-lab.sh / sync-lab.ps1)`)
    }
    return { errors, warnings }
  }

  const html = fs.readFileSync(indexPath, 'utf8')

  if (FORBIDDEN_CSS_HREF.test(html)) {
    errors.push(
      `${tag}: index.html ссылается на CSS через ../ — при npx serve . в round будет 404. Только ./lab-base.css и ./styles.css (round).`,
    )
  }

  const referencesLabBase = LAB_BASE_HREF.test(html)
  if (!hasSyncLab && !referencesLabBase) {
    return { errors, warnings }
  }

  if (hasSyncLab && !referencesLabBase) {
    errors.push(
      `${tag}: index.html должен подключать <link rel="stylesheet" href="./lab-base.css" /> (self-contained round).`,
    )
  }

  if (referencesLabBase || hasSyncLab) {
    if (fs.existsSync(labBasePath) && /mqx-needs-block/.test(html)) {
      const labCss = fs.readFileSync(labBasePath, 'utf8')
      if (!/\.mqx-needs-block\b/.test(labCss)) {
        errors.push(
          `${tag}: lab-base.css не содержит .mqx-needs-block — пересоберите sync-lab (v5: prod dashboard.css).`,
        )
      }
    }

    if (!fs.existsSync(labBasePath)) {
      errors.push(`${tag}: нет lab-base.css — запустите ./sync-lab.sh (или .\\sync-lab.ps1) в папке раунда.`)
    } else {
      const stat = fs.statSync(labBasePath)
      if (stat.size < MIN_LAB_BASE_BYTES) {
        errors.push(
          `${tag}: lab-base.css слишком мал (${stat.size} B) — пересоберите ./sync-lab.sh.`,
        )
      }
      const head = fs.readFileSync(labBasePath, 'utf8').slice(0, 120)
      if (!head.includes('Auto-generated') && !head.includes('sync-lab')) {
        warnings.push(
          `${tag}: lab-base.css не похож на вывод sync-lab — не редактируйте вручную, запустите ./sync-lab.sh.`,
        )
      }
    }

    if (
      enforceFreshLabBase &&
      hasSyncLab &&
      fs.existsSync(stylesPath) &&
      fs.existsSync(labBasePath)
    ) {
      const stylesMtime = fs.statSync(stylesPath).mtimeMs
      const labMtime = fs.statSync(labBasePath).mtimeMs
      if (stylesMtime > labMtime + 1000) {
        errors.push(
          `${tag}: styles.css новее lab-base.css — стили в lab устарели. Запустите ./sync-lab.sh`,
        )
      }
    }
  }

  return { errors, warnings }
}

function validateParityBlocks(repoRoot, theme) {
  const parityDir = path.join(
    repoRoot,
    'design-lab',
    theme,
    'parity-generated-page-round',
    'blocks',
  )
  if (!fs.existsSync(parityDir)) {
    return {
      errors: [`${theme}: нет ${posix(path.relative(repoRoot, parityDir))} — npm run design-lab:build-${theme}-page-round`],
      warnings: [],
    }
  }

  const errors = []
  const warnings = []
  const blockIds = fs.readdirSync(parityDir, { withFileTypes: true }).filter((e) => e.isDirectory())

  for (const ent of blockIds) {
    const blockDir = path.join(parityDir, ent.name)
    const r = validateRoundDir(blockDir, repoRoot, {
      label: `${theme} parity block/${ent.name}`,
      enforceFreshLabBase: true,
    })
    errors.push(...r.errors)
    warnings.push(...r.warnings)
  }

  return { errors, warnings }
}

/**
 * @param {string} repoRoot
 * @param {{ parityThemes?: string[], includeAllSyncRounds?: boolean }} opts
 */
export function validateDesignLabRounds(repoRoot, opts = {}) {
  const parityThemes = opts.parityThemes ?? ['dashboard', 'finance']
  const includeAllSyncRounds = opts.includeAllSyncRounds !== false
  const skipParityBlocks = opts.skipParityBlocks === true
  const parityOnly = opts.parityOnly === true
  const canonOnly = opts.canonOnly === true

  const errors = []
  const warnings = []
  const protectedDirs = new Set(canonicalRoundPaths(repoRoot))

  if (!parityOnly && includeAllSyncRounds) {
    const roundDirs = findSyncLabRoundDirs(repoRoot, { skipParityBlocks })
    for (const dir of roundDirs) {
      const r = validateRoundDir(dir, repoRoot, {
        enforceFreshLabBase: isProtectedRoundDir(dir, repoRoot, protectedDirs),
      })
      errors.push(...r.errors)
      warnings.push(...r.warnings)
    }
  }

  if (!canonOnly) {
    for (const theme of parityThemes) {
      const p = validateParityBlocks(repoRoot, theme)
      errors.push(...p.errors)
      warnings.push(...p.warnings)
    }
  }

  if (!parityOnly) {
    const canonDirs = canonicalRoundPaths(repoRoot)
    for (const dir of canonDirs) {
      if (!fs.existsSync(dir)) {
        errors.push(`Канон: папка раунда не найдена: ${posix(path.relative(repoRoot, dir))}`)
        continue
      }
      const labBasePath = path.join(dir, 'lab-base.css')
      if (!hasSyncLabScript(dir) && !fs.existsSync(labBasePath)) {
        continue
      }
      const r = validateRoundDir(dir, repoRoot, {
        label: `canon ${posix(path.relative(repoRoot, dir))}`,
        enforceFreshLabBase: true,
      })
      errors.push(...r.errors)
      warnings.push(...r.warnings)
    }
  }

  return {
    errors,
    warnings,
    roundCount: findSyncLabRoundDirs(repoRoot, { skipParityBlocks: false }).length,
  }
}

export function printValidationResult(result, { failOnWarnings = false } = {}) {
  for (const w of result.warnings) {
    // eslint-disable-next-line no-console
    console.warn(`WARN: ${w}`)
  }

  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      [
        'Design-lab rounds check failed.',
        '',
        'Self-contained раунды: index.html → только ./lab-base.css (без ../).',
        'После правки styles.css: ./sync-lab.sh в папке раунда (предпочтительно; legacy: .\\sync-lab.ps1).',
        'Перед parity: cd frontend-react && npm run design-lab:build',
        '',
        ...result.errors.map((e) => `- ${e}`),
      ].join('\n'),
    )
    process.exit(1)
  }

  if (failOnWarnings && result.warnings.length > 0) {
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(
    `OK: design-lab rounds (${result.roundCount} sync-lab dirs, parity + canon checked).`,
  )
}
