update public.products
set description = replace(description, 'Garrafa de vidro de', 'Garrafa de')
where description ilike '%garrafa de vidro%';
