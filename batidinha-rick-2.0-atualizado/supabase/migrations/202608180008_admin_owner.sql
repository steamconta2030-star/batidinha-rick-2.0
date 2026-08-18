do $$
declare
  admin_user_id uuid;
begin
  select id into admin_user_id
  from auth.users
  where lower(email) = lower('maicokot@gmail.com')
  limit 1;

  if admin_user_id is null then
    raise exception 'Usuário administrativo não encontrado.';
  end if;

  insert into public.store_members (store_id, user_id, role)
  values ('10000000-0000-4000-8000-000000000001', admin_user_id, 'owner')
  on conflict (store_id, user_id) do update set role = excluded.role;
end;
$$;
