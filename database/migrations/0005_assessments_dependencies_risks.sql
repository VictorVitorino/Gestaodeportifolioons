create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas(id),
  criticidade text,
  impacto text,
  alinhamento_estrategico text,
  requisito_regulatorio_institucional text,
  capacidade text,
  dependencias_resumo text,
  riscos_resumo text,
  trl text,
  observacoes text,
  registrado_por uuid,
  registrado_em timestamptz not null default now()
);

create table if not exists public.dependencias (
  id uuid primary key default gen_random_uuid(),
  iniciativa_origem_id uuid not null references public.iniciativas(id),
  iniciativa_dependencia_id uuid references public.iniciativas(id),
  comunidade_dependencia_id uuid references public.comunidades(id),
  descricao text not null,
  impacto text,
  responsavel text,
  status text,
  data_esperada date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (iniciativa_dependencia_id is null or iniciativa_dependencia_id <> iniciativa_origem_id)
);

create table if not exists public.riscos_impedimentos (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid not null references public.iniciativas(id),
  descricao text not null,
  impacto text,
  responsavel text,
  acao text,
  status text,
  prazo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avaliacoes_iniciativa on public.avaliacoes(iniciativa_id, registrado_em desc);
create index if not exists idx_dependencias_origem on public.dependencias(iniciativa_origem_id);
create index if not exists idx_riscos_iniciativa on public.riscos_impedimentos(iniciativa_id);

create trigger trg_dependencias_updated_at before update on public.dependencias for each row execute function public.set_updated_at();
create trigger trg_riscos_updated_at before update on public.riscos_impedimentos for each row execute function public.set_updated_at();
