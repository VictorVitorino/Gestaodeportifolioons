-- Segurança explícita para acesso do HTML via Supabase Client/REST.
-- O browser usa apenas SUPABASE_URL + anon key. A anon key identifica a aplicação,
-- mas dados corporativos exigem sessão autenticada e continuam sujeitos a RLS.

-- 1) Usuário anônimo não recebe acesso aos dados do schema público.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- 2) Usuários autenticados podem alcançar o schema, mas RLS decide quais linhas.
grant usage on schema public to authenticated;

-- Leitura necessária à aplicação. RLS continua filtrando por ação + escopo.
grant select on public.gerencias,
  public.comunidades,
  public.squads,
  public.ferramentas,
  public.status_configuracao,
  public.iniciativas,
  public.avaliacoes,
  public.dependencias,
  public.riscos_impedimentos,
  public.capacidades,
  public.demandas_capacidade,
  public.financeiro,
  public.foruns,
  public.decisoes,
  public.snapshots_forum,
  public.parametros_sistema,
  public.historico
  to authenticated;

-- No estágio atual, escrita pelo browser é liberada somente para iniciativas.
-- As policies de RLS ainda exigem as ações initiative.create / initiative.update.
grant insert, update on public.iniciativas to authenticated;

-- DELETE físico não faz parte do fluxo funcional do browser.
revoke delete on all tables in schema public from authenticated;

-- RPC de arquivamento é permitida apenas para sessão autenticada;
-- a própria função valida initiative.archive + escopo de gerência.
revoke all on function public.archive_initiative(uuid) from public, anon;
grant execute on function public.archive_initiative(uuid) to authenticated;

-- Helpers de RLS são necessários durante avaliação das policies, mas não constituem
-- APIs de negócio. Não expor rotinas administrativas adicionais ao browser.

-- IMPORTANTE:
-- service_role e senha do PostgreSQL nunca são enviados ao HTML.
-- Escritas nas tabelas filhas permanecem deny-by-default até a matriz de permissões
-- ser validada e novas policies/grants serem versionadas por migration.
