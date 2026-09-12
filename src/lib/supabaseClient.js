import { createClient } from '@supabase/supabase-js';
import { assertSupabaseEnv } from '../config/env.js';

export function createSupabaseClient(env) {
  const cfg = assertSupabaseEnv(env);
  return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}
