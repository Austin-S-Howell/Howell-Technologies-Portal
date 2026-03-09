import { PortalApp } from "@howell-technologies/portal";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { createDefaultPOCState } from "../poc/defaults";
import { loadPOCStateFromStorage, savePOCStateToStorage } from "../poc/storage";
import type { POCGeneratorState } from "../poc/types";
import type { PowerBIReportRef } from "@howell-technologies/portal";

type DerivedTheme = {
  primary: string;
  accent: string;
  surface: string;
  text: string;
  mutedText: string;
};

function makeInitialState(): POCGeneratorState {
  const fallback = createDefaultPOCState();
  const loaded = loadPOCStateFromStorage();
  if (!loaded) {
    return fallback;
  }

  return {
    ...loaded,
    config: {
      ...loaded.config,
      // Keep demo report experience deterministic regardless of older saved state.
      reports: fallback.config.reports,
      multiViews: fallback.config.multiViews,
    },
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgb(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function mixHexColors(first: string, second: string, ratio: number) {
  const left = hexToRgb(first);
  const right = hexToRgb(second);
  if (!left || !right) {
    return first;
  }
  const weight = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    left.r * (1 - weight) + right.r * weight,
    left.g * (1 - weight) + right.g * weight,
    left.b * (1 - weight) + right.b * weight,
  );
}

function getLuminance(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) {
    return 0;
  }
  const normalize = (value: number) => value / 255;
  return 0.2126 * normalize(rgb.r) + 0.7152 * normalize(rgb.g) + 0.0722 * normalize(rgb.b);
}

function colorSaturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

function deriveThemeFromPixelData(pixels: Uint8ClampedArray): DerivedTheme | null {
  const bins = new Map<string, { count: number; r: number; g: number; b: number; saturation: number }>();

  for (let index = 0; index < pixels.length; index += 16) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const alpha = pixels[index + 3];

    if (alpha < 180) {
      continue;
    }

    const key = `${Math.round(r / 24) * 24}-${Math.round(g / 24) * 24}-${Math.round(b / 24) * 24}`;
    const existing = bins.get(key);
    if (existing) {
      existing.count += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.saturation += colorSaturation(r, g, b);
    } else {
      bins.set(key, {
        count: 1,
        r,
        g,
        b,
        saturation: colorSaturation(r, g, b),
      });
    }
  }

  const ranked = [...bins.values()].sort((left, right) => right.count - left.count);
  if (!ranked.length) {
    return null;
  }

  const toHex = (entry: { count: number; r: number; g: number; b: number }) =>
    rgbToHex(entry.r / entry.count, entry.g / entry.count, entry.b / entry.count);

  const dominantHex = toHex(ranked[0]);
  const accentCandidate =
    [...ranked]
      .filter((entry) => entry.count >= 3)
      .sort((left, right) => right.saturation / right.count - left.saturation / left.count)[0] ?? ranked[0];
  const accentHex = toHex(accentCandidate);
  const surfaceHex = mixHexColors(dominantHex, "#ffffff", 0.88);
  const textHex = getLuminance(surfaceHex) > 0.65 ? "#1b2f3a" : "#f3f8fb";
  const mutedTextHex = mixHexColors(textHex, surfaceHex, 0.42);

  return {
    primary: dominantHex,
    accent: accentHex,
    surface: surfaceHex,
    text: textHex,
    mutedText: mutedTextHex,
  };
}

async function extractThemeFromImage(logoUrl: string): Promise<DerivedTheme | null> {
  return await new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const sampleWidth = 120;
      const sampleHeight = 120;
      const canvas = document.createElement("canvas");
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
      resolve(deriveThemeFromPixelData(imageData.data));
    };
    image.onerror = () => resolve(null);
    image.src = logoUrl;
  });
}

