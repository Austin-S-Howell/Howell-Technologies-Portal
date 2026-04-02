import { useEffect, useRef, useState } from "react";
import {
  EMPTY_IDEAS_BOARD_STATE,
  loadIdeasBoardState,
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  saveIdeasBoardState,
  type DrawingPath,
  type StickyNote,
  type WhiteboardPoint,
} from "./ideasStorage";

const NOTE_COLORS = ["#f8e587", "#ffd4aa", "#cce4ff", "#cfeec9", "#e4d6ff", "#ffd4df"];
const STROKE_COLORS = ["#b86b3d", "#424852", "#2f6db0", "#2f9150", "#7f3fbf", "#b0225f"];
const SAVE_DEBOUNCE_MS = 180;
const MAX_UNDO_STEPS = 50;

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

export function IdeasPage() {
  const initialState = loadIdeasBoardState();
  const [notes, setNotes] = useState(initialState.notes);
  const [paths, setPaths] = useState(initialState.paths);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [strokeColor, setStrokeColor] = useState(STROKE_COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [draftPath, setDraftPath] = useState<DrawingPath | null>(null);
  const [history, setHistory] = useState<Array<ReturnType<typeof cloneBoardState>>>([]);
  const [isTouchInput, setIsTouchInput] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  useEffect(() => {
    draftPathRef.current = draftPath;
  }, [draftPath]);

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
    const timeoutId = window.setTimeout(() => {
      saveIdeasBoardState({ notes, paths });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notes, paths]);

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

  function handleAddNote() {
    recordHistorySnapshot();
    setNotes((current) => [
      ...current,
      createStickyNote(current.length, noteColor, boardSize.width, boardSize.height),
    ]);
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
  }

  function handleCanvasPointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    finalizeDraftPath(event.pointerId);
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

  const whiteboardHint = isTouchInput
    ? "Drag notes by the handle. Draw directly on the board with your finger."
    : "Drag notes by the handle. Draw or erase directly on the board.";

  return (
    <section className="ideas-page">
      <header className="ideas-page__header">
        <div>
          <p className="eyebrow">Ideas Board</p>
          <h1>Ideas whiteboard</h1>
          <p className="lead">
            A local-only planning surface for sticky notes, quick sketches, and throwaway thinking that persists in
            this browser.
          </p>
        </div>
        <div className="ideas-page__summary">
          <article className="ideas-summary-card">
            <span>Notes</span>
            <strong>{notes.length}</strong>
          </article>
          <article className="ideas-summary-card">
            <span>Sketches</span>
            <strong>{paths.length}</strong>
          </article>
        </div>
      </header>

      <section className="ideas-toolbar">
        <div className="ideas-toolbar__cluster">
          <button type="button" className="ideas-action ideas-action--primary" onClick={handleAddNote}>
            <i className="pi pi-plus" aria-hidden="true" />
            Add sticky note
          </button>
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
            className={tool === "pen" ? "ideas-toggle is-active" : "ideas-toggle"}
            onClick={() => setTool("pen")}
            aria-pressed={tool === "pen"}
          >
            <i className="pi pi-pencil" aria-hidden="true" />
            Pen
          </button>
          <button
            type="button"
            className={tool === "eraser" ? "ideas-toggle is-active" : "ideas-toggle"}
            onClick={() => setTool("eraser")}
            aria-pressed={tool === "eraser"}
          >
            <i className="pi pi-eraser" aria-hidden="true" />
            Eraser
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
              min="2"
              max="24"
              step="1"
              value={strokeWidth}
              onChange={(event) => setStrokeWidth(Number(event.target.value))}
            />
            <strong>{strokeWidth}px</strong>
          </label>
          <button type="button" className="ideas-action ideas-action--ghost" onClick={handleClearBoard}>
            <i className="pi pi-trash" aria-hidden="true" />
            Clear all
          </button>
        </div>
      </section>

      <section className="ideas-board-shell">
        <div className="ideas-board-meta">
          <p>{whiteboardHint}</p>
          <span>{tool === "eraser" ? "Erasing strokes" : "Sketching mode"}</span>
        </div>

        <div ref={boardRef} className="ideas-board">
          <canvas
            ref={canvasRef}
            className={tool === "eraser" ? "ideas-board__canvas is-erasing" : "ideas-board__canvas"}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerCancel}
          />

          {notes.length === 0 && paths.length === 0 ? (
            <div className="ideas-board__empty-state">
              <strong>Start with a note or a sketch</strong>
              <p>The board saves automatically to localStorage on this device.</p>
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
      </section>
    </section>
  );
}
