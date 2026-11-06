-- ============================================================
-- Amigo Secreto - Supabase schema
-- Ejecuta este archivo completo en el SQL Editor de Supabase.
-- Autenticación: Clerk como proveedor de terceros en Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  name text not null check (char_length(name) between 3 and 80),
  creator_id text not null,
  min_budget numeric(12, 2) not null default 0 check (min_budget >= 0),
  max_budget numeric(12, 2) not null check (max_budget >= min_budget),
  currency text not null default 'MXN',
  max_participants integer not null default 20
    check (max_participants between 2 and 100),
  draw_at timestamptz,
  send_emails boolean not null default true,
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id text not null,
  email text,
  full_name text not null default 'Invitado',
  avatar_url text,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.exclusions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id_1 text not null,
  user_id_2 text not null,
  created_at timestamptz not null default now(),
  check (user_id_1 <> user_id_2)
);

create table if not exists public.draw_results (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  giver_id text not null,
  receiver_id text not null,
  created_at timestamptz not null default now(),
  unique (group_id, giver_id),
  unique (group_id, receiver_id),
  check (giver_id <> receiver_id)
);

create index if not exists groups_creator_id_idx
  on public.groups (creator_id);

create index if not exists group_members_group_id_idx
  on public.group_members (group_id);

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

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
create or replace function public.current_clerk_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id text default null
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
      and gm.user_id = coalesce(p_user_id, public.current_clerk_id())
  );
$$;

create or replace function public.is_group_creator(
  p_group_id uuid,
  p_user_id text default null
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
      and g.creator_id = coalesce(p_user_id, public.current_clerk_id())
  );
$$;

revoke all on function public.is_group_member(uuid, text) from public, anon;
revoke all on function public.is_group_creator(uuid, text) from public, anon;
grant execute on function public.is_group_member(uuid, text) to authenticated;
grant execute on function public.is_group_creator(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- Capacity guard (prevents overbooking even under concurrent joins)
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
-- Atomic draw persistence (service_role only)
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

  if jsonb_typeof(p_pairs) <> 'array' or jsonb_array_length(p_pairs) < 2 then
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
    where pair ->> 'giver_id' = pair ->> 'receiver_id'
      or not exists (
        select 1 from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = pair ->> 'giver_id'
      )
      or not exists (
        select 1 from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = pair ->> 'receiver_id'
      )
      or exists (
        select 1 from public.exclusions e
        where e.group_id = p_group_id
          and (
            (e.user_id_1 = pair ->> 'giver_id' and e.user_id_2 = pair ->> 'receiver_id')
            or
            (e.user_id_2 = pair ->> 'giver_id' and e.user_id_1 = pair ->> 'receiver_id')
          )
      )
  ) then
    raise exception 'INVALID_ASSIGNMENT';
  end if;

  delete from public.draw_results where group_id = p_group_id;

  for v_pair in select * from jsonb_array_elements(p_pairs)
  loop
    insert into public.draw_results (group_id, giver_id, receiver_id)
    values (p_group_id, v_pair ->> 'giver_id', v_pair ->> 'receiver_id');
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
-- ------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.exclusions enable row level security;
alter table public.draw_results enable row level security;

drop policy if exists "groups_select_members" on public.groups;
create policy "groups_select_members"
on public.groups for select
to authenticated
using (
  creator_id = public.current_clerk_id()
  or public.is_group_member(id)
);

drop policy if exists "members_select_group_members" on public.group_members;
create policy "members_select_group_members"
on public.group_members for select
to authenticated
using (
  public.is_group_member(group_id)
  or public.is_group_creator(group_id)
);

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
with check (public.is_group_creator(group_id));

drop policy if exists "creator_delete_exclusions" on public.exclusions;
create policy "creator_delete_exclusions"
on public.exclusions for delete
to authenticated
using (public.is_group_creator(group_id));

drop policy if exists "giver_select_own_result" on public.draw_results;
create policy "giver_select_own_result"
on public.draw_results for select
to authenticated
using (giver_id = public.current_clerk_id());

-- Clients never write groups, members or draw results directly.
-- The service role (API routes) bypasses RLS for those operations.

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
alter table public.group_members replica identity full;
alter table public.exclusions replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.groups;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.group_members;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.exclusions;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.draw_results;
  exception when duplicate_object then null;
  end;
end;
$$;
