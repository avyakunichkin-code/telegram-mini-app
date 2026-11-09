import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../../frontend-react/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const round = path.dirname(fileURLToPath(import.meta.url))
const context = { window: {} }
vm.runInNewContext(await fs.readFile(path.resolve(round, '../companions-round/characters.js'), 'utf8'), context)
const C = context.window.TH_CHARACTERS
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 900, height: 650 }, deviceScaleFactor: 2 })
for (const [person, companion] of [['student','studbilet'],['pro','card'],['boss','briefcase'],['biz','phone']]) {
  await page.setContent(`<style>html,body{margin:0;background:transparent}main{height:650px;display:flex;align-items:end;justify-content:center;gap:45px;padding:35px;box-sizing:border-box}svg:first-child{width:420px;height:580px}svg:last-child{width:300px;height:400px}</style><main>${C.persona(person, person)}${C.companion(companion,'calm',companion)}</main>`)
  await page.screenshot({ path: path.join(round, `assets/reference/${person}-current.png`), omitBackground: true })
}
await browser.close()
console.log('Rendered four existing persona/companion pairs without editing their sources.')
