create table if not exists public.perfis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  ativo boolean not null default true,
  origem_regra text not null default 'A_VALIDAR_FEG',
  created_at timestamptz not null default now()
);

create table if not exists public.acoes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null
);

create table if not exists public.perfil_acoes (
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  acao_id uuid not null references public.acoes(id) on delete cascade,
  permitido boolean not null default false,
  escopo text,
  primary key (perfil_id, acao_id)
);

create table if not exists public.usuarios_perfis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  perfil_id uuid not null references public.perfis(id),
  gerencia_id uuid references public.gerencias(id),
  comunidade_id uuid references public.comunidades(id),
  ativo boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  unique(user_id, perfil_id, gerencia_id, comunidade_id)
);

create or replace function public.has_action(action_code text)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.can_access_gerencia(target_gerencia uuid)
returns boolean
language sql
stable
security definer
set search_path = public
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
