-- Hardening pós-advisor Supabase.
-- Objetivos:
-- 1) garantir que views executivas respeitem RLS do usuário;
-- 2) retirar helpers internos de autorização do schema exposto `public`;
-- 3) corrigir search_path mutável em funções técnicas;
-- 4) manter no schema público apenas RPCs de negócio intencionalmente expostas.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.has_action(action_code text)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.usuarios_perfis up
    join public.perfil_acoes pa on pa.perfil_id = up.perfil_id
    join public.acoes a on a.id = pa.acao_id
    where up.user_id = auth.uid()
      and up.ativo = true
      and (up.valid_to is null or up.valid_to > now())
      and pa.permitido = true
      and a.codigo = action_code
  );
$$;

create or replace function private.can_access_gerencia(target_gerencia uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.usuarios_perfis up
    where up.user_id = auth.uid()
      and up.ativo = true
      and (up.valid_to is null or up.valid_to > now())
      and (up.gerencia_id is null or up.gerencia_id = target_gerencia)
  );
$$;

create or replace function private.can_access_comunidade(target_comunidade uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.usuarios_perfis up
    join public.comunidades c on c.id = target_comunidade
    where up.user_id = auth.uid()
      and up.ativo = true
      and (up.valid_to is null or up.valid_to > now())
      and (up.comunidade_id is null or up.comunidade_id = target_comunidade)
      and (up.gerencia_id is null or up.gerencia_id = c.gerencia_id)
  );
$$;

revoke all on function private.has_action(text) from public, anon;
revoke all on function private.can_access_gerencia(uuid) from public, anon;
revoke all on function private.can_access_comunidade(uuid) from public, anon;
grant execute on function private.has_action(text) to authenticated;
grant execute on function private.can_access_gerencia(uuid) to authenticated;
grant execute on function private.can_access_comunidade(uuid) to authenticated;

-- Recria policies usando helpers internos fora do schema exposto pela API.
drop policy if exists iniciativas_select on public.iniciativas;
drop policy if exists iniciativas_insert on public.iniciativas;
drop policy if exists iniciativas_update on public.iniciativas;
drop policy if exists historico_select on public.historico;
drop policy if exists gerencias_select on public.gerencias;
drop policy if exists comunidades_select on public.comunidades;
drop policy if exists squads_select on public.squads;
drop policy if exists ferramentas_select on public.ferramentas;
drop policy if exists status_configuracao_select on public.status_configuracao;
drop policy if exists avaliacoes_select on public.avaliacoes;
drop policy if exists dependencias_select on public.dependencias;
drop policy if exists riscos_select on public.riscos_impedimentos;
drop policy if exists demandas_capacidade_select on public.demandas_capacidade;
drop policy if exists financeiro_select on public.financeiro;

create policy iniciativas_select on public.iniciativas
for select using (private.has_action('portfolio.read') and private.can_access_gerencia(gerencia_id));

create policy iniciativas_insert on public.iniciativas
for insert with check (private.has_action('initiative.create') and private.can_access_gerencia(gerencia_id));

create policy iniciativas_update on public.iniciativas
for update using (private.has_action('initiative.update') and private.can_access_gerencia(gerencia_id))
with check (private.has_action('initiative.update') and private.can_access_gerencia(gerencia_id));

create policy historico_select on public.historico
for select using (private.has_action('portfolio.read'));

create policy gerencias_select on public.gerencias
for select using (private.has_action('portfolio.read') and private.can_access_gerencia(id));

create policy comunidades_select on public.comunidades
for select using (private.has_action('portfolio.read') and private.can_access_gerencia(gerencia_id));

create policy squads_select on public.squads
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.comunidades c
    where c.id = squads.comunidade_id
      and private.can_access_gerencia(c.gerencia_id)
  )
);

create policy ferramentas_select on public.ferramentas
for select using (
  private.has_action('portfolio.read')
  and (comunidade_id is null or private.can_access_comunidade(comunidade_id))
);

create policy status_configuracao_select on public.status_configuracao
for select using (private.has_action('portfolio.read'));

create policy avaliacoes_select on public.avaliacoes
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = avaliacoes.iniciativa_id
      and private.can_access_gerencia(i.gerencia_id)
  )
);

create policy dependencias_select on public.dependencias
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = dependencias.iniciativa_origem_id
      and private.can_access_gerencia(i.gerencia_id)
  )
);

create policy riscos_select on public.riscos_impedimentos
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = riscos_impedimentos.iniciativa_id
      and private.can_access_gerencia(i.gerencia_id)
  )
);

create policy demandas_capacidade_select on public.demandas_capacidade
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = demandas_capacidade.iniciativa_id
      and private.can_access_gerencia(i.gerencia_id)
  )
);

create policy financeiro_select on public.financeiro
for select using (
  private.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = financeiro.iniciativa_id
      and private.can_access_gerencia(i.gerencia_id)
  )
);

-- RPC de arquivamento continua pública por ser operação funcional intencional,
-- mas usa helpers internos e valida ação + escopo.
create or replace function public.archive_initiative(p_iniciativa_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_gerencia_id uuid;
begin
  select gerencia_id into v_gerencia_id
  from public.iniciativas
  where id = p_iniciativa_id;

  if v_gerencia_id is null then
    raise exception 'REFERENCE_NOT_FOUND';
  end if;

  if not private.has_action('initiative.archive')
     or not private.can_access_gerencia(v_gerencia_id) then
    raise exception 'FORBIDDEN';
  end if;

  update public.iniciativas
     set ativo = false,
         updated_at = now()
   where id = p_iniciativa_id;
end;
$$;

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
set search_path = public, private, pg_temp
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
    and private.has_action('portfolio.read')
    and private.can_access_gerencia(i.gerencia_id);
$$;

-- Views devem executar com privilégios do invocador para respeitar RLS.
alter view public.v_portfolio_iniciativas set (security_invoker = true);
alter view public.v_dependencias_abertas set (security_invoker = true);
alter view public.v_riscos_abertos set (security_invoker = true);
alter view public.v_horizonte_datas set (security_invoker = true);

-- Search path fixo em funções técnicas.
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.bump_row_version() set search_path = public, pg_temp;
alter function public.protect_closed_snapshot() set search_path = public, pg_temp;
alter function public.enforce_initiative_hierarchy() set search_path = public, private, pg_temp;
alter function public.audit_simple_changes() set search_path = public, pg_temp;

-- Remove exposição RPC desnecessária de helpers antigos e funções técnicas.
revoke execute on all functions in schema public from public, anon;
grant execute on function public.archive_initiative(uuid) to authenticated;
grant execute on function public.get_horizonte_datas(date) to authenticated;

-- Helpers antigos deixam de ser necessários no schema público.
drop function if exists public.has_action(text);
drop function if exists public.can_access_gerencia(uuid);
drop function if exists public.can_access_comunidade(uuid);
