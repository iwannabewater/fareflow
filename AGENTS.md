# FareFlow Agent Guide

FareFlow is a mobile-first, local-first travel expense PWA. Expense capture must work without a network connection, and authenticated users sync to Supabase when online.

## Project Map

- `src/components/fareflow/`: product surfaces and the main dashboard.
- `src/hooks/`: React Query hooks for trips, expenses, auth, network state, and sync.
- `src/lib/domain/`: schema, money, analytics, and date rules.
- `src/lib/expenses/`: quick-capture parsing and expense-specific logic.
- `src/lib/offline/`: Dexie storage and outbox records.
- `src/lib/sync/`: Supabase adapter and retrying sync engine.
- `tests/`: Vitest unit and component coverage.
- `e2e/`: Playwright accessibility, PWA, and ledger flows.
- `docs/devops.md`: deployment and release smoke checks.

## Commands

Use Node.js 24 and the pnpm version declared in `package.json`.

```bash
pnpm verify
```

Narrow checks are `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:e2e`.

## Engineering Boundaries

- Preserve offline-first writes and idempotent synchronization.
- Keep date-only defaults on the Beijing calendar date and inject reference dates into deterministic parsing and tests.
- Use `·` as the canonical separator inside structured expense notes. Normalize legacy `•` only at parsing or display boundaries, without destructive migrations.
- Preserve meaningful note context such as `医院·看病`; category detection must not remove ledger information.
- Keep Simplified Chinese as the default language and maintain English parity.
- Keep destructive actions behind explicit confirmation.
- Avoid dependencies and broad refactors unless they remove demonstrated risk.

## Verification

- Bug fixes require a deterministic regression test.
- UI changes require a rendered desktop and narrow mobile check.
- Before pushing, run `pnpm verify`, `pnpm build`, and the release smoke checks relevant to the change.
- Production dependency audits must have no high-severity findings.

## Hotspots

- `src/components/fareflow/fareflow-app.tsx` is the main UI hotspot. Keep changes scoped, then run `pnpm exec vitest run tests/trip-selection.test.tsx` and `pnpm test:e2e`.
- `src/lib/expenses/quick-capture.ts` is parser-sensitive. Add table-driven cases, then run `pnpm exec vitest run tests/quick-capture.test.ts tests/trip-dates.test.ts`.
- `src/lib/i18n.ts` is the visible-copy source of truth. Maintain both `zh` and `en`.
- `pnpm-lock.yaml` is generated. Do not edit it manually; verify changes with `pnpm install --frozen-lockfile` and `pnpm audit --prod`.
