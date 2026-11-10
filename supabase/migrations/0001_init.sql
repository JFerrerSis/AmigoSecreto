-- ============================================================
-- Amigo Secreto - Supabase schema (normalizado)
-- Ejecuta este archivo en el SQL Editor de Supabase o con:
--   bun run db:migrate
--
-- Nota: si en el proyecto existen las tablas legacy creadas por
-- supabase/schema.sql (versión Clerk), elimínalas antes de correr
-- esta migración porque usaban identificadores text en lugar de uuid.
-- ============================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ------------------------------------------------------------
-- Identidades locales (sin password; sesión con cookie httpOnly)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 80),
  email citext unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Salas / grupos
-- ------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique
    check (invite_code ~ '^[A-Za-z0-9_-]{6,32}$'),
  name text not null
    check (char_length(btrim(name)) between 3 and 80),
  creator_id uuid not null references public.users(id) on delete restrict,
  min_budget numeric(12, 2) not null default 0
    check (min_budget >= 0),
  max_budget numeric(12, 2) not null
    check (max_budget >= min_budget),
  currency text not null default 'MXN'
    check (currency in ('MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'PEN', 'UYU')),
  max_participants integer not null default 20
    check (max_participants between 2 and 100),
  draw_at timestamptz,
  send_emails boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ------------------------------------------------------------
-- Participantes de cada sala
-- ------------------------------------------------------------
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  email citext,
  full_name text not null default 'Invitado',
  avatar_url text,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- ------------------------------------------------------------
-- Exclusiones (parejas que no pueden regalarse)
-- Las FKs compuestas garantizan que ambos usuarios pertenezcan
-- a la misma sala.
-- ------------------------------------------------------------
create table if not exists public.exclusions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id_1 uuid not null,
  user_id_2 uuid not null,
  created_at timestamptz not null default now(),
  check (user_id_1 <> user_id_2),
  foreign key (group_id, user_id_1)
    references public.group_members(group_id, user_id) on delete cascade,
  foreign key (group_id, user_id_2)
    references public.group_members(group_id, user_id) on delete cascade
);

-- ------------------------------------------------------------
-- Resultado del sorteo (una fila por participante)
-- ------------------------------------------------------------
create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  giver_id uuid not null,
  receiver_id uuid not null,
  created_at timestamptz not null default now(),
  check (giver_id <> receiver_id),
  unique (group_id, giver_id),
  unique (group_id, receiver_id),
  foreign key (group_id, giver_id)
    references public.group_members(group_id, user_id) on delete cascade,
  foreign key (group_id, receiver_id)
    references public.group_members(group_id, user_id) on delete cascade
);

-- ------------------------------------------------------------
-- Historial de notificaciones enviadas con Resend
-- ------------------------------------------------------------
create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  recipient_email citext not null,
  recipient_name text,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider text not null default 'resend',
  error_message text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
create index if not exists groups_creator_id_idx
  on public.groups (creator_id);

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create index if not exists exclusions_group_id_idx
  on public.exclusions (group_id);

create unique index if not exists exclusions_unique_pair_idx
  on public.exclusions (
    group_id,
    least(user_id_1, user_id_2),
    greatest(user_id_1, user_id_2)
  );

create index if not exists draw_results_group_id_idx
  on public.draw_results (group_id);

create index if not exists email_deliveries_group_id_idx
  on public.email_deliveries (group_id);

create index if not exists email_deliveries_created_at_idx
  on public.email_deliveries (created_at desc);

-- ------------------------------------------------------------
-- Helpers de autorización (para Supabase Auth / RLS)
-- ------------------------------------------------------------
create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
  );
$$;

create or replace function public.is_group_creator(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.creator_id = p_user_id
  );
$$;

revoke all on function public.is_group_member(uuid, uuid) from public, anon;
revoke all on function public.is_group_creator(uuid, uuid) from public, anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_creator(uuid, uuid) to authenticated;

-- ------------------------------------------------------------
-- Capacidad de la sala (segura ante joins concurrentes)
-- ------------------------------------------------------------
create or replace function public.enforce_group_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_count integer;
begin
  select max_participants
    into v_capacity
    from public.groups
   where id = new.group_id
     for update;

  if v_capacity is null then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  select count(*)
    into v_count
    from public.group_members
   where group_id = new.group_id;

  if v_count >= v_capacity then
    raise exception 'GROUP_FULL';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_group_capacity on public.group_members;

create trigger trg_enforce_group_capacity
before insert on public.group_members
for each row execute function public.enforce_group_capacity();

