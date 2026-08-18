create sequence public.order_number_seq start 1;

create table public.orders (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  number bigint not null default nextval('public.order_number_seq'), customer_name text not null, phone text not null,
  delivery_type text not null check (delivery_type in ('delivery', 'pickup')), address text, payment_method text not null check (payment_method in ('pix', 'cash', 'card')),
  change_for numeric(10,2), notes text not null default '', subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0), total numeric(10,2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (store_id, number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  name text not null, detail text not null default '', quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0), created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
create policy "members read store orders" on public.orders for select to authenticated using (public.is_store_member(store_id));
create policy "members update store orders" on public.orders for update to authenticated using (public.is_store_member(store_id));
create policy "members read order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and public.is_store_member(o.store_id)));

alter publication supabase_realtime add table public.orders;
alter table public.orders replica identity full;

-- A criação pública deverá passar por uma função RPC/rota de servidor na Onda 8.
-- Não há INSERT anônimo direto: preços e taxas precisam ser recalculados no servidor.
