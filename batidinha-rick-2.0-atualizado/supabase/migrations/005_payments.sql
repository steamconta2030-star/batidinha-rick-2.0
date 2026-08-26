alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','cancelled','refunded')),
  add column if not exists payment_provider text,
  add column if not exists provider_payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_expires_at timestamptz;

create unique index if not exists orders_provider_payment_id_unique
  on public.orders (provider_payment_id)
  where provider_payment_id is not null;

create index if not exists orders_payment_status_idx
  on public.orders (store_id, payment_status, created_at desc);

comment on column public.orders.payment_status is 'Estado financeiro independente do status operacional do pedido.';
comment on column public.orders.payment_provider is 'Provedor do pagamento online, por exemplo mercado_pago.';
comment on column public.orders.provider_payment_id is 'ID da order/cobrança no provedor de pagamento.';
