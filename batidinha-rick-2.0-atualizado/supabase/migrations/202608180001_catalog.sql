create extension if not exists pgcrypto;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'operator')),
  primary key (store_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  image_path text,
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_store_position_idx on public.categories (store_id, position);
create index products_store_category_idx on public.products (store_id, category_id, position);

create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members
    where store_id = target_store_id and user_id = auth.uid()
  );
$$;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy "public reads active stores" on public.stores
  for select to anon, authenticated using (active = true or public.is_store_member(id));

create policy "members read memberships" on public.store_members
  for select to authenticated using (user_id = auth.uid());

create policy "public reads active categories" on public.categories
  for select to anon, authenticated using (active = true or public.is_store_member(store_id));

create policy "members manage categories" on public.categories
  for all to authenticated using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy "public reads active products" on public.products
  for select to anon, authenticated using (active = true or public.is_store_member(store_id));

create policy "members manage products" on public.products
  for all to authenticated using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public reads product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

create policy "members upload product images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images' and exists (
      select 1 from public.store_members
      where user_id = auth.uid() and store_id::text = split_part(name, '/', 1)
    )
  );

create policy "members update product images" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images' and exists (
      select 1 from public.store_members
      where user_id = auth.uid() and store_id::text = split_part(name, '/', 1)
    )
  );

create policy "members delete product images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images' and exists (
      select 1 from public.store_members
      where user_id = auth.uid() and store_id::text = split_part(name, '/', 1)
    )
  );
