import { type CSSProperties, useEffect, useRef, useState } from "react";
import { downloadIdeasBoardSnapshotPng } from "./ideasExport";
import {
  type IdeasBoardScope,
  isSupabaseIdeasEnabled,
  loadIdeasBoardFromSupabase,
  saveIdeasBoardToSupabase,
  subscribeToSharedIdeasBoard,
} from "./ideasSupabase";
import {
  EMPTY_IDEAS_BOARD_STATE,
  getIdeasStorageKey,
  loadIdeasBoardState,
  MAX_PATH_WIDTH,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  MIN_PATH_WIDTH,
  saveIdeasBoardState,
  type DrawingPath,
  type StickyNote,
  type WhiteboardPoint,
} from "./ideasStorage";
import { readSession } from "../services/sessionStorage";

const NOTE_COLORS = ["#f8e587", "#ffd4aa", "#cce4ff", "#cfeec9", "#e4d6ff", "#ffd4df"];
const STROKE_COLORS = ["#b86b3d", "#424852", "#2f6db0", "#2f9150", "#7f3fbf", "#b0225f"];
const SAVE_DEBOUNCE_MS = 180;
const MAX_UNDO_STEPS = 50;
const IDEAS_BOARD_SCOPE_KEY = "ht.operatorPortal.ideasBoardScope.v1";
const IDEAS_SHARED_LIVE_UPDATES_KEY = "ht.operatorPortal.ideasSharedLiveUpdates.v1";
const MIN_STROKE_WIDTH = MIN_PATH_WIDTH;
const MAX_STROKE_WIDTH = MAX_PATH_WIDTH;
const SHARED_LIVE_SAVE_DEBOUNCE_MS = 700;

function buildId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ideas-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isTouchDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  if (navigator.maxTouchPoints > 0) {
    return true;
  }
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
}

function getStoredIdeasBoardScope(): IdeasBoardScope {
  if (typeof window === "undefined") {
    return "private";
  }

  try {
    const raw = window.localStorage.getItem(IDEAS_BOARD_SCOPE_KEY);
    return raw === "shared" ? "shared" : "private";
  } catch {
    return "private";
  }
}

function persistIdeasBoardScope(scope: IdeasBoardScope) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(IDEAS_BOARD_SCOPE_KEY, scope);
  } catch {
    // Ignore localStorage failures.
  }
}

function getStoredSharedLiveUpdatesEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(IDEAS_SHARED_LIVE_UPDATES_KEY) === "true";
  } catch {
    return false;
  }
}

function persistSharedLiveUpdatesEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(IDEAS_SHARED_LIVE_UPDATES_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore localStorage failures.
  }
}

function createStickyNote(index: number, color: string, boardWidth: number, boardHeight: number): StickyNote {
  const safeWidth = boardWidth || 960;
  const safeHeight = boardHeight || 640;
  const width = clampNumber(Math.min(MIN_NOTE_WIDTH, safeWidth * 0.34), MIN_NOTE_WIDTH, 260);
  const height = clampNumber(Math.min(MIN_NOTE_HEIGHT, safeHeight * 0.36), MIN_NOTE_HEIGHT, 210);
  const maxX = Math.max(0.05, 1 - width / safeWidth - 0.03);
  const maxY = Math.max(0.07, 1 - height / safeHeight - 0.03);

  return {
    id: buildId(),
    x: clampNumber(0.08 + (index % 4) * 0.075, 0.03, maxX),
    y: clampNumber(0.08 + (index % 3) * 0.08, 0.03, maxY),
    width,
    height,
    text: "",
    color,
  };
}

