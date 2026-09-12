create table if not exists public.historico (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid not null,
  campo_alterado text,
  valor_anterior jsonb,
  valor_novo jsonb,
  usuario_id uuid,
  alterado_em timestamptz not null default now(),
  origem_alteracao text
);

create index if not exists idx_historico_entidade on public.historico(entidade, entidade_id, alterado_em desc);

create or replace function public.audit_simple_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.historico(entidade, entidade_id, valor_anterior, valor_novo, usuario_id, origem_alteracao)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    auth.uid(),
    'DATABASE_TRIGGER'
  );
  return coalesce(new, old);
end;
$$;

-- Triggers de auditoria mais detalhados serão adicionados apenas onde não for necessário
-- contexto funcional/justificativa, que deve ser registrado pela camada de serviço.
