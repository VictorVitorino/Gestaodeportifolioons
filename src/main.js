import { getEnv } from './config/env.js';
import { createSupabaseClient } from './lib/supabaseClient.js';

const env = getEnv();
const status = document.querySelector('#runtime-status');

async function bootstrap() {
  if (!status) return;

  if (env.dataProvider !== 'supabase') {
    status.textContent = `Ambiente: ${env.appEnv} | Provider: ${env.dataProvider}`;
    return;
  }

  try {
    const supabase = createSupabaseClient(env);
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    const authState = data.session ? 'autenticado' : 'aguardando login';
    status.textContent = `Ambiente: ${env.appEnv} | Provider: supabase | ${authState}`;

    globalThis.__PORTFOLIO_FE__ = {
      ...(globalThis.__PORTFOLIO_FE__ ?? {}),
      supabase
    };
  } catch (error) {
    console.error('Falha ao inicializar o provider Supabase.', error);
    status.textContent = `Ambiente: ${env.appEnv} | Provider: supabase | erro de configuração`;
  }
}

bootstrap();
