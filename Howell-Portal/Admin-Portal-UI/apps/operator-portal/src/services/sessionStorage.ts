import type { OperatorSession } from "../types";

let currentSession: OperatorSession | null = null;

export function readSession() {
  return currentSession;
}

export function writeSession(session: OperatorSession) {
  currentSession = session;
}

export function clearSession() {
  currentSession = null;
}
