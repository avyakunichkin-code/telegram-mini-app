import path from 'node:path'
import { printValidationResult, validateDesignLabRounds } from './lib/validate-design-lab-rounds.mjs'

const repoRoot = path.resolve(process.cwd(), '..')
const failOnWarnings = process.argv.includes('--strict-warnings')
const preBuild = process.argv.includes('--pre-build')

const result = validateDesignLabRounds(repoRoot, {
  skipParityBlocks: preBuild,
  parityThemes: preBuild ? [] : ['dashboard', 'finance'],
})
printValidationResult(result, { failOnWarnings })
