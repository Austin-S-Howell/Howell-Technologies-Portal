import { describe, expect, it } from "vitest";
import { buildIdeasBoardSummaryHtml } from "./ideasExport";

describe("buildIdeasBoardSummaryHtml", () => {
  it("renders a readable export and escapes note content", () => {
    const html = buildIdeasBoardSummaryHtml({
      notes: [
        {
          id: "note-1",
          x: 0.1,
          y: 0.2,
          width: 240,
          height: 184,
          text: "Line 1\n<script>alert('xss')</script>",
          color: "#f8e587",
        },
      ],
      paths: [],
      snapshotDataUrl: "data:image/png;base64,abc123",
      exportedAt: new Date("2026-04-01T12:34:00Z"),
    });

    expect(html).toContain("Ideas board export");
    expect(html).toContain("Sticky note 1");
    expect(html).toContain("data:image/png;base64,abc123");
    expect(html).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('xss')</script>");
  });
});
