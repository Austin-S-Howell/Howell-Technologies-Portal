import users from "../data/users.json";
import type { OperatorCredentialRecord, OperatorSession } from "../types";
import { clearSession, readSession, writeSession } from "./sessionStorage";

const mockUsers = users as OperatorCredentialRecord[];

export async function login(email: string, password: string) {
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
  return readSession();
}

export async function logout() {
  clearSession();
}

export function getMockUsers() {
  return mockUsers.map(({ password: _password, ...user }) => user);
}
