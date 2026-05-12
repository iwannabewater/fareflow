create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  destination text not null check (char_length(destination) between 1 and 80),
  base_currency text not null check (char_length(base_currency) = 3),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  constraint trips_end_after_start check (end_date is null or end_date >= start_date),
  constraint trips_user_client_unique unique (user_id, client_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  currency text not null check (char_length(currency) = 3),
  base_amount bigint not null check (base_amount > 0),
  base_currency text not null check (char_length(base_currency) = 3),
  exchange_rate numeric(20, 8) not null check (exchange_rate > 0),
  exchange_rate_at timestamptz not null,
  exchange_rate_source text not null check (exchange_rate_source in ('identity', 'manual')),
  category text not null check (category in ('food', 'transport', 'lodging', 'sights', 'shopping', 'health', 'other')),
  note text,
  receipt_url text,
  expense_date date not null,
  created_at timestamptz not null default now(),
  constraint expenses_user_client_unique unique (user_id, client_id)
);

create index if not exists trips_user_created_at_idx on public.trips (user_id, created_at desc);
create index if not exists expenses_trip_expense_date_idx on public.expenses (trip_id, expense_date desc);
create index if not exists expenses_user_created_at_idx on public.expenses (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.trips enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Users can read their trips" on public.trips;
create policy "Users can read their trips"
on public.trips for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert their trips" on public.trips;
create policy "Users can insert their trips"
on public.trips for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update their trips" on public.trips;
create policy "Users can update their trips"
on public.trips for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their trips" on public.trips;
create policy "Users can delete their trips"
on public.trips for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can read their expenses" on public.expenses;
create policy "Users can read their expenses"
on public.expenses for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can insert expenses for their trips" on public.expenses;
create policy "Users can insert expenses for their trips"
on public.expenses for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trips
    where trips.id = expenses.trip_id
      and trips.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update their expenses" on public.expenses;
create policy "Users can update their expenses"
on public.expenses for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their expenses" on public.expenses;
create policy "Users can delete their expenses"
on public.expenses for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can read their receipt files" on storage.objects;
create policy "Users can read their receipt files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload receipt files" on storage.objects;
create policy "Users can upload receipt files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their receipt files" on storage.objects;
create policy "Users can update their receipt files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their receipt files" on storage.objects;
create policy "Users can delete their receipt files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
