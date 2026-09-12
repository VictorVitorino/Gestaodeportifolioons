alter table public.gerencias enable row level security;
alter table public.comunidades enable row level security;
alter table public.squads enable row level security;
alter table public.ferramentas enable row level security;
alter table public.status_configuracao enable row level security;
alter table public.iniciativas enable row level security;
alter table public.avaliacoes enable row level security;
alter table public.dependencias enable row level security;
alter table public.riscos_impedimentos enable row level security;
alter table public.capacidades enable row level security;
alter table public.demandas_capacidade enable row level security;
alter table public.financeiro enable row level security;
alter table public.foruns enable row level security;
alter table public.decisoes enable row level security;
alter table public.snapshots_forum enable row level security;
alter table public.parametros_sistema enable row level security;
alter table public.historico enable row level security;
alter table public.perfis enable row level security;
alter table public.acoes enable row level security;
alter table public.perfil_acoes enable row level security;
alter table public.usuarios_perfis enable row level security;

create policy iniciativas_select on public.iniciativas
for select using (public.has_action('portfolio.read') and public.can_access_gerencia(gerencia_id));

create policy iniciativas_insert on public.iniciativas
for insert with check (public.has_action('initiative.create') and public.can_access_gerencia(gerencia_id));

create policy iniciativas_update on public.iniciativas
for update using (public.has_action('initiative.update') and public.can_access_gerencia(gerencia_id))
with check (public.has_action('initiative.update') and public.can_access_gerencia(gerencia_id));

create policy historico_select on public.historico
for select using (public.has_action('portfolio.read'));

-- As policies das demais tabelas serão refinadas com a matriz final de permissões.
-- Até lá, o acesso deve permanecer conservador e ser validado em DEV/HML.
