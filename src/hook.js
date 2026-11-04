/* Runs in the PAGE's JS world (manifest "world": "MAIN"; the desktop app injects it too).
   TradingView paints the chart inside <canvas>, so CSS alone can't restyle it. This hook:
     1. Background: when Wicked Skins is on, turns the full-pane background fill into a clear,
        so the skin shows through. Candles, grid, axes and drawings are untouched.
     2. Light theme: lightens dark axis text so it stays readable on dark skins.
     3. Candle colours: remaps TradingView's default up/down colours to the chosen ones,
        with an optional glow.
     4. Glow on indicator / drawing / price lines, and price-scale styling (text colour, glow,
        bold, background, label colours).
   Settings arrive via attributes on <html> (class "bd-on", data-ws-candles + data-ws-fx JSON).
   Nothing is read or sent anywhere; this only changes how things are drawn. */
(function () {
  // Bump HOOK_VERSION whenever this file learns something new. A newer hook still installs if an older one is
  // already on the page (e.g. two copies of the extension installed), so new settings always work.
  const HOOK_VERSION = 4;
  if (window.__bdHooked && (window.__bdHookVer || 1) >= HOOK_VERSION) return;
  const olderHook = !!window.__bdHooked;
  window.__bdHooked = true;
  window.__bdHookVer = HOOK_VERSION;
  // An older copy of the extension already wrapped the canvas API. Put the browser's own untouched functions back
  // (taken from a fresh hidden frame), so the old wrappers are cut out and only this version draws.
  if (olderHook) {
    try {
      const f = document.createElement("iframe"); f.style.display = "none";
      (document.documentElement || document.head || document.body).appendChild(f);
      const N = f.contentWindow.CanvasRenderingContext2D.prototype, P = CanvasRenderingContext2D.prototype;
      for (const m of ["fillText", "fillRect", "fill", "stroke", "beginPath", "moveTo", "lineTo", "strokeRect"]) P[m] = N[m];
      for (const prop of ["fillStyle", "strokeStyle"]) Object.defineProperty(P, prop, Object.getOwnPropertyDescriptor(N, prop));
      f.remove();
    } catch {}
  }

  // <html> can be missing when this runs very early (desktop app preload), so always look it up lazily.
  const EMPTY = { classList: { contains: () => false }, getAttribute: () => null };
  const htmlEl = () => document.documentElement || EMPTY;
  const proto = CanvasRenderingContext2D.prototype;

  // ---------- settings ----------
  let on = htmlEl().classList.contains("bd-on");
  let candles = null; // { up:[r,g,b], down:[r,g,b], upHex, downHex, glow }
  const remapCache = new Map();

  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  function readCandles() {
    remapCache.clear();
    try {
      const raw = htmlEl().getAttribute("data-ws-candles");
      const c = raw ? JSON.parse(raw) : null;
      if (c && /^#[0-9a-f]{6}$/i.test(c.up) && /^#[0-9a-f]{6}$/i.test(c.down)) {
        candles = { up: hexToRgb(c.up), down: hexToRgb(c.down), upHex: c.up.toLowerCase(), downHex: c.down.toLowerCase(),
          glow: Math.max(0, Math.min(1, +c.glow || 0)), look: ["solid", "neon", "prism", "shift"].includes(c.look) ? c.look : "solid" };
      } else candles = null;
    } catch { candles = null; }
  }
  readCandles();

  // Line glow + price scale styling
  const FX0 = { lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: false,
    scaleSize: 0, scaleFont: "default", bg: null, busy: false, prof: [], profs: [] };
  let fx = { ...FX0 };
  function readFx() {
    try {
      const raw = htmlEl().getAttribute("data-ws-fx"), f = raw ? JSON.parse(raw) : {};
      fx = {
        lineGlow: Math.max(0, Math.min(1, +f.lineGlow || 0)),
        scaleText: /^#[0-9a-f]{6}$/i.test(f.scaleText || "") ? f.scaleText : "",
        scaleGlow: Math.max(0, Math.min(1, +f.scaleGlow || 0)),
        scaleBold: !!f.scaleBold,
        scaleBg: ["auto", "glass", "color", "default"].includes(f.scaleBg) ? f.scaleBg : "auto",
        scaleBgColor: /^#[0-9a-f]{6}$/i.test(f.scaleBgColor || "") ? f.scaleBgColor : "#0b1320",
        scaleSize: Math.max(0, Math.min(2, +f.scaleSize || 0)),
        scaleFont: ["default", "mono", "rounded"].includes(f.scaleFont) ? f.scaleFont : "default",
        scaleLabels: !!f.scaleLabels,
        bg: f.bg === "dark" || f.bg === "light" ? f.bg : null,   // measured brightness of the wallpaper (content.js)
        busy: !!f.busy,                                           // wallpaper has lots of contrast behind the scale
        prof: Array.isArray(f.prof) ? f.prof.slice(0, 18).map(Number) : [],  // brightness behind the price scale, top->bottom
        // one profile per chart (multi-chart layouts): { l, t, r, b } = the chart's box on screen, p = profile
        profs: Array.isArray(f.profs) ? f.profs.slice(0, 16).filter((q) => q && Array.isArray(q.p))
          .map((q) => ({ l: +q.l || 0, t: +q.t || 0, r: +q.r || 0, b: +q.b || 0, p: q.p.slice(0, 18).map(Number) })) : [],
      };
    } catch { fx = { ...FX0 }; }
    remapCache.clear();
    const sig = JSON.stringify([fx.lineGlow, fx.scaleText, fx.scaleGlow, fx.scaleBold, fx.scaleBg, fx.scaleBgColor, fx.scaleLabels, fx.scaleSize, fx.scaleFont]);
    const userChanged = sig !== fxSig; fxSig = sig;
    return userChanged;
  }
  let fxSig = "";
  readFx();

  const settingsObserver = new MutationObserver((muts) => {
    let repaint = false, soft = false;
    for (const m of muts) {
      if (m.attributeName === "class") on = htmlEl().classList.contains("bd-on");
      if (m.attributeName === "data-ws-candles") readCandles();
      if (m.attributeName === "data-ws-fx") { if (readFx()) repaint = true; else soft = true; }
    }
    if (repaint) forceRepaint(false);
    else if (soft) forceRepaint(true);   // brightness-only update: redraw only if it can be done without a blink
  });
  (function watchSettings() {
    const el = document.documentElement;
    if (!el) return setTimeout(watchSettings, 5);            // wait for the page's <html>
    settingsObserver.observe(el, { attributes: true, attributeFilter: ["class", "data-ws-candles", "data-ws-fx"] });
    on = el.classList.contains("bd-on"); readCandles(); readFx();
  })();

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
    const api = window.TradingViewApi || window.tradingViewApi, out = [];
    try { const a = api && api._activeChartWidgetWV && api._activeChartWidgetWV.value(); if (a) out.push(a); } catch {}
    try { // multi-chart layouts
      const n = api && api.chartsCount ? api.chartsCount() : 0;
      for (let i = 0; i < n; i++) { const w = api.chart(i); if (w && !out.includes(w)) out.push(w); }
    } catch {}
    return out;
  }
  let scaleTextKey = null; // "r,g,b" of TradingView's axis label colour
  function learnSides() {
    const found = [];
    try {
      const w = chartWidgets()[0], cw = w && (w._chartWidget || w);
      const props = cw && (cw.model().model ? cw.model().model().properties() : cw.properties());
      const sp = props && props.childs().scalesProperties.childs();
      const r = sp && rgbKey(sp.textColor.value());
      scaleTextKey = r ? r.key : null;
    } catch {}
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
    if (!found.length) for (const [c, side] of learnedFromDrawing()) {        // no API: use what we saw drawn
      const r = rgbKey(c); if (r && !best.has(r.key)) best.set(r.key, { side, rank: RANK.body, tie: false });
    }
    const next = new Map();
    for (const [k, v] of best) if (!v.tie) next.set(k, v.side);
    const sig = [...next].sort().join("|");
    if (sig !== sidesSig) {
      sides = next; sidesSig = sig; remapCache.clear();
      if (candles) forceRepaint(false);
    }
  }
  // Fallback for platforms without TradingView's internal API: the two most-drawn small, opaque,
  // colourful fills in the chart are the candles. Greener one = up, the other = down.
  const tally = new Map();
  function noteFill(col) { if (typeof col === "string" && tally.size < 300) tally.set(col, (tally.get(col) || 0) + 1); }
  function learnedFromDrawing() {
    const cands = [...tally].filter(([c, n]) => n >= 20 && glowable(c) && !/rgba\(.*,\s*0?\.\d+\)$/.test(c)).sort((a, b) => b[1] - a[1]).slice(0, 2);
    tally.clear();
    if (cands.length < 2) return lastLearned;
    const hue = (c) => { const [R, G, B] = rgbKey(c).key.split(",").map(Number), mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      if (mx === mn) return 0; let h = mx === R ? (G - B) / (mx - mn) : mx === G ? 2 + (B - R) / (mx - mn) : 4 + (R - G) / (mx - mn); return (h * 60 + 360) % 360; };
    const d = (c) => Math.min(Math.abs(hue(c) - 140), 360 - Math.abs(hue(c) - 140)); // distance from green
    const [a, b] = cands.map(([c]) => c);
    lastLearned = d(a) <= d(b) ? [[a, "up"], [b, "down"]] : [[b, "up"], [a, "down"]];
    return lastLearned;
  }
  let lastLearned = [];
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

  const axisCache = new WeakMap();
  function isAxis(canvas) {
    if (!canvas) return false;
    let v = axisCache.get(canvas);
    if (v === undefined) {
      v = !!(canvas.closest && canvas.closest(".price-axis, .time-axis, [class*='price-axis'], [class*='time-axis']"));
      axisCache.set(canvas, v);
    }
    return v;
  }

  // Fills (candle bodies, wicks, volume, price-label badges) are recoloured as the colour is set.
  const strokeDesc = Object.getOwnPropertyDescriptor(proto, "strokeStyle");
  {
    const d = Object.getOwnPropertyDescriptor(proto, "fillStyle");
    Object.defineProperty(proto, "fillStyle", {
      configurable: true,
      enumerable: d.enumerable,
      get: d.get,
      set(v) {
        const c = this.canvas;
        this.__bdFill = v;
        d.set.call(this, candles && (isPane(c) || (fx.scaleLabels && isAxis(c))) ? remap(v) : v);
      },
    });
  }

  // Strokes are decided at stroke() time, when we know the shape of the path:
  //  - segment paths (bars, last-price line: ~1 lineTo per moveTo) get candle colours
  //  - continuous polylines (indicators: 1 moveTo + many lineTo) keep their own colour
  //  - any colourful, visible line can glow; grid (faint) and crosshair (grey) never do
  const segs = new WeakMap();
  const origBegin = proto.beginPath, origMove = proto.moveTo, origLine = proto.lineTo, origStroke = proto.stroke;
  proto.beginPath = function () { segs.set(this, [0, 0]); return origBegin.call(this); };
  proto.moveTo = function (x, y) { const k = segs.get(this); if (k) k[0]++; return origMove.call(this, x, y); };
  proto.lineTo = function (x, y) { const k = segs.get(this); if (k) k[1]++; return origLine.call(this, x, y); };

  const glowCache = new Map();
  function glowable(col) {
    let v = glowCache.get(col);
    if (v !== undefined) return v;
    const r = rgbKey(col); v = false;
    if (r && (r.a === null || +r.a >= 0.35)) {
      const [R, G, B] = r.key.split(",").map((n) => n / 255);
      const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2;
      const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      v = !(sat < 0.15 && l > 0.12 && l < 0.88); // greys (crosshair, borders) don't glow; white/colours do
    }
    if (glowCache.size < 400) glowCache.set(col, v);
    return v;
  }

  proto.stroke = function (path) {
    const c = this.canvas;
    if (!on || !c || !(candles || fx.lineGlow > 0) || !isPane(c)) return origStroke.apply(this, arguments);
    const k = segs.get(this) || [0, 0];
    // only paths we SAW built from short segments (bars, last-price line) count as candle strokes;
    // Path2D or paths built some other way (indicators) keep their own colour
    const polyline = path !== undefined || k[0] < 1 || k[1] > k[0] * 2 + 1;
    const cur = strokeDesc.get.call(this);
    const col = candles && !polyline ? remap(cur) : cur;
    const glow = fx.lineGlow > 0 && glowable(col);
    if (col === cur && !glow) return origStroke.apply(this, arguments);
    const pSB = this.shadowBlur, pSC = this.shadowColor;
    if (col !== cur) strokeDesc.set.call(this, col);
    if (glow) { this.shadowColor = col; this.shadowBlur = 2 + fx.lineGlow * 16; }
    origStroke.apply(this, arguments);
    if (col !== cur) strokeDesc.set.call(this, cur);
    if (glow) { this.shadowBlur = pSB; this.shadowColor = pSC; }
  };

  // Same redraw trick as content.js: TradingView only rebuilds canvases when the chart is re-shown.
  // Redraw the chart. Two kinds: a soft redraw via TradingView's model.fullUpdate() (no blink), and a full
  // rebuild by hiding the chart for two frames (guarded by a DOM flag so two rebuilds never stack).
  function apiRepaint() {
    let done = false;
    for (const w of chartWidgets()) {
      try { const cw = w._chartWidget || w, m = cw.model().model ? cw.model().model() : cw.model(); m.fullUpdate(); done = true; } catch {}
    }
    return done;
  }
  let rpT;
  function forceRepaint(softOnly) {
    clearTimeout(rpT);
    rpT = setTimeout(() => {
      // soft: brightness updates -> TradingView's own redraw, never a blink.
      // hard: your setting changed -> full rebuild, because TradingView caches some colours (e.g. volume bars)
      //       that only a rebuild picks up.
      if (softOnly) { apiRepaint(); return; }
      document.querySelectorAll(".chart-container").forEach((el) => {
        if (el.dataset.bdRepaint) return;
        el.dataset.bdRepaint = "1";
        el.style.display = "none";
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.display = ""; delete el.dataset.bdRepaint; }));
      });
    }, 120);
  }
  document.addEventListener("bd-repaint", () => forceRepaint(false));   // asked for by content.js

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
  const origMeasure = proto.measureText;
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
  // Auto contrast: pick light/dark text from the measured wallpaper brightness, unless the user chose a colour.
  const AUTO_TEXT = { dark: "#e9ebf2", light: "#14161f" };
  const autoHalo = (tone) => ((tone || fx.bg) === "dark" ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)");
  // Which tone is right behind this label? Uses the brightness profile of the strip behind the scale.
  const rectCache = new WeakMap();
  function toneAt(ctx, y) {
    const c = ctx.canvas;
    if (!isPriceAxis(c) || (!fx.profs.length && fx.prof.length < 6)) return fx.bg;
    let rc = rectCache.get(c), now = performance.now();
    if (!rc || now - rc.t > 1000) { rc = { r: c.getBoundingClientRect(), t: now }; rectCache.set(c, rc); }
    const t = ctx.getTransform(), cssY = rc.r.top + ((y * t.d + t.f) / c.height) * rc.r.height;
    // which chart is this price scale part of? (multi-chart layouts have one scale per chart)
    const cx = (rc.r.left + rc.r.right) / 2, cy = (rc.r.top + rc.r.bottom) / 2;
    const own = fx.profs.find((q) => cx >= q.l - 2 && cx <= q.r + 2 && cy >= q.t - 2 && cy <= q.b + 2);
    let prof = fx.prof, top = 0, height = innerHeight;
    if (own) { prof = own.p; top = own.t; height = Math.max(1, own.b - own.t); }
    if (!prof || prof.length < 6) return fx.bg;
    const row = Math.max(0, Math.min(prof.length - 1, Math.floor(((cssY - top) / height) * prof.length)));
    return prof[row] > 0.46 ? "light" : "dark";   // ~equal WCAG contrast for light vs dark text here
  }
  const paCache = new WeakMap();
  function isPriceAxis(c) { let v = paCache.get(c); if (v === undefined) { v = !!(c.closest && c.closest(".price-axis, [class*='price-axis']")); paCache.set(c, v); } return v; }
  const autoOn = () => !htmlEl().classList.contains("bd-over-mode") && !!fx.bg;
  const scaleStyled = () => fx.scaleText || fx.scaleGlow > 0 || fx.scaleBold || fx.scaleSize > 0 || fx.scaleFont !== "default" || autoOn();
  const FONTS = { mono: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace', rounded: '"SF Pro Rounded", "Nunito", "Varela Round", ui-rounded, system-ui, sans-serif' };
  function styledFont(font) {
    let f = font;
    if (fx.scaleSize > 0) f = f.replace(/(\d+(?:\.\d+)?)px/, (m, n) => (+n + fx.scaleSize * 1.5) + "px");
    if (fx.scaleFont !== "default") f = f.replace(/(\d+(?:\.\d+)?px)\s+.*$/, (m, sz) => sz + " " + FONTS[fx.scaleFont]);
    if (fx.scaleBold && !/\bbold\b|\b[6-9]00\b/.test(f)) f = "bold " + f;
    return f;
  }
  function isScaleLabel(style) {           // tick labels, not text on coloured price badges
    const r = rgbKey(style);
    if (!r) return false;
    if (scaleTextKey) return r.key === scaleTextKey;
    return r.key !== "255,255,255";        // fallback when the theme colour is unknown
  }
  // Position lines show your open P&L as text on the chart ("+128.40 USD", "P&L: -45.00", "$-12.50"...).
  // We read that text as it's drawn, add up every position shown in the same frame, and publish the total
  // on <html data-ws-pnl> for content.js. Nothing leaves your computer.
  const PNL_RE = /^(?:p\s*(?:&|n|\/)?\s*l\s*:?\s*)?([+\-\u2212])?\s*([$\u20ac\u00a3\u00a5])?\s*([+\-\u2212])?\s*(\d{1,3}(?:,\d{3})*|\d+)(\.\d{1,2})\s*(usd|usdt|usdc|eur|gbp|jpy|aud|cad|chf|nzd|pts|points)?$/i;
  let pnlFrame = -1, pnlSum = 0, pnlUnit = "", pnlLastWrite = 0, frameNo = 0;
  (function tick() { frameNo++; requestAnimationFrame(tick); })();
  function notePnl(text, c) {
    if (!on || typeof text !== "string" || text.length > 40 || !isPane(c)) return;
    const m = text.trim().match(PNL_RE);
    if (!m) return;
    const hasPrefix = /^p/i.test(text.trim()), sign = m[1] || m[3], cur = m[2], code = m[6];
    if (!hasPrefix && !sign && !cur && !code) return;          // a bare number: price/qty, not P&L
    const v = parseFloat((m[4] + m[5]).replace(/,/g, "")) * (sign === "-" || sign === "\u2212" ? -1 : 1);
    if (frameNo !== pnlFrame) { pnlFrame = frameNo; pnlSum = 0; }
    pnlSum += v; pnlUnit = cur || (code ? code.toUpperCase() : "");
    const now = performance.now();
    if (now - pnlLastWrite > 400) {
      pnlLastWrite = now;
      htmlEl().setAttribute && htmlEl().setAttribute("data-ws-pnl", JSON.stringify({ v: Math.round(pnlSum * 100) / 100, unit: pnlUnit, ts: Date.now() }));
    }
  }

  proto.fillText = function (...a) {
    const c = this.canvas;
    notePnl(a[0], c);
    // Live-price tags (and other price boxes): same font/weight/size as the scale, text kept inside its box.
    const tagsRecoloured = candles && fx.scaleLabels;
    if (on && c && isAxis(c) && !isScaleLabel(this.fillStyle) && (tagsRecoloured || fx.scaleFont !== "default" || fx.scaleSize > 0 || fx.scaleBold)) {
      const pFont = this.font, pF = this.fillStyle, w0 = origMeasure.call(this, String(a[0])).width;
      const nf = styledFont(pFont);
      if (nf !== pFont) { this.font = nf; if (a[3] === undefined && w0 > 0) a[3] = w0 * 1.06; }
      // text on a recoloured tag: dark on bright tags, white on dark ones
      const tag = tagsRecoloured && lastTag.get(this), r = tag && rgbKey(tag);
      if (r) {
        const [R, G, B] = r.key.split(",").map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
        const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
        this.fillStyle = L > 0.36 ? "#06110d" : "#ffffff";
      }
      origText.apply(this, a);
      this.font = pFont; this.fillStyle = pF;
      return;
    }
    if (on && c && isAxis(c) && scaleStyled() && isScaleLabel(this.fillStyle)) {
      const pF = this.fillStyle, pFont = this.font, pSB = this.shadowBlur, pSC = this.shadowColor;
      const tone = autoOn() ? toneAt(this, a[2]) : null;
      // a bigger or wider font must still fit the scale: give the text the room that's actually there
      if (a[3] === undefined && (fx.scaleSize > 0 || fx.scaleFont !== "default" || fx.scaleBold)) {
        const w0 = origMeasure.call(this, String(a[0])).width, sx = this.getTransform().a || 1;
        const room = this.textAlign === "left" || this.textAlign === "start" ? c.width / sx - (a[1] || 0) - 3 : w0 * 1.06;
        a[3] = Math.max(w0, room);
      }
      if (fx.scaleText) this.fillStyle = fx.scaleText;
      else if (tone) this.fillStyle = AUTO_TEXT[tone];
      const nf = styledFont(pFont); if (nf !== pFont) this.font = nf;
      if (fx.scaleGlow > 0) { this.shadowColor = this.fillStyle; this.shadowBlur = 2 + fx.scaleGlow * 12; }
      else if (tone) { this.shadowColor = autoHalo(tone); this.shadowBlur = 3; }      // halo keeps text crisp on busy art
      origText.apply(this, a);
      this.fillStyle = pF; this.font = pFont; this.shadowBlur = pSB; this.shadowColor = pSC;
      return;
    }
    const bgDark = fx.bg ? fx.bg === "dark" : htmlEl().classList.contains("theme-light"); // before 1st measurement: old behaviour
    if (on && !htmlEl().classList.contains("bd-over-mode") && this.canvas && inChart(this.canvas) && isScaleLabel(this.fillStyle) &&
        (bgDark ? isDark(this.fillStyle) : !isDark(this.fillStyle))) {
      const prev = this.fillStyle;
      this.fillStyle = bgDark ? AUTO_TEXT.dark : AUTO_TEXT.light;
      origText.apply(this, a);
      this.fillStyle = prev;
      return;
    }
    return origText.apply(this, a);
  };

  // ---------- candle looks ----------
  // prism: each candle's colour is rotated along the chart (a spectrum across the screen)
  function hueRotate(rgb, deg) {
    let [r, g, b] = rgb.map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, sat = 0;
    if (mx !== mn) {
      const d = mx - mn; sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    h = (h + deg + 360) % 360;
    const f = (n) => { const k = (n + h / 30) % 12, a = sat * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }
  const prismCache = new Map();
  function prismColour(isUp, frac) {
    const step = Math.max(0, Math.min(31, Math.floor(frac * 32)));
    const key = (isUp ? "u" : "d") + step + (isUp ? candles.upHex : candles.downHex);
    let v = prismCache.get(key);
    if (!v) { v = hueRotate(isUp ? candles.up : candles.down, -70 + (step / 31) * 140); if (prismCache.size > 400) prismCache.clear(); prismCache.set(key, v); }
    return v;
  }

  // ---------- price tags glow with the scale glow ----------
  const origFillPath = proto.fill;
  const lastTag = new WeakMap();   // colour of the last price box drawn on each scale canvas
  proto.fill = function (...a) {
    const c = this.canvas;
    if (on && c && isAxis(c)) lastTag.set(this, this.fillStyle);
    if (on && c && fx.scaleGlow > 0 && isAxis(c)) {
      const col = this.fillStyle;
      if (typeof col === "string" && glowable(col)) {
        const sb = this.shadowBlur, sc = this.shadowColor;
        this.shadowColor = col; this.shadowBlur = 3 + fx.scaleGlow * 16;
        origFillPath.apply(this, a);
        this.shadowBlur = sb; this.shadowColor = sc;
        return;
      }
    }
    return origFillPath.apply(this, a);
  };

  // ---------- fillRect: transparent pane background + candle looks / glow ----------
  const origFill = proto.fillRect;
  proto.fillRect = function (x, y, w, h) {
    const c = this.canvas;
    if (on && c && w * (this.getTransform().a || 1) <= 40 && isPane(c)) noteFill(this.__bdFill);
    if (on && c && c.width > 20 && c.height > 20) {
      const s = this.getTransform().a || 1;
      // covers (nearly) the whole canvas => it's the pane background
      if (w * s >= c.width * 0.98 && h * s >= c.height * 0.98 && inChart(c)) {
        if (isAxis(c)) return this.clearRect(x, y, w, h);   // backing is drawn by CSS (frosted glass) behind the scale
        return this.clearRect(x, y, w, h);
      }
    }
    if (candles && c && (candles.glow > 0 || candles.look === "neon" || candles.look === "prism") && h < c.height * 0.8 && isPane(c)) {
      const fs = this.fillStyle; // already remapped, normalised to "#rrggbb" for opaque colours
      if (fs === candles.upHex || fs === candles.downHex) {
        const sx = this.getTransform().a || 1, body = w * sx >= 3;
        let col = fs;
        if (candles.look === "prism") col = prismColour(fs === candles.upHex, (x * sx) / c.width);
        const glow = candles.look === "neon" ? Math.max(0.55, candles.glow) : candles.glow;
        this.save();
        if (glow > 0) { this.shadowColor = col; this.shadowBlur = 4 + glow * 22; }
        if (candles.look === "neon" && body && h * (this.getTransform().d || 1) >= 3) {
          // neon tube: faint fill + bright outline
          this.globalAlpha *= 0.22; this.fillStyle = col; origFill.call(this, x, y, w, h); this.globalAlpha /= 0.22;
          strokeDesc.set.call(this, col); this.lineWidth = Math.max(1, 1.4 / sx);
          proto.strokeRect.call(this, x + 0.5 / sx, y + 0.5 / sx, w - 1 / sx, h - 1 / sx);
        } else {
          if (col !== fs) this.fillStyle = col;
          origFill.call(this, x, y, w, h);
        }
        this.restore();
        return;
      }
    }
    return origFill.call(this, x, y, w, h);
  };
})();
