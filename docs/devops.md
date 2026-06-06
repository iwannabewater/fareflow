# FareFlow DevOps Runbook

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

For a linked Vercel project, prefer CLI-driven env setup:

```bash
vercel link --yes --project fareflow --scope <team-or-user>
vercel env pull .env.local --yes
```

Required public variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser-safe Supabase publishable key.

## Supabase

Apply `supabase/migrations/20260512123000_initial_fareflow_schema.sql` with Supabase CLI or the Supabase SQL editor. The migration enables RLS, creates the private `receipts` Storage bucket, and makes `(user_id, client_id)` unique for idempotent offline retries.

CLI-first setup:

```bash
pnpm dlx supabase login
pnpm dlx supabase orgs list
pnpm dlx supabase projects create fareflow \
  --org-id <supabase-org-id> \
  --region <region> \
  --db-password '<strong-database-password>'
pnpm dlx supabase link --project-ref <project-ref> --password '<strong-database-password>'
pnpm dlx supabase db push
pnpm dlx supabase projects api-keys --project-ref <project-ref>
```

If the host cannot reach the remote Postgres IPv6 endpoint, apply the idempotent migration through Supabase's linked Management API path:

```bash
supabase db query --linked -f supabase/migrations/20260512123000_initial_fareflow_schema.sql
```

Dashboard fallback:

1. Create a Supabase project.
2. Run the migration in SQL Editor.
3. Copy the project URL and browser-safe anon/publishable key from Project Settings > API.

Auth URL configuration:

- Site URL: `https://project.whynotsleep.cc/fareflow/`.
- Redirect URLs:
  - `http://localhost:3000/fareflow/auth/confirm/`
  - `https://<preview-or-project-domain>.vercel.app/fareflow/auth/confirm/`
  - `https://project.whynotsleep.cc/fareflow/auth/confirm/`

Supabase's default magic-link email verifies at Supabase first and redirects back with `access_token` and `refresh_token` in the URL hash. The hash is intentionally handled by the client page at `/fareflow/auth/confirm/`; do not replace it with a server-only route unless the email template is also changed to use query parameters.

GitHub integration:

Supabase GitHub integration is authorized through the Dashboard OAuth flow, not the CLI. After the GitHub repository exists, open Project Settings > Integrations > GitHub Integration, authorize Supabase, select the `fareflow` repository, set Working directory to `.`, enable Automatic branching if preview branches are desired, and enable Deploy to production if production migrations should run from the production branch.

## Vercel

The Vercel project is connected to `iwannabewater/fareflow`. Pushes to `main` are deployed by Vercel Git Integration after GitHub Actions verification passes. GitHub Actions intentionally runs verification only; do not add a second CLI production deploy job unless the Git Integration is disabled.

The Next.js app is built with `basePath: "/fareflow"` and is exposed publicly through the existing Cloudflare Worker route:

```text
https://project.whynotsleep.cc/fareflow/ -> https://fareflow.vercel.app/fareflow/
```

Keep `https://project.whynotsleep.cc/` routed to the static project channel; only the `/fareflow` application prefix is proxied to Vercel.
The Worker also proxies `/_vercel/insights/*` on the project subdomain so the existing Vercel Web Analytics integration continues to load and report.

Preview deployment:

```bash
pnpm verify
vercel deploy
```

Production deployment:

```bash
vercel deploy --prod
```

Use direct CLI production deployment only as a manual fallback. Normal production releases should come from the Vercel Git deployment for `main`.

Environment variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value '<supabase-project-url>' --yes
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production --value '<supabase-anon-or-publishable-key>' --yes
vercel env add NEXT_PUBLIC_SUPABASE_URL development --value '<supabase-project-url>' --yes
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY development --value '<supabase-anon-or-publishable-key>' --yes
vercel env pull .env.local --yes
```

For Preview variables, connect the Vercel project to Git first, then add branch-scoped Preview variables:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL preview main --value '<supabase-project-url>' --yes
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY preview main --value '<supabase-anon-or-publishable-key>' --yes
```

Post-deploy checks:

```bash
vercel inspect <deployment-url>
vercel logs --environment production --since 30m --level error --json --no-branch
```

If a future workflow reintroduces CLI deployments, confirm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` are valid repository secrets before relying on it for production.

Release smoke checks:

1. Open `/fareflow` and confirm it canonicalizes to `/fareflow/`.
2. Generate or receive a Supabase magic link and confirm that it returns to `/fareflow/` without `auth=confirm_failed`.
3. Verify one visible login form on desktop and one visible login form on mobile.
4. Confirm logged-out production state starts without seeded trips and the sync badge reads Offline/离线.
5. Create two trips in a row and confirm the newly created trip becomes selected each time.
6. Confirm both trips remain visible in the compact trip switcher and in the picker.
7. Confirm new Trip and Expense forms default to CNY and the Beijing calendar date.
8. On desktop, verify Quick Capture saves clean food and health notes such as `食堂 · 饺子` and `医院 · 看病`, using the spaced ` · ` separator consistently.
9. For a three-day budgeted trip, log a first-day expense above the daily guide and confirm Budget Pace shows today's guide, today's overage, and budget left without forecasted overage copy.
10. Confirm Simplified Chinese is the default language, then toggle the language switch and confirm English remains available.
11. Confirm Chinese copy and the New Trip date fields fit at `390px` width.
12. Confirm `/fareflow/manifest.webmanifest`, `/fareflow/sw.js`, and Vercel Web Analytics requests load successfully.

## Cloudflare

Keep DNS proxied through Cloudflare with SSL/TLS mode set to Full (strict). Do not add cache rules that cache `sw.js`, `workbox-*`, `manifest.webmanifest`, or authenticated Supabase responses.

Recommended cache bypass patterns:

- `/fareflow/sw.js`
- `/fareflow/workbox-*`
- `/fareflow/manifest.webmanifest`
- `/fareflow/auth/*`
- `/_vercel/insights/*`

Wrangler is used only for Cloudflare-side inspection/configuration in this architecture; Vercel remains the Next.js runtime.
