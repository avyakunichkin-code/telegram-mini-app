# Shared control contract — SPL-403

## Consumers and ownership

| Component | Shared behavior | Application owns |
|---|---|---|
| Plan `Button` | `ButtonBase`: native button, ref, default type, disabled/busy, aria-busy | primary/ghost/danger classes, loading label, Bento tokens |
| Game `MqxButton` | Same `ButtonBase` | seven variants, size, stretched, ink/other style contexts, MQX tokens |
| Plan `ErrorNote` / Game error patterns | No extracted component | Alert content, placement and API errors differ |
| Plan `RangeInput` / Game financial inputs | No extracted component | Range semantics, labels, parsing, validation and layout |
| Plan `Precision` / Game progress patterns | No extracted component | Financial precision differs from game progression |

Financial views, charts, report recommendations, game events, periods and journeys
stay in their applications. These differences have no common implementation in
the current package. The implemented shared primitive is ButtonBase; this table
does not claim a complete component library.

## Theme semantics and current mapping

This is a semantic contract and source map, not a shared color palette or new
runtime CSS namespace. Values remain in the applications. A consumer's variant
and context select a surface/text pair together; the same variant name need not
look identical in Game and Plan.

| Meaning | Plan source | Game source |
|---|---|---|
| Primary surface / on-surface text | `.btn-primary`: `--inverse` / `--on-inverse` | `.mqx-btn--primary`: `--mq-violet` / white; ink catalog overrides with `--mq-turn` / `--mq-turn-on` |
| Neutral surface / text | `.btn-ghost`: `--tile` / `--ink` | `.mqx-btn--secondary`: Telegram background / `--mq-violet-deep`; ink catalog uses `--mq-cell` / `--mq-board-ink` |
| Destructive surface / text | `.btn-danger`: `--tile-risk` / `--on-tile` | `.mqx-btn--destructive`: `--mq-danger` mix / `--mq-danger`; ink catalog uses `--mq-danger-soft` |
| Focus | Global `:focus-visible`: `--focus`, 2 px outline and offset | Native/browser outline and existing context rules; ButtonBase forwards the DOM ref and adds no focus CSS |
| Disabled | Native disabled + opacity 0.5, no active transform | Native disabled + opacity 0.45; ink catalog adds dashed border and `--mq-board-ink-faint` |
| Typography, radius and spacing | `--font-text`, `--radius-pill` and Bento spacing | `--mq-fs-*`, component radius and ink/context overrides |

Sources: [Plan styles](../../../plan/web/src/styles.css),
[Game layout](../../../game/web/src/styles/mqx/layout.css),
[Game ink overrides](../../frontend-react/src/styles/mqx/ink.css).
Both products retain their theme behavior. No fake common variables are added
solely to rename existing tokens. A future shared styled component needs actual
consumers and a mapping in both themes before it extends this package.

## Verification boundaries

- Root `node --test shared/tests/ui/*.test.mjs`: both actual adapters, separate CI job.
- Plan `npm.cmd run test:unit`: Plan adapter and report blocks only.
- Plan `npm.cmd run test:e2e`: browser contract through Plan and product flows.
- Game `npm.cmd run test:ui-kit`: actual Game adapter with the production CSS
  barrel, mobile/desktop, keyboard/ref/form/busy and seven variants in both themes.
- The Game specs also run under its ordinary `npm.cmd run test:e2e` discovery.
  The standalone config omits game/api/auth because the native button contract
  performs no API calls. It uses a separate Vite cache and fails on a busy port.

Fixtures in each application's `e2e/` are test entry points and are not imported
into the production entry. These checks do not prove full screen-reader support,
contrast compliance for all variants, or a complete game/core-loop regression.
