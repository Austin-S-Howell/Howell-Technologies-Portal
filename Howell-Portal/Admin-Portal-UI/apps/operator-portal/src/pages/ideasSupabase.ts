import type { IdeasBoardState } from "./ideasStorage";
import { EMPTY_IDEAS_BOARD_STATE, sanitizeIdeasBoardState } from "./ideasStorage";
import { getSupabaseClient, getSupabaseConfig } from "../services/supabaseClient";

export type IdeasBoardScope = "private" | "shared";

function normalizeUserEmail(value: string) {
  return value.trim().toLowerCase();
}

function resolveIdeasUsername(scope: IdeasBoardScope, userEmail: string, sharedIdeasUsername: string) {
  if (scope === "shared") {
    return normalizeUserEmail(sharedIdeasUsername);
  }

  const normalizedEmail = normalizeUserEmail(userEmail);
  return normalizedEmail;
}

function parseIdeasPayload(rawIdeas: unknown) {
  if (typeof rawIdeas === "string") {
    try {
      return JSON.parse(rawIdeas);
    } catch {
      return EMPTY_IDEAS_BOARD_STATE;
    }
  }

  return rawIdeas;
}

export function isSupabaseIdeasEnabled() {
  return Boolean(getSupabaseClient());
}

export async function loadIdeasBoardFromSupabase(scope: IdeasBoardScope, userEmail: string): Promise<IdeasBoardState | null> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config) {
    return null;
  }

  const targetUsername = resolveIdeasUsername(scope, userEmail, config.sharedIdeasUsername);
  if (!targetUsername) {
    return EMPTY_IDEAS_BOARD_STATE;
  }

  const { data: rawData, error } = await client
    .from(config.authTable)
    .select("*")
    .eq(config.authUsernameColumn, targetUsername)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load ideas board from Supabase.");
  }

  const data = rawData as Record<string, unknown> | null;
  if (!data) {
    return EMPTY_IDEAS_BOARD_STATE;
  }

  return sanitizeIdeasBoardState(parseIdeasPayload(data[config.ideasColumn]));
}

export async function saveIdeasBoardToSupabase(
  scope: IdeasBoardScope,
  userEmail: string,
  state: IdeasBoardState,
): Promise<void> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config) {
    return;
  }

  const targetUsername = resolveIdeasUsername(scope, userEmail, config.sharedIdeasUsername);
  if (!targetUsername) {
    return;
  }

  const { data, error } = await client
    .from(config.authTable)
    .update({
      [config.ideasColumn]: state,
    })
    .eq(config.authUsernameColumn, targetUsername)
    .select(config.authUsernameColumn)
    .limit(1);

  if (error) {
    throw new Error(error.message || "Unable to save ideas board to Supabase.");
  }

  if (!data || data.length === 0) {
    throw new Error(`Ideas row not found for ${scope === "shared" ? "shared" : "private"} board user.`);
  }
}
