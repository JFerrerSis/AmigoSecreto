-- ============================================================
-- Permite códigos de moneda de 3 a 8 letras, incluido USDT.
-- La lista válida se controla en la aplicación.
-- ============================================================

begin;

alter table public.groups
  drop constraint if exists groups_currency_check;

alter table public.groups
  add constraint groups_currency_check
  check (currency ~ '^[A-Z]{3,8}$');

commit;
