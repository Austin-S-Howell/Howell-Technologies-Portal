import type { OperatorSession } from "../types";
import { clearSession, readSession, writeSession } from "./sessionStorage";
import { isSupabaseOperatorAuthEnabled, loginWithSupabaseOperator } from "./supabaseOperatorAuth";

const isStaticFrontendOnly = (import.meta.env.VITE_STATIC_FE_ONLY as string | undefined) !== "false";
const baseUrl = (import.meta.env.VITE_POC_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:8000";

interface OperatorSessionPayload {
  isAuthenticated?: boolean;
  session?: OperatorSession | null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "";
    try {
      const data = (await response.json()) as { detail?: string };
      message = data.detail ?? "";
    } catch {
      message = await response.text();
    }
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  if (isSupabaseOperatorAuthEnabled()) {
    const session = await loginWithSupabaseOperator(email, password);
    if (!session) {
      throw new Error("Login failed: Incorrect username/password combo.");
    }
    writeSession(session);
    return session;
  }

  if (!isStaticFrontendOnly) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/operator/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password,
        }),
      });
      const session = await parseResponse<OperatorSession>(response);
      writeSession(session);
      return session;
    } catch (error) {
      throw error;
    }
  }

  throw new Error("Operator login is not configured.");
}

export async function getSession() {
  const current = readSession();
  if (current) {
    return current;
  }

  if (isSupabaseOperatorAuthEnabled()) {
    return readSession();
  }

  if (isStaticFrontendOnly) {
    return readSession();
  }

  try {
    const response = await fetch(`${baseUrl}/api/auth/operator/session`, {
      method: "GET",
      credentials: "include",
    });
    const payload = await parseResponse<OperatorSessionPayload>(response);
    if (!payload.isAuthenticated || !payload.session) {
      clearSession();
      return null;
    }
    writeSession(payload.session);
    return payload.session;
  } catch {
    clearSession();
    return null;
  }
}

export async function logout() {
  clearSession();
  if (!isStaticFrontendOnly && !isSupabaseOperatorAuthEnabled()) {
    await fetch(`${baseUrl}/api/auth/operator/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
  }
}
