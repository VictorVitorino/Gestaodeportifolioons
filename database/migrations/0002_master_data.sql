create table if not exists public.gerencias (
  id uuid primary key default gen_random_uuid(),
  sigla text not null unique,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comunidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('ENTREGA','TECNICA')),
  gerencia_id uuid not null references public.gerencias(id),
  lider text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gerencia_id, nome)
);

create table if not exists public.squads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  comunidade_id uuid not null references public.comunidades(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comunidade_id, nome)
);

create table if not exists public.ferramentas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  comunidade_id uuid references public.comunidades(id),
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_gerencias_updated_at before update on public.gerencias for each row execute function public.set_updated_at();
create trigger trg_comunidades_updated_at before update on public.comunidades for each row execute function public.set_updated_at();
create trigger trg_squads_updated_at before update on public.squads for each row execute function public.set_updated_at();
create trigger trg_ferramentas_updated_at before update on public.ferramentas for each row execute function public.set_updated_at();
