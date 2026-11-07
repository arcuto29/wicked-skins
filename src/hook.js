/* Runs in the PAGE's JS world (manifest "world": "MAIN"; the desktop app injects it too).
   TradingView paints the chart inside <canvas>, so CSS alone can't restyle it. This hook:
     1. Background: when Priism Skins is on, turns the full-pane background fill into a clear,
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
  const HOOK_VERSION = 6;
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

  // every candle look lives in candlelooks.js (shared with lw.js and the panel previews)
  const lookIds = () => (window.__bdCandleLooks && window.__bdCandleLooks.IDS) || ["solid", "neon", "prism", "shift"];
  function readCandles() {
    remapCache.clear();
    try {
      const raw = htmlEl().getAttribute("data-ws-candles");
      const c = raw ? JSON.parse(raw) : null;
      if (c && /^#[0-9a-f]{6}$/i.test(c.up) && /^#[0-9a-f]{6}$/i.test(c.down)) {
        candles = { up: hexToRgb(c.up), down: hexToRgb(c.down), upHex: c.up.toLowerCase(), downHex: c.down.toLowerCase(),
          glow: Math.max(0, Math.min(1, +c.glow || 0)), look: lookIds().includes(c.look) ? c.look : "solid" };
      } else candles = null;
    } catch { candles = null; }
  }
  readCandles();

  // Line glow + price scale styling
  const FX0 = { lineGlow: 0, scaleText: "", scaleGlow: 0, scaleBold: false, scaleBg: "auto", scaleBgColor: "#0b1320", scaleLabels: false,
    scaleSize: 0, scaleFont: "default",
    // Bracket pills = the broker's on-chart TP / Stop / entry / P&L boxes (drawn by TradingView, "bold Npx Verdana").
    // We can fully recolour every part, at draw time (the API can't reach these). All colours are "" = keep as-is.
    //   bracketSize 0..3  px bigger text
    //   bracketFill       box background colour      ("" keep; else any hex)
    //   bracketText       number colour              ("" keep/auto; a single colour for all pills)
    //   bracketProfit/Loss  +/- number colours        (override bracketText by sign; green/red style)
    //   bracketBorderColor  box outline colour        ("" keep)   + bracketBorderW 0..3 thickness
    //   bracketLineColor    level-line colour         ("" keep)   + bracketLineW   0..3 thickness
    //   bracketBack keep|glass|solid  box opacity (only when bracketFill is "", to strengthen TradingView's box)
    bracketOn: false, bracketSize: 0, bracketBack: "keep",
    bracketFill: "", bracketText: "", bracketProfit: "", bracketLoss: "",
    bracketBorderColor: "", bracketBorderW: 0, bracketLineColor: "", bracketLineW: 0,
    bracketDebug: false,
    bg: null, busy: false, prof: [], profs: [] };
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
        bracketOn: !!f.bracketOn,
        bracketSize: Math.max(0, Math.min(3, +f.bracketSize || 0)),
        bracketBack: ["keep", "glass", "solid"].includes(f.bracketBack) ? f.bracketBack : "keep",
        bracketFill: /^#[0-9a-f]{6}$/i.test(f.bracketFill || "") ? f.bracketFill : "",
        bracketText: /^#[0-9a-f]{6}$/i.test(f.bracketText || "") ? f.bracketText : "",
        bracketProfit: /^#[0-9a-f]{6}$/i.test(f.bracketProfit || "") ? f.bracketProfit : "",
        bracketLoss: /^#[0-9a-f]{6}$/i.test(f.bracketLoss || "") ? f.bracketLoss : "",
        bracketBorderColor: /^#[0-9a-f]{6}$/i.test(f.bracketBorderColor || "") ? f.bracketBorderColor : "",
        bracketBorderW: Math.max(0, Math.min(3, +f.bracketBorderW || 0)),
        bracketLineColor: /^#[0-9a-f]{6}$/i.test(f.bracketLineColor || "") ? f.bracketLineColor : "",
        bracketLineW: Math.max(0, Math.min(3, +f.bracketLineW || 0)),
        bracketDebug: !!f.bracketDebug,
        bg: f.bg === "dark" || f.bg === "light" ? f.bg : null,   // measured brightness of the wallpaper (content.js)
        busy: !!f.busy,                                           // wallpaper has lots of contrast behind the scale
        prof: Array.isArray(f.prof) ? f.prof.slice(0, 18).map(Number) : [],  // brightness behind the price scale, top->bottom
        // one profile per chart (multi-chart layouts): { l, t, r, b } = the chart's box on screen, p = profile
        profs: Array.isArray(f.profs) ? f.profs.slice(0, 16).filter((q) => q && Array.isArray(q.p))
          .map((q) => ({ l: +q.l || 0, t: +q.t || 0, r: +q.r || 0, b: +q.b || 0, p: q.p.slice(0, 18).map(Number) })) : [],
      };
    } catch { fx = { ...FX0 }; }
    remapCache.clear();
    const sig = JSON.stringify([fx.lineGlow, fx.scaleText, fx.scaleGlow, fx.scaleBold, fx.scaleBg, fx.scaleBgColor, fx.scaleLabels, fx.scaleSize, fx.scaleFont,
      fx.bracketOn, fx.bracketSize, fx.bracketBack, fx.bracketFill, fx.bracketText, fx.bracketProfit, fx.bracketLoss,
      fx.bracketBorderColor, fx.bracketBorderW, fx.bracketLineColor, fx.bracketLineW]);
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
  proto.beginPath = function () { segs.set(this, [0, 0]); if (on && fx.bracketOn) lastSeg.set(this, null); return origBegin.call(this); };
  proto.moveTo = function (x, y) { const k = segs.get(this); if (k) k[0]++;
    if (on && fx.bracketOn) { const t = this.getTransform(); lastSeg.set(this, { x0: x * (t.a || 1) + t.e, y0: y * (t.d || 1) + t.f, x1: null, y1: null }); }
    return origMove.call(this, x, y); };
  proto.lineTo = function (x, y) { const k = segs.get(this); if (k) k[1]++;
    if (on && fx.bracketOn) { const s = lastSeg.get(this), t = this.getTransform(); if (s) { s.x1 = x * (t.a || 1) + t.e; s.y1 = y * (t.d || 1) + t.f; } }
    return origLine.call(this, x, y); };

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
    // Bracket level line: a wide, horizontal stroke sitting at a pill's height. Recolour / thicken it so the whole
    // bracket level is easy to see. Done before the candle/glow path because it can be on when those are off.
    if (on && fx.bracketOn && (fx.bracketLineColor || fx.bracketLineW > 0) && c && path === undefined && isPane(c)) {
      const s = lastSeg.get(this);
      // horizontal segment (any width) whose y lands exactly on a pill row — the pill-row match is the real filter
      // (so grid lines, which never sit on a pill row, are left alone), covering both stubs either side of the box.
      if (s && s.x1 !== null && Math.abs(s.y0 - s.y1) <= 1.5 && Math.abs(s.x1 - s.x0) >= 20
          && bracketRowSign(this, (s.y0 + s.y1) / 2) !== null) {
        const sx = this.getTransform().a || 1, cur = strokeDesc.get.call(this);
        const col = fx.bracketLineColor || cur;
        const pS = cur, pLW = this.lineWidth;
        if (col !== cur) strokeDesc.set.call(this, col);
        if (fx.bracketLineW > 0) this.lineWidth = Math.max(pLW, (fx.bracketLineW + 1) / sx);
        origStroke.apply(this, arguments);
        if (col !== cur) strokeDesc.set.call(this, pS);
        this.lineWidth = pLW;
        return;
      }
    }
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
  // asked for by content.js before it decides a position has closed: a quiet market stops the chart redrawing, so the
  // position pill (our P&L signal) would go stale even though the trade is still open. A soft redraw refreshes it, no blink.
  document.addEventListener("bd-softrepaint", () => { try { apiRepaint(); } catch {} });

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

  // ---------- bracket pills (the broker's TP / Stop / entry / P&L boxes TradingView draws on the chart) ----------
  // TradingView draws each pill as a small rounded box (a fillRect ~15-28px tall, <~170px wide) and then its
  // text in "bold 9px Verdana", centered. We can't read these through the chart API (they belong to the broker's
  // trading integration, not our drawings), but they DO pass through this canvas hook, so we restyle them here:
  // a stronger box behind the text (readable on busy wallpapers), a bigger font, and optional +/- colours.
  // Every broker pill (TP, Stop, entry, quantity, P&L) draws its text in Verdana — regular chart text uses a
  // sans-serif stack, so the font is the reliable signal. The box is only used so we have something to restyle;
  // we keep its size test loose and DPR-correct so wide multi-part pills and HiDPI screens still match.
  const BRACKET_FONT = /\bVerdana\b/i;
  const lastPill = new WeakMap();
  // Font-independent pill test: this text sits inside the pill box drawn a moment ago (so a font change on
  // TradingView's side can't leave a restyled box with unstyled, invisible text on it).
  function textInPill(ctx, x, y) {
    const p = lastPill.get(ctx); if (!p || !p.box || performance.now() - p.t > 250) return false;
    const t = ctx.getTransform(), tx = (x || 0) * (t.a || 1) + t.e, ty = (y || 0) * (t.d || 1) + t.f, b = p.box, m = b.h * 0.6;
    return tx >= b.x - m && tx <= b.x + b.w + m && ty >= b.y - m && ty <= b.y + b.h + m;
  }   // ctx -> { used, box:{x,y,w,h} } of the last pill-shaped box drawn
  function pillBox(ctx, x, y, w, h) {
    // convert the box to CSS px: the canvas transform's scale already folds in devicePixelRatio
    const sx = ctx.getTransform().a || 1, sy = ctx.getTransform().d || 1;
    const dpr = (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
    const pw = Math.abs(w * sx) / dpr, ph = Math.abs(h * sy) / dpr;
    // a pill is a short, wide-ish box — generous bounds so every variant/DPI is caught (font gate does the rest)
    return ph >= 8 && ph <= 40 && pw >= 10 && pw <= 460 && pw >= ph * 0.7;
  }
  // Per-canvas list of y-centres (device px) where a pill box was drawn this frame — used to spot the bracket's
  // own horizontal "level line" (a wide stroke at a pill's height) so we can thicken / recolour the whole level.
  // Pill rows are matched by time, not frame: the level line is stroked BEFORE the pill text in the same paint
  // (so this paint's row isn't known yet when the line draws), and TradingView repaints often — so we keep the
  // rows seen in the last ~400ms and match against those. The y positions barely move between paints.
  const pillRows = new WeakMap();   // ctx -> [{ y, sign, t }]
  function notePillRow(ctx, yDev, sign) {
    let a = pillRows.get(ctx); if (!a) { a = []; pillRows.set(ctx, a); }
    const now = performance.now();
    // replace a near-duplicate row (same height) rather than growing without bound
    const i = a.findIndex((e) => Math.abs(e.y - yDev) <= 3);
    if (i >= 0) a[i] = { y: yDev, sign, t: now };
    else { a.push({ y: yDev, sign, t: now }); if (a.length > 40) a.shift(); }
  }
  function bracketRowSign(ctx, yDev) {     // is yDev on a recently-seen pill row? returns its +/- sign, or null
    const a = pillRows.get(ctx); if (!a) return null;
    const now = performance.now();
    for (const e of a) if (now - e.t < 500 && Math.abs(e.y - yDev) <= 5) return e.sign;
    return null;
  }
  // minimal path geometry (just the first move + last line) so stroke() can tell a wide horizontal line apart
  const lastSeg = new WeakMap();   // ctx -> { x0, y0, x1, y1 }
  // A pill's money/price text (what the user wants to see): has a digit, and a $/currency or +/- sign, or is a bare
  // number/qty. We only *recolour* the ones that read as profit/loss (have a sign); size applies to all pills.
  const MONEY_RE = /[$€£¥]|[+\-\u2212]?\s*\d/;
  function pillSign(text) {
    const t = String(text).trim();
    if (/^[+＋]|\+\s*[$€£¥]/.test(t)) return 1;                       // +$1170.00
    if (/^[-\u2212]|[-\u2212]\s*[$€£¥]/.test(t)) return -1;           // -$133.00
    return 0;
  }
  // readable text (black or white) for a given box colour, so a recoloured/opaque box never hides its number
  function readableOn(hexOrRgb) {
    const r = rgbKey(hexOrRgb); if (!r) return null;
    const [R, G, B] = r.key.split(",").map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B > 0.34 ? "#0a0e14" : "#ffffff";
  }
  function lum(v) {
    const r = rgbKey(v); if (!r) return null;
    const [R, G, B] = r.key.split(",").map((n) => { n /= 255; return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4); });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }
  function lowContrast(a, b) {             // WCAG contrast < 3:1
    const A = lum(a), B = lum(b); if (A === null || B === null) return false;
    return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05) < 3;
  }
  // which fill colour did the box end up with (what we painted, or TradingView's own)? remembered per ctx so the
  // text branch can auto-pick a readable colour when the user recoloured/strengthened the box but not the text.
  const pillFill = new WeakMap();

  // Diagnostic: when bracketDebug is on, record a small sample of the pill text we see on the real chart so we can
  // confirm the hook is catching the broker's pills. Readable from the page console as window.__bdBracketDebug.
  function noteBracketDebug(text, font, align, fill, box) {
    try {
      const d = (window.__bdBracketDebug = window.__bdBracketDebug || { note: "Priism Skins bracket debug — pills the hook caught:", samples: [] });
      const key = String(text).slice(0, 20) + "|" + font;
      if (!d.samples.some((s) => s.key === key) && d.samples.length < 20) {
        d.samples.push({ key, text: String(text).slice(0, 20), font, align, fill: String(fill).slice(0, 16), box: box ? { w: Math.round(box.w), h: Math.round(box.h) } : null });
      }
    } catch {}
  }

  proto.fillText = function (...a) {
    const c = this.canvas;
    notePnl(a[0], c);

    // Bracket pill text: bigger + optional +/- recolour. The reliable signal is the FONT (Verdana) — every TP /
    // Stop / entry / P&L / quantity pill uses it, regular chart text doesn't. We do NOT require a preceding box:
    // some pills draw their box with roundRect / a path (not fillRect), which we can't always catch, but the text
    // still comes through here, so recolour + size always work. If we did record a box, we use it to clamp size
    // and to feed the level-line row match.
    if (on && fx.bracketOn && c && isPane(c) && MONEY_RE.test(String(a[0]))
        && (((this.textAlign === "center" || this.textAlign === "end" || this.textAlign === "right") && BRACKET_FONT.test(this.font || ""))
            || textInPill(this, a[1], a[2]))) {
      {
        const pill = lastPill.get(this);
        if (pill) pill.used = true;
        const sign = pillSign(a[0]);
        // remember this pill's row so stroke() can find the level line. Prefer the box centre; else the text's y.
        const rowY = pill && pill.box ? pill.box.y + pill.box.h / 2 : (() => { const t = this.getTransform(); return (a[2] || 0) * (t.d || 1) + t.f; })();
        if (fx.bracketDebug) noteBracketDebug(a[0], this.font, this.textAlign, String(this.fillStyle), pill && pill.box);
        notePillRow(this, rowY, sign);
        const pFont = this.font, pFill = this.fillStyle, sx = this.getTransform().a || 1;
        // Enlarge, but NEVER clip: TradingView centers text in a fixed-width box, so a bigger font can spill over
        // the edges and look broken ("can't see the number"). Clamp the font so the text still fits the box.
        const box = pill && pill.box;
        if (fx.bracketSize > 0) {
          let nf = pFont.replace(/(\d+(?:\.\d+)?)px/, (m, n) => (+n + fx.bracketSize) + "px");
          this.font = nf;
          if (box) {
            const avail = box.w / sx - 4;                 // room inside the box (css px)
            let w = origMeasure.call(this, String(a[0])).width;
            // shrink a step at a time until it fits (keeps the number fully visible)
            let px = +nf.match(/(\d+(?:\.\d+)?)px/)[1];
            while (w > avail && px > +pFont.match(/(\d+(?:\.\d+)?)px/)[1]) {
              px -= 1; this.font = nf.replace(/\d+(?:\.\d+)?px/, px + "px"); w = origMeasure.call(this, String(a[0])).width;
            }
            if (a[3] === undefined) a[3] = Math.max(w, avail);   // let the engine letter-squeeze if still a hair wide
          }
        }
        // text colour: profit/loss by sign, else a single custom colour, else auto-readable if we changed the box
        let col = "";
        if (sign > 0 && fx.bracketProfit) col = fx.bracketProfit;
        else if (sign < 0 && fx.bracketLoss) col = fx.bracketLoss;
        else if (fx.bracketText) col = fx.bracketText;
        // never let the number match its box: if the chosen (or TradingView's) colour is too close to the box we
        // painted, switch to black/white so TP / Stop / P&L always read
        const boxCol = pillFill.get(this);
        if (boxCol && lowContrast(col || String(pFill), boxCol)) col = readableOn(boxCol) || col;
        if (col) this.fillStyle = col;
        origText.apply(this, a);
        this.font = pFont; this.fillStyle = pFill;
        return;
      }
    }
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
  const lastBody = new WeakMap();
  // drawing kit handed to candlelooks.js: the REAL canvas calls, so our own hooks don't re-process the look's shapes
  const lookK = { g: null, px: 1, yfrac: 0,
    fill(x, y, w, h) { origFill.call(lookK.g, x, y, w, h); },
    style(v) { origFillDesc.set.call(lookK.g, v); },
    stroke(v) { strokeDesc.set.call(lookK.g, v); },
    strokeRect(x, y, w, h) { origStrokeRectRaw.call(lookK.g, x, y, w, h); },
    fillPath() { origFillPathRaw.call(lookK.g); } };
  const origStrokeRectRaw = proto.strokeRect, origFillPathRaw = proto.fill;
  proto.fillRect = function (x, y, w, h) {
    const c = this.canvas;
    if (on && c && w * (this.getTransform().a || 1) <= 40 && isPane(c)) noteFill(this.__bdFill);
    // Bracket pills: record the box so the text drawn next knows it belongs to a pill. Optionally strengthen the
    // box backing so the TP/Stop/P&L number stays readable on busy wallpapers.
    if (on && fx.bracketOn && c && isPane(c) && pillBox(this, x, y, w, h)) {
      const t = this.getTransform(), sx = t.a || 1, sy = t.d || 1;
      lastPill.set(this, { used: false, t: performance.now(), box: { x: x * sx + t.e, y: y * sy + t.f, w: Math.abs(w * sx), h: Math.abs(h * sy) } });
      // Custom box colour wins; otherwise glass/solid just strengthens TradingView's own box so it pops on a skin.
      if (fx.bracketFill) {
        const pF = this.fillStyle;
        this.fillStyle = fx.bracketFill; pillFill.set(this, fx.bracketFill);
        origFill.call(this, x, y, w, h);
        this.fillStyle = pF;
        return;
      }
      if (fx.bracketBack !== "keep") {
        // Strengthen as a DARK box tinted with the pill's own colour. (Making TradingView's colour opaque turned the
        // box the same colour as its number -> "fully white", nothing readable.) Text is then forced to contrast.
        const r = rgbKey(this.fillStyle), base = [16, 19, 28];
        const rgb = r ? r.key.split(",").map(Number) : base;
        const k = fx.bracketBack === "solid" ? 0.22 : 0.3, al = fx.bracketBack === "solid" ? 1 : 0.88;
        const mix = rgb.map((v, i) => Math.round(base[i] + (v - base[i]) * k));
        const pF = this.fillStyle, fill = `rgba(${mix.join(",")},${al})`;
        this.fillStyle = fill; pillFill.set(this, fill);
        origFill.call(this, x, y, w, h);
        this.fillStyle = pF;
        return;
      }
      // box unchanged: TradingView's own text already reads on it, so don't override the colour
      pillFill.delete(this);
    }
    if (on && c && c.width > 20 && c.height > 20) {
      const s = this.getTransform().a || 1;
      // covers (nearly) the whole canvas => it's the pane background
      if (w * s >= c.width * 0.98 && h * s >= c.height * 0.98 && inChart(c)) {
        if (isAxis(c)) return this.clearRect(x, y, w, h);   // backing is drawn by CSS (frosted glass) behind the scale
        return this.clearRect(x, y, w, h);
      }
    }
    if (candles && c && (candles.glow > 0 || (candles.look !== "solid" && candles.look !== "shift")) && h < c.height * 0.8 && isPane(c)) {
      const fs = this.fillStyle; // already remapped, normalised to "#rrggbb" for opaque colours
      if (fs === candles.upHex || fs === candles.downHex) {
        const L = window.__bdCandleLooks, t = this.getTransform(), sx = t.a || 1, sy = t.d || 1, body = w * sx >= 3;
        const isUp = fs === candles.upHex, look = L ? candles.look : (candles.look === "neon" ? "neon" : "solid");
        // TradingView draws a bordered candle as an outer rect then the body inside it, both in our colour: draw the
        // look once (on the outer rect) so outlines / glass don't double up.
        if (body && look !== "solid") {
          const lb = lastBody.get(this), X = x * sx + t.e, Y = y * sy + t.f, W = w * sx, H = h * sy;
          // either order: body-then-border or border-then-body (within ~2 device px on every side)
          const inside = (a, o) => a.x >= o.x - 0.5 && a.y >= o.y - 0.5 && a.x + a.w <= o.x + o.w + 0.5 && a.y + a.h <= o.y + o.h + 0.5;
          const near = (a, o) => Math.abs(a.x - o.x) <= 2.5 && Math.abs(a.y - o.y) <= 2.5 && Math.abs(a.x + a.w - o.x - o.w) <= 2.5 && Math.abs(a.y + a.h - o.y - o.h) <= 2.5;
          const cur = { x: X, y: Y, w: W, h: H };
          if (lb && lb.col === fs && near(cur, lb) && (inside(cur, lb) || inside(lb, cur))) { lastBody.delete(this); return; }
          lastBody.set(this, { x: X, y: Y, w: W, h: H, col: fs });
        }
        let col = fs;
        if (look === "prism") col = prismColour(isUp, (x * sx) / c.width);
        const meta = L && L.META[look], glow = Math.max(candles.glow, meta ? meta.minGlow : 0);
        lookK.g = this; lookK.px = 1 / sx; lookK.yfrac = c.height ? (y * sy + t.f) / c.height : 0;
        this.save();
        if (glow > 0) { this.shadowColor = L ? L.tone(look, col, lookK) : col; this.shadowBlur = 4 + glow * 22; }
        if (L && body && h * sy >= 3) L.draw(this, look, x, y, w, h, col, isUp, lookK);
        else { const wc = L ? L.wick(look, col, lookK) : col; origFillDesc.set.call(this, wc); origFill.call(this, x, y, w, h); }
        this.restore();
        return;
      }
    }
    return origFill.call(this, x, y, w, h);
  };

  // ---------- bracket pill box border ----------
  // TradingView outlines each pill with a 1px strokeRect right after the box fill. When bracket styling is on we
  // restyle that outline: bolder, a glow, or a custom / profit-loss colour — so the whole pill level stands out.
  const origStrokeRect = proto.strokeRect;
  proto.strokeRect = function (x, y, w, h) {
    const c = this.canvas;
    if (on && fx.bracketOn && (fx.bracketBorderColor || fx.bracketBorderW > 0) && c && isPane(c)) {
      const pill = lastPill.get(this), t = this.getTransform(), sx = t.a || 1;
      const bx = x * sx + t.e, by = y * (t.d || 1) + t.f, bw = Math.abs(w * sx), bh = Math.abs(h * (t.d || 1));
      // this strokeRect is the pill's outline if it sits on the box we just recorded (same place, ~same size)
      const box = pill && pill.box;
      const isPillBorder = box && Math.abs(bx - box.x) <= 3 && Math.abs(by - box.y) <= 3 && Math.abs(bw - box.w) <= 4 && Math.abs(bh - box.h) <= 4;
      if (isPillBorder) {
        const cur = strokeDesc.get.call(this);
        const col = fx.bracketBorderColor || cur;
        const pS = cur, pLW = this.lineWidth;
        if (col !== cur) strokeDesc.set.call(this, col);
        if (fx.bracketBorderW > 0) this.lineWidth = Math.max(pLW, (fx.bracketBorderW + 1) / sx);
        origStrokeRect.call(this, x, y, w, h);
        if (col !== cur) strokeDesc.set.call(this, pS);
        this.lineWidth = pLW;
        return;
      }
    }
    return origStrokeRect.call(this, x, y, w, h);
  };
})();
