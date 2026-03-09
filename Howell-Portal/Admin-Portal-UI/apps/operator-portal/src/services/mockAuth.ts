import users from "../data/users.json";
import type { OperatorCredentialRecord, OperatorSession } from "../types";
import { clearSession, readSession, writeSession } from "./sessionStorage";
import { waitForSimulatedDelay } from "./simulatedDelay";

const mockUsers = users as OperatorCredentialRecord[];
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
  if (!isStaticFrontendOnly) {
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
  }

  await waitForSimulatedDelay();

  const matchedUser = mockUsers.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password,
  );

  if (!matchedUser) {
    throw new Error("Invalid mock credentials.");
  }

  const session: OperatorSession = {
    id: matchedUser.id,
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role,
  };

  writeSession(session);
  return session;
}

export async function getSession() {
  const current = readSession();
  if (current) {
    return current;
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
  if (!isStaticFrontendOnly) {
    await fetch(`${baseUrl}/api/auth/operator/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => undefined);
  }
}

export function getMockUsers() {
  return mockUsers.map(({ password: _password, ...user }) => user);
}
