-- ============================================================
-- Importa los datos legacy de public.app_state (una fila JSONB)
-- a las tablas normalizadas creadas en 0001_init.sql.
--
-- Es idempotente: puedes ejecutarla varias veces sin duplicar filas.
-- No elimina app_state; consérvala como respaldo hasta validar todo.
-- ============================================================

begin;

create or replace function public.app_uuid(p_value text)
returns uuid
language sql
immutable
as $$
  select case
    when p_value is null or btrim(p_value) = '' then null
    when p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then p_value::uuid
    when p_value ~* '^[a-z]+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(p_value, '_', 2)::uuid
    else (
      substr(md5(p_value), 1, 8) || '-' ||
      substr(md5(p_value), 9, 4) || '-' ||
      substr(md5(p_value), 13, 4) || '-' ||
      substr(md5(p_value), 17, 4) || '-' ||
      substr(md5(p_value), 21, 12)
    )::uuid
  end;
$$;

do $$
declare
  v_data jsonb;
begin
  if to_regclass('public.app_state') is null then
    raise notice 'public.app_state no existe; no hay datos legacy que importar.';
    return;
  end if;

  select data into v_data
    from public.app_state
   where id = 1;

  if v_data is null then
    raise notice 'public.app_state está vacío; nada que importar.';
    return;
  end if;

  -- Usuarios
  insert into public.users (id, full_name, email, avatar_url, created_at)
  select
    public.app_uuid(u ->> 'id'),
    case
      when char_length(btrim(coalesce(u ->> 'full_name', ''))) between 2 and 80
        then btrim(u ->> 'full_name')
      else 'Invitado'
    end,
    nullif(lower(btrim(coalesce(u ->> 'email', ''))), ''),
    nullif(btrim(coalesce(u ->> 'avatar_url', '')), ''),
    coalesce(nullif(u ->> 'created_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(v_data -> 'users', '[]'::jsonb)) as u
  where public.app_uuid(u ->> 'id') is not null
  on conflict do nothing;

  -- Salas
  insert into public.groups (
    id, invite_code, name, creator_id,
    min_budget, max_budget, currency, max_participants,
    draw_at, send_emails, status, created_at, completed_at
  )
  select
    public.app_uuid(g ->> 'id'),
    case
      when coalesce(g ->> 'invite_code', '') ~ '^[A-Za-z0-9_-]{6,32}$'
        then g ->> 'invite_code'
      else 'imp-' || substr(md5(g ->> 'id'), 1, 16)
    end,
    case
      when char_length(btrim(coalesce(g ->> 'name', ''))) between 3 and 80
        then btrim(g ->> 'name')
      else 'Sala importada'
    end,
    public.app_uuid(g ->> 'creator_id'),
    coalesce(nullif(g ->> 'min_budget', '')::numeric, 0),
    greatest(
      coalesce(nullif(g ->> 'max_budget', '')::numeric, 0),
      coalesce(nullif(g ->> 'min_budget', '')::numeric, 0)
    ),
    case
      when g ->> 'currency' in ('MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'PEN', 'UYU')
        then g ->> 'currency'
      else 'MXN'
    end,
    least(greatest(coalesce(nullif(g ->> 'max_participants', '')::int, 20), 2), 100),
    nullif(g ->> 'draw_at', '')::timestamptz,
    coalesce(nullif(g ->> 'send_emails', '')::boolean, true),
    case when g ->> 'status' = 'completed' then 'completed' else 'pending' end,
    coalesce(nullif(g ->> 'created_at', '')::timestamptz, now()),
    nullif(g ->> 'completed_at', '')::timestamptz
  from jsonb_array_elements(coalesce(v_data -> 'groups', '[]'::jsonb)) as g
  where public.app_uuid(g ->> 'id') is not null
    and exists (
      select 1 from public.users u
      where u.id = public.app_uuid(g ->> 'creator_id')
    )
  on conflict do nothing;

  -- Participantes
  insert into public.group_members (
    id, group_id, user_id, email, full_name, avatar_url, joined_at
  )
  select
    public.app_uuid(m ->> 'id'),
    public.app_uuid(m ->> 'group_id'),
    public.app_uuid(m ->> 'user_id'),
    nullif(lower(btrim(coalesce(m ->> 'email', ''))), ''),
    case
      when char_length(btrim(coalesce(m ->> 'full_name', ''))) between 2 and 80
        then btrim(m ->> 'full_name')
      else 'Invitado'
    end,
    nullif(btrim(coalesce(m ->> 'avatar_url', '')), ''),
    coalesce(nullif(m ->> 'joined_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(v_data -> 'group_members', '[]'::jsonb)) as m
  where public.app_uuid(m ->> 'id') is not null
    and exists (
      select 1 from public.groups g
      where g.id = public.app_uuid(m ->> 'group_id')
    )
    and exists (
      select 1 from public.users u
      where u.id = public.app_uuid(m ->> 'user_id')
    )
  on conflict do nothing;

  -- Exclusiones
  insert into public.exclusions (
    id, group_id, user_id_1, user_id_2, created_at
  )
  select
    public.app_uuid(e ->> 'id'),
    public.app_uuid(e ->> 'group_id'),
    public.app_uuid(e ->> 'user_id_1'),
    public.app_uuid(e ->> 'user_id_2'),
    coalesce(nullif(e ->> 'created_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(v_data -> 'exclusions', '[]'::jsonb)) as e
  where public.app_uuid(e ->> 'id') is not null
    and public.app_uuid(e ->> 'user_id_1') <> public.app_uuid(e ->> 'user_id_2')
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = public.app_uuid(e ->> 'group_id')
        and gm.user_id = public.app_uuid(e ->> 'user_id_1')
    )
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = public.app_uuid(e ->> 'group_id')
        and gm.user_id = public.app_uuid(e ->> 'user_id_2')
    )
  on conflict do nothing;

  -- Resultados del sorteo
  insert into public.draw_results (
    id, group_id, giver_id, receiver_id, created_at
  )
  select
    public.app_uuid(d ->> 'id'),
    public.app_uuid(d ->> 'group_id'),
    public.app_uuid(d ->> 'giver_id'),
    public.app_uuid(d ->> 'receiver_id'),
    coalesce(nullif(d ->> 'created_at', '')::timestamptz, now())
  from jsonb_array_elements(coalesce(v_data -> 'draw_results', '[]'::jsonb)) as d
  where public.app_uuid(d ->> 'id') is not null
    and public.app_uuid(d ->> 'giver_id') <> public.app_uuid(d ->> 'receiver_id')
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = public.app_uuid(d ->> 'group_id')
        and gm.user_id = public.app_uuid(d ->> 'giver_id')
    )
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = public.app_uuid(d ->> 'group_id')
        and gm.user_id = public.app_uuid(d ->> 'receiver_id')
    )
  on conflict do nothing;

  -- Si hay resultados, la sala debe figurar como completada.
  update public.groups g
     set status = 'completed',
         completed_at = coalesce(g.completed_at, now())
   where g.status <> 'completed'
     and exists (
       select 1 from public.draw_results d
       where d.group_id = g.id
     );

  raise notice 'Importación desde app_state completada.';
end $$;

drop function if exists public.app_uuid(text);

commit;
