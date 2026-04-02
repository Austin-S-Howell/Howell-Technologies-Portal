export type WhiteboardPoint = {
  x: number;
  y: number;
};

export type StickyNote = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
};

export type DrawingPath = {
  points: WhiteboardPoint[];
  color: string;
  width: number;
  tool: "draw" | "erase";
};

export type IdeasBoardState = {
  notes: StickyNote[];
  paths: DrawingPath[];
};

export const MIN_NOTE_WIDTH = 236;
export const MIN_NOTE_HEIGHT = 184;
export const MIN_PATH_WIDTH = 2;
export const MAX_PATH_WIDTH = 80;
export const IDEAS_STORAGE_KEY = "ht.operatorPortal.ideasWhiteboard.v1";
export const EMPTY_IDEAS_BOARD_STATE: IdeasBoardState = {
  notes: [],
  paths: [],
};

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPoint(value: WhiteboardPoint | null): value is WhiteboardPoint {
  return value !== null;
}

function isStickyNote(value: StickyNote | null): value is StickyNote {
  return value !== null;
}

function isDrawingPath(value: DrawingPath | null): value is DrawingPath {
  return value !== null;
}

function sanitizePoint(value: unknown): WhiteboardPoint | null {
  if (!isRecord(value) || typeof value.x !== "number" || typeof value.y !== "number") {
    return null;
  }

  return {
    x: clampNumber(value.x, 0, 1),
    y: clampNumber(value.y, 0, 1),
  };
}

function sanitizeNote(value: unknown): StickyNote | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.x !== "number" ||
    typeof value.y !== "number" ||
    typeof value.width !== "number" ||
    typeof value.height !== "number" ||
    typeof value.text !== "string" ||
    typeof value.color !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    x: clampNumber(value.x, 0, 1),
    y: clampNumber(value.y, 0, 1),
    width: clampNumber(value.width, MIN_NOTE_WIDTH, 420),
    height: clampNumber(value.height, MIN_NOTE_HEIGHT, 320),
    text: value.text,
    color: value.color,
  };
}

function sanitizePath(value: unknown): DrawingPath | null {
  if (!isRecord(value) || typeof value.color !== "string" || typeof value.width !== "number") {
    return null;
  }

  const points = Array.isArray(value.points) ? value.points.map(sanitizePoint).filter(isPoint) : [];
  if (points.length === 0) {
    return null;
  }

  return {
    points,
    color: value.color,
    width: clampNumber(value.width, MIN_PATH_WIDTH, MAX_PATH_WIDTH),
    tool: value.tool === "erase" ? "erase" : "draw",
  };
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getIdeasStorageKey(scopeKey?: string) {
  const normalized = (scopeKey || "").trim();
  if (!normalized) {
    return IDEAS_STORAGE_KEY;
  }
  return `${IDEAS_STORAGE_KEY}:${normalized}`;
}

export function sanitizeIdeasBoardState(value: unknown): IdeasBoardState {
  const parsed = isRecord(value) ? value : {};
  const notes = Array.isArray(parsed.notes) ? parsed.notes.map(sanitizeNote).filter(isStickyNote) : [];
  const paths = Array.isArray(parsed.paths) ? parsed.paths.map(sanitizePath).filter(isDrawingPath) : [];
  return { notes, paths };
}

export function loadIdeasBoardState(scopeKey?: string): IdeasBoardState {
  const storage = getLocalStorage();
  if (!storage) {
    return EMPTY_IDEAS_BOARD_STATE;
  }

  try {
    const raw = storage.getItem(getIdeasStorageKey(scopeKey));
    if (!raw) {
      return EMPTY_IDEAS_BOARD_STATE;
    }

    return sanitizeIdeasBoardState(JSON.parse(raw));
  } catch {
    return EMPTY_IDEAS_BOARD_STATE;
  }
}

export function saveIdeasBoardState(state: IdeasBoardState, scopeKey?: string) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.setItem(getIdeasStorageKey(scopeKey), JSON.stringify(state));
}
