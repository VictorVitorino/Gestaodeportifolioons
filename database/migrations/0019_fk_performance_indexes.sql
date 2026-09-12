-- Índices de suporte às FKs identificadas pelo Supabase Performance Advisor.
create index if not exists idx_decisoes_forum_id on public.decisoes(forum_id);
create index if not exists idx_dependencias_comunidade_dependencia_id on public.dependencias(comunidade_dependencia_id);
create index if not exists idx_dependencias_iniciativa_dependencia_id on public.dependencias(iniciativa_dependencia_id);
create index if not exists idx_ferramentas_comunidade_id on public.ferramentas(comunidade_id);
create index if not exists idx_iniciativas_ferramenta_id on public.iniciativas(ferramenta_id);
create index if not exists idx_perfil_acoes_acao_id on public.perfil_acoes(acao_id);
create index if not exists idx_usuarios_perfis_comunidade_id on public.usuarios_perfis(comunidade_id);
create index if not exists idx_usuarios_perfis_gerencia_id on public.usuarios_perfis(gerencia_id);
create index if not exists idx_usuarios_perfis_perfil_id on public.usuarios_perfis(perfil_id);
