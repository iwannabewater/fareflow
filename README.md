# FareFlow

FareFlow is a mobile-first travel expense PWA. It captures expenses instantly, keeps an IndexedDB outbox while offline, and syncs authenticated data to Supabase when the network returns.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict mode
- Tailwind CSS, shadcn/ui, Framer Motion, Lucide React
- Supabase Auth/Postgres/Storage-ready schema with RLS
- TanStack Query v5 for cache, optimistic mutations, and retry orchestration
- Dexie for the local outbox and persisted query cache
- CNY-first trip defaults with Beijing calendar dates for date-only capture
- `@ducanh2912/next-pwa` for Workbox service worker generation
- Simplified Chinese default UI with persisted in-app English switching
- Self-hosted LXGW WenKai, ZCOOL KuaiLe, Alegreya, and Comic Neue fonts
- Vercel Web Analytics through `@vercel/analytics`
- Vercel CLI and Wrangler-compatible deployment runbook

## Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs in local demo mode without Supabase env vars. Add these keys to enable cloud auth and sync:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Verification

```bash
pnpm verify
```

This runs ESLint, TypeScript, Vitest, and a production build. Production and dev commands explicitly use webpack because the PWA plugin adds a webpack Workbox configuration while Next.js 16 defaults to Turbopack.

## Supabase

Apply `supabase/migrations/20260512123000_initial_fareflow_schema.sql`. The migration creates `trips`, `expenses`, a private `receipts` Storage bucket, RLS policies, and `(user_id, client_id)` uniqueness for idempotent offline retries.

Supabase magic links are confirmed at `/auth/confirm`. The app handles the default hash-session callback, PKCE `code` callbacks, and `token_hash` callbacks. The confirmation route refreshes the shared auth cache before returning to the app so newly signed-in users immediately see their cloud-backed trips.

## Deployment

See [docs/devops.md](docs/devops.md) for the CLI-first Supabase/Vercel deployment runbook, auth redirect settings, and Cloudflare cache guidance.
