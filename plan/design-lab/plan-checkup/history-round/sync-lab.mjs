import { readFileSync, writeFileSync } from 'node:fs'
writeFileSync(new URL('./lab-base.css', import.meta.url), '/* Generated from plan/web/src/styles.css. Do not edit. */\n' + readFileSync(new URL('../../../web/src/styles.css', import.meta.url), 'utf8'))
