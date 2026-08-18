create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  opened_by uuid references auth.users(id), opened_at timestamptz not null default now(), opening_amount numeric(10,2) not null default 0,
  closed_by uuid references auth.users(id), closed_at timestamptz, closing_amount numeric(10,2), notes text not null default ''
);
alter table public.cash_sessions enable row level security;
create policy "members read cash sessions" on public.cash_sessions for select to authenticated using (public.is_store_member(store_id));
create policy "members manage cash sessions" on public.cash_sessions for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create unique index one_open_cash_per_store on public.cash_sessions (store_id) where closed_at is null;
