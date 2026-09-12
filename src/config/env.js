function browserConfig() {
  return globalThis?.__APP_CONFIG__ ?? {};
}

function processEnv() {
  return globalThis?.process?.env ?? {};
}

export function getEnv() {
  const browser = browserConfig();
  const env = processEnv();

  return {
    appEnv: browser.APP_ENV ?? env.APP_ENV ?? 'development',
    dataProvider: browser.DATA_PROVIDER ?? env.DATA_PROVIDER ?? 'local',
    supabaseUrl: browser.SUPABASE_URL ?? env.SUPABASE_URL ?? '',
    supabaseAnonKey: browser.SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? ''
  };
}

export function assertSupabaseEnv(env = getEnv()) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('SUPABASE_ENV_MISSING');
  }
  return env;
}
