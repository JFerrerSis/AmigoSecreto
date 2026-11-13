-- ============================================================
-- Credenciales de acceso: contraseña y vínculo con Google
-- ============================================================

begin;

create table if not exists public.user_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  password_hash text,
  google_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    password_hash is null
    or char_length(password_hash) between 20 and 100
  )
);

create index if not exists user_credentials_google_id_idx
  on public.user_credentials (google_id)
  where google_id is not null;

alter table public.user_credentials enable row level security;

revoke all on public.user_credentials from anon, authenticated;

grant all
  on public.user_credentials
  to service_role;

commit;
