-- Controle de concorrência robusto por versão monotônica.

alter table public.iniciativas
  add column if not exists row_version bigint not null default 1;

create or replace function public.bump_row_version()
returns trigger
language plpgsql
as $$
begin
  new.row_version = old.row_version + 1;
  return new;
end;
$$;

drop trigger if exists trg_iniciativas_row_version on public.iniciativas;
create trigger trg_iniciativas_row_version
before update on public.iniciativas
for each row execute function public.bump_row_version();

-- row_version é utilizado para optimistic locking no Repository.
-- updated_at permanece como timestamp de auditoria, não como token de concorrência.
