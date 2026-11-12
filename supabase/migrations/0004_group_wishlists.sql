-- ============================================================
-- Listas de deseos personales por sala
-- Una fila por participante y sala. Visible para los miembros.
-- ============================================================

begin;

create table if not exists public.group_wishlists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id uuid not null,
  content text not null default ''
    check (char_length(content) <= 2000),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id),
  foreign key (group_id, user_id)
    references public.group_members(group_id, user_id) on delete cascade
);

create index if not exists group_wishlists_group_id_idx
  on public.group_wishlists (group_id);

alter table public.group_wishlists enable row level security;

drop policy if exists "members_select_wishlists" on public.group_wishlists;
create policy "members_select_wishlists"
on public.group_wishlists for select
to authenticated
using (
  public.is_group_member(group_id)
  or public.is_group_creator(group_id)
);

drop policy if exists "members_insert_own_wishlist" on public.group_wishlists;
create policy "members_insert_own_wishlist"
on public.group_wishlists for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
);

drop policy if exists "members_update_own_wishlist" on public.group_wishlists;
create policy "members_update_own_wishlist"
on public.group_wishlists for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public.is_group_member(group_id)
);

drop policy if exists "members_delete_own_wishlist" on public.group_wishlists;
create policy "members_delete_own_wishlist"
on public.group_wishlists for delete
to authenticated
using (user_id = auth.uid());

revoke all on public.group_wishlists from anon;

grant select, insert, update, delete
  on public.group_wishlists
  to authenticated;

grant all
  on public.group_wishlists
  to service_role;

commit;