function normalizePoint(point: WhiteboardPoint, width: number, height: number) {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

function drawPath(ctx: CanvasRenderingContext2D, path: DrawingPath, width: number, height: number) {
  if (path.points.length === 0) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = path.tool === "erase" ? "destination-out" : "source-over";
  ctx.strokeStyle = path.color;
  ctx.fillStyle = path.color;
  ctx.lineWidth = path.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const firstPoint = normalizePoint(path.points[0], width, height);
  if (path.points.length === 1) {
    ctx.beginPath();
    ctx.arc(firstPoint.x, firstPoint.y, path.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);
  for (const point of path.points.slice(1)) {
    const normalized = normalizePoint(point, width, height);
    ctx.lineTo(normalized.x, normalized.y);
  }
  ctx.stroke();
  ctx.restore();
}

function cloneBoardState(notes: StickyNote[], paths: DrawingPath[]) {
  return {
    notes: notes.map((note) => ({ ...note })),
    paths: paths.map((path) => ({
      ...path,
      points: path.points.map((point) => ({ ...point })),
    })),
  };
}

function boardStatesMatch(left: ReturnType<typeof cloneBoardState>, right: ReturnType<typeof cloneBoardState>) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getBoardStateSignature(notes: StickyNote[], paths: DrawingPath[]) {
  return JSON.stringify(cloneBoardState(notes, paths));
}

function getBoardPoint(board: HTMLDivElement, clientX: number, clientY: number): WhiteboardPoint | null {
  const rect = board.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: clampNumber((clientX - rect.left) / rect.width, 0, 1),
    y: clampNumber((clientY - rect.top) / rect.height, 0, 1),
  };
}

function getRenderedNoteFrame(note: StickyNote, boardWidth: number, boardHeight: number) {
  const safeBoardWidth = Math.max(boardWidth, 220);
  const safeBoardHeight = Math.max(boardHeight, 220);
  const width = clampNumber(note.width, MIN_NOTE_WIDTH, Math.max(MIN_NOTE_WIDTH, safeBoardWidth - 18));
  const height = clampNumber(note.height, MIN_NOTE_HEIGHT, Math.max(MIN_NOTE_HEIGHT, safeBoardHeight - 18));
  const left = clampNumber(note.x * safeBoardWidth, 0, Math.max(0, safeBoardWidth - width));
  const top = clampNumber(note.y * safeBoardHeight, 0, Math.max(0, safeBoardHeight - height));

  return { width, height, left, top };
}

function getToolButtonStyle(kind: "pen" | "eraser", active: boolean, accentColor: string): CSSProperties {
  if (kind === "pen") {
    return active
      ? {
          color: "#ffffff",
          background: `linear-gradient(135deg, ${accentColor}, #24313f)`,
          borderColor: accentColor,
          boxShadow: `0 14px 24px color-mix(in srgb, ${accentColor} 28%, transparent)`,
        }
      : {
          color: accentColor,
          background: `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 12%, white), rgba(255, 255, 255, 0.96))`,
          borderColor: `color-mix(in srgb, ${accentColor} 42%, rgba(97, 102, 114, 0.2))`,
        };
  }

  return active
    ? {
        color: "#ffffff",
        background: "linear-gradient(135deg, #c64283, #7b214c)",
        borderColor: "#d85a95",
        boxShadow: "0 14px 24px rgba(198, 66, 131, 0.22)",
      }
    : {
        color: "#a63d73",
        background: "linear-gradient(180deg, rgba(255, 230, 239, 0.98), rgba(255, 247, 250, 0.98))",
        borderColor: "rgba(198, 66, 131, 0.28)",
      };
}

export function IdeasPage() {
  type SharedLiveStatus = "off" | "connecting" | "connected" | "warning" | "error";
  const operatorSession = readSession();
  const operatorEmail = operatorSession?.email ?? "";
  const supabaseIdeasEnabled = isSupabaseIdeasEnabled();
  const [boardScope, setBoardScope] = useState<IdeasBoardScope>(() => getStoredIdeasBoardScope());
  const [notes, setNotes] = useState(EMPTY_IDEAS_BOARD_STATE.notes);
  const [paths, setPaths] = useState(EMPTY_IDEAS_BOARD_STATE.paths);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [draftPath, setDraftPath] = useState<DrawingPath | null>(null);
  const [cursorPreview, setCursorPreview] = useState<{
    visible: boolean;
    x: number;
    y: number;
    pointerType: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    pointerType: "",
  });
  const [noteSeedDrag, setNoteSeedDrag] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const [history, setHistory] = useState<Array<ReturnType<typeof cloneBoardState>>>([]);
  const [isTouchInput, setIsTouchInput] = useState(false);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardRefreshing, setBoardRefreshing] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardStatus, setBoardStatus] = useState("Loading board...");
  const [boardError, setBoardError] = useState("");
  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const [sharedLiveUpdatesEnabled, setSharedLiveUpdatesEnabled] = useState(() => getStoredSharedLiveUpdatesEnabled());
  const [sharedLiveStatus, setSharedLiveStatus] = useState<SharedLiveStatus>(() =>
    getStoredSharedLiveUpdatesEnabled() ? "connecting" : "off",
  );
  const boardShellRef = useRef<HTMLElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardStateRef = useRef(cloneBoardState(EMPTY_IDEAS_BOARD_STATE.notes, EMPTY_IDEAS_BOARD_STATE.paths));
  const boardSyncedSignatureRef = useRef(getBoardStateSignature(EMPTY_IDEAS_BOARD_STATE.notes, EMPTY_IDEAS_BOARD_STATE.paths));
  const mountedRef = useRef(true);
  const boardLoadRequestIdRef = useRef(0);
  const drawingPointerIdRef = useRef<number | null>(null);
  const draftPathRef = useRef<DrawingPath | null>(null);
  const textEditSessionRef = useRef<string | null>(null);
  const noteDragRef = useRef<{
    noteId: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const noteResizeRef = useRef<{
    noteId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const noteSeedDragRef = useRef<{
    pointerId: number;
  } | null>(null);
  const activeBoardStorageKey = getIdeasStorageKey(boardScope === "shared" ? "shared" : `private:${operatorEmail || "anonymous"}`);
  const activeBoardName = boardScope === "shared" ? "Shared ideas board" : "Private ideas board";
  const hasBoardContent = notes.length > 0 || paths.length > 0;
  const whiteboardHint = isTouchInput
    ? "Drag notes by the handle. Draw directly on the board with your finger."
    : "Drag notes by the handle. Draw or erase directly on the board.";
  const showManualRefresh = boardScope === "private" || !sharedLiveUpdatesEnabled;
  const showManualSave = boardScope === "private" || !sharedLiveUpdatesEnabled;
  const sharedLiveButtonClassName = `ideas-toggle ideas-live-toggle is-${sharedLiveStatus}`;
  const sharedLiveButtonLabel =
    sharedLiveStatus === "connected"
      ? "Live updates on"
      : sharedLiveStatus === "connecting"
        ? "Connecting live updates..."
        : sharedLiveStatus === "error"
          ? "Live updates error"
          : sharedLiveStatus === "warning"
            ? "Live updates disconnected"
            : "Live updates off";
  const sharedLiveQuickLabel =
    sharedLiveStatus === "connected"
      ? "Live on"
      : sharedLiveStatus === "connecting"
        ? "Connecting..."
        : sharedLiveStatus === "error"
          ? "Live error"
          : sharedLiveStatus === "warning"
            ? "Live warning"
            : "Live off";

  useEffect(() => {
    draftPathRef.current = draftPath;
  }, [draftPath]);

  useEffect(() => {
    boardStateRef.current = cloneBoardState(notes, paths);
  }, [notes, paths]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      boardLoadRequestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleFullscreenChange = () => {
      setBoardFullscreen(document.fullscreenElement === boardShellRef.current);
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function recordHistorySnapshot() {
    const snapshot = cloneBoardState(notes, paths);
    setHistory((current) => {
      const next = [...current, snapshot];
      return next.length > MAX_UNDO_STEPS ? next.slice(next.length - MAX_UNDO_STEPS) : next;
    });
  }

  function handleUndo() {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) {
        return current;
      }

      noteDragRef.current = null;
      noteResizeRef.current = null;
      drawingPointerIdRef.current = null;
      draftPathRef.current = null;
      textEditSessionRef.current = null;
      setDraftPath(null);
      setNotes(previous.notes.map((note) => ({ ...note })));
      setPaths(
        previous.paths.map((path) => ({
          ...path,
          points: path.points.map((point) => ({ ...point })),
        })),
      );
      return current.slice(0, -1);
    });
  }

  useEffect(() => {
    setIsTouchInput(isTouchDevice());
  }, []);

  useEffect(() => {
    persistIdeasBoardScope(boardScope);
  }, [boardScope]);

  useEffect(() => {
    void loadBoard({ mode: "initial", preserveLocalWhenRemoteEmpty: true });
  }, [activeBoardStorageKey, boardScope, operatorEmail, supabaseIdeasEnabled]);

  useEffect(() => {
    persistSharedLiveUpdatesEnabled(sharedLiveUpdatesEnabled);
  }, [sharedLiveUpdatesEnabled]);

  useEffect(() => {
    if (!sharedLiveUpdatesEnabled) {
      setSharedLiveStatus("off");
    }
  }, [sharedLiveUpdatesEnabled]);

  useEffect(() => {
    setSharedLiveStatus(sharedLiveUpdatesEnabled ? "connecting" : "off");

    if (!supabaseIdeasEnabled || boardScope !== "shared" || !sharedLiveUpdatesEnabled || boardLoading) {
      return;
    }

    void loadBoard({ mode: "live", preserveLocalWhenRemoteEmpty: true });

    const subscription = subscribeToSharedIdeasBoard({
      onState: (nextState) => {
        if (!mountedRef.current) {
          return;
        }

        const resolvedState = cloneBoardState(nextState.notes, nextState.paths);
        boardSyncedSignatureRef.current = getBoardStateSignature(resolvedState.notes, resolvedState.paths);
        if (!boardStatesMatch(boardStateRef.current, resolvedState)) {
          applyBoardState(resolvedState);
          setBoardStatus("Shared board updated live from Supabase.");
        }
        setSharedLiveStatus("connected");
        setBoardError("");
      },
      onSubscribed: () => {
        if (!mountedRef.current) {
          return;
        }

        setSharedLiveStatus("connected");
        setBoardError("");
      },
      onWarning: (message) => {
        if (!mountedRef.current) {
          return;
        }

        setSharedLiveStatus("warning");
        setBoardError(message);
      },
      onError: (message) => {
        if (!mountedRef.current) {
          return;
        }

        setSharedLiveStatus("error");
        setBoardError(message);
      },
    });

    if (!subscription) {
      setSharedLiveStatus("error");
      setBoardError("Supabase live updates are not available for the shared board.");
      return;
    }

    return () => {
      setSharedLiveStatus(sharedLiveUpdatesEnabled ? "warning" : "off");
      void subscription.unsubscribe();
    };
  }, [boardLoading, boardScope, operatorEmail, sharedLiveUpdatesEnabled, supabaseIdeasEnabled]);

  useEffect(() => {
    if (boardLoading) {
      return;
    }

    const localTimeoutId = window.setTimeout(() => {
      saveIdeasBoardState({ notes, paths }, activeBoardStorageKey);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(localTimeoutId);
    };
  }, [activeBoardStorageKey, boardLoading, notes, paths]);

  useEffect(() => {
    if (!supabaseIdeasEnabled || boardScope !== "shared" || !sharedLiveUpdatesEnabled || boardLoading) {
      return;
    }

    const nextSignature = getBoardStateSignature(notes, paths);
    if (nextSignature === boardSyncedSignatureRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (getBoardStateSignature(boardStateRef.current.notes, boardStateRef.current.paths) === boardSyncedSignatureRef.current) {
        return;
      }

      setBoardSaving(true);
      setBoardError("");
      void saveIdeasBoardToSupabase("shared", operatorEmail, boardStateRef.current)
        .then(() => {
          if (!mountedRef.current) {
            return;
          }

          boardSyncedSignatureRef.current = getBoardStateSignature(boardStateRef.current.notes, boardStateRef.current.paths);
          setBoardStatus("Shared board saved live to Supabase.");
        })
        .catch((error) => {
          if (!mountedRef.current) {
            return;
          }

          setBoardError(error instanceof Error ? error.message : "Shared live save failed.");
          setBoardStatus("Using local board backup.");
        })
        .finally(() => {
          if (!mountedRef.current) {
            return;
          }

          setBoardSaving(false);
        });
    }, SHARED_LIVE_SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [boardLoading, boardScope, notes, operatorEmail, paths, sharedLiveUpdatesEnabled, supabaseIdeasEnabled]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    const updateBoardSize = () => {
      const rect = board.getBoundingClientRect();
      setBoardSize((current) => {
        const next = {
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        };
        if (current.width === next.width && current.height === next.height) {
          return current;
        }
        return next;
      });
    };

    updateBoardSize();

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => {
        updateBoardSize();
      });
      observer.observe(board);
      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener("resize", updateBoardSize);
    return () => {
      window.removeEventListener("resize", updateBoardSize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || boardSize.width <= 0 || boardSize.height <= 0) {
      return;
    }

    if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext("2d");
    } catch {
      context = null;
    }
    if (!context) {
      return;
    }

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(boardSize.width * dpr);
    canvas.height = Math.round(boardSize.height * dpr);
    canvas.style.width = `${boardSize.width}px`;
    canvas.style.height = `${boardSize.height}px`;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, boardSize.width, boardSize.height);

    const allPaths = draftPath ? [...paths, draftPath] : paths;
    for (const path of allPaths) {
      drawPath(context, path, boardSize.width, boardSize.height);
    }
  }, [boardSize, draftPath, paths]);

  function bringNoteToFront(noteId: string) {
    setNotes((current) => {
      const target = current.find((note) => note.id === noteId);
      if (!target || current[current.length - 1]?.id === noteId) {
        return current;
      }
      return [...current.filter((note) => note.id !== noteId), target];
    });
  }

  function placeNewNoteAtClientPoint(clientX: number, clientY: number) {
    const board = boardRef.current;
    if (!board) {
      return false;
    }

    const rect = board.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return false;
    }

    recordHistorySnapshot();
    setNotes((current) => {
      const nextNote = createStickyNote(current.length, noteColor, rect.width, rect.height);
      return [
        ...current,
        {
          ...nextNote,
          x: clampNumber((clientX - rect.left - nextNote.width / 2) / rect.width, 0, 1 - nextNote.width / rect.width),
          y: clampNumber((clientY - rect.top - nextNote.height / 2) / rect.height, 0, 1 - nextNote.height / rect.height),
        },
      ];
    });
    return true;
  }

  function handleNoteSeedPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    noteSeedDragRef.current = { pointerId: event.pointerId };
    setNoteSeedDrag({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleNoteSeedPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (noteSeedDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    setNoteSeedDrag({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
    event.preventDefault();
  }

  function finalizeNoteSeedDrag(pointerId: number, clientX: number, clientY: number) {
    if (noteSeedDragRef.current?.pointerId !== pointerId) {
      return;
    }

    noteSeedDragRef.current = null;
    setNoteSeedDrag({ visible: false, x: 0, y: 0 });
    placeNewNoteAtClientPoint(clientX, clientY);
  }

  function handleNoteSeedPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    finalizeNoteSeedDrag(event.pointerId, event.clientX, event.clientY);
  }

  function handleNoteSeedPointerCancel(event: React.PointerEvent<HTMLButtonElement>) {
    finalizeNoteSeedDrag(event.pointerId, event.clientX, event.clientY);
  }

  function handleClearBoard() {
    const hasContent = notes.length > 0 || paths.length > 0;
    if (!hasContent) {
      return;
    }

    if (!window.confirm("Clear all notes and sketches from the ideas board?")) {
      return;
    }

    recordHistorySnapshot();
    setNotes(EMPTY_IDEAS_BOARD_STATE.notes);
    setPaths(EMPTY_IDEAS_BOARD_STATE.paths);
    setDraftPath(null);
  }

  function updateCursorPreview(clientX: number, clientY: number, pointerType: string) {
    const board = boardRef.current;
    if (!board || pointerType !== "mouse") {
      setCursorPreview((current) => (current.visible ? { ...current, visible: false, pointerType } : current));
      return;
    }

    const rect = board.getBoundingClientRect();
    setCursorPreview({
      visible: true,
      x: clampNumber(clientX - rect.left, 0, rect.width),
      y: clampNumber(clientY - rect.top, 0, rect.height),
      pointerType,
    });
  }

  function hideCursorPreview() {
    setCursorPreview((current) => (current.visible ? { ...current, visible: false } : current));
  }

  function updateStrokeWidth(nextValue: number) {
    setStrokeWidth(clampNumber(Number.isFinite(nextValue) ? nextValue : MIN_STROKE_WIDTH, MIN_STROKE_WIDTH, MAX_STROKE_WIDTH));
  }

  function handleCanvasPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    const point = getBoardPoint(board, event.clientX, event.clientY);
    if (!point) {
      return;
    }

    drawingPointerIdRef.current = event.pointerId;
    updateCursorPreview(event.clientX, event.clientY, event.pointerType);
    const nextPath: DrawingPath = {
      points: [point],
      color: strokeColor,
      width: strokeWidth,
      tool: tool === "eraser" ? "erase" : "draw",
    };
    setDraftPath(nextPath);
    draftPathRef.current = nextPath;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleCanvasPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    updateCursorPreview(event.clientX, event.clientY, event.pointerType);

    if (drawingPointerIdRef.current !== event.pointerId) {
      return;
    }

    const board = boardRef.current;
    const activePath = draftPathRef.current;
    if (!board || !activePath) {
      return;
    }

    const point = getBoardPoint(board, event.clientX, event.clientY);
    if (!point) {
      return;
    }

    const lastPoint = activePath.points[activePath.points.length - 1];
    if (lastPoint && Math.abs(lastPoint.x - point.x) < 0.0015 && Math.abs(lastPoint.y - point.y) < 0.0015) {
      return;
    }

    setDraftPath((current) => {
      if (!current) {
        return current;
      }
      const next = { ...current, points: [...current.points, point] };
      draftPathRef.current = next;
      return next;
    });
    event.preventDefault();
  }

  function finalizeDraftPath(pointerId: number) {
    if (drawingPointerIdRef.current !== pointerId) {
      return;
    }

    const completedPath = draftPathRef.current;
    drawingPointerIdRef.current = null;
    draftPathRef.current = null;
    setDraftPath(null);

    if (!completedPath || completedPath.points.length === 0) {
      return;
    }

    recordHistorySnapshot();
    setPaths((current) => [...current, completedPath]);
  }

  function handleCanvasPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    finalizeDraftPath(event.pointerId);
    updateCursorPreview(event.clientX, event.clientY, event.pointerType);
  }

  function handleCanvasPointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    finalizeDraftPath(event.pointerId);
    hideCursorPreview();
  }

  function handleCanvasPointerLeave() {
    hideCursorPreview();
  }

  function handleCanvasPointerEnter(event: React.PointerEvent<HTMLCanvasElement>) {
    updateCursorPreview(event.clientX, event.clientY, event.pointerType);
  }

  function handleNoteDragStart(noteId: string, event: React.PointerEvent<HTMLButtonElement>) {
    const board = boardRef.current;
    const targetNote = notes.find((note) => note.id === noteId);
    if (!board || !targetNote) {
      return;
    }

    const frame = getRenderedNoteFrame(targetNote, boardSize.width, boardSize.height);
    recordHistorySnapshot();
    noteDragRef.current = {
      noteId,
      pointerId: event.pointerId,
      offsetX: event.clientX - frame.left,
      offsetY: event.clientY - frame.top,
    };
    bringNoteToFront(noteId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleNoteDragMove(event: React.PointerEvent<HTMLButtonElement>) {
    const dragState = noteDragRef.current;
    const board = boardRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !board) {
      return;
    }

    const rect = board.getBoundingClientRect();
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== dragState.noteId) {
          return note;
        }

        const width = clampNumber(note.width, 160, Math.max(160, rect.width - 18));
        const height = clampNumber(note.height, 130, Math.max(130, rect.height - 18));
        const nextX = clampNumber((event.clientX - rect.left - dragState.offsetX) / rect.width, 0, 1 - width / rect.width);
        const nextY = clampNumber(
          (event.clientY - rect.top - dragState.offsetY) / rect.height,
          0,
          1 - height / rect.height,
        );

        return {
          ...note,
          x: nextX,
          y: nextY,
        };
      }),
    );
    event.preventDefault();
  }

  function handleNoteDragEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (noteDragRef.current?.pointerId !== event.pointerId) {
      return;
    }
    noteDragRef.current = null;
  }

  function handleNoteResizeStart(noteId: string, event: React.PointerEvent<HTMLButtonElement>) {
    const targetNote = notes.find((note) => note.id === noteId);
    if (!targetNote) {
      return;
    }

    noteResizeRef.current = {
      noteId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startWidth: targetNote.width,
      startHeight: targetNote.height,
    };
    recordHistorySnapshot();
    bringNoteToFront(noteId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleNoteResizeMove(event: React.PointerEvent<HTMLButtonElement>) {
    const resizeState = noteResizeRef.current;
    const board = boardRef.current;
    if (!resizeState || resizeState.pointerId !== event.pointerId || !board) {
      return;
    }

    const rect = board.getBoundingClientRect();
    setNotes((current) =>
      current.map((note) => {
        if (note.id !== resizeState.noteId) {
          return note;
        }

        const noteLeft = clampNumber(note.x * rect.width, 0, rect.width);
        const noteTop = clampNumber(note.y * rect.height, 0, rect.height);
        const maxWidth = Math.max(MIN_NOTE_WIDTH, rect.width - noteLeft);
        const maxHeight = Math.max(MIN_NOTE_HEIGHT, rect.height - noteTop);

        return {
          ...note,
          width: clampNumber(resizeState.startWidth + (event.clientX - resizeState.startClientX), MIN_NOTE_WIDTH, maxWidth),
          height: clampNumber(
            resizeState.startHeight + (event.clientY - resizeState.startClientY),
            MIN_NOTE_HEIGHT,
            maxHeight,
          ),
        };
      }),
    );
    event.preventDefault();
  }

  function handleNoteResizeEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (noteResizeRef.current?.pointerId !== event.pointerId) {
      return;
    }
    noteResizeRef.current = null;
  }

  function updateNote(noteId: string, patch: Partial<StickyNote>) {
    setNotes((current) => current.map((note) => (note.id === noteId ? { ...note, ...patch } : note)));
  }

  function getExportSize() {
    const board = boardRef.current;
    if (board) {
      const rect = board.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }
    }

    return {
      width: Math.max(boardSize.width, 960),
      height: Math.max(boardSize.height, 640),
    };
  }

  function handleDownloadSnapshot() {
    try {
      const size = getExportSize();
      downloadIdeasBoardSnapshotPng({
        notes,
        paths,
        width: size.width,
        height: size.height,
      });
    } catch {
      window.alert("Unable to download the board snapshot in this browser.");
    }
  }

  function resetBoardInteractions() {
    noteDragRef.current = null;
    noteResizeRef.current = null;
    drawingPointerIdRef.current = null;
    draftPathRef.current = null;
    textEditSessionRef.current = null;
    setDraftPath(null);
  }

  function applyBoardState(nextState: ReturnType<typeof cloneBoardState>) {
    const clonedState = cloneBoardState(nextState.notes, nextState.paths);
    resetBoardInteractions();
    setHistory([]);
    setNotes(clonedState.notes);
    setPaths(clonedState.paths);
  }

  async function loadBoard(options: {
    mode: "initial" | "manual" | "live";
    preserveLocalWhenRemoteEmpty: boolean;
  }) {
    const requestId = ++boardLoadRequestIdRef.current;
    const storedLocalState = loadIdeasBoardState(activeBoardStorageKey);
    const localState = cloneBoardState(storedLocalState.notes, storedLocalState.paths);

    if (options.mode === "initial") {
      setBoardLoading(true);
      setBoardError("");
      setBoardStatus(supabaseIdeasEnabled ? "Loading board from Supabase..." : "Using browser-only board storage.");
      applyBoardState(localState);
    } else if (options.mode === "manual") {
      setBoardRefreshing(true);
      setBoardError("");
      setBoardStatus(supabaseIdeasEnabled ? `Refreshing ${activeBoardName.toLowerCase()}...` : `Reloading ${activeBoardName.toLowerCase()} from this browser...`);
    }

    if (!supabaseIdeasEnabled) {
      if (!mountedRef.current || requestId !== boardLoadRequestIdRef.current) {
        return;
      }

      if (options.mode !== "initial") {
        applyBoardState(localState);
        setBoardStatus(`${activeBoardName} reloaded from this browser.`);
      }
      setBoardLoading(false);
      setBoardRefreshing(false);
      return;
    }

    try {
      const remoteState = await loadIdeasBoardFromSupabase(boardScope, operatorEmail);
      if (!mountedRef.current || requestId !== boardLoadRequestIdRef.current) {
        return;
      }

      const shouldKeepLocal =
        options.preserveLocalWhenRemoteEmpty &&
        remoteState !== null &&
        remoteState.notes.length === 0 &&
        remoteState.paths.length === 0 &&
        (localState.notes.length > 0 || localState.paths.length > 0);
      const resolvedState = cloneBoardState(
        (remoteState && !shouldKeepLocal ? remoteState : localState).notes,
        (remoteState && !shouldKeepLocal ? remoteState : localState).paths,
      );
      const boardChanged = !boardStatesMatch(boardStateRef.current, resolvedState);
      if (remoteState && !shouldKeepLocal) {
        boardSyncedSignatureRef.current = getBoardStateSignature(resolvedState.notes, resolvedState.paths);
      }
      applyBoardState(resolvedState);

      if (options.mode === "initial") {
        setBoardStatus(
          shouldKeepLocal
            ? "Loaded local board and ready to sync it to Supabase."
            : boardScope === "shared"
              ? "Shared board synced with Supabase."
              : "Private board synced with Supabase.",
        );
      } else if (options.mode === "manual") {
        setBoardStatus(
          boardChanged
            ? boardScope === "shared"
              ? "Shared board refreshed from Supabase."
              : "Private board refreshed from Supabase."
            : `${activeBoardName} already matches Supabase.`,
        );
      } else if (boardChanged) {
        setBoardStatus(
          options.mode === "live" ? "Shared board updated live from Supabase." : "Shared board updated from Supabase.",
        );
      }
    } catch (error) {
      if (!mountedRef.current || requestId !== boardLoadRequestIdRef.current) {
        return;
      }

      if (options.mode === "initial") {
        setBoardError("Unable to load the Supabase board right now. Using the local browser copy.");
        setBoardStatus("Using local board backup.");
      } else if (options.mode === "manual") {
        setBoardError(error instanceof Error ? error.message : "Unable to refresh the board from Supabase.");
        setBoardStatus("Using local board backup.");
      } else {
        setBoardError("Live updates could not refresh the shared board.");
      }
    } finally {
      if (!mountedRef.current || requestId !== boardLoadRequestIdRef.current) {
        return;
      }
      setBoardLoading(false);
      setBoardRefreshing(false);
    }
  }

  async function handleRefreshBoard() {
    await loadBoard({ mode: "manual", preserveLocalWhenRemoteEmpty: false });
  }

  async function handleToggleFullscreen() {
    if (typeof document === "undefined") {
      return;
    }

    const boardShell = boardShellRef.current;
    if (!boardShell || typeof boardShell.requestFullscreen !== "function") {
      setBoardError("Fullscreen is not available in this browser.");
      return;
    }

    try {
      if (document.fullscreenElement === boardShell) {
        await document.exitFullscreen();
      } else {
        await boardShell.requestFullscreen();
      }
      setBoardError("");
    } catch {
      setBoardError("Unable to change fullscreen mode for the ideas board.");
    }
  }

  async function handleSaveBoard() {
    saveIdeasBoardState({ notes, paths }, activeBoardStorageKey);

    if (!supabaseIdeasEnabled) {
      setBoardError("");
      setBoardStatus(`${activeBoardName} saved in this browser.`);
      return;
    }

    setBoardSaving(true);
    setBoardError("");
    try {
      await saveIdeasBoardToSupabase(boardScope, operatorEmail, { notes, paths });
      boardSyncedSignatureRef.current = getBoardStateSignature(notes, paths);
      setBoardStatus(boardScope === "shared" ? "Shared board saved to the shared Supabase row." : "Private board saved to your Supabase row.");
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Supabase save failed.");
      setBoardStatus("Using local board backup.");
    } finally {
      setBoardSaving(false);
    }
  }

  return (
    <section className="ideas-page">
      <header className="ideas-page__header">
        <div>
          <p className="eyebrow">Ideas Board</p>
          <h1>Ideas whiteboard</h1>
          <p className="lead">
            A planning surface for sticky notes, quick sketches, and throwaway thinking with private and shared board
            modes.
          </p>
        </div>
        <div className="ideas-page__summary">
          <article className="ideas-summary-card">
            <span>Board</span>
            <strong>{boardScope === "shared" ? "Shared" : "Private"}</strong>
          </article>
          <article className="ideas-summary-card">
            <span>Items</span>
            <strong>{notes.length + paths.length}</strong>
          </article>
        </div>
      </header>

      <section className="ideas-toolbar">
        <div className="ideas-toolbar__cluster">
          <div className="ideas-board-switch" role="group" aria-label="Ideas board scope">
            <button
              type="button"
              className={boardScope === "private" ? "ideas-board-switch__option is-active" : "ideas-board-switch__option"}
              onClick={() => setBoardScope("private")}
              aria-pressed={boardScope === "private"}
            >
              <i className="pi pi-lock" aria-hidden="true" />
              Private
            </button>
            <button
              type="button"
              className={boardScope === "shared" ? "ideas-board-switch__option is-active" : "ideas-board-switch__option"}
              onClick={() => setBoardScope("shared")}
              aria-pressed={boardScope === "shared"}
            >
              <i className="pi pi-users" aria-hidden="true" />
              Shared
            </button>
          </div>
          <button
            type="button"
            className="ideas-note-seed"
            onPointerDown={handleNoteSeedPointerDown}
            onPointerMove={handleNoteSeedPointerMove}
            onPointerUp={handleNoteSeedPointerUp}
            onPointerCancel={handleNoteSeedPointerCancel}
            aria-label="Drag a sticky note onto the board"
            style={{ background: noteColor }}
          >
            <span className="ideas-note-seed__header">
              <i className="pi pi-arrows-alt" aria-hidden="true" />
              New note
            </span>
            <span className="ideas-note-seed__body">Drag to board</span>
          </button>
          {boardScope === "shared" && supabaseIdeasEnabled ? (
            <button
              type="button"
              className={sharedLiveButtonClassName}
              onClick={() => setSharedLiveUpdatesEnabled((current) => !current)}
              aria-pressed={sharedLiveUpdatesEnabled}
              disabled={boardLoading || boardSaving}
            >
              <i className="pi pi-sync" aria-hidden="true" />
              {sharedLiveButtonLabel}
              <span className={`ideas-live-toggle__dot is-${sharedLiveStatus}`} aria-hidden="true" />
            </button>
          ) : null}
          {showManualRefresh ? (
            <button
              type="button"
              className="ideas-action ideas-action--ghost"
              onClick={() => {
                void handleRefreshBoard();
              }}
              disabled={boardLoading || boardRefreshing || boardSaving}
            >
              <i className="pi pi-refresh" aria-hidden="true" />
              {boardRefreshing ? "Refreshing..." : "Refresh board"}
            </button>
          ) : null}
          {showManualSave ? (
            <button
              type="button"
              className="ideas-action ideas-action--ghost"
              onClick={() => {
                void handleSaveBoard();
              }}
              disabled={boardSaving || boardLoading}
            >
              <i className="pi pi-save" aria-hidden="true" />
              {boardSaving ? "Saving..." : boardScope === "shared" ? "Save shared" : "Save private"}
            </button>
          ) : null}
          <button
            type="button"
            className="ideas-action ideas-action--ghost"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            <i className="pi pi-undo" aria-hidden="true" />
            Undo
          </button>
          <button
            type="button"
            className={tool === "pen" ? "ideas-toggle ideas-tool ideas-tool--pen is-active" : "ideas-toggle ideas-tool ideas-tool--pen"}
            onClick={() => setTool("pen")}
            aria-pressed={tool === "pen"}
            style={getToolButtonStyle("pen", tool === "pen", strokeColor)}
          >
            <span className="ideas-tool__icon" aria-hidden="true">
              <i className="pi pi-pencil" />
            </span>
            <span className="ideas-tool__meta">
              <span className="ideas-tool__label">Pen</span>
              <span className="ideas-tool__hint">{strokeWidth}px</span>
            </span>
          </button>
          <button
            type="button"
            className={tool === "eraser" ? "ideas-toggle ideas-tool ideas-tool--eraser is-active" : "ideas-toggle ideas-tool ideas-tool--eraser"}
            onClick={() => setTool("eraser")}
            aria-pressed={tool === "eraser"}
            style={getToolButtonStyle("eraser", tool === "eraser", strokeColor)}
          >
            <span className="ideas-tool__icon" aria-hidden="true">
              <i className="pi pi-eraser" />
            </span>
            <span className="ideas-tool__meta">
              <span className="ideas-tool__label">Eraser</span>
            </span>
          </button>
          <button
            type="button"
            className="ideas-action ideas-action--ghost"
            onClick={handleDownloadSnapshot}
            disabled={!hasBoardContent}
          >
            <i className="pi pi-image" aria-hidden="true" />
            Download PNG
          </button>
        </div>

        <div className="ideas-toolbar__cluster ideas-toolbar__cluster--swatches">
          <div className="ideas-toolbar__label-block">
            <span>Note color</span>
            <div className="ideas-swatch-row" role="group" aria-label="New note color">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={noteColor === color ? "ideas-swatch is-active" : "ideas-swatch"}
                  style={{ background: color }}
                  onClick={() => setNoteColor(color)}
                  aria-label={`Use note color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="ideas-toolbar__label-block">
            <span>Stroke color</span>
            <div className="ideas-swatch-row" role="group" aria-label="Drawing color">
              {STROKE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={strokeColor === color ? "ideas-swatch is-active" : "ideas-swatch"}
                  style={{ background: color }}
                  onClick={() => setStrokeColor(color)}
                  aria-label={`Use drawing color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="ideas-toolbar__cluster ideas-toolbar__cluster--range">
          <label className="ideas-range">
            <span>Stroke width</span>
            <input
              type="range"
              min={String(MIN_STROKE_WIDTH)}
              max={String(MAX_STROKE_WIDTH)}
              step="1"
              value={strokeWidth}
              onChange={(event) => updateStrokeWidth(Number(event.target.value))}
            />
            <div className="ideas-range__value-row">
              <input
                type="number"
                min={String(MIN_STROKE_WIDTH)}
                max={String(MAX_STROKE_WIDTH)}
                step="1"
                value={strokeWidth}
                onChange={(event) => updateStrokeWidth(Number(event.target.value))}
                aria-label="Stroke width in pixels"
                className="ideas-range__number"
              />
              <strong>px</strong>
            </div>
          </label>
          <button type="button" className="ideas-action ideas-action--ghost" onClick={handleClearBoard}>
            <i className="pi pi-trash" aria-hidden="true" />
            Clear all
          </button>
        </div>
      </section>

      <section
        ref={boardShellRef}
        className={boardFullscreen ? "ideas-board-shell is-fullscreen" : "ideas-board-shell"}
      >
        {boardFullscreen ? (
          <div className="ideas-board-shell__controls" aria-label="Fullscreen board actions">
            <div className="ideas-board-shell__quickbar">
              <button
                type="button"
                className="ideas-note-seed ideas-note-seed--compact"
                onPointerDown={handleNoteSeedPointerDown}
                onPointerMove={handleNoteSeedPointerMove}
                onPointerUp={handleNoteSeedPointerUp}
                onPointerCancel={handleNoteSeedPointerCancel}
                aria-label="Drag a sticky note onto the board"
                style={{ background: noteColor }}
              >
                <span className="ideas-note-seed__header">
                  <i className="pi pi-arrows-alt" aria-hidden="true" />
                  New note
                </span>
                <span className="ideas-note-seed__body">Drag to board</span>
              </button>
              {showManualRefresh ? (
                <button
                  type="button"
                  className="ideas-action ideas-action--ghost"
                  onClick={() => {
                    void handleRefreshBoard();
                  }}
                  disabled={boardLoading || boardRefreshing || boardSaving}
                >
                  <i className="pi pi-refresh" aria-hidden="true" />
                  {boardRefreshing ? "Refreshing..." : "Refresh"}
                </button>
              ) : null}
              {showManualSave ? (
                <button
                  type="button"
                  className="ideas-action ideas-action--ghost"
                  onClick={() => {
                    void handleSaveBoard();
                  }}
                  disabled={boardSaving || boardLoading}
                >
                  <i className="pi pi-save" aria-hidden="true" />
                  {boardSaving ? "Saving..." : "Save"}
                </button>
              ) : null}
              <button
                type="button"
                className="ideas-action ideas-action--ghost"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                <i className="pi pi-undo" aria-hidden="true" />
                Undo
              </button>
              <button
                type="button"
                className={tool === "pen" ? "ideas-toggle ideas-tool ideas-tool--pen is-active" : "ideas-toggle ideas-tool ideas-tool--pen"}
                onClick={() => setTool("pen")}
                aria-pressed={tool === "pen"}
                style={getToolButtonStyle("pen", tool === "pen", strokeColor)}
              >
                <span className="ideas-tool__icon" aria-hidden="true">
                  <i className="pi pi-pencil" />
                </span>
                <span className="ideas-tool__meta">
                  <span className="ideas-tool__label">Pen</span>
                  <span className="ideas-tool__hint">{strokeWidth}px</span>
                </span>
              </button>
              <button
                type="button"
                className={tool === "eraser" ? "ideas-toggle ideas-tool ideas-tool--eraser is-active" : "ideas-toggle ideas-tool ideas-tool--eraser"}
                onClick={() => setTool("eraser")}
                aria-pressed={tool === "eraser"}
                style={getToolButtonStyle("eraser", tool === "eraser", strokeColor)}
              >
                <span className="ideas-tool__icon" aria-hidden="true">
                  <i className="pi pi-eraser" />
                </span>
                <span className="ideas-tool__meta">
                  <span className="ideas-tool__label">Eraser</span>
                </span>
              </button>
              {boardScope === "shared" && supabaseIdeasEnabled ? (
                <button
                  type="button"
                  className={sharedLiveButtonClassName}
                  onClick={() => setSharedLiveUpdatesEnabled((current) => !current)}
                  aria-pressed={sharedLiveUpdatesEnabled}
                  disabled={boardLoading || boardSaving}
                >
                  <i className="pi pi-sync" aria-hidden="true" />
                  {sharedLiveQuickLabel}
                  <span className={`ideas-live-toggle__dot is-${sharedLiveStatus}`} aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                className="ideas-action ideas-action--ghost"
                onClick={handleDownloadSnapshot}
                disabled={!hasBoardContent}
              >
                <i className="pi pi-image" aria-hidden="true" />
                PNG
              </button>
            </div>

            <div className="ideas-board-shell__quickbar ideas-board-shell__quickbar--detail">
              <div className="ideas-toolbar__label-block">
                <span>Note color</span>
                <div className="ideas-swatch-row" role="group" aria-label="Fullscreen note color">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={`fullscreen-note-${color}`}
                      type="button"
                      className={noteColor === color ? "ideas-swatch is-active" : "ideas-swatch"}
                      style={{ background: color }}
                      onClick={() => setNoteColor(color)}
                      aria-label={`Use note color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="ideas-toolbar__label-block">
                <span>Stroke color</span>
                <div className="ideas-swatch-row" role="group" aria-label="Fullscreen drawing color">
                  {STROKE_COLORS.map((color) => (
                    <button
                      key={`fullscreen-stroke-${color}`}
                      type="button"
                      className={strokeColor === color ? "ideas-swatch is-active" : "ideas-swatch"}
                      style={{ background: color }}
                      onClick={() => setStrokeColor(color)}
                      aria-label={`Use drawing color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <label className="ideas-range ideas-range--compact">
                <span>Stroke width</span>
                <input
                  type="range"
                  min={String(MIN_STROKE_WIDTH)}
                  max={String(MAX_STROKE_WIDTH)}
                  step="1"
                  value={strokeWidth}
                  onChange={(event) => updateStrokeWidth(Number(event.target.value))}
                />
                <div className="ideas-range__value-row">
                  <input
                    type="number"
                    min={String(MIN_STROKE_WIDTH)}
                    max={String(MAX_STROKE_WIDTH)}
                    step="1"
                    value={strokeWidth}
                    onChange={(event) => updateStrokeWidth(Number(event.target.value))}
                    aria-label="Fullscreen stroke width in pixels"
                    className="ideas-range__number"
                  />
                  <strong>px</strong>
                </div>
              </label>

              <button type="button" className="ideas-action ideas-action--ghost" onClick={handleClearBoard}>
                <i className="pi pi-trash" aria-hidden="true" />
                Clear all
              </button>
            </div>
          </div>
        ) : null}
        <div className="ideas-board-meta">
          <div className="ideas-board-meta__copy">
            <p>{whiteboardHint}</p>
            <small>
              {boardLoading ? `Loading ${activeBoardName.toLowerCase()}...` : boardStatus}
              {boardError ? ` ${boardError}` : ""}
            </small>
          </div>
          <div className="ideas-board-meta__actions">
            <span>{tool === "eraser" ? "Erasing strokes" : activeBoardName}</span>
            <button
              type="button"
              className="ideas-action ideas-action--ghost"
              onClick={() => {
                void handleToggleFullscreen();
              }}
            >
              <i className={boardFullscreen ? "pi pi-window-minimize" : "pi pi-window-maximize"} aria-hidden="true" />
              {boardFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>

        <div ref={boardRef} className="ideas-board">
          <canvas
            ref={canvasRef}
            className={
              tool === "eraser"
                ? cursorPreview.visible && cursorPreview.pointerType === "mouse"
                  ? "ideas-board__canvas is-erasing is-previewing"
                  : "ideas-board__canvas is-erasing"
                : cursorPreview.visible && cursorPreview.pointerType === "mouse"
                  ? "ideas-board__canvas is-previewing"
                  : "ideas-board__canvas"
            }
            onPointerDown={handleCanvasPointerDown}
            onPointerEnter={handleCanvasPointerEnter}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
            onPointerLeave={handleCanvasPointerLeave}
          />
          {cursorPreview.visible && cursorPreview.pointerType === "mouse" ? (
            <div
              className={tool === "eraser" ? "ideas-board__cursor-preview is-erasing" : "ideas-board__cursor-preview"}
              style={{
                left: `${cursorPreview.x}px`,
                top: `${cursorPreview.y}px`,
                width: `${strokeWidth}px`,
                height: `${strokeWidth}px`,
              }}
              aria-hidden="true"
            />
          ) : null}

          {!hasBoardContent ? (
            <div className="ideas-board__empty-state">
              <strong>Start with a note or a sketch</strong>
              <p>
                {supabaseIdeasEnabled
                  ? `${activeBoardName} syncs through Supabase and also keeps a local browser backup.`
                  : `${activeBoardName} saves automatically in this browser on this device.`}
              </p>
            </div>
          ) : null}

          {notes.map((note) => {
            const frame = getRenderedNoteFrame(note, boardSize.width, boardSize.height);

            return (
              <article
                key={note.id}
                className="ideas-note"
                style={{
                  left: `${frame.left}px`,
                  top: `${frame.top}px`,
                  width: `${frame.width}px`,
                  height: `${frame.height}px`,
                  background: note.color,
                  zIndex: notes.findIndex((entry) => entry.id === note.id) + 2,
                }}
              >
                <div className="ideas-note__header">
                  <button
                    type="button"
                    className="ideas-note__drag-handle"
                    onPointerDown={(event) => handleNoteDragStart(note.id, event)}
                    onPointerMove={handleNoteDragMove}
                    onPointerUp={handleNoteDragEnd}
                    onPointerCancel={handleNoteDragEnd}
                    aria-label="Drag note"
                  >
                    <i className="pi pi-arrows-alt" aria-hidden="true" />
                  </button>

                  <div className="ideas-note__swatches" role="group" aria-label="Change note color">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={`${note.id}-${color}`}
                        type="button"
                        className={note.color === color ? "ideas-note__swatch is-active" : "ideas-note__swatch"}
                        style={{ background: color }}
                        onClick={() => {
                          recordHistorySnapshot();
                          updateNote(note.id, { color });
                        }}
                        aria-label={`Set note color ${color}`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="ideas-note__delete"
                    onClick={() => {
                      recordHistorySnapshot();
                      setNotes((current) => current.filter((entry) => entry.id !== note.id));
                    }}
                    aria-label="Delete note"
                  >
                    <i className="pi pi-times" aria-hidden="true" />
                  </button>
                </div>

                <textarea
                  className="ideas-note__textarea"
                  value={note.text}
                  onFocus={() => {
                    if (textEditSessionRef.current !== note.id) {
                      recordHistorySnapshot();
                      textEditSessionRef.current = note.id;
                    }
                    bringNoteToFront(note.id);
                  }}
                  onBlur={() => {
                    if (textEditSessionRef.current === note.id) {
                      textEditSessionRef.current = null;
                    }
                  }}
                  onChange={(event) => updateNote(note.id, { text: event.target.value })}
                  placeholder="Capture an idea, task, or reminder..."
                  aria-label="Sticky note text"
                />

                <button
                  type="button"
                  className="ideas-note__resize-handle"
                  onPointerDown={(event) => handleNoteResizeStart(note.id, event)}
                  onPointerMove={handleNoteResizeMove}
                  onPointerUp={handleNoteResizeEnd}
                  onPointerCancel={handleNoteResizeEnd}
                  aria-label="Resize note"
                >
                  <i className="pi pi-arrow-down-right-and-arrow-up-left-to-center" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
        {noteSeedDrag.visible ? (
          <div
            className="ideas-note-seed__preview"
            aria-hidden="true"
            style={{
              left: `${noteSeedDrag.x}px`,
              top: `${noteSeedDrag.y}px`,
              background: noteColor,
            }}
          >
            <span className="ideas-note-seed__header">
              <i className="pi pi-plus" aria-hidden="true" />
              Note
            </span>
          </div>
        ) : null}
      </section>
    </section>
  );
}