function buildStockMockReportHtml(reportName: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${reportName}</title>
    <style>
      :root { font-family: Manrope, Segoe UI, sans-serif; color-scheme: light; }
      body { margin: 0; background: linear-gradient(180deg, #f9fcfe 0%, #edf3f7 100%); color: #193543; }
      .page { display: grid; gap: 12px; padding: 14px; }
      .panel { background: #fff; border: 1px solid #c5ced5; border-radius: 10px; padding: 10px 12px; }
      .header { display: flex; justify-content: space-between; align-items: center; }
      .eyebrow { margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #4e6c7b; }
      .title { margin: 2px 0 0; font-size: 18px; font-weight: 700; }
      .live { border: 1px solid rgba(22,157,106,.35); background: rgba(22,157,106,.13); color: #0f7a51; border-radius: 999px; padding: 6px 10px; font-weight: 700; font-size: 13px; }
      .kpis { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .kpi { display: grid; gap: 4px; }
      .kpi strong { font-size: 24px; line-height: 1.1; }
      .pill { display: inline-block; width: fit-content; border-radius: 999px; border: 1px solid rgba(22,157,106,.34); background: rgba(22,157,106,.14); color: #12714f; padding: 4px 8px; font-weight: 700; font-size: 13px; }
      .charts { display: grid; gap: 10px; grid-template-columns: 1.4fr 1fr; }
      .bars { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; align-items: end; min-height: 120px; }
      .bar { border-radius: 6px; }
      .watch { display: grid; gap: 8px; }
      .row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; background: #f5f9fb; border: 1px solid #c5ced5; border-radius: 8px; padding: 8px 10px; }
      .up { color: #177a57; font-weight: 700; }
      .down { color: #9d3434; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="panel header">
        <div>
          <p class="eyebrow">Market Report</p>
          <p class="title">${reportName}</p>
        </div>
        <span class="live">Live</span>
      </section>

      <section class="kpis">
        <article class="panel kpi"><span class="eyebrow">S&P 500</span><strong>5,211.23</strong><span class="pill">+0.82%</span></article>
        <article class="panel kpi"><span class="eyebrow">NASDAQ</span><strong>16,489.64</strong><span class="pill">+1.11%</span></article>
        <article class="panel kpi"><span class="eyebrow">Dow Jones</span><strong>39,018.52</strong><span class="pill" style="color:#1f628f;border-color:rgba(42,111,155,.32);background:rgba(42,111,155,.14)">+0.32%</span></article>
      </section>

      <section class="charts">
        <article class="panel">
          <p class="eyebrow">7-Day Trend</p>
          <svg viewBox="0 0 275 110" role="img" aria-label="Stock trend chart" style="width:100%;height:120px">
            <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(13,103,126,.32)" /><stop offset="100%" stop-color="rgba(13,103,126,.04)" /></linearGradient></defs>
            <polyline points="5,108 5,92 28,76 50,81 74,64 96,70 120,52 145,44 170,37 196,41 220,28 246,34 270,22 270,108" fill="url(#fill)" />
            <polyline points="5,92 28,76 50,81 74,64 96,70 120,52 145,44 170,37 196,41 220,28 246,34 270,22" fill="none" stroke="#0d677e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </article>
        <article class="panel">
          <p class="eyebrow">Volume</p>
          <div class="bars">
            <span class="bar" style="height:56%;background:rgba(27,140,98,.72)"></span>
            <span class="bar" style="height:72%;background:rgba(13,103,126,.72)"></span>
            <span class="bar" style="height:44%;background:rgba(27,140,98,.72)"></span>
            <span class="bar" style="height:81%;background:rgba(13,103,126,.72)"></span>
            <span class="bar" style="height:63%;background:rgba(27,140,98,.72)"></span>
            <span class="bar" style="height:75%;background:rgba(13,103,126,.72)"></span>
            <span class="bar" style="height:68%;background:rgba(27,140,98,.72)"></span>
            <span class="bar" style="height:84%;background:rgba(13,103,126,.72)"></span>
          </div>
        </article>
      </section>

      <section class="panel">
        <p class="eyebrow">Watchlist</p>
        <div class="watch">
          <div class="row"><strong>MSFT</strong><strong>$428.61</strong><span class="up">+1.24%</span></div>
          <div class="row"><strong>AAPL</strong><strong>$213.17</strong><span class="up">+0.71%</span></div>
          <div class="row"><strong>NVDA</strong><strong>$967.86</strong><span class="up">+2.09%</span></div>
          <div class="row"><strong>AMZN</strong><strong>$189.31</strong><span class="down">-0.34%</span></div>
        </div>
      </section>
    </div>
  </body>
</html>`;
}

function resolvePOCReportEmbedUrl(report: PowerBIReportRef | undefined): string {
  if (!report) {
    return "about:blank";
  }
  if (report.embedUrl.startsWith("demo://")) {
    return `data:text/html;charset=utf-8,${encodeURIComponent(buildStockMockReportHtml(report.name))}`;
  }
  return report.embedUrl;
}

export function DemoWorkbenchPage() {
  const [pocState, setPocState] = useState<POCGeneratorState>(makeInitialState);
  const [isBuilderVisible, setIsBuilderVisible] = useState(true);
  const [websiteLogoSource, setWebsiteLogoSource] = useState("");
  const [builderError, setBuilderError] = useState("");

  const preview = useMemo(() => {
    return {
      branding: pocState.config.branding,
      features: pocState.config.features,
      session: pocState.config.session,
      adapter: {
        auth: {
          getSession: async () => pocState.config.session,
        },
        portalData: {
          getContent: async () => pocState.config.content,
        },
        reports: {
          getReports: async () => pocState.config.reports,
          getMultiViews: async () => pocState.config.multiViews,
        },
        powerBI: {
          getEmbedInfo: async ({ reportId, groupId, pageName }: { reportId: string; groupId?: string; pageName?: string }) => {
            const report = pocState.config.reports.find((entry) => entry.reportId === reportId && entry.groupId === groupId);
            return {
              reportId,
              groupId,
              pageName,
              embedUrl: resolvePOCReportEmbedUrl(report),
              embedToken: "preview-token",
              tokenExpiry: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            };
          },
        },
      },
    };
  }, [pocState.config]);

  useEffect(() => {
    savePOCStateToStorage(pocState);
  }, [pocState]);

  function updateCompanyName(value: string) {
    setPocState((previous) => ({
      ...previous,
      configName: `${value || "Company"} POC`,
      config: {
        ...previous.config,
        companyName: value,
        branding: {
          ...previous.config.branding,
          companyName: value,
        },
        content: {
          ...previous.config.content,
          headline: value ? `${value} Portal` : "POC Portal Experience",
        },
      },
    }));
  }

  function updateLogoUrl(value: string) {
    setPocState((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        branding: {
          ...previous.config.branding,
          logoUrl: value,
        },
      },
    }));
  }

  async function applyThemeFromLogo(logoUrl: string) {
    const derivedTheme = await extractThemeFromImage(logoUrl);
    if (!derivedTheme) {
      return;
    }

    setPocState((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        branding: {
          ...previous.config.branding,
          theme: {
            ...previous.config.branding.theme,
            ...derivedTheme,
          },
        },
      },
    }));
  }

  function applyWebsiteLogo() {
    setBuilderError("");
    const source = websiteLogoSource.trim();
    if (!source) {
      setBuilderError("Enter a website URL before applying a logo from website.");
      return;
    }
    try {
      const normalized = source.startsWith("http://") || source.startsWith("https://") ? source : `https://${source}`;
      const hostname = new URL(normalized).hostname;
      if (!hostname) {
        throw new Error("Invalid website URL.");
      }
      const logoUrl = `https://logo.clearbit.com/${hostname}`;
      updateLogoUrl(logoUrl);
      void applyThemeFromLogo(logoUrl);
    } catch {
      setBuilderError("Invalid website URL. Use a domain like example.com.");
    }
  }

  function onLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (result) {
        updateLogoUrl(result);
        void applyThemeFromLogo(result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function updateThemeColor(field: "primary" | "surface" | "accent", value: string) {
    setPocState((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        branding: {
          ...previous.config.branding,
          theme: {
            ...previous.config.branding.theme,
            [field]: value,
          },
        },
      },
    }));
  }

  return (
    <div className={`poc-generator-fullscreen ${isBuilderVisible ? "" : "poc-generator-fullscreen--focus"}`}>
      {isBuilderVisible ? (
        <section className="dashboard-panel poc-generator-controls">
          <div className="poc-generator-controls__header">
            <div>
              <p className="eyebrow">POC Demo</p>
              <h1>Company proof-of-concept builder</h1>
              <p className="lead" style={{ marginTop: 8 }}>
                Demo mode only. This view uses seeded portal data without Microsoft login or live report generation.
              </p>
            </div>
            <button type="button" className="button-link" onClick={() => setIsBuilderVisible(false)}>
              Dismiss Builder
            </button>
          </div>

          <div className="poc-generator-controls__grid">
            <label className="poc-field">
              <span>Company Name</span>
              <input value={pocState.config.companyName} onChange={(event) => updateCompanyName(event.target.value)} />
            </label>

            <label className="poc-field">
              <span>Company Logo URL</span>
              <input
                placeholder="https://..."
                value={pocState.config.branding.logoUrl ?? ""}
                onChange={(event) => updateLogoUrl(event.target.value)}
              />
            </label>

            <label className="poc-field">
              <span>Upload Logo Image</span>
              <input type="file" accept="image/*" onChange={onLogoUpload} />
            </label>

            <div className="poc-field">
              <span>Website Logo Source</span>
              <div className="poc-input-action">
                <input
                  placeholder="company.com"
                  value={websiteLogoSource}
                  onChange={(event) => setWebsiteLogoSource(event.target.value)}
                />
                <button type="button" className="button-link" onClick={applyWebsiteLogo}>
                  Use Website Logo
                </button>
              </div>
            </div>

            <div className="poc-color-row">
              <label className="poc-field">
                <span>Primary</span>
                <input
                  type="color"
                  value={pocState.config.branding.theme?.primary ?? "#0d677e"}
                  onChange={(event) => updateThemeColor("primary", event.target.value)}
                />
              </label>
              <label className="poc-field">
                <span>Surface</span>
                <input
                  type="color"
                  value={pocState.config.branding.theme?.surface ?? "#d5dde2"}
                  onChange={(event) => updateThemeColor("surface", event.target.value)}
                />
              </label>
              <label className="poc-field">
                <span>Accent</span>
                <input
                  type="color"
                  value={pocState.config.branding.theme?.accent ?? "#c5ced5"}
                  onChange={(event) => updateThemeColor("accent", event.target.value)}
                />
              </label>
            </div>
          </div>

          {builderError ? <p className="demo-error">{builderError}</p> : null}
        </section>
      ) : (
        <button type="button" className="button-link poc-builder-open" onClick={() => setIsBuilderVisible(true)}>
          Open POC Builder
        </button>
      )}
      <section className="poc-generator-preview-shell">
        <PortalApp {...preview} basePath="/demo-workbench" />
      </section>
    </div>
  );
}
