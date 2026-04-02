import {
  MIN_NOTE_HEIGHT,
  MIN_NOTE_WIDTH,
  type DrawingPath,
  type StickyNote,
  type WhiteboardPoint,
} from "./ideasStorage";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePoint(point: WhiteboardPoint, width: number, height: number) {
  return {
    x: point.x * width,
    y: point.y * height,
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

function drawBoardBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(248, 249, 252, 0.96)");
  gradient.addColorStop(1, "rgba(238, 240, 244, 0.98)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(width * 0.82, height * 0.08, 8, width * 0.82, height * 0.08, width * 0.38);
  radial.addColorStop(0, "rgba(184, 107, 61, 0.2)");
  radial.addColorStop(1, "rgba(184, 107, 61, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(97, 102, 114, 0.05)";
  ctx.lineWidth = 1;
  for (let y = 32; y < height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(97, 102, 114, 0.04)";
  for (let x = 32; x < width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapNoteText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const lines: string[] = [];
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const nextLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(nextLine).width <= maxWidth) {
        currentLine = nextLine;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const trimmed = lines.slice(0, maxLines);
  const lastLine = trimmed[maxLines - 1] ?? "";
  let finalLine = lastLine;
  while (finalLine.length > 0 && ctx.measureText(`${finalLine}...`).width > maxWidth) {
    finalLine = finalLine.slice(0, -1).trimEnd();
  }
  trimmed[maxLines - 1] = `${finalLine || lastLine.slice(0, 1)}...`;
  return trimmed;
}

function drawStickyNote(ctx: CanvasRenderingContext2D, note: StickyNote, boardWidth: number, boardHeight: number) {
  const frame = getRenderedNoteFrame(note, boardWidth, boardHeight);
  const radius = 18;

  ctx.save();
  ctx.shadowColor = "rgba(47, 52, 61, 0.18)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  drawRoundedRect(ctx, frame.left, frame.top, frame.width, frame.height, radius);
  ctx.fillStyle = note.color;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, frame.left, frame.top, frame.width, frame.height, radius);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(47, 52, 61, 0.14)";
  ctx.stroke();

  const headerHeight = 42;
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  drawRoundedRect(ctx, frame.left, frame.top, frame.width, headerHeight, 18);
  ctx.fill();

  ctx.fillStyle = "rgba(47, 52, 61, 0.6)";
  ctx.beginPath();
  ctx.arc(frame.left + 22, frame.top + 22, 5, 0, Math.PI * 2);
  ctx.arc(frame.left + 36, frame.top + 22, 5, 0, Math.PI * 2);
  ctx.arc(frame.left + 50, frame.top + 22, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '500 15px "Inter", "Segoe UI", sans-serif';
  ctx.fillStyle = "#2d3038";
  const lines = wrapNoteText(ctx, note.text || "Empty note", frame.width - 28, Math.max(2, Math.floor((frame.height - 70) / 20)));
  const startX = frame.left + 14;
  let startY = frame.top + 62;

  for (const line of lines) {
    ctx.fillText(line, startX, startY);
    startY += 20;
  }
  ctx.restore();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildFileStem(date: Date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ];
  return `ideas-board-${parts.join("-")}`;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function noteTextToHtml(text: string) {
  const normalized = (text || "").trim();
  if (!normalized) {
    return "<p class=\"ideas-export__note-text is-empty\">Empty note</p>";
  }

  return normalized
    .split(/\n{2,}/)
    .map((block) => `<p class="ideas-export__note-text">${escapeHtml(block).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export function createIdeasBoardSnapshotCanvas({
  notes,
  paths,
  width,
  height,
}: {
  notes: StickyNote[];
  paths: DrawingPath[];
  width: number;
  height: number;
}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas export is not supported in this browser.");
  }

  const safeWidth = Math.max(720, Math.round(width));
  const safeHeight = Math.max(480, Math.round(height));
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  canvas.width = Math.round(safeWidth * dpr);
  canvas.height = Math.round(safeHeight * dpr);
  canvas.style.width = `${safeWidth}px`;
  canvas.style.height = `${safeHeight}px`;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBoardBackground(context, safeWidth, safeHeight);

  for (const path of paths) {
    drawPath(context, path, safeWidth, safeHeight);
  }

  for (const note of notes) {
    drawStickyNote(context, note, safeWidth, safeHeight);
  }

  return canvas;
}

export function downloadIdeasBoardSnapshotPng({
  notes,
  paths,
  width,
  height,
}: {
  notes: StickyNote[];
  paths: DrawingPath[];
  width: number;
  height: number;
}) {
  const canvas = createIdeasBoardSnapshotCanvas({ notes, paths, width, height });
  const dataUrl = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${buildFileStem(new Date())}.png`;
  document.body.append(link);
  link.click();
  link.remove();
}

export function buildIdeasBoardSummaryHtml({
  notes,
  paths,
  snapshotDataUrl,
  exportedAt = new Date(),
}: {
  notes: StickyNote[];
  paths: DrawingPath[];
  snapshotDataUrl: string;
  exportedAt?: Date;
}) {
  const noteCards = notes
    .map(
      (note, index) => `
        <article class="ideas-export__note-card">
          <div class="ideas-export__note-accent" style="background:${escapeHtml(note.color)}"></div>
          <div class="ideas-export__note-body">
            <div class="ideas-export__note-meta">
              <strong>Sticky note ${index + 1}</strong>
              <span>${Math.round(note.width)} x ${Math.round(note.height)} px</span>
            </div>
            ${noteTextToHtml(note.text)}
          </div>
        </article>
      `,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ideas Board Summary</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Inter", "Segoe UI", sans-serif;
        --ink: #24313a;
        --muted: #64717e;
        --line: rgba(77, 86, 97, 0.16);
        --panel: #ffffff;
        --bg: #f3f5f8;
        --copper: #b86b3d;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: linear-gradient(180deg, #fbfcfd 0%, #eef2f5 100%);
        color: var(--ink);
      }
      .ideas-export {
        max-width: 1080px;
        margin: 0 auto;
        display: grid;
        gap: 20px;
      }
      .ideas-export__hero,
      .ideas-export__panel {
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 18px 34px rgba(36, 49, 58, 0.08);
      }
      .ideas-export__hero {
        display: grid;
        gap: 18px;
      }
      .ideas-export__eyebrow {
        margin: 0;
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--copper);
        font-weight: 700;
      }
      h1 {
        margin: 8px 0 10px;
        font-size: 2rem;
      }
      .ideas-export__meta {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      .ideas-export__stats {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .ideas-export__stat {
        min-width: 140px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--bg);
        padding: 14px 16px;
      }
      .ideas-export__stat span {
        display: block;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .ideas-export__stat strong {
        display: block;
        margin-top: 6px;
        font-size: 1.65rem;
      }
      .ideas-export__snapshot {
        width: 100%;
        display: block;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #fff;
      }
      .ideas-export__panel h2 {
        margin: 0 0 14px;
        font-size: 1.15rem;
      }
      .ideas-export__notes {
        display: grid;
        gap: 14px;
      }
      .ideas-export__note-card {
        display: grid;
        grid-template-columns: 10px 1fr;
        border: 1px solid var(--line);
        border-radius: 18px;
        overflow: hidden;
        background: var(--panel);
      }
      .ideas-export__note-body {
        padding: 16px 18px;
      }
      .ideas-export__note-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
        margin-bottom: 10px;
      }
      .ideas-export__note-meta span {
        color: var(--muted);
        font-size: 0.9rem;
      }
      .ideas-export__note-text {
        margin: 0;
        color: var(--ink);
        line-height: 1.65;
        white-space: normal;
      }
      .ideas-export__note-text + .ideas-export__note-text {
        margin-top: 10px;
      }
      .ideas-export__note-text.is-empty {
        color: var(--muted);
        font-style: italic;
      }
      @media print {
        body {
          padding: 0;
          background: #fff;
        }
        .ideas-export {
          max-width: none;
        }
        .ideas-export__hero,
        .ideas-export__panel {
          box-shadow: none;
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <main class="ideas-export">
      <section class="ideas-export__hero">
        <div>
          <p class="ideas-export__eyebrow">Howell Technologies</p>
          <h1>Ideas board export</h1>
          <p class="ideas-export__meta">Saved ${escapeHtml(formatTimestamp(exportedAt))}. This export includes a board snapshot and a readable summary of the current sticky notes.</p>
        </div>
        <div class="ideas-export__stats">
          <article class="ideas-export__stat">
            <span>Notes</span>
            <strong>${notes.length}</strong>
          </article>
          <article class="ideas-export__stat">
            <span>Sketches</span>
            <strong>${paths.length}</strong>
          </article>
        </div>
        <img class="ideas-export__snapshot" src="${snapshotDataUrl}" alt="Ideas board snapshot" />
      </section>

      <section class="ideas-export__panel">
        <h2>Sticky note transcript</h2>
        <div class="ideas-export__notes">
          ${noteCards || '<p class="ideas-export__note-text is-empty">No sticky note text was captured on this board.</p>'}
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export function downloadIdeasBoardSummaryHtml({
  notes,
  paths,
  width,
  height,
}: {
  notes: StickyNote[];
  paths: DrawingPath[];
  width: number;
  height: number;
}) {
  const canvas = createIdeasBoardSnapshotCanvas({ notes, paths, width, height });
  const html = buildIdeasBoardSummaryHtml({
    notes,
    paths,
    snapshotDataUrl: canvas.toDataURL("image/png"),
  });
  triggerBlobDownload(new Blob([html], { type: "text/html;charset=utf-8" }), `${buildFileStem(new Date())}.html`);
}
