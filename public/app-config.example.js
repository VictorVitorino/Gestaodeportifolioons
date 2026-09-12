// Copie para app-config.js no ambiente de desenvolvimento e não versionar segredos.
// A anon key do Supabase pode existir no browser somente com RLS corretamente configurada.
globalThis.__APP_CONFIG__ = {
  APP_ENV: 'development',
  DATA_PROVIDER: 'local',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
