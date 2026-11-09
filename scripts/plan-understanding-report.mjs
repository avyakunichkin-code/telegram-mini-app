import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const TASKS = ['resume','conclusion','transfer','next_step','feedback']
const STATES = ['independent','assisted','error','unobserved']
const CATEGORIES = ['input','resume','conclusion','range','transfer','step','navigation','technical']
function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw Error('Unexpected fields in synthetic research snapshot')
}
export function summarize(input) {
  keys(input,['dataset','build','variant','sessions'])
  if(!['synthetic','synthetic_case_observations'].includes(input.dataset) || typeof input.build!=='string' || !input.build.trim() || !['A','B'].includes(input.variant) || !Array.isArray(input.sessions)) throw Error('Only synthetic fixtures or observations on synthetic cases are supported')
  const tasks=Object.fromEntries(TASKS.map(t=>[t,Object.fromEntries(STATES.map(s=>[s,0]))]))
  const difficulties=Object.fromEntries(CATEGORIES.map(c=>[c,0]))
  for(const session of input.sessions){
    keys(session,['viewport','tasks','difficulties'])
    if(!['mobile','desktop'].includes(session.viewport) || !Array.isArray(session.difficulties))throw Error('Invalid session')
    keys(session.tasks,TASKS)
    for(const t of TASKS){if(!STATES.includes(session.tasks[t]))throw Error('Every task needs an explicit status');tasks[t][session.tasks[t]]++}
    for(const c of new Set(session.difficulties)){if(!CATEGORIES.includes(c))throw Error('Unknown category');difficulties[c]++}
  }
  return {dataset:input.dataset,human_evidence:input.dataset==='synthetic_case_observations' && input.sessions.length>0,build:input.build,variant:input.variant,sessions:input.sessions.length,tasks,difficulties}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2])throw Error('Usage: node scripts/plan-understanding-report.mjs <research-snapshot.json>')
  console.log(JSON.stringify(summarize(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2))
}
