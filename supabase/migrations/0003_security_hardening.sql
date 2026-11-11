-- ============================================================
-- Endurecimiento de integridad
-- Bloquea cambios sobre columnas que definen identidad,
-- pertenencia y resultados ya persistidos.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Grupos
-- ------------------------------------------------------------
create or replace function public.prevent_group_immutable_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.creator_id <> old.creator_id
     or new.invite_code <> old.invite_code
     or new.created_at <> old.created_at then
    raise exception 'IMMUTABLE_GROUP_FIELD';
  end if;

  if old.status = 'completed' then
    if new.status <> 'completed' then
      raise exception 'GROUP_ALREADY_COMPLETED';
    end if;

    if new.completed_at is distinct from old.completed_at
       or new.name is distinct from old.name
       or new.min_budget is distinct from old.min_budget
       or new.max_budget is distinct from old.max_budget
       or new.currency is distinct from old.currency
       or new.max_participants is distinct from old.max_participants
       or new.draw_at is distinct from old.draw_at
       or new.send_emails is distinct from old.send_emails then
      raise exception 'GROUP_ALREADY_COMPLETED';
    end if;
  end if;

  if new.status = 'completed' and new.completed_at is null then
    raise exception 'COMPLETED_AT_REQUIRED';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_groups_immutable on public.groups;

create trigger trg_groups_immutable
before update on public.groups
for each row execute function public.prevent_group_immutable_changes();

-- ------------------------------------------------------------
-- Participantes
-- ------------------------------------------------------------
create or replace function public.prevent_member_immutable_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.group_id <> old.group_id
     or new.user_id <> old.user_id
     or new.joined_at <> old.joined_at then
    raise exception 'IMMUTABLE_MEMBER_FIELD';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_members_immutable on public.group_members;

create trigger trg_members_immutable
before update on public.group_members
for each row execute function public.prevent_member_immutable_changes();

-- ------------------------------------------------------------
-- Exclusiones
-- ------------------------------------------------------------
create or replace function public.prevent_exclusion_immutable_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.group_id <> old.group_id
     or new.user_id_1 <> old.user_id_1
     or new.user_id_2 <> old.user_id_2
     or new.created_at <> old.created_at then
    raise exception 'IMMUTABLE_EXCLUSION_FIELD';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_exclusions_immutable on public.exclusions;

create trigger trg_exclusions_immutable
before update on public.exclusions
for each row execute function public.prevent_exclusion_immutable_changes();

-- ------------------------------------------------------------
-- Resultados del sorteo
-- ------------------------------------------------------------
create or replace function public.prevent_draw_result_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'IMMUTABLE_DRAW_RESULT';
end;
$$;

drop trigger if exists trg_draw_results_immutable on public.draw_results;

create trigger trg_draw_results_immutable
before update on public.draw_results
for each row execute function public.prevent_draw_result_changes();

-- ------------------------------------------------------------
-- Identidades
-- ------------------------------------------------------------
create or replace function public.prevent_user_immutable_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.created_at <> old.created_at
     or new.email is distinct from old.email then
    raise exception 'IMMUTABLE_USER_FIELD';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_users_immutable on public.users;

create trigger trg_users_immutable
before update on public.users
for each row execute function public.prevent_user_immutable_changes();

-- ------------------------------------------------------------
-- Historial de correos
-- ------------------------------------------------------------
create or replace function public.prevent_email_delivery_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'IMMUTABLE_EMAIL_DELIVERY';
end;
$$;

drop trigger if exists trg_email_deliveries_immutable on public.email_deliveries;

create trigger trg_email_deliveries_immutable
before update on public.email_deliveries
for each row execute function public.prevent_email_delivery_changes();

commit;
