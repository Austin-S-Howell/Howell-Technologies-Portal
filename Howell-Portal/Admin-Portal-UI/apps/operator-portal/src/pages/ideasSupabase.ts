import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
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

function parseIdeasStateFromRow(row: Record<string, unknown> | null, ideasColumn: string) {
  return sanitizeIdeasBoardState(parseIdeasPayload(row?.[ideasColumn]));
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

  return parseIdeasStateFromRow(data, config.ideasColumn);
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

type SharedIdeasSubscriptionHandlers = {
  onState: (state: IdeasBoardState) => void;
  onSubscribed?: () => void;
  onWarning?: (message: string) => void;
  onError?: (message: string) => void;
};

export function subscribeToSharedIdeasBoard(handlers: SharedIdeasSubscriptionHandlers) {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  if (!client || !config) {
    return null;
  }

  const filter = `${config.authUsernameColumn}=eq.${normalizeUserEmail(config.sharedIdeasUsername)}`;
  const channelName = `ideas-shared-board-${config.authTable}-${normalizeUserEmail(config.sharedIdeasUsername)}`;

  const channel: RealtimeChannel = client
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: config.authTable,
        filter,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const nextRow =
          payload.new && typeof payload.new === "object" ? (payload.new as Record<string, unknown>) : null;
        handlers.onState(parseIdeasStateFromRow(nextRow, config.ideasColumn));
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        handlers.onSubscribed?.();
        return;
      }

      if (status === "CHANNEL_ERROR") {
        handlers.onError?.("Supabase live updates failed to connect for the shared board.");
        return;
      }

      if (status === "TIMED_OUT" || status === "CLOSED") {
        handlers.onWarning?.("Supabase live updates disconnected from the shared board.");
      }
    });

  return {
    unsubscribe: () => client.removeChannel(channel),
  };
}
