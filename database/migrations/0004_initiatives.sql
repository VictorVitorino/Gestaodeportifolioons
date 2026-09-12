create table if not exists public.iniciativas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao_objetivo text not null,
  gerencia_id uuid not null references public.gerencias(id),
  comunidade_id uuid not null references public.comunidades(id),
  squad_id uuid references public.squads(id),
  ferramenta_id uuid references public.ferramentas(id),
  area_cliente_origem text,
  responsavel text not null,
  horizonte_prazo date,
  status_id uuid references public.status_configuracao(id),
  criticidade text,
  impacto text,
  trl_esperado text,
  link_operacional text,
  data_planejada date,
  data_prevista_atual date,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_iniciativas_gerencia on public.iniciativas(gerencia_id);
create index if not exists idx_iniciativas_comunidade on public.iniciativas(comunidade_id);
create index if not exists idx_iniciativas_squad on public.iniciativas(squad_id);
create index if not exists idx_iniciativas_status on public.iniciativas(status_id);
create index if not exists idx_iniciativas_data_prevista on public.iniciativas(data_prevista_atual);

create trigger trg_iniciativas_updated_at before update on public.iniciativas for each row execute function public.set_updated_at();
