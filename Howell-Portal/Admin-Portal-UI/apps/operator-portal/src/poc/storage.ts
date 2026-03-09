import { clonePOCState } from "./defaults";
import { parsePOCStateFromUnknown } from "./validation";
import type { POCGeneratorState } from "./types";

export const POC_STORAGE_KEY = "howell.admin.pocGenerator.v1";

export function loadPOCStateFromStorage(): POCGeneratorState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(POC_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsePOCStateFromUnknown(parsed);
  } catch {
    return null;
  }
}

export function savePOCStateToStorage(state: POCGeneratorState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(POC_STORAGE_KEY, JSON.stringify(clonePOCState(state)));
}
