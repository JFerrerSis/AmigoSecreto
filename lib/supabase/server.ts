import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseServerConfig {
  url: string;
  anonKey: string | null;
  serviceRoleKey: string | null;
}

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) return null;

  return {
    url,
    anonKey:
      process.env.SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      null,
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.SUPABASE_SECRET_KEY?.trim() ||
      process.env.SUPABASE_SERVICE_KEY?.trim() ||
      null,
  };
}

/**
 * Cliente con privilegios de servidor (bypass de RLS).
 * Úsalo solo en API routes/server actions. Requiere una secret key.
 */
export function createSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabaseServerConfig();
  if (!config?.serviceRoleKey) return null;

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "X-Client-Info": "amigo-secreto-server" },
    },
  });
}

/**
 * Cliente con la anon/publishable key. Respeta RLS.
 * Útil para operaciones públicas o cuando migres a Supabase Auth.
 */
export function createSupabaseAnonServerClient(): SupabaseClient | null {
  const config = getSupabaseServerConfig();
  if (!config?.anonKey) return null;

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "X-Client-Info": "amigo-secreto-server-anon" },
    },
  });
}
