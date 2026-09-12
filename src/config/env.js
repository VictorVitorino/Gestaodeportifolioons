function browserConfig() {
  return globalThis?.__APP_CONFIG__ ?? {};
}

function processEnv() {
  return globalThis?.process?.env ?? {};
}

function viteEnv() {
  try {
    return import.meta.env ?? {};
  } catch {
    return {};
  }
}

export function getEnv() {
  const browser = browserConfig();
  const env = processEnv();
  const vite = viteEnv();

  return {
    appEnv:
      browser.APP_ENV ?? vite.VITE_APP_ENV ?? env.APP_ENV ?? 'development',
    dataProvider:
      browser.DATA_PROVIDER ?? vite.VITE_DATA_PROVIDER ?? env.DATA_PROVIDER ?? 'local',
    supabaseUrl:
      browser.SUPABASE_URL ?? vite.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? '',
    supabasePublishableKey:
      browser.SUPABASE_PUBLISHABLE_KEY ??
      browser.SUPABASE_ANON_KEY ??
      vite.VITE_SUPABASE_PUBLISHABLE_KEY ??
      vite.VITE_SUPABASE_ANON_KEY ??
      env.SUPABASE_PUBLISHABLE_KEY ??
      env.SUPABASE_ANON_KEY ??
      ''
  };
}

export function assertSupabaseEnv(env = getEnv()) {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error('SUPABASE_ENV_MISSING');
  }
  return env;
}
