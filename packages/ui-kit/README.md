# @tvoy/ui-kit

Shared native behavior for Game and Plan (SPL-403). `ButtonBase` forwards the
DOM ref, defaults to `type="button"`, and disables interaction while `busy`
even when `disabled={false}` is supplied. It exposes `aria-busy` without
choosing a loading label. Explicit submit/reset types and native events pass through.

Consumers: Plan `Button` and Game `MqxButton`. Each owns its classes, variants,
content and theme. No financial or game components belong here.

The applications currently resolve source packages through Vite aliases, as with
api-client; React is deduplicated to the consuming application's installation.
No root workspace or dependency installation is required.

Theme contract: surface/text, focus and disabled appearance remain in each
application's styles. This package supplies no shared palette or global CSS.
See [CONTRACT.md](CONTRACT.md) for the consumer inventory and semantic token mapping.

Verification: from repository root, `node --test tests/shared-ui/*.test.mjs`
tests both actual adapters in a separate contract suite (dependencies from plan-web).
`cd apps/plan-web; npm.cmd run test:unit` tests only Plan;
`npm.cmd run test:e2e` covers native keyboard, form, busy and ref behavior.
Game `cd frontend-react; npm.cmd run test:ui-kit` checks its actual MqxButton in
Chrome with production CSS, without a backend. Its specs also join normal Game E2E.
