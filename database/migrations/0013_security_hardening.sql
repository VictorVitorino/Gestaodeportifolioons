-- Hardening identified during architecture review.

create or replace function public.can_access_comunidade(target_comunidade uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_perfis up
    join public.comunidades c on c.id = target_comunidade
    where up.user_id = auth.uid()
      and up.ativo = true
      and (up.valid_to is null or up.valid_to > now())
      and (
        up.comunidade_id is null
        or up.comunidade_id = target_comunidade
      )
      and (
        up.gerencia_id is null
        or up.gerencia_id = c.gerencia_id
      )
  );
$$;

-- Cadastros mestres: leitura apenas para usuários autenticados com portfolio.read.
create policy gerencias_select on public.gerencias
for select using (public.has_action('portfolio.read') and public.can_access_gerencia(id));

create policy comunidades_select on public.comunidades
for select using (public.has_action('portfolio.read') and public.can_access_gerencia(gerencia_id));

create policy squads_select on public.squads
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.comunidades c
    where c.id = squads.comunidade_id
      and public.can_access_gerencia(c.gerencia_id)
  )
);

create policy ferramentas_select on public.ferramentas
for select using (
  public.has_action('portfolio.read')
  and (
    comunidade_id is null
    or public.can_access_comunidade(comunidade_id)
  )
);

create policy status_configuracao_select on public.status_configuracao
for select using (public.has_action('portfolio.read'));

-- Leitura de tabelas filhas sempre deriva do escopo da iniciativa.
create policy avaliacoes_select on public.avaliacoes
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = avaliacoes.iniciativa_id
      and public.can_access_gerencia(i.gerencia_id)
  )
);

create policy dependencias_select on public.dependencias
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = dependencias.iniciativa_origem_id
      and public.can_access_gerencia(i.gerencia_id)
  )
);

create policy riscos_select on public.riscos_impedimentos
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = riscos_impedimentos.iniciativa_id
      and public.can_access_gerencia(i.gerencia_id)
  )
);

create policy demandas_capacidade_select on public.demandas_capacidade
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = demandas_capacidade.iniciativa_id
      and public.can_access_gerencia(i.gerencia_id)
  )
);

create policy financeiro_select on public.financeiro
for select using (
  public.has_action('portfolio.read')
  and exists (
    select 1 from public.iniciativas i
    where i.id = financeiro.iniciativa_id
      and public.can_access_gerencia(i.gerencia_id)
  )
);

-- Reforça arquivamento com escopo da gerência.
create or replace function public.archive_initiative(p_iniciativa_id uuid)
returns void
language plpgsql
security definer
set search_path = public
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

  if not public.has_action('initiative.archive')
     or not public.can_access_gerencia(v_gerencia_id) then
    raise exception 'FORBIDDEN';
  end if;

  update public.iniciativas
     set ativo = false,
         updated_at = now()
   where id = p_iniciativa_id;
end;
$$;

-- Nota: policies de escrita das tabelas filhas serão ativadas somente após
-- a matriz funcional de permissões ser validada. Até lá, o padrão é deny-by-default.
