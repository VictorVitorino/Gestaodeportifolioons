create or replace function public.validate_initiative_hierarchy(
  p_gerencia_id uuid,
  p_comunidade_id uuid,
  p_squad_id uuid default null
)
returns boolean
language plpgsql
stable
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select exists (
    select 1 from public.comunidades c
    where c.id = p_comunidade_id
      and c.gerencia_id = p_gerencia_id
      and c.ativo = true
  ) into v_ok;

  if not v_ok then
    return false;
  end if;

  if p_squad_id is not null then
    select exists (
      select 1 from public.squads s
      where s.id = p_squad_id
        and s.comunidade_id = p_comunidade_id
        and s.ativo = true
    ) into v_ok;
  end if;

  return coalesce(v_ok, false);
end;
$$;

create or replace function public.protect_closed_snapshot()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'FECHADO' then
    raise exception 'SNAPSHOT_LOCKED';
  end if;
  return new;
end;
$$;

create trigger trg_protect_closed_snapshot
before update or delete on public.snapshots_forum
for each row execute function public.protect_closed_snapshot();

create or replace function public.archive_initiative(p_iniciativa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_action('initiative.archive') then
    raise exception 'FORBIDDEN';
  end if;

  update public.iniciativas
     set ativo = false,
         updated_at = now()
   where id = p_iniciativa_id;
end;
$$;
