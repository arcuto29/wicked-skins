/* Runs in the PAGE's JS world (manifest "world": "MAIN"; the desktop app injects it too).
   TradingView paints the chart inside <canvas>, so CSS alone can't restyle it. This hook:
     1. Background: when Wicked Skins is on, turns the full-pane background fill into a clear,
        so the skin shows through. Candles, grid, axes and drawings are untouched.
     2. Light theme: lightens dark axis text so it stays readable on dark skins.
     3. Candle colours: remaps TradingView's default up/down colours to the chosen ones,
        with an optional glow.
   Settings arrive via attributes on <html> (class "bd-on", data-bd-candles JSON).
   Nothing is read or sent anywhere; this only changes how things are drawn. */
(function () {
  if (window.__bdHooked) return;
  window.__bdHooked = true;

  const html = document.documentElement;
  const proto = CanvasRenderingContext2D.prototype;

  // ---------- settings ----------
  let on = html.classList.contains("bd-on");
  let candles = null; // { up:[r,g,b], down:[r,g,b], upHex, downHex, glow }
  const remapCache = new Map();

  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  function readCandles() {
    remapCache.clear();
    try {
      const raw = html.getAttribute("data-bd-candles");
      const c = raw ? JSON.parse(raw) : null;
      if (c && /^#[0-9a-f]{6}$/i.test(c.up) && /^#[0-9a-f]{6}$/i.test(c.down)) {
        candles = { up: hexToRgb(c.up), down: hexToRgb(c.down), upHex: c.up.toLowerCase(), downHex: c.down.toLowerCase(), glow: Math.max(0, Math.min(1, +c.glow || 0)) };
      } else candles = null;
    } catch { candles = null; }
  }
  readCandles();

  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.attributeName === "class") on = html.classList.contains("bd-on");
      if (m.attributeName === "data-bd-candles") readCandles();
    }
  }).observe(html, { attributes: true, attributeFilter: ["class", "data-bd-candles"] });

  // ---------- candle colour remap (fillStyle / strokeStyle setters) ----------
  // We recolour the candles TradingView actually draws. To know WHICH colours are candles we
  // read the chart's own candle settings (read-only, never written): your custom colours,
  // hollow candles, Heikin Ashi, bars... TradingView's defaults are always included as a fallback
  // (they also cover the default Volume bars).
  const scratch0 = document.createElement("canvas").getContext("2d");
  const origFillDesc = Object.getOwnPropertyDescriptor(proto, "fillStyle");
  function rgbKey(v) {                      // any CSS colour -> { key:"r,g,b", a:alpha } or null
    if (typeof v !== "string") return null;
    origFillDesc.set.call(scratch0, "#000"); origFillDesc.set.call(scratch0, v);
    const n = origFillDesc.get.call(scratch0);
    if (n[0] === "#") return { key: [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16)).join(","), a: null };
    const m = n.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    return m ? { key: m[1] + "," + m[2] + "," + m[3], a: m[4] === undefined ? null : m[4] } : null;
  }
  const DEFAULT_SIDES = [["#089981", "up"], ["#26a69a", "up"], ["#f23645", "down"], ["#ef5350", "down"]];
  let sides = new Map();                    // "r,g,b" -> "up" | "down"
  let sidesSig = "";
  const UP_KEYS = ["upColor", "borderUpColor", "wickUpColor"];
  const DOWN_KEYS = ["downColor", "borderDownColor", "wickDownColor"];
  const KIND = { upColor: "body", downColor: "body", borderUpColor: "border", borderDownColor: "border", wickUpColor: "wick", wickDownColor: "wick" };
  const STYLES = ["candleStyle", "hollowCandleStyle", "haStyle", "barStyle", "volCandlesStyle", "hlcBarsStyle"];

  function chartWidgets() {
    const api = window.TradingViewApi, out = [];
    try { const a = api && api._activeChartWidgetWV && api._activeChartWidgetWV.value(); if (a) out.push(a); } catch {}
    try { // multi-chart layouts
      const n = api && api.chartsCount ? api.chartsCount() : 0;
      for (let i = 0; i < n; i++) { const w = api.chart(i); if (w && !out.includes(w)) out.push(w); }
    } catch {}
    return out;
  }
  function learnSides() {
    const found = [];
    for (const w of chartWidgets()) {
      try {
        const p = (w._chartWidget || w).model().mainSeries().properties().childs();
        for (const st of STYLES) {
          const cs = p[st] && p[st].childs && p[st].childs();
          if (!cs) continue;
          for (const k of UP_KEYS) if (cs[k]) found.push([cs[k].value(), "up", KIND[k]]);
          for (const k of DOWN_KEYS) if (cs[k]) found.push([cs[k].value(), "down", KIND[k]]);
        }
      } catch {}
    }
    // A colour can be used by both sides (e.g. black borders on every candle + black down bodies).
    // Resolve by priority: body colour > border > wick > TradingView defaults.
    // Only a colour that is the BODY of both sides (or only a shared border/wick) is left alone.
    const RANK = { body: 3, border: 2, wick: 1, def: 0 };
    const best = new Map(); // key -> { side, rank, tie }
    for (const [c, side, kind] of [...DEFAULT_SIDES.map(([c, s]) => [c, s, "def"]), ...found]) {
      const r = rgbKey(c);
      if (!r) continue;
      const rank = RANK[kind], cur = best.get(r.key);
      if (!cur || rank > cur.rank) best.set(r.key, { side, rank, tie: false });
      else if (rank === cur.rank && side !== cur.side) cur.tie = true;
    }
    const next = new Map();
    for (const [k, v] of best) if (!v.tie) next.set(k, v.side);
    const sig = [...next].sort().join("|");
    if (sig !== sidesSig) {
      sides = next; sidesSig = sig; remapCache.clear();
      if (candles) forceRepaint();
    }
  }
  learnSides();
  setInterval(learnSides, 2000); // cheap: picks up chart/style/colour changes the user makes

  // Only recolour inside chart panes, never on the price/time axes (keeps label text intact).
  const paneCache = new WeakMap();
  function isPane(canvas) {
    if (!canvas) return false;
    let v = paneCache.get(canvas);
    if (v === undefined) {
      v = !!(canvas.closest && canvas.closest(".chart-markup-table") && !canvas.closest(".price-axis, .time-axis, [class*='price-axis'], [class*='time-axis']"));
      paneCache.set(canvas, v);
    }
    return v;
  }

  function remap(v) {
    if (!candles || typeof v !== "string") return v;
    let out = remapCache.get(v);
    if (out !== undefined) return out;
    out = v;
    const r = rgbKey(v);
    const side = r && sides.get(r.key);
    if (side) {
      const c = side === "up" ? candles.up : candles.down;
      out = r.a === null || r.a === "1" ? (side === "up" ? candles.upHex : candles.downHex) : `rgba(${c[0]},${c[1]},${c[2]},${r.a})`;
    }
    if (remapCache.size < 800) remapCache.set(v, out);
    return out;
  }

  for (const prop of ["fillStyle", "strokeStyle"]) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.set) continue;
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: d.enumerable,
      get: d.get,
      set(v) { d.set.call(this, candles && isPane(this.canvas) ? remap(v) : v); },
    });
  }

  // Same redraw trick as content.js: TradingView only rebuilds canvases when the chart is re-shown.
  let rpT;
  function forceRepaint() {
    clearTimeout(rpT);
    rpT = setTimeout(() => document.querySelectorAll(".chart-container").forEach((el) => {
      const prev = el.style.display; el.style.display = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => { el.style.display = prev; }));
    }), 150);
  }

  // ---------- helpers ----------
  const chartCache = new WeakMap();
  function inChart(canvas) {
    let v = chartCache.get(canvas);
    if (v === undefined) {
      v = !!(canvas.closest && canvas.closest(".chart-container, .chart-markup-table"));
      chartCache.set(canvas, v);
    }
    return v;
  }

  // ---------- light theme: lighten dark text on dark skins ----------
  const origText = proto.fillText;
  const darkCache = new Map();
  const scratch = document.createElement("canvas").getContext("2d");
  function isDark(style) {
    if (typeof style !== "string") return false;
    let v = darkCache.get(style);
    if (v === undefined) {
      scratch.fillStyle = "#000"; scratch.fillStyle = style;
      const m = scratch.fillStyle.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      const rgb = m ? [1, 2, 3].map((i) => parseInt(m[i], 16)) : (scratch.fillStyle.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number);
      v = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] < 110;
      darkCache.set(style, v);
    }
    return v;
  }
  proto.fillText = function (...a) {
    if (on && html.classList.contains("theme-light") && !html.classList.contains("bd-over-mode") &&
        this.canvas && inChart(this.canvas) && isDark(this.fillStyle)) {
      const prev = this.fillStyle;
      this.fillStyle = "#e8eaf0";
      origText.apply(this, a);
      this.fillStyle = prev;
      return;
    }
    return origText.apply(this, a);
  };

  // ---------- fillRect: transparent pane background + candle glow ----------
  const origFill = proto.fillRect;
  proto.fillRect = function (x, y, w, h) {
    const c = this.canvas;
    if (on && c && c.width > 20 && c.height > 20) {
      const s = this.getTransform().a || 1;
      // covers (nearly) the whole canvas => it's the pane background
      if (w * s >= c.width * 0.98 && h * s >= c.height * 0.98 && inChart(c)) {
        return this.clearRect(x, y, w, h);
      }
    }
    if (candles && candles.glow > 0 && c && w * (this.getTransform().a || 1) >= 2 && h < c.height * 0.8) {
      const fs = this.fillStyle; // already remapped, normalised to "#rrggbb" for opaque colours
      if (fs === candles.upHex || fs === candles.downHex) {
        this.save();
        this.shadowColor = fs;
        this.shadowBlur = 4 + candles.glow * 22;
        origFill.call(this, x, y, w, h);
        this.restore();
        return;
      }
    }
    return origFill.call(this, x, y, w, h);
  };
})();
