// Attribution Tycoon — canvas drawing helpers for the embed.
// Kept out of lib/ because these touch the DOM; lib/attribution-tycoon stays
// pure game logic.

export interface Series {
  color: string;
  data: number[];
  dashed?: boolean;
}

export interface LineOptions {
  min?: number;
  max?: number;
  yFormat?: (v: number) => string;
}

interface Prepared {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

function prep(canvas: HTMLCanvasElement): Prepared | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(200, rect.width);
  const h = Math.max(60, rect.height);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const VAR_PATTERN = /^var\((--[\w-]+)\)$/;
const resolved = new Map<string, string>();

/**
 * Canvas fillStyle/strokeStyle cannot resolve `var(--token)` — an unparseable
 * value is silently ignored and the context keeps its previous colour, which
 * paints everything black. Every colour that reaches the canvas goes through
 * here first.
 */
function resolveColor(color: string): string {
  const cached = resolved.get(color);
  if (cached) return cached;
  const match = VAR_PATTERN.exec(color);
  const out = match ? cssVar(match[1], "#ffffff") : color;
  resolved.set(color, out);
  return out;
}

/** Multi-series line chart with a shared Y axis. */
export function line(
  canvas: HTMLCanvasElement,
  series: Series[],
  opts: LineOptions = {},
) {
  const p = prep(canvas);
  if (!p) return;
  const { ctx, w, h } = p;

  const pad = { t: 12, r: 12, b: 22, l: 44 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;
  const muted = cssVar("--muted", "#9cabd6");
  const grid = "rgba(238, 242, 255, 0.10)";

  const all = series.flatMap((s) => s.data).filter((n) => Number.isFinite(n));
  if (!all.length) {
    ctx.fillStyle = muted;
    ctx.font = `12px ${MONO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No data yet — run your first day", w / 2, h / 2);
    return;
  }

  const autoMin = opts.min === undefined;
  const autoMax = opts.max === undefined;
  let min = autoMin ? Math.min(...all) : (opts.min as number);
  let max = autoMax ? Math.max(...all) : (opts.max as number);
  if (min === max) max = min + 1;
  const range = max - min;
  // Only auto-computed bounds get breathing room; explicit bounds are exact.
  if (autoMin) min -= range * 0.12;
  if (autoMax) max += range * 0.12;

  const n = Math.max(...series.map((s) => s.data.length));
  const xAt = (i: number) => pad.l + (n <= 1 ? gw / 2 : (i / (n - 1)) * gw);
  const yAt = (v: number) => pad.t + gh - ((v - min) / (max - min)) * gh;

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = muted;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (gh / 4) * i;
    const val = max - ((max - min) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillText(opts.yFormat ? opts.yFormat(val) : val.toFixed(1), pad.l - 7, y);
  }

  if (min < 0 && max > 0) {
    ctx.strokeStyle = "rgba(238, 242, 255, 0.28)";
    ctx.beginPath();
    ctx.moveTo(pad.l, yAt(0));
    ctx.lineTo(w - pad.r, yAt(0));
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = muted;
  const step = Math.max(1, Math.ceil(n / 8));
  for (let i = 0; i < n; i += step) {
    ctx.fillText(`D${i + 1}`, xAt(i), pad.t + gh + 6);
  }

  for (const s of series) {
    if (!s.data.length) continue;
    const stroke = resolveColor(s.color);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = s.dashed ? 1.5 : 2.1;
    ctx.setLineDash(s.dashed ? [5, 4] : []);
    ctx.beginPath();
    s.data.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    const li = s.data.length - 1;
    ctx.fillStyle = stroke;
    ctx.beginPath();
    ctx.arc(xAt(li), yAt(s.data[li]), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export interface BarPart {
  value: number;
  color: string;
}

/** Stacked horizontal bar — the attribution split. */
export function stackedBar(canvas: HTMLCanvasElement, parts: BarPart[]) {
  const p = prep(canvas);
  if (!p) return;
  const { ctx, w, h } = p;

  const total = parts.reduce((s, x) => s + x.value, 0) || 1;
  const barH = Math.min(26, h - 2);
  const y = (h - barH) / 2;
  let x = 0;

  for (const part of parts) {
    const pw = (part.value / total) * w;
    ctx.fillStyle = resolveColor(part.color);
    ctx.fillRect(x, y, Math.max(0, pw - 2), barH);
    if (pw > 44) {
      ctx.fillStyle = "rgba(15, 26, 46, 0.9)";
      ctx.font = `600 11px ${MONO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${((part.value / total) * 100).toFixed(0)}%`,
        x + pw / 2,
        y + barH / 2,
      );
    }
    x += pw;
  }
}

export interface BarGroup {
  label: string;
  values: Array<{ value: number; color: string; ghost?: boolean }>;
}

/** Grouped bars — true vs dashboard ROAS per channel. */
export function groupedBars(canvas: HTMLCanvasElement, groups: BarGroup[]) {
  const p = prep(canvas);
  if (!p) return;
  const { ctx, w, h } = p;

  const pad = { t: 10, r: 8, b: 24, l: 34 };
  const gw = w - pad.l - pad.r;
  const gh = h - pad.t - pad.b;
  const muted = cssVar("--muted", "#9cabd6");

  const max =
    Math.max(1, ...groups.flatMap((g) => g.values.map((v) => v.value))) * 1.15;

  ctx.strokeStyle = "rgba(238, 242, 255, 0.10)";
  ctx.fillStyle = muted;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 3; i++) {
    const y = pad.t + (gh / 3) * i;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillText((max - (max / 3) * i).toFixed(1), pad.l - 6, y);
  }

  const slot = gw / groups.length;
  groups.forEach((g, gi) => {
    const bw = Math.min(20, (slot - 14) / g.values.length);
    g.values.forEach((v, vi) => {
      const bh = (v.value / max) * gh;
      const x =
        pad.l + slot * gi + slot / 2 - (bw * g.values.length) / 2 + bw * vi;
      ctx.fillStyle = resolveColor(v.color);
      ctx.globalAlpha = v.ghost ? 0.4 : 1;
      ctx.fillRect(x, pad.t + gh - bh, bw - 2, bh);
      ctx.globalAlpha = 1;
    });
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `11px ${MONO}`;
    ctx.fillText(g.label, pad.l + slot * gi + slot / 2, pad.t + gh + 7);
  });
}
