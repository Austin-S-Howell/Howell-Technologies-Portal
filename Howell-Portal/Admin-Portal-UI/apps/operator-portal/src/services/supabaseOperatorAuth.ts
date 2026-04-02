import type { OperatorSession } from "../types";
import { getSupabaseClient, getSupabaseConfig } from "./supabaseClient";

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function buildDisplayName(username: string) {
  const localPart = username.split("@", 1)[0]?.trim() ?? "";
  if (!localPart) {
    return "Portal Operator";
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function isSupabaseOperatorAuthEnabled() {
  return Boolean(getSupabaseClient());
}

export async function loginWithSupabaseOperator(username: string, password: string): Promise<OperatorSession | null> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config) {
    return null;
  }

  const normalizedUsername = normalizeUsername(username);
  const { data: rawData, error } = await client
    .from(config.authTable)
    .select("*")
    .ilike(config.authUsernameColumn, normalizedUsername)
    .eq(config.authPasswordColumn, password)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Supabase operator login failed.");
  }

  const data = rawData as Record<string, unknown> | null;
  if (!data) {
    return null;
  }

  const role = typeof data.role === "string" && data.role.trim() ? data.role.trim() : "Operator";
  const nameCandidates = [data.name, data.display_name, data.full_name];
  const resolvedName =
    nameCandidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ||
    buildDisplayName(normalizedUsername);

  return {
    id:
      typeof data.id === "string" && data.id.trim()
        ? data.id.trim()
        : normalizeUsername(String(data[config.authUsernameColumn] ?? normalizedUsername)),
    email: normalizedUsername,
    name: resolvedName,
    role,
  };
}
