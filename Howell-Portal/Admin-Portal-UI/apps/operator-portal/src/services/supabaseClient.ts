import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type OperatorPortalSupabaseConfig = {
  url: string;
  anonKey: string;
  authTable: string;
  authUsernameColumn: string;
  authPasswordColumn: string;
  ideasColumn: string;
  sharedIdeasUsername: string;
};

let supabaseClient: SupabaseClient | null | undefined;

function readConfig(): OperatorPortalSupabaseConfig | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
    authTable: (import.meta.env.VITE_SUPABASE_AUTH_TABLE as string | undefined)?.trim() || "users",
    authUsernameColumn:
      (import.meta.env.VITE_SUPABASE_AUTH_USERNAME_COLUMN as string | undefined)?.trim() || "username",
    authPasswordColumn:
      (import.meta.env.VITE_SUPABASE_AUTH_PASSWORD_COLUMN as string | undefined)?.trim() || "password",
    ideasColumn: (import.meta.env.VITE_SUPABASE_IDEAS_COLUMN as string | undefined)?.trim() || "ideas",
    sharedIdeasUsername: (import.meta.env.VITE_SUPABASE_SHARED_IDEAS_USERNAME as string | undefined)?.trim() || "shared",
  };
}

export function getSupabaseConfig() {
  return readConfig();
}

export function getSupabaseClient() {
  if (supabaseClient !== undefined) {
    return supabaseClient;
  }

  const config = readConfig();
  if (!config) {
    supabaseClient = null;
    return supabaseClient;
  }

  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return supabaseClient;
}

export function hasSupabaseClientConfig() {
  return Boolean(readConfig());
}
