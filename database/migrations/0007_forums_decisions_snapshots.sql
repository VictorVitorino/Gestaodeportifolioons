create table if not exists public.foruns (
  id uuid primary key default gen_random_uuid(),
  tipo_forum text not null,
  periodo_referencia text,
  data_corte date,
  status_preparacao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisoes (
  id uuid primary key default gen_random_uuid(),
  iniciativa_id uuid references public.iniciativas(id),
  forum_id uuid references public.foruns(id),
  tipo_rito_forum text,
  decisao text not null,
  justificativa text,
  responsavel text not null,
  decidido_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.snapshots_forum (
  id uuid primary key default gen_random_uuid(),
  forum_id uuid not null references public.foruns(id),
  gerado_em timestamptz not null default now(),
  versao integer not null,
  status text not null default 'ABERTO',
  indicadores_json jsonb not null default '{}'::jsonb,
  iniciativas_json jsonb not null default '[]'::jsonb,
  decisoes_pendentes_json jsonb not null default '[]'::jsonb,
  filtros_json jsonb not null default '{}'::jsonb,
  hash_conteudo text,
  unique (forum_id, versao)
);

create index if not exists idx_decisoes_iniciativa on public.decisoes(iniciativa_id, decidido_em desc);
create index if not exists idx_snapshots_forum on public.snapshots_forum(forum_id, versao desc);
create trigger trg_foruns_updated_at before update on public.foruns for each row execute function public.set_updated_at();
