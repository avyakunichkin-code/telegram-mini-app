import fs from 'node:fs'
import path from 'node:path'

function posixPath(p) {
  return p.replaceAll('\\', '/')
}

function ensureDir(absDir) {
  fs.mkdirSync(absDir, { recursive: true })
}

function copyDir(srcAbs, dstAbs) {
  fs.rmSync(dstAbs, { recursive: true, force: true })
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

function main() {
  const repoRoot = path.resolve(process.cwd(), '..')
  const outRoot = path.join(repoRoot, 'design-lab', '_baseline')
  ensureDir(outRoot)

  const targets = [
    {
      id: 'dashboard',
      src: path.join(repoRoot, 'design-lab', 'dashboard', 'parity-generated-page-round'),
      dst: path.join(outRoot, 'dashboard'),
    },
    {
      id: 'finance',
      src: path.join(repoRoot, 'design-lab', 'finance', 'parity-generated-page-round'),
      dst: path.join(outRoot, 'finance'),
    },
  ]

  const frozenAt = new Date().toISOString()
  const meta = { frozen_at: frozenAt, items: [] }

  for (const t of targets) {
    if (!fs.existsSync(t.src)) {
      // eslint-disable-next-line no-console
      console.warn(`WARN: skip baseline for ${t.id} (missing): ${posixPath(path.relative(repoRoot, t.src))}`)
      continue
    }
    copyDir(t.src, t.dst)
    meta.items.push({ id: t.id, src: posixPath(path.relative(repoRoot, t.src)), dst: posixPath(path.relative(repoRoot, t.dst)) })
  }

  fs.writeFileSync(path.join(outRoot, 'baseline.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8')

  // eslint-disable-next-line no-console
  console.log(`OK: baseline frozen at ${frozenAt}`)
  for (const it of meta.items) {
    // eslint-disable-next-line no-console
    console.log(`- ${it.id}: ${it.dst}`)
  }
}

main()

