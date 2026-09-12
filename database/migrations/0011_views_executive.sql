create or replace view public.v_portfolio_iniciativas as
select
  i.id,
  i.titulo,
  i.descricao_objetivo,
  g.sigla as gerencia,
  c.nome as comunidade,
  c.tipo as tipo_comunidade,
  s.nome as squad,
  f.nome as ferramenta,
  i.responsavel,
  sc.codigo as status_codigo,
  sc.nome as status_nome,
  i.data_planejada,
  i.data_prevista_atual,
  i.horizonte_prazo,
  i.criticidade,
  i.impacto,
  i.trl_esperado,
  i.link_operacional,
  i.ativo,
  i.created_at,
  i.updated_at
from public.iniciativas i
join public.gerencias g on g.id = i.gerencia_id
join public.comunidades c on c.id = i.comunidade_id
left join public.squads s on s.id = i.squad_id
left join public.ferramentas f on f.id = i.ferramenta_id
left join public.status_configuracao sc on sc.id = i.status_id;

create or replace view public.v_dependencias_abertas as
select d.*, i.titulo as iniciativa_origem_titulo
from public.dependencias d
join public.iniciativas i on i.id = d.iniciativa_origem_id
where coalesce(upper(d.status), 'ABERTA') not in ('RESOLVIDA','CONCLUIDA','FECHADA');

create or replace view public.v_riscos_abertos as
select r.*, i.titulo as iniciativa_titulo
from public.riscos_impedimentos r
join public.iniciativas i on i.id = r.iniciativa_id
where coalesce(upper(r.status), 'ABERTO') not in ('RESOLVIDO','CONCLUIDO','FECHADO');

create or replace view public.v_horizonte_datas as
select
  i.id,
  i.titulo,
  i.gerencia_id,
  i.comunidade_id,
  i.data_prevista_atual,
  case
    when i.data_prevista_atual is null then 'SEM_DATA'
    when i.data_prevista_atual < current_date then 'VENCIDO'
    when i.data_prevista_atual <= current_date + 30 then '30_DIAS'
    when i.data_prevista_atual <= current_date + 60 then '60_DIAS'
    when i.data_prevista_atual <= current_date + 90 then '90_DIAS'
    else 'ACIMA_90_DIAS'
  end as horizonte
from public.iniciativas i
where i.ativo = true;

-- Nenhuma view executiva atribui saúde, semáforo ou score sem regra formal validada.