-- ------------------------------------------------------------
-- Persistencia atómica del sorteo
-- Solo el rol privilegiado del servidor puede ejecutarla.
-- ------------------------------------------------------------
create or replace function public.save_draw_results(
  p_group_id uuid,
  p_pairs jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_member_count integer;
  v_pair jsonb;
begin
  select status
    into v_status
    from public.groups
   where id = p_group_id
     for update;

  if not found then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  if v_status <> 'pending' then
    raise exception 'ALREADY_COMPLETED';
  end if;

  if jsonb_typeof(p_pairs) <> 'array'
     or jsonb_array_length(p_pairs) < 2 then
    raise exception 'INVALID_DRAW';
  end if;

  select count(*)
    into v_member_count
    from public.group_members
   where group_id = p_group_id;

  if v_member_count <> jsonb_array_length(p_pairs) then
    raise exception 'MEMBER_MISMATCH';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_pairs) as pair
    where (pair ->> 'giver_id')::uuid = (pair ->> 'receiver_id')::uuid
      or not exists (
        select 1 from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = (pair ->> 'giver_id')::uuid
      )
      or not exists (
        select 1 from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = (pair ->> 'receiver_id')::uuid
      )
      or exists (
        select 1 from public.exclusions e
        where e.group_id = p_group_id
          and (
            (e.user_id_1 = (pair ->> 'giver_id')::uuid
             and e.user_id_2 = (pair ->> 'receiver_id')::uuid)
            or
            (e.user_id_2 = (pair ->> 'giver_id')::uuid
             and e.user_id_1 = (pair ->> 'receiver_id')::uuid)
          )
      )
  ) then
    raise exception 'INVALID_ASSIGNMENT';
  end if;

  delete from public.draw_results where group_id = p_group_id;

  for v_pair in select * from jsonb_array_elements(p_pairs)
  loop
    insert into public.draw_results (group_id, giver_id, receiver_id)
    values (
      p_group_id,
      (v_pair ->> 'giver_id')::uuid,
      (v_pair ->> 'receiver_id')::uuid
    );
  end loop;

  update public.groups
     set status = 'completed',
         completed_at = now()
   where id = p_group_id;
end;
$$;

revoke all on function public.save_draw_results(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_draw_results(uuid, jsonb)
  to service_role;

-- ------------------------------------------------------------
-- Row Level Security
--
-- La app actual usa una cookie propia (no Supabase Auth) y accede
-- desde el servidor con el rol privilegiado de Postgres, por lo que
-- RLS no se evalúa en esas consultas.
--
-- Estas políticas dejan la puerta lista para una futura migración a
-- Supabase Auth: el cliente con anon key NUNCA puede leer datos
-- privados directamente; authenticated solo ve lo que le corresponde.
-- ------------------------------------------------------------
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.exclusions enable row level security;
alter table public.draw_results enable row level security;
alter table public.email_deliveries enable row level security;

-- users: cada identidad solo se ve/edita a sí misma.
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self"
on public.users for select
to authenticated
using (id = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- groups: las ven el creador y sus miembros.
drop policy if exists "groups_select_members" on public.groups;
create policy "groups_select_members"
on public.groups for select
to authenticated
using (
  creator_id = auth.uid()
  or public.is_group_member(id)
);

drop policy if exists "groups_insert_creator" on public.groups;
create policy "groups_insert_creator"
on public.groups for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "groups_update_creator" on public.groups;
create policy "groups_update_creator"
on public.groups for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "groups_delete_creator" on public.groups;
create policy "groups_delete_creator"
on public.groups for delete
to authenticated
using (creator_id = auth.uid());

-- group_members: visibles para miembros; el usuario puede unirse a sí mismo.
drop policy if exists "members_select_group_members" on public.group_members;
create policy "members_select_group_members"
on public.group_members for select
to authenticated
using (
  public.is_group_member(group_id)
  or public.is_group_creator(group_id)
);

drop policy if exists "members_insert_self" on public.group_members;
create policy "members_insert_self"
on public.group_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.status = 'pending'
  )
);

drop policy if exists "members_delete_self_or_creator" on public.group_members;
create policy "members_delete_self_or_creator"
on public.group_members for delete
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_creator(group_id)
);

-- exclusions: las leen los miembros; solo el creador las edita.
drop policy if exists "members_select_exclusions" on public.exclusions;
create policy "members_select_exclusions"
on public.exclusions for select
to authenticated
using (
  public.is_group_member(group_id)
  or public.is_group_creator(group_id)
);

drop policy if exists "creator_insert_exclusions" on public.exclusions;
create policy "creator_insert_exclusions"
on public.exclusions for insert
to authenticated
with check (
  public.is_group_creator(group_id)
  and exists (
    select 1 from public.groups g
    where g.id = group_id
      and g.status = 'pending'
  )
);

drop policy if exists "creator_delete_exclusions" on public.exclusions;
create policy "creator_delete_exclusions"
on public.exclusions for delete
to authenticated
using (public.is_group_creator(group_id));

-- draw_results: cada participante solo ve su propia asignación.
drop policy if exists "giver_select_own_result" on public.draw_results;
create policy "giver_select_own_result"
on public.draw_results for select
to authenticated
using (giver_id = auth.uid());

-- email_deliveries: solo el organizador puede consultar el historial.
drop policy if exists "creator_select_email_deliveries" on public.email_deliveries;
create policy "creator_select_email_deliveries"
on public.email_deliveries for select
to authenticated
using (public.is_group_creator(group_id));

-- ------------------------------------------------------------
-- Grants explícitos
-- ------------------------------------------------------------
revoke all on public.users, public.groups, public.group_members,
  public.exclusions, public.draw_results, public.email_deliveries
  from anon;

grant select, insert, update, delete
  on public.users, public.groups, public.group_members,
     public.exclusions, public.draw_results, public.email_deliveries
  to authenticated;

grant all
  on public.users, public.groups, public.group_members,
     public.exclusions, public.draw_results, public.email_deliveries
  to service_role;

commit;
