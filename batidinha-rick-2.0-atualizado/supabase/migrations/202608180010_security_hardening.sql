-- Endurecimento das leituras públicas e índices da operação.
drop policy if exists "public reads active categories" on public.categories;
create policy "public reads active categories" on public.categories
  for select to anon, authenticated
  using (
    public.is_store_member(store_id)
    or (
      active = true
      and exists (select 1 from public.stores s where s.id = store_id and s.active = true)
    )
  );

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated
  using (
    public.is_store_member(store_id)
    or (
      active = true
      and exists (select 1 from public.stores s where s.id = store_id and s.active = true)
      and (
        category_id is null
        or exists (select 1 from public.categories c where c.id = category_id and c.store_id = store_id and c.active = true)
      )
    )
  );

drop policy if exists "members update store orders" on public.orders;
create policy "members update store orders" on public.orders
  for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create index if not exists orders_store_created_idx on public.orders (store_id, created_at desc);
create index if not exists orders_store_status_idx on public.orders (store_id, status, created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists delivery_zones_store_active_idx on public.delivery_zones (store_id, active, neighborhood);
