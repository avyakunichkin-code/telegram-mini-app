import fs from 'node:fs'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd(), '..')
const template = fs.readFileSync(
  path.join(repoRoot, 'design-lab', '_shared', 'sync-lab-round.sh'),
  'utf8',
)

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === '.git') continue
    const abs = path.join(dir, name.name)
    if (name.isDirectory()) {
      walk(abs, out)
      continue
    }
    if (name.name === 'sync-lab.ps1') {
      out.push(path.dirname(abs))
    }
  }
  return out
}

let n = 0
for (const roundDir of walk(path.join(repoRoot, 'design-lab'))) {
  const shPath = path.join(roundDir, 'sync-lab.sh')
  fs.writeFileSync(shPath, template, 'utf8')
  n += 1
}

// eslint-disable-next-line no-console
console.log(`OK: wrote sync-lab.sh in ${n} round dirs.`)
