create table public.pizza_sizes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slices integer not null check (slices > 0),
  max_flavors integer not null default 1 check (max_flavors between 1 and 4),
  base_price numeric(10,2) not null default 0 check (base_price >= 0),
  position integer not null default 0,
  active boolean not null default true,
  unique (store_id, name)
);

create table public.pizza_flavors (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  ingredients text not null default '',
  active boolean not null default true,
  position integer not null default 0,
  unique (store_id, name)
);

create table public.pizza_flavor_prices (
  flavor_id uuid not null references public.pizza_flavors(id) on delete cascade,
  size_id uuid not null references public.pizza_sizes(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  primary key (flavor_id, size_id)
);

create table public.pizza_options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in ('crust', 'extra', 'dough')),
  name text not null,
  price numeric(10,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  position integer not null default 0,
  unique (store_id, type, name)
);

alter table public.pizza_sizes enable row level security;
alter table public.pizza_flavors enable row level security;
alter table public.pizza_flavor_prices enable row level security;
alter table public.pizza_options enable row level security;

create policy "public reads active pizza sizes" on public.pizza_sizes for select to anon, authenticated
  using (active = true or public.is_store_member(store_id));
create policy "members manage pizza sizes" on public.pizza_sizes for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "public reads active pizza flavors" on public.pizza_flavors for select to anon, authenticated
  using (active = true or public.is_store_member(store_id));
create policy "members manage pizza flavors" on public.pizza_flavors for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));

create policy "public reads pizza flavor prices" on public.pizza_flavor_prices for select to anon, authenticated
  using (exists (select 1 from public.pizza_flavors f where f.id = flavor_id and (f.active = true or public.is_store_member(f.store_id))));
create policy "members manage pizza flavor prices" on public.pizza_flavor_prices for all to authenticated
  using (exists (select 1 from public.pizza_flavors f where f.id = flavor_id and public.is_store_member(f.store_id)))
  with check (exists (select 1 from public.pizza_flavors f where f.id = flavor_id and public.is_store_member(f.store_id)));

create policy "public reads active pizza options" on public.pizza_options for select to anon, authenticated
  using (active = true or public.is_store_member(store_id));
create policy "members manage pizza options" on public.pizza_options for all to authenticated
  using (public.is_store_member(store_id)) with check (public.is_store_member(store_id));
