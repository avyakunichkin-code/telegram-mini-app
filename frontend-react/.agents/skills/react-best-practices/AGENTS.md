# React Best Practices (ТВОЙ ХОД — slim index)

> **Контекст:** Vite + React TMA, не Next.js. Полный Vercel-гайд (70 правил): [`AGENTS.full.md`](AGENTS.full.md).  
> **Не перегенерировать** `AGENTS.md` через `pnpm build` без восстановления slim-обёртки.

## Когда читать полный гайд

- Рефактор perf, bundle, waterfalls → открыть **`AGENTS.full.md`** или правило `rules/<name>.md`
- Skill: `frontend-react/.agents/skills/react-best-practices/SKILL.md`

## CRITICAL для этого проекта

1. **Waterfalls:** `Promise.all()` для независимых fetch; cheap sync guard до `await`.
2. **Bundle:** прямые импорты; lazy `import()` для тяжёлых экранов (Vite dynamic import, не `next/dynamic`).
3. **Re-render:** derived state в render, не effect; не объявлять компоненты внутри компонентов.
4. **Handlers:** side effects по клику — в handler, не state+effect.
5. **Lists:** `content-visibility: auto` для длинных списков (события, история).

## Не применять буквально

- RSC, Server Actions, `React.cache()`, `after()` — **Next.js only**; у нас FastAPI backend.
- SWR — опционально; основной data layer: `useGame.js` + `api.js`.

## MQX / TMA

- Prod UI: `*Premium.jsx` + `mqx/` — rule `tvoy-hod-frontend-core.mdc`, skill **frontend-ui-engineering**.
- TMA viewport/theme: skill **telegram-mini-app-runtime** (deferred, по запросу).
