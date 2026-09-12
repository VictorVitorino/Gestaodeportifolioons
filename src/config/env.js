export function getEnv() {
  return {
    appEnv: globalThis?.process?.env?.APP_ENV ?? 'dev',
    dataProvider: globalThis?.process?.env?.DATA_PROVIDER ?? 'local',
    supabaseUrl: globalThis?.process?.env?.SUPABASE_URL ?? '',
    supabaseAnonKey: globalThis?.process?.env?.SUPABASE_ANON_KEY ?? ''
  };
}

export function assertSupabaseEnv(env = getEnv()) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('SUPABASE_ENV_MISSING');
  }
  return env;
}
