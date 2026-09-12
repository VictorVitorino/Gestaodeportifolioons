// Copie para app-config.js no ambiente de desenvolvimento.
// A publishable key do Supabase é apropriada para o browser quando RLS está corretamente configurada.
// Nunca coloque service_role, senha PostgreSQL ou segredo administrativo neste arquivo.
globalThis.__APP_CONFIG__ = {
  APP_ENV: 'development',
  DATA_PROVIDER: 'supabase',
  SUPABASE_URL: '',
  SUPABASE_PUBLISHABLE_KEY: ''
};
