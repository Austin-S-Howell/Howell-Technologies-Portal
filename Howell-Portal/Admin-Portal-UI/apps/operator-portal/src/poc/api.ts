import type { CompanyPOCConfig, MultiViewConfig } from "@howell-technologies/portal";
import type {
  AvailableReportsResponse,
  MicrosoftRuntimeConfig,
  MicrosoftRuntimeConfigInput,
  POCAuthSession,
  SavedMultiViewRecord,
  SavedPOCConfigRecord,
} from "./types";

const baseUrl = (import.meta.env.VITE_POC_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export function getMicrosoftLoginUrl() {
  return `${baseUrl}/api/auth/microsoft/login`;
}

export async function fetchMicrosoftConfig(): Promise<MicrosoftRuntimeConfig> {
  const response = await fetch(`${baseUrl}/api/auth/microsoft/config`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse<MicrosoftRuntimeConfig>(response);
}

export async function updateMicrosoftConfig(payload: MicrosoftRuntimeConfigInput): Promise<MicrosoftRuntimeConfig> {
  const response = await fetch(`${baseUrl}/api/auth/microsoft/config`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<MicrosoftRuntimeConfig>(response);
}

export async function fetchPOCAuthSession(): Promise<POCAuthSession> {
  const response = await fetch(`${baseUrl}/api/auth/session`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse<POCAuthSession>(response);
}

export async function fetchAvailableReports(): Promise<AvailableReportsResponse> {
  const response = await fetch(`${baseUrl}/api/reports/available`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse<AvailableReportsResponse>(response);
}

export async function fetchSavedConfigs(): Promise<SavedPOCConfigRecord[]> {
  const response = await fetch(`${baseUrl}/api/poc/configs`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse<SavedPOCConfigRecord[]>(response);
}

export async function createPOCConfig(name: string, config: CompanyPOCConfig): Promise<SavedPOCConfigRecord> {
  const response = await fetch(`${baseUrl}/api/poc/configs`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name, config }),
  });
  return parseResponse<SavedPOCConfigRecord>(response);
}

export async function updatePOCConfig(configId: string, name: string, config: CompanyPOCConfig): Promise<SavedPOCConfigRecord> {
  const response = await fetch(`${baseUrl}/api/poc/configs/${configId}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name, config }),
  });
  return parseResponse<SavedPOCConfigRecord>(response);
}

export async function deletePOCConfig(configId: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/poc/configs/${configId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function fetchSavedMultiViews(): Promise<SavedMultiViewRecord[]> {
  const response = await fetch(`${baseUrl}/api/poc/multiviews`, {
    method: "GET",
    credentials: "include",
  });
  return parseResponse<SavedMultiViewRecord[]>(response);
}

export async function createMultiView(name: string, multiView: MultiViewConfig): Promise<SavedMultiViewRecord> {
  const response = await fetch(`${baseUrl}/api/poc/multiviews`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ name, multiView }),
  });
  return parseResponse<SavedMultiViewRecord>(response);
}
