alter table public.trips
add column if not exists budget_amount bigint;

alter table public.trips
drop constraint if exists trips_budget_amount_positive;

alter table public.trips
add constraint trips_budget_amount_positive
check (budget_amount is null or budget_amount > 0);
