-- ============================================================
-- Bloqueo de reingreso por sala
-- ============================================================

begin;

create table if not exists public.group_bans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_bans_group_id_idx
  on public.group_bans (group_id);

alter table public.group_bans enable row level security;

drop policy if exists "creator_select_group_bans" on public.group_bans;
create policy "creator_select_group_bans"
on public.group_bans for select
to authenticated
using (public.is_group_creator(group_id));

drop policy if exists "creator_insert_group_bans" on public.group_bans;
create policy "creator_insert_group_bans"
on public.group_bans for insert
to authenticated
with check (public.is_group_creator(group_id));

drop policy if exists "creator_delete_group_bans" on public.group_bans;
create policy "creator_delete_group_bans"
on public.group_bans for delete
to authenticated
using (public.is_group_creator(group_id));

revoke all on public.group_bans from anon;

grant select, insert, delete
  on public.group_bans
  to authenticated;

grant all
  on public.group_bans
  to service_role;

alter table public.groups
  alter column send_emails set default false;

update public.groups
   set send_emails = false
 where send_emails is distinct from false;

commit;
