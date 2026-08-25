-- Corrige a configuração comercial necessária ao cardápio online.
alter table public.stores
  add column if not exists accepting_orders boolean not null default true,
  add column if not exists whatsapp text not null default '',
  add column if not exists minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
  add column if not exists updated_at timestamptz not null default now();

drop policy if exists "members update stores" on public.stores;
create policy "members update stores" on public.stores
  for update to authenticated
  using (public.is_store_member(id))
  with check (public.is_store_member(id));

update public.stores
set accepting_orders = true,
    whatsapp = '31985011514',
    minimum_order = 0,
    updated_at = now()
where id = '10000000-0000-4000-8000-000000000001';
