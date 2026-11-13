-- ============================================================
-- Acceso solo con correo y contraseña
-- ============================================================

begin;

drop index if exists public.user_credentials_google_id_idx;

alter table public.user_credentials
  drop column if exists google_id;

commit;
