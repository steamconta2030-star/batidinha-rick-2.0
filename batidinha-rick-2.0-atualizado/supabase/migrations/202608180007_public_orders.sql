create or replace function public.create_public_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_store constant uuid := '10000000-0000-4000-8000-000000000001';
  new_order public.orders%rowtype;
  item jsonb;
  item_kind text;
  item_quantity integer;
  item_name text;
  item_detail text;
  item_price numeric(10,2);
  order_subtotal numeric(10,2) := 0;
  order_delivery_fee numeric(10,2) := 0;
  zone_name text := '';
  size_name text;
  size_base numeric(10,2);
  size_max_flavors integer;
  flavor_count integer;
  extra_count integer;
  crust_name text;
  crust_price numeric(10,2);
  extras_name text;
  extras_price numeric(10,2);
  store_accepting_orders boolean;
  store_minimum_order numeric(10,2);
begin
  if jsonb_typeof(payload) <> 'object' then raise exception 'Pedido inválido.'; end if;
  if octet_length(payload::text) > 20000 then raise exception 'Pedido excede o tamanho permitido.'; end if;
  select accepting_orders, minimum_order into store_accepting_orders, store_minimum_order
  from public.stores where id = target_store and active = true;
  if not found or not store_accepting_orders then raise exception 'A loja não está aceitando pedidos no momento.'; end if;
  if length(btrim(coalesce(payload->>'customer_name', ''))) not between 2 and 100 then raise exception 'Informe o nome do cliente.'; end if;
  if length(regexp_replace(coalesce(payload->>'phone', ''), '\D', '', 'g')) not between 10 and 13 then raise exception 'Informe um WhatsApp válido.'; end if;
  if coalesce(payload->>'delivery_type', '') not in ('delivery', 'pickup') then raise exception 'Forma de recebimento inválida.'; end if;
  if coalesce(payload->>'payment_method', '') not in ('pix', 'cash', 'card') then raise exception 'Forma de pagamento inválida.'; end if;
  if payload->>'payment_method' = 'cash' and nullif(payload->>'change_for', '') is not null
    and (payload->>'change_for')::numeric <= 0 then raise exception 'Valor de troco inválido.'; end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') not between 1 and 30 then raise exception 'O pedido precisa ter itens.'; end if;

  if payload->>'delivery_type' = 'delivery' then
    select fee, neighborhood into order_delivery_fee, zone_name
    from public.delivery_zones
    where id = (payload->>'delivery_zone_id')::uuid and store_id = target_store and active = true;
    if not found then raise exception 'Bairro de entrega inválido.'; end if;
    if length(btrim(coalesce(payload->>'address', ''))) < 5 then raise exception 'Informe o endereço de entrega.'; end if;
  end if;

  insert into public.orders (store_id, customer_name, phone, delivery_type, address, payment_method, change_for, notes, subtotal, delivery_fee, total)
  values (
    target_store,
    left(btrim(payload->>'customer_name'), 100),
    left(btrim(payload->>'phone'), 30),
    payload->>'delivery_type',
    case when payload->>'delivery_type' = 'delivery' then left(btrim(payload->>'address') || ' • ' || zone_name, 300) else null end,
    payload->>'payment_method',
    case when payload->>'payment_method' = 'cash' then nullif(payload->>'change_for', '')::numeric else null end,
    left(btrim(coalesce(payload->>'notes', '')), 500),
    0, order_delivery_fee, order_delivery_fee
  ) returning * into new_order;

  for item in select value from jsonb_array_elements(payload->'items') loop
    item_kind := item->>'kind';
    item_quantity := coalesce((item->>'quantity')::integer, 0);
    if item_quantity not between 1 and 20 then raise exception 'Quantidade inválida.'; end if;

    if item_kind = 'product' then
      select name, description, price into item_name, item_detail, item_price
      from public.products
      where id = (item->>'product_id')::uuid and store_id = target_store and active = true;
      if not found then raise exception 'Produto indisponível.'; end if;
    elsif item_kind = 'pizza' then
      select name, base_price, max_flavors into size_name, size_base, size_max_flavors
      from public.pizza_sizes
      where id = (item->>'size_id')::uuid and store_id = target_store and active = true;
      if not found then raise exception 'Opção de quantidade indisponível.'; end if;
      if jsonb_typeof(item->'flavor_ids') <> 'array' or jsonb_array_length(item->'flavor_ids') not between 1 and size_max_flavors then raise exception 'Quantidade de sabores inválida.'; end if;

      select count(*), greatest(size_base, coalesce(max(pfp.price), size_base)), string_agg(f.name, ' + ' order by f.position)
      into flavor_count, item_price, item_detail
      from public.pizza_flavors f
      join public.pizza_flavor_prices pfp on pfp.flavor_id = f.id and pfp.size_id = (item->>'size_id')::uuid
      where f.store_id = target_store and f.active = true
        and f.id in (select value::uuid from jsonb_array_elements_text(item->'flavor_ids'));
      if flavor_count <> jsonb_array_length(item->'flavor_ids') then raise exception 'Sabor de batidinha indisponível.'; end if;

      crust_name := null; crust_price := 0;
      if nullif(item->>'crust_id', '') is not null then
        select name, price into crust_name, crust_price from public.pizza_options
        where id = (item->>'crust_id')::uuid and store_id = target_store and type = 'crust' and active = true;
        if not found then raise exception 'Modo de preparo indisponível.'; end if;
      end if;

      extras_name := null; extras_price := 0; extra_count := 0;
      if jsonb_typeof(item->'extra_ids') = 'array' and jsonb_array_length(item->'extra_ids') > 0 then
        select count(*), coalesce(sum(price), 0), string_agg(name, ', ' order by position)
        into extra_count, extras_price, extras_name
        from public.pizza_options
        where store_id = target_store and type = 'extra' and active = true
          and id in (select value::uuid from jsonb_array_elements_text(item->'extra_ids'));
        if extra_count <> jsonb_array_length(item->'extra_ids') then raise exception 'Adicional indisponível.'; end if;
      end if;

      item_name := 'Batidinha ' || size_name;
      item_detail := item_detail || case when crust_name is not null then ' • ' || crust_name else '' end || case when extras_name is not null then ' • ' || extras_name else '' end;
      item_price := item_price + crust_price + extras_price;
    else
      raise exception 'Tipo de item inválido.';
    end if;

    insert into public.order_items (order_id, name, detail, quantity, unit_price)
    values (new_order.id, item_name, coalesce(item_detail, ''), item_quantity, item_price);
    order_subtotal := order_subtotal + item_price * item_quantity;
  end loop;

  if order_subtotal < store_minimum_order then
    raise exception 'O pedido não atingiu o valor mínimo de R$ %.', to_char(store_minimum_order, 'FM999990D00');
  end if;

  update public.orders set subtotal = order_subtotal, total = order_subtotal + order_delivery_fee, updated_at = now()
  where id = new_order.id
  returning * into new_order;

  return jsonb_build_object(
    'id', new_order.id, 'number', new_order.number, 'subtotal', new_order.subtotal,
    'delivery_fee', new_order.delivery_fee, 'total', new_order.total, 'created_at', new_order.created_at
  );
exception when others then
  raise;
end;
$$;

revoke all on function public.create_public_order(jsonb) from public;
grant execute on function public.create_public_order(jsonb) to anon, authenticated;
