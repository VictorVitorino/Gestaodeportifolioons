-- Correções de integridade identificadas na revisão arquitetural.

create or replace function public.protect_closed_snapshot()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'FECHADO' then
    raise exception 'SNAPSHOT_LOCKED';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.enforce_initiative_hierarchy()
returns trigger
language plpgsql
as $$
begin
  if not public.validate_initiative_hierarchy(new.gerencia_id, new.comunidade_id, new.squad_id) then
    raise exception 'HIERARCHY_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_initiative_hierarchy
before insert or update of gerencia_id, comunidade_id, squad_id
on public.iniciativas
for each row execute function public.enforce_initiative_hierarchy();

drop view if exists public.v_horizonte_datas;

create or replace view public.v_horizonte_datas as
select
  i.id,
  i.titulo,
  i.gerencia_id,
  i.comunidade_id,
  i.data_prevista_atual,
  i.ativo
from public.iniciativas i
where i.ativo = true;

create or replace function public.get_horizonte_datas(p_reference_date date default current_date)
returns table (
  id uuid,
  titulo text,
  gerencia_id uuid,
  comunidade_id uuid,
  data_prevista_atual date,
  horizonte text
)
language sql
stable
set search_path = public
as $$
  select
    i.id,
    i.titulo,
    i.gerencia_id,
    i.comunidade_id,
    i.data_prevista_atual,
    case
      when i.data_prevista_atual is null then 'SEM_DATA'
      when i.data_prevista_atual < p_reference_date then 'VENCIDO'
      when i.data_prevista_atual <= p_reference_date + 30 then '30_DIAS'
      when i.data_prevista_atual <= p_reference_date + 60 then '60_DIAS'
      when i.data_prevista_atual <= p_reference_date + 90 then '90_DIAS'
      else 'ACIMA_90_DIAS'
    end as horizonte
  from public.iniciativas i
  where i.ativo = true
    and public.has_action('portfolio.read')
    and public.can_access_gerencia(i.gerencia_id);
$$;

-- A data de referência pode ser a data de corte do fórum/snapshot, permitindo
-- reproduzir historicamente o mesmo resultado de 30/60/90.
