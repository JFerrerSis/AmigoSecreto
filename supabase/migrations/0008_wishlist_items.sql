-- ============================================================
-- Wishlist avanzada: ítems estructurados por participante
-- ============================================================

begin;

create table if not exists public.group_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  url text,
  price numeric(12, 2),
  notes text,
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_wishlist_items_title_length
    check (char_length(btrim(title)) between 1 and 120),
  constraint group_wishlist_items_url_length
    check (url is null or char_length(url) <= 500),
  constraint group_wishlist_items_notes_length
    check (notes is null or char_length(notes) <= 500),
  constraint group_wishlist_items_price_nonnegative
    check (price is null or price >= 0),
  constraint group_wishlist_items_priority_check
    check (priority in ('low', 'medium', 'high'))
);

create index if not exists group_wishlist_items_group_user_idx
  on public.group_wishlist_items (group_id, user_id, created_at);

alter table public.group_wishlist_items enable row level security;

revoke all on public.group_wishlist_items from anon, authenticated;

grant all
  on public.group_wishlist_items
  to service_role;

commit;
