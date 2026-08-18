create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  neighborhood text not null, fee numeric(10,2) not null default 0 check (fee >= 0), eta_minutes integer not null default 45 check (eta_minutes > 0),
  active boolean not null default true, unique (store_id, neighborhood)
);
create table public.couriers (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  name text not null, phone text not null default '', vehicle text not null default 'Moto', active boolean not null default true
);
alter table public.orders add column courier_id uuid references public.couriers(id) on delete set null;
alter table public.delivery_zones enable row level security;
alter table public.couriers enable row level security;
create policy "public reads active delivery zones" on public.delivery_zones for select to anon, authenticated using (active = true or public.is_store_member(store_id));
create policy "members manage delivery zones" on public.delivery_zones for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
create policy "members read couriers" on public.couriers for select to authenticated using (public.is_store_member(store_id));
create policy "members manage couriers" on public.couriers for all to authenticated using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
