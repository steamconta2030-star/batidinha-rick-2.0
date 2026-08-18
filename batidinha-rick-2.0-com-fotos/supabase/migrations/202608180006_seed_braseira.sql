-- Dados iniciais da Batidinha do Rick. Seguro para executar mais de uma vez.
insert into public.stores (id, name, slug, active)
values ('10000000-0000-4000-8000-000000000001', 'Batidinha do Rick', 'batidinha-rick', true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, active = excluded.active;

insert into public.categories (id, store_id, name, position, active) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Batidinhas', 1, true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Combos', 2, true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Adicionais', 3, true)
on conflict (id) do update set name = excluded.name, position = excluded.position, active = excluded.active;

insert into public.products (id, store_id, category_id, name, description, price, image_path, position, active) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Batidinha de Morango', 'Cremosa, gelada e preparada na hora. Garrafa de 300 ml.', 15, 'images/batidinha-morango.webp', 1, true),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Batidinha de Maracujá', 'Cremosa com o azedinho do maracujá. Garrafa de 300 ml.', 15, 'images/batidinha-maracuja.webp', 2, true),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Batidinha de Paçoca', 'Cremosa, refrescante e preparada com paçoca selecionada. Garrafa de 300 ml.', 15, 'images/batidinha-pacoca.webp', 3, true),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Combo Dupla do Rick', 'Duas batidinhas de 300 ml com sabores à escolha.', 28, 'images/batidinha-morango.webp', 4, true)
on conflict (id) do update set category_id = excluded.category_id, name = excluded.name, description = excluded.description,
  price = excluded.price, image_path = excluded.image_path, position = excluded.position, active = excluded.active;

insert into public.pizza_sizes (id, store_id, name, slices, max_flavors, base_price, position, active) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Individual 300 ml', 1, 1, 15, 1, true),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Dupla 600 ml', 2, 2, 28, 2, true),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Trio 900 ml', 3, 3, 41, 3, true),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Família 1,2 L', 4, 3, 54, 4, true)
on conflict (id) do update set name = excluded.name, slices = excluded.slices, max_flavors = excluded.max_flavors,
  base_price = excluded.base_price, position = excluded.position, active = excluded.active;

insert into public.pizza_flavors (id, store_id, name, ingredients, position, active) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Morango', 'Doce, cremosa e gelada', 1, true),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Maracujá', 'Cremosa com o azedinho da fruta', 2, true),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Açaí', 'Em breve no cardápio', 3, false),
  ('50000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Morango com maracujá', 'Combinação dos dois sabores', 4, true)
  ,('50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Paçoca', 'Cremosa e preparada com paçoca selecionada', 5, true)
on conflict (id) do update set name = excluded.name, ingredients = excluded.ingredients,
  position = excluded.position, active = excluded.active;

insert into public.pizza_flavor_prices (flavor_id, size_id, price) values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 15),
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', 28),
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 41),
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000004', 54),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 15),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', 28),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000003', 41),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', 54),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001', 15),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000002', 28),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 41),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004', 54),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000001', 15),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002', 28),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000003', 41),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', 54)
  ,('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000001', 15)
  ,('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002', 28)
  ,('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000003', 41)
  ,('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000004', 54)
on conflict (flavor_id, size_id) do update set price = excluded.price;

insert into public.pizza_options (id, store_id, type, name, price, position, active) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'crust', 'Receita tradicional', 0, 1, true),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'crust', 'Menos doce', 0, 2, true),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'crust', 'Extra gelada', 0, 3, true),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'crust', 'Cremosa extra', 2, 4, true),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'extra', 'Leite condensado', 2, 1, true),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'extra', 'Granola', 2, 2, true),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'extra', 'Fruta extra', 3, 3, true)
on conflict (id) do update set type = excluded.type, name = excluded.name, price = excluded.price,
  position = excluded.position, active = excluded.active;

insert into public.delivery_zones (id, store_id, neighborhood, fee, eta_minutes, active) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Centro', 0, 35, true),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Veneza', 0, 35, true),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Caravelas', 5, 45, true),
  ('70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Cidade Nova', 2, 50, true),
  ('70000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Planalto', 0, 40, true),
  ('70000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Parque das Águas', 0, 40, true)
on conflict (id) do update set neighborhood = excluded.neighborhood, fee = excluded.fee,
  eta_minutes = excluded.eta_minutes, active = excluded.active;

insert into public.couriers (id, store_id, name, phone, vehicle, active)
values ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Entregador 1', '', 'Moto', true)
on conflict (id) do update set name = excluded.name, phone = excluded.phone, vehicle = excluded.vehicle, active = excluded.active;
