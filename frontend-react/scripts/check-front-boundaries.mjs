import fs from 'node:fs'
import path from 'node:path'

/**
 * Frontend boundaries check (legacy quarantine).
 *
 * Goals:
 * - screens/ must not depend on legacy components/*Premium* or components/*Section*
 * - screens/ should only import UI from components/mqx/**
 * - components/ remains legacy: new visible UI patterns go via MQX workflow
 *
 * This script is intentionally simple (regex-based) to avoid extra dependencies.
 */

const ROOT = path.resolve(process.cwd(), 'src')
const SCREENS_DIR = path.join(ROOT, 'screens')

const ALLOWED_COMPONENT_IMPORT_SUBPATHS = new Set([
  'components/mqx/',
  'components/notifications',
])

const FORBIDDEN_COMPONENT_IMPORT_SUBSTRINGS = [
  '/components/',
  '/components\\',
]

const FORBIDDEN_LEGACY_IMPORT_REGEX = /(\/|\\)components(\/|\\).*?(Premium|Section)\b/

function listFilesRecursive(dir, exts) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...listFilesRecursive(p, exts))
    else if (exts.has(path.extname(ent.name))) out.push(p)
  }
  return out
}

function normalizeToPosix(p) {
  return p.replaceAll('\\', '/')
}

function extractImportSources(code) {
  // Matches:
  // - import x from '...'
  // - import { x } from "..."
  // - import '...'
  // - const x = await import('...')
  const sources = []
  const re =
    /\bimport\s+(?:type\s+)?(?:[^'"]+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(code))) {
    const src = m[1] ?? m[2]
    if (src) sources.push(src)
  }
  return sources
}

function toResolvedPosix(fromFile, importSource) {
  if (!importSource.startsWith('.')) return null
  const abs = path.resolve(path.dirname(fromFile), importSource)
  // We only need a stable string to match "components/..." path fragments.
  return normalizeToPosix(abs)
}

function isAllowedComponentImport(resolvedPosixAbs) {
  const rel = normalizeToPosix(path.relative(ROOT, resolvedPosixAbs))
  if (!rel.startsWith('components/')) return true
  for (const allowed of ALLOWED_COMPONENT_IMPORT_SUBPATHS) {
    if (rel.startsWith(allowed)) return true
  }
  return false
}

function main() {
  const screenFiles = listFilesRecursive(SCREENS_DIR, new Set(['.js', '.jsx']))
  const errors = []

  for (const file of screenFiles) {
    const code = fs.readFileSync(file, 'utf8')
    const sources = extractImportSources(code)

    for (const src of sources) {
      if (!src.startsWith('.')) continue
      const resolvedAbsPosix = toResolvedPosix(file, src)
      if (!resolvedAbsPosix) continue

      if (FORBIDDEN_LEGACY_IMPORT_REGEX.test(resolvedAbsPosix)) {
        errors.push(
          `${normalizeToPosix(path.relative(process.cwd(), file))}: запрещён импорт legacy (*Premium/*Section): ${src}`,
        )
        continue
      }

      if (FORBIDDEN_COMPONENT_IMPORT_SUBSTRINGS.some((s) => resolvedAbsPosix.includes(s))) {
        if (!isAllowedComponentImport(resolvedAbsPosix)) {
          const rel = normalizeToPosix(path.relative(ROOT, resolvedAbsPosix))
          errors.push(
            `${normalizeToPosix(path.relative(process.cwd(), file))}: screens/ может импортировать из components/ только MQX и infra (notifications). Сейчас: ${src} → ${rel}`,
          )
        }
      }
    }
  }

  if (errors.length) {
    // eslint-disable-next-line no-console
    console.error('Frontend boundaries check failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
    process.exit(1)
  }

  // eslint-disable-next-line no-console
  console.log(`OK: boundaries (checked ${screenFiles.length} screens files).`)
}

main()

