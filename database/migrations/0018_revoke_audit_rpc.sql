-- audit_simple_changes é função de trigger e não deve ser RPC do frontend.
revoke execute on function public.audit_simple_changes() from public, anon, authenticated;
