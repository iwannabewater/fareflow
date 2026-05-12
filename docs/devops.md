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

- Site URL: the production Vercel or custom domain.
- Redirect URLs:
  - `http://localhost:3000/auth/confirm`
  - `https://<preview-or-project-domain>.vercel.app/auth/confirm`
  - `https://<custom-domain>/auth/confirm`

Supabase's default magic-link email verifies at Supabase first and redirects back with `access_token` and `refresh_token` in the URL hash. The hash is intentionally handled by the client page at `/auth/confirm`; do not replace it with a server-only route unless the email template is also changed to use query parameters.

GitHub integration:

Supabase GitHub integration is authorized through the Dashboard OAuth flow, not the CLI. After the GitHub repository exists, open Project Settings > Integrations > GitHub Integration, authorize Supabase, select the `fareflow` repository, set Working directory to `.`, enable Automatic branching if preview branches are desired, and enable Deploy to production if production migrations should run from the production branch.

## Vercel

Preview deployment:

```bash
pnpm verify
vercel deploy
```

Production deployment:

```bash
vercel deploy --prod
```

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

Release smoke checks:

1. Generate or receive a Supabase magic link and confirm that it returns to `/` without `auth=confirm_failed`.
2. Verify one visible login form on desktop and one visible login form on mobile.
3. Toggle the language switch and confirm Chinese copy fits at `390px` width.
4. Confirm `/manifest.webmanifest` and `/sw.js` return `200`.

## Cloudflare

Keep DNS proxied through Cloudflare with SSL/TLS mode set to Full (strict). Do not add cache rules that cache `sw.js`, `workbox-*`, `manifest.webmanifest`, or authenticated Supabase responses.

Recommended cache bypass patterns:

- `/sw.js`
- `/workbox-*`
- `/manifest.webmanifest`
- `/auth/*`

Wrangler is used only for Cloudflare-side inspection/configuration in this architecture; Vercel remains the Next.js runtime.
