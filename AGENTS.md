# FareFlow Agent Guide

FareFlow is a mobile-first travel expense PWA. It is intentionally local-first: expense capture must work without a network connection, and authenticated users sync to Supabase when the app is online.

## Project Map

- `src/components/fareflow/`: product surfaces, drawers, sync status, recovery panels, and the main dashboard.
- `src/hooks/`: React Query hooks for trips, expenses, auth session, network state, and sync orchestration.
- `src/lib/domain/`: schema, money formatting, category metadata, analytics, seed data, and date defaults.
- `src/lib/offline/`: Dexie database and outbox records.
- `src/lib/sync/`: Supabase remote adapter and retrying sync engine.
- `src/lib/supabase/`: browser/server clients, mappers, middleware, and auth callback helpers.
- `tests/`: Vitest unit and component coverage.
- `e2e/`: Playwright smoke, accessibility, and core ledger flows.
- `docs/devops.md`: deployment, Supabase, Vercel, and release smoke checks.

## Commands

Use `pnpm` with Node.js 24. The default verification gate is:

```bash
pnpm verify
```

For narrower checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The app runs locally with:

```bash
pnpm dev
```

## Engineering Boundaries

- Preserve offline-first behavior. Writes should land locally first, then sync when Supabase is available.
- Treat Supabase as the authenticated source of truth. Dexie is a cache and outbox, not a durable cloud substitute.
- Keep date-only inputs and labels on the Beijing calendar date (`Asia/Shanghai`).
- Keep Simplified Chinese as the default UI language, with the in-app English switch preserved.
- Do not duplicate authentication panels in the same visible layout.
- Keep destructive actions behind explicit confirmation.
- Avoid adding dependencies unless they clearly remove more complexity than they add.

## UI Boundaries

- Follow `DESIGN.md` for the warm atlas ledger direction.
- Category analytics must remain readable on mobile and must not use overlapping chart marks.
- Repeated expenses should stay row-based, not nested card stacks.
- Primary add/edit flows stay in bottom drawers on mobile.
- Touch targets should remain at least 44px where users perform primary actions.

## Verification Expectations

- UI changes require at least one Vitest or Playwright assertion when behavior, labels, accessibility roles, or layout risk changes.
- Bug fixes should include a regression guard when the failure can be reproduced deterministically.
- Before pushing, run `pnpm verify`. If a full Playwright run is not possible, state the blocker and run the narrowest available substitute.
- For release readiness, also run the manual smoke checklist in `docs/devops.md`.

## Hotspots

- `src/components/fareflow/fareflow-app.tsx` is the main dashboard and current UI hotspot. Keep edits scoped, prefer extracting only when a boundary is stable, and verify both desktop and mobile after substantial changes.
- `src/lib/i18n.ts` is the copy source of truth. Any visible text added to the app must be present in both `en` and `zh`.
