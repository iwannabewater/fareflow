# FareFlow Domain Context

FareFlow is a mobile-first travel expense PWA. Supabase is the source of truth for authenticated users; Dexie is a local outbox and cache used to keep capture working offline.

## Domain Terms

- Trip: a journey with a destination, base currency, and date range.
- Expense: a cost captured against a Trip, stored in the expense currency and in the Trip base currency using an exchange-rate snapshot.
- Base currency: the reporting currency for a Trip.
- App date: the Beijing calendar date (`Asia/Shanghai`) used for all date inputs and date-only labels.
- Exchange-rate snapshot: the rate saved with each Expense so totals remain stable when market rates change.
- Outbox: local Dexie records with `pending` or `failed` sync state. It is not a source of truth.
- Sync engine: the Module that owns online/offline branching, retries, and Supabase upserts.
- Authenticated online: the only state that may claim cloud connectivity in the UI. A network connection without a Supabase user is treated as local capture until login completes.

## Product Defaults

- New Trips default to `CNY` as the Base currency.
- New Trip and Expense date inputs default to the current App date, not the UTC date.

## Architecture Terms

- Module: anything with an interface and implementation.
- Interface: all facts callers need to use a Module correctly.
- Seam: where an interface lives.
- Adapter: a concrete thing satisfying an interface at a seam.
- Depth: leverage at the interface.
