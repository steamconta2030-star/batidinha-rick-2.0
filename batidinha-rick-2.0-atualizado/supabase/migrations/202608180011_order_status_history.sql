create table if not exists public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history (order_id, created_at desc);

alter table public.order_status_history enable row level security;

create policy "members read order status history" on public.order_status_history
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and public.is_store_member(o.store_id)
    )
  );

create or replace function public.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history (order_id, previous_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists orders_record_status_change on public.orders;
create trigger orders_record_status_change
after update of status on public.orders
for each row execute function public.record_order_status_change();
