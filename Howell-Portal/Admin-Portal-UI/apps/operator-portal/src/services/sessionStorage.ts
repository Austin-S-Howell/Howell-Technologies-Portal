import type { OperatorSession } from "../types";

const OPERATOR_SESSION_KEY = "ht.operatorPortal.operatorSession.v1";

let currentSession: OperatorSession | null = null;

function getBrowserSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isOperatorSession(value: unknown): value is OperatorSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.role === "string"
  );
}

export function readSession() {
  if (currentSession) {
    return currentSession;
  }

  const storage = getBrowserSessionStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(OPERATOR_SESSION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isOperatorSession(parsed)) {
      storage.removeItem(OPERATOR_SESSION_KEY);
      return null;
    }

    currentSession = parsed;
    return parsed;
  } catch {
    storage.removeItem(OPERATOR_SESSION_KEY);
    return null;
  }
}

export function writeSession(session: OperatorSession) {
  currentSession = session;

  const storage = getBrowserSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(OPERATOR_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage failures and keep the in-memory session.
  }
}

export function clearSession() {
  currentSession = null;

  const storage = getBrowserSessionStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(OPERATOR_SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
}
