create table if not exists public.capacidades (
  id uuid primary key default gen_random_uuid(),
  periodo date not null,
  nivel_organizacional text not null,
  referencia_id uuid not null,
  capacidade_disponivel numeric,
  unidade text,
  fonte text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.demandas_capacidade (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas(id),
  periodo date not null,
  capacidade_requerida numeric,
  unidade text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas(id),
  periodo date not null,
  orcamento_planejado numeric,
  previsao numeric,
  realizado numeric,
  fonte text,
  data_referencia date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_capacidades_periodo on public.capacidades(periodo, nivel_organizacional);
create index if not exists idx_demanda_capacidade_iniciativa_periodo on public.demandas_capacidade(iniciativa_id, periodo);
create index if not exists idx_financeiro_iniciativa_periodo on public.financeiro(iniciativa_id, periodo);

create trigger trg_capacidades_updated_at before update on public.capacidades for each row execute function public.set_updated_at();
create trigger trg_demandas_capacidade_updated_at before update on public.demandas_capacidade for each row execute function public.set_updated_at();
create trigger trg_financeiro_updated_at before update on public.financeiro for each row execute function public.set_updated_at();
