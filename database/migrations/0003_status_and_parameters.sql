create table if not exists public.status_configuracao (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  origem_regra text not null check (origem_regra in ('FONTE_ONS','DECISAO_FUNCIONAL_PRODUTO','A_VALIDAR_FEG')),
  status_validacao text not null default 'A_VALIDAR',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parametros_sistema (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  valor jsonb,
  tipo text,
  origem_regra text not null check (origem_regra in ('FONTE_ONS','DECISAO_FUNCIONAL_PRODUTO','A_VALIDAR_FEG')),
  status_validacao text not null default 'A_VALIDAR',
  versao integer not null default 1,
  atualizado_por uuid,
  atualizado_em timestamptz not null default now()
);

create trigger trg_status_configuracao_updated_at before update on public.status_configuracao for each row execute function public.set_updated_at();
