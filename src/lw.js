/* Priism Skins — TradingView LIGHTWEIGHT CHARTS adapter (MAIN world).
   The main hook (hook.js) skins TradingView's *Advanced Charts* (tradingview.com, prop platforms). Some sites
   (e.g. nq.vision) instead use TradingView's *Lightweight Charts* — a different engine: no window.TradingViewApi,
   no .chart-markup-table, different candle draw. This module adds support for that engine:
     1. Candle recolour — remap the series' up/down colours to the chosen ones as they're drawn.
     2. Transparent background — clear the chart's full-canvas background fill so a wallpaper shows through.
   It activates ONLY when Lightweight Charts is present AND Advanced Charts is not, so it never fights hook.js.
     3. Chart lines — grid, crosshair and price line take your Style tab settings (same options as on TradingView).
   There are NO broker position/order "bracket" pills in Lightweight Charts, so that feature does not apply here.
   Nothing is read or sent anywhere; this only changes how the chart is drawn. */
(function () {
  const LW_VERSION = 15;
  if (window.__bdLwHooked && (window.__bdLwVer || 1) >= LW_VERSION) return;
  window.__bdLwHooked = true;
  window.__bdLwVer = LW_VERSION;

  const proto = CanvasRenderingContext2D.prototype;
  const EMPTY = { classList: { contains: () => false }, getAttribute: () => null };
  const htmlEl = () => document.documentElement || EMPTY;

  // ---------- is this a Lightweight Charts page (and NOT Advanced Charts)? ----------
  function hasAdvanced() {
    // NOTE: not ".chart-container" — that's a generic class name lots of apps (incl. Lightweight Charts ones) use too.
    try { return !!(window.TradingViewApi || window.tradingViewApi || document.querySelector(".chart-markup-table")); }
    catch { return false; }
  }
  // Modified builds of Lightweight Charts may rename the ".tv-lightweight-charts" wrapper, so also recognise the
  // chart by its structure: LW always lays a chart out as a <table> of cells holding 2+ stacked canvases.
  const ROOT_SEL = "[data-bd-lwroot], .tv-lightweight-charts";
  function markRoots() {
    let n = 0, fresh = false;
    try {
      for (const el of document.querySelectorAll(".tv-lightweight-charts")) { if (!el.hasAttribute("data-bd-lwroot")) { el.setAttribute("data-bd-lwroot", ""); fresh = true; } n++; }
      for (const t of document.querySelectorAll("table")) {
        if (t.closest(ROOT_SEL)) { n++; continue; }
        const cv = t.querySelectorAll("canvas"); if (cv.length < 2) continue;
        const r = t.getBoundingClientRect(); if (r.width < 200 || r.height < 120) continue;
        const root = t.parentElement && t.parentElement !== document.body ? t.parentElement : t;
        root.setAttribute("data-bd-lwroot", ""); fresh = true; n++;
      }
    } catch {}
    if (fresh) { try { paneCache = new WeakMap(); lwTableCache = new WeakMap(); } catch {} }   // a chart appeared: re-check canvases
    return n;
  }
  function hasLightweight() {
    try {
      if (markRoots()) return true;
      if (window.LightweightCharts) return true;
      if (document.querySelector(".tv-lightweight-charts, [class*='lightweight']")) return true;
      // fallback: a canvas whose wrapper looks like a LW table, or the LW "attribution" link is present
      if (document.querySelector("a#tv-attr-logo, a[href*='tradingview.com'][class*='tv']")) return true;
      return false;
    } catch { return false; }
  }

  // ---------- settings (same channel as hook.js) ----------
  const cache = new Map();          // colour-string -> { key:"r,g,b", a } | null   (declared early: readCandles clears it)
  const remapCacheMain = new Map();
  let on = htmlEl().classList.contains("bd-on");
  let candles = null;   // { up:[r,g,b], down:[r,g,b], upHex, downHex, glow, look }
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function readCandles(rawIn) {
    cache.clear();
    try {
      const raw = rawIn !== undefined ? rawIn : htmlEl().getAttribute("data-ws-candles");
      const c = raw ? JSON.parse(raw) : null;
      if (c && /^#[0-9a-f]{6}$/i.test(c.up) && /^#[0-9a-f]{6}$/i.test(c.down)) {
        candles = { up: hexToRgb(c.up), down: hexToRgb(c.down), upHex: c.up.toLowerCase(), downHex: c.down.toLowerCase(),
          glow: Math.max(0, Math.min(1, +c.glow || 0)), look: String(c.look || "solid"),
          P: window.__bdCandleLooks && window.__bdCandleLooks.parts ? window.__bdCandleLooks.parts(c.parts) : null };   // wick / border / hollow / widths
      } else candles = null;
    } catch { candles = null; }
  }
  // A Lightweight Charts chart only redraws when something about the chart changes, NOT when our settings change, so
  // after a settings change the old colours would stay until you next scroll. Nudge it: tell the page the window resized
  // (apps that listen for that call chart.resize), and shave 1px off the chart's container for two frames (charts that
  // auto-size themselves with a ResizeObserver redraw on that). Live price updates redraw the chart anyway.
  let repaintT = 0;
  function repaint() {
    clearTimeout(repaintT);
    repaintT = setTimeout(() => {
      if (!active) return;
      try { window.dispatchEvent(new Event("resize")); } catch {}
      const hosts = [...document.querySelectorAll(ROOT_SEL)].map((e) => e.parentElement).filter(Boolean);
      for (const h of hosts) {
        const r = h.getBoundingClientRect(); if (r.width < 50) continue;
        const was = h.style.width, wasMax = h.style.maxWidth;
        h.style.width = (r.width - 1) + "px"; h.style.maxWidth = (r.width - 1) + "px";
        requestAnimationFrame(() => requestAnimationFrame(() => { h.style.width = was; h.style.maxWidth = wasMax; }));
      }
      // Apps that never resize their chart (nq.vision) ignore both of those. What always makes Lightweight Charts
      // redraw is a mouse-wheel event on the chart: we send a ten-thousandth of a notch, then the same back, so the
      // zoom doesn't change but the whole chart is drawn again, in the new colours.
      for (const root of document.querySelectorAll(ROOT_SEL)) {
        let pane = null, area = 0;
        for (const cv of root.querySelectorAll("canvas")) { const r = cv.getBoundingClientRect(); if (r.width * r.height > area) { area = r.width * r.height; pane = cv; } }
        if (!pane || area < 200 * 120) continue;
        const r = pane.getBoundingClientRect(), target = pane.parentElement || pane, at = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        try {
          target.dispatchEvent(new WheelEvent("wheel", { ...at, deltaY: 0.0001 }));
          requestAnimationFrame(() => { try { target.dispatchEvent(new WheelEvent("wheel", { ...at, deltaY: -0.0001 })); } catch {} });
        } catch {}
      }
    }, 150);
  }
  window.__bdLwRepaint = repaint;
  // chart-line settings (Style tab), from the same attribute hook.js reads
  let lfx = null;
  const colOk = (v) => (v === "candle" || /^#[0-9a-f]{6}$/i.test(v || "") ? v : "");
  const styleOk = (v, d, extra = []) => (["solid", "dotted", "dashed", ...extra].includes(v) ? v : d);
  let ltx = null;
  function readFx(rawIn) {
    try {
      const f = JSON.parse((rawIn !== undefined ? rawIn : htmlEl().getAttribute("data-ws-fx")) || "null");
      const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v || "") ? v : "");
      const any = f && (f.lineGlow > 0 || f.zoneDim || (f.zoneShape && f.zoneShape !== "square") || (f.zoneBorder && f.zoneBorder !== "line") || (f.zoneStyle && f.zoneStyle !== "flat") || (f.indMode && f.indMode !== "own") || (f.indCustom && Object.keys(f.indCustom).length > 0) || f.gridOn || f.chOn || f.plOn || f.bracketOn || f.privacy || f.scaleText || f.scaleGlow > 0 || f.scaleBold || f.scaleSize > 0 || (f.scaleFont && f.scaleFont !== "default") || (f.scaleBg && f.scaleBg !== "auto"));
      // Chart text: read whenever Priism is on (its "Own" setting still lightens black text on a dark wallpaper)
      ltx = f ? { mode: ["readable", "custom", "candle"].includes(f.txtMode) ? f.txtMode : "own", color: hex(f.txtColor), outline: Math.max(0, Math.min(2, +f.txtOutline || 0)),
        size: Math.max(0, Math.min(2, +f.txtSize || 0)), bg: f.bg === "light" ? "light" : "dark" } : null;
      lfx = any ? {
        // price scale text + backing
        scaleText: hex(f.scaleText), scaleGlow: Math.max(0, Math.min(1, +f.scaleGlow || 0)), scaleBold: !!f.scaleBold, scaleSize: Math.max(0, Math.min(2, +f.scaleSize || 0)),
        lite: !!f.lite, scaleFont: /^[a-z]{1,16}$/.test(f.scaleFont || "") ? f.scaleFont : "default", scaleFamily: typeof f.scaleFamily === "string" && /^[A-Za-z0-9 ,"'\-]{1,200}$/.test(f.scaleFamily) ? f.scaleFamily : "", fontTick: +f.fontTick || 0, scaleBg: ["auto", "glass", "color", "default"].includes(f.scaleBg) ? f.scaleBg : "auto", scaleBgColor: hex(f.scaleBgColor) || "#0b1320",
        // trade brackets = the platform's own level lines (orders / positions) and their price-scale labels
        bracketOn: !!f.bracketOn, bracketFill: hex(f.bracketFill), bracketText: hex(f.bracketText), bracketProfit: hex(f.bracketProfit), bracketLoss: hex(f.bracketLoss),
        bracketSize: Math.max(0, Math.min(3, +f.bracketSize || 0)), bracketLineColor: hex(f.bracketLineColor), bracketLineW: Math.max(0, Math.min(3, +f.bracketLineW || 0)),
        privacy: !!f.privacy, privacyPnl: ["hide", "ticks", "points", "show"].includes(f.privacyPnl) ? f.privacyPnl : "hide",
        gridOn: !!f.gridOn, gridColor: colOk(f.gridColor), gridAlpha: Math.max(0.03, Math.min(1, f.gridAlpha === undefined ? 0.35 : +f.gridAlpha || 0)),
        gridW: Math.max(0, Math.min(2, +f.gridW || 0)), gridStyle: styleOk(f.gridStyle, "dotted", ["none"]),
        chOn: !!f.chOn, chColor: colOk(f.chColor), chW: Math.max(0, Math.min(2, +f.chW || 0)), chStyle: styleOk(f.chStyle, "dashed"), chGlow: !!f.chGlow, chGlowColor: colOk(f.chGlowColor), chLabels: !!f.chLabels,
        plOn: !!f.plOn, plColor: colOk(f.plColor), plW: Math.max(0, Math.min(2, +f.plW || 0)), plStyle: styleOk(f.plStyle, "dotted"),
        lineGlow: Math.max(0, Math.min(1, +f.lineGlow || 0)),   // Style → Line glow: indicator lines and drawings
        indMode: ["own", "rainbow", "gradient", "candles", "wallpaper", "custom"].includes(f.indMode) ? f.indMode : "own", indColor: /^#[0-9a-f]{6}$/i.test(f.indColor || "") ? f.indColor : "",
        indCustom: (() => { const o = {}; for (const [k, e] of Object.entries(f.indCustom && typeof f.indCustom === "object" ? f.indCustom : {}).slice(0, 40))
          if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(k) && e && typeof e === "object") o[k] = { c: e.c === "rainbow" || e.c === "gradient" || /^#[0-9a-f]{6}$/i.test(e.c || "") ? e.c : "",
            g: e.g === undefined || e.g === null || e.g === "" ? undefined : Math.max(0, Math.min(1, +e.g || 0)), w: Math.max(0, Math.min(3, +e.w || 0)), h: !!e.h }; return o; })(),
        zoneFill: Math.max(0.04, Math.min(0.45, +f.zoneFill || 0.12)), zoneDim: !!f.zoneDim,
        zoneShape: ["square", "rounded", "pill"].includes(f.zoneShape) ? f.zoneShape : "square", zoneBorder: ["line", "dashed", "double", "glow", "none"].includes(f.zoneBorder) ? f.zoneBorder : "line", zoneStyle: ["flat", "fade", "shine", "glass", "hollow"].includes(f.zoneStyle) ? f.zoneStyle : "flat",
        indGrad: Array.isArray(f.indGrad) ? f.indGrad.filter((x) => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 3) : [],
        accent: hex(f.accent), wallColors: Array.isArray(f.wallColors) ? f.wallColors.filter((x) => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 5) : [] } : null;
      if (window.__bdCandleLooks && window.__bdCandleLooks.setWallColors) window.__bdCandleLooks.setWallColors(lfx ? lfx.wallColors : []);
    } catch { lfx = null; ltx = null; }
  }
  let lfxSig = "null", candSig = null, onWas = null;
  // data-ws-fx also carries the wallpaper brightness, refreshed every few seconds: only redraw when something we use changed
  const settingsObserver = new MutationObserver(() => {
    on = htmlEl().classList.contains("bd-on");
    const cs = htmlEl().getAttribute("data-ws-candles"); readFx(); const ls = JSON.stringify(lfx) + JSON.stringify(ltx);
    if (cs === candSig && ls === lfxSig && on === onWas) return;
    candSig = cs; lfxSig = ls; onWas = on; readCandles(); remapCacheMain.clear();
    try { window.__bdLite = !!(JSON.parse(htmlEl().getAttribute("data-ws-fx") || "{}").lite || JSON.parse(cs || "{}").lite); } catch {}
    repaint();
  });
  (function watch() {
    const el = document.documentElement;
    if (!el) return setTimeout(watch, 10);
    settingsObserver.observe(el, { attributes: true, attributeFilter: ["class", "data-ws-candles", "data-ws-fx"] });
    on = el.classList.contains("bd-on"); readCandles(); readFx();
  })();

  // ---------- colour normalisation (no recursion with our own setters) ----------
  const fillDesc = Object.getOwnPropertyDescriptor(proto, "fillStyle");
  const strokeDesc = Object.getOwnPropertyDescriptor(proto, "strokeStyle");
  const scratch = document.createElement("canvas").getContext("2d");
  function rgbKey(v) {
    if (typeof v !== "string") return null;
    let out = cache.get(v);
    if (out !== undefined) return out;
    try {
      fillDesc.set.call(scratch, "#000"); fillDesc.set.call(scratch, v);
      const n = fillDesc.get.call(scratch);
      if (n[0] === "#") out = { key: [1, 3, 5].map((i) => parseInt(n.slice(i, i + 2), 16)).join(","), a: null };
      else { const m = n.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); out = m ? { key: m[1] + "," + m[2] + "," + m[3], a: m[4] === undefined ? null : m[4] } : null; }
    } catch { out = null; }
    if (cache.size < 500) cache.set(v, out);
    return out;
  }

  // ---------- which colours are candles? ----------
  // Lightweight Charts' defaults: up #26a69a, down #ef5350. We also LEARN the real colours from any chart instance
  // we can reach, and from the most-drawn small opaque colourful fills (same idea as hook.js's drawn fallback).
  const DEFAULTS = [["#26a69a", "up"], ["#4caf50", "up"], ["#089981", "up"], ["#ef5350", "down"], ["#f23645", "down"], ["#e91e63", "down"]];
  let sides = new Map();            // "r,g,b" -> "up" | "down"
  let sidesSig = "";

  // Try to read the candle series options straight from a Lightweight Charts instance, if the site exposes one.
  // LW doesn't publish a global registry, so we look at common spots and any object with the series shape.
  function learnFromApi() {
    const found = [];
    const take = (o) => {
      if (!o || typeof o !== "object") return;
      try {
        const g = typeof o.options === "function" ? o.options() : null;
        if (g && (g.upColor || g.downColor)) {
          for (const k of ["upColor", "borderUpColor", "wickUpColor"]) if (g[k]) found.push([g[k], "up"]);
          for (const k of ["downColor", "borderDownColor", "wickDownColor"]) if (g[k]) found.push([g[k], "down"]);
        }
      } catch {}
    };
    try { (window.__bdLwSeries || []).forEach(take); } catch {}
    // common globals some apps leave around
    for (const name of ["series", "candleSeries", "mainSeries", "__series"]) { try { take(window[name]); } catch {} }
    return found;
  }

  const tally = new Map();          // drawn-colour frequency (fallback when no API)
  function noteFill(col) { if (typeof col === "string" && tally.size < 300) tally.set(col, (tally.get(col) || 0) + 1); }
  function hueOf(key) { const [R, G, B] = key.split(",").map((n) => n / 255); const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
    if (mx === mn) return 0; let h = mx === R ? (G - B) / (mx - mn) : mx === G ? 2 + (B - R) / (mx - mn) : 4 + (R - G) / (mx - mn); return (h * 60 + 360) % 360; }
  function colourful(key) { const [R, G, B] = key.split(",").map(Number); const mx = Math.max(R, G, B), mn = Math.min(R, G, B); return mx - mn > 28 && mx > 40; }
  function learnFromDrawing() {
    lastTally = [...tally].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const all = [...tally].filter(([c, n]) => n >= 6).map(([c, n]) => [rgbKey(c), n]).filter(([r]) => r && (r.a === null || +r.a >= 0.6)).sort((a, b) => b[1] - a[1]);
    tally.clear();
    // The two most-drawn COLOURFUL fills are the candles. Never greys, white or black: apps draw text, boxes and
    // backgrounds in those, and treating them as candles recoloured half the platform (seen on nq.vision).
    const cands = all.filter(([r]) => colourful(r.key)).slice(0, 2);
    if (cands.length < 2) return [];
    const [a, b] = cands.map(([r]) => r.key);
    const dGreen = (k) => Math.min(Math.abs(hueOf(k) - 140), 360 - Math.abs(hueOf(k) - 140));
    return dGreen(a) <= dGreen(b) ? [[a, "up"], [b, "down"]] : [[b, "up"], [a, "down"]];
  }

  const learnedDrawn = new Map();   // colour key -> "up" | "down", learned from what the chart really draws; kept once learned
  // ---------- candles recognised by their SHAPE ----------
  // The reliable way to tell candles apart from everything else an app draws (buttons, markers, text boxes, volume):
  // candle bodies and wicks are narrow bars spread across many x positions, and they end at many different heights
  // (volume bars all end at the bottom). Per colour we count those fills on the chart pane; the two colours drawn that
  // way the most are the candles, whatever they are: coloured, grey, white or black (nq.vision uses grey/black).
  // Only candle-shaped fills in those colours are recoloured, so the rest of the app is never touched.
  const shapeTally = new Map();     // colour key -> { n, xs:Set, bs:Set }
  let shapeSides = new Map();       // colour key -> "up" | "down"
  function noteShape(col, x, bottom) {
    const r = rgbKey(col); if (!r || (r.a !== null && +r.a < 0.6)) return;
    let m = shapeTally.get(r.key); if (!m) { if (shapeTally.size > 80) return; m = { n: 0, xs: new Set(), bs: new Set() }; shapeTally.set(r.key, m); }
    m.n++; if (m.xs.size < 400) m.xs.add(Math.round(x / 2)); if (m.bs.size < 200) m.bs.add(Math.round(bottom / 3));
  }
  function learnShape() {
    const c = [...shapeTally].filter(([, m]) => m.n >= 20 && m.xs.size >= 12 && m.bs.size >= 8).sort((a, b) => b[1].n - a[1].n).slice(0, 2);
    lastShape = [...shapeTally].sort((a, b) => b[1].n - a[1].n).slice(0, 5).map(([k, m]) => [k, m.n, m.xs.size, m.bs.size]);
    shapeTally.clear();
    if (c.length < 2) return null;
    const [a, b] = c.map(([k]) => k);
    if (colourful(a) && colourful(b)) { const dG = (k) => Math.min(Math.abs(hueOf(k) - 140), 360 - Math.abs(hueOf(k) - 140)); return dG(a) <= dG(b) ? [[a, "up"], [b, "down"]] : [[b, "up"], [a, "down"]]; }
    const lum = (k) => k.split(",").reduce((s, v) => s + +v, 0);
    return lum(a) >= lum(b) ? [[a, "up"], [b, "down"]] : [[b, "up"], [a, "down"]];
  }
  // the widest bar that can be a candle body: zoomed in, bodies get wide (they used to stop being recognised past
  // 60 px and fell back to the platform's own white / black, while the thin wicks kept your colours)
  const candleMaxW = (c) => Math.max(60, c.width * 0.2);
  let lastShape = [], apiSides = 0;
  // the platform's OWN candle colours are known (from its chart API, or found by their shape): only then can a filled
  // bar safely be called an indicator zone for the all-indicators colours, and never a candle
  const candlesKnown = () => apiSides > 0 || shapeSides.size > 0;
  const ownCandle = (k) => sides.has(k) || shapeSides.has(k);
  function learnSides() {
    if (!active) return;
    const best = new Map();
    const add = (c, side, rank) => { const r = rgbKey(c); if (!r) return; const cur = best.get(r.key);
      if (!cur || rank > cur.rank) best.set(r.key, { side, rank, tie: false }); else if (rank === cur.rank && side !== cur.side) cur.tie = true; };
    for (const [c, s] of DEFAULTS) add(c, s, 0);
    const api = learnFromApi(); for (const [c, s] of api) add(c, s, 3); apiSides = api.length;
    if (!api.length) {
      const sh = learnShape();
      if (sh) {                                             // found by shape: these are the candles, nothing else
        const sig = sh.map((x) => x.join()).join("|");
        if (sig !== [...shapeSides].map((x) => x.join()).join("|")) { shapeSides = new Map(sh); learnedDrawn.clear(); repaint(); }
      }
      if (!shapeSides.size) {                               // not found (yet): the older colour-frequency guess
        for (const [k, s] of learnFromDrawing()) if (colourful(k) && !learnedDrawn.has(k) && learnedDrawn.size < 8) learnedDrawn.set(k, s);
        for (const [k, s] of learnedDrawn) { if (!colourful(k)) continue; const cur = best.get(k); if (!cur) best.set(k, { side: s, rank: 2, tie: false }); }
      } else tally.clear();
    } else { shapeSides = new Map(); shapeTally.clear(); }
    const next = new Map(); for (const [k, v] of best) if (!v.tie) next.set(k, v.side);
    const sig = [...next].sort().join("|");
    if (sig !== sidesSig) { sides = next; sidesSig = sig; cache.clear(); remapCacheMain.clear(); repaint(); }   // new colours learned: the chart has to redraw to show them
  }

  // is this (already remapped) colour one of the chosen candle colours?
  function isCandleCol(v) { if (!candles || typeof v !== "string") return false; const r = rgbKey(v); return !!r && (r.key === candles.up.join(",") || r.key === candles.down.join(",")); }
  // ---------- remap ----------
  function remap(v) {
    if (!candles || typeof v !== "string") return v;
    const remapCache = candles.cache || remapCacheMain;    // each chart its own (charts can have their own colours)
    let out = remapCache.get(v);
    if (out !== undefined) return out;
    out = v;
    const r = rgbKey(v), side = r && sides.get(r.key);
    if (side) { const c = side === "up" ? candles.up : candles.down;
      out = r.a === null ? (side === "up" ? candles.upHex : candles.downHex) : `rgba(${c[0]},${c[1]},${c[2]},${r.a})`; }
    if (remapCache.size < 600) remapCache.set(v, out);
    return out;
  }

  // ---------- only touch the chart's own canvases ----------
  let paneCache = new WeakMap();
  function isChart(c) {
    if (!c) return false;
    let v = paneCache.get(c);
    if (v === undefined) {
      try { v = !!(c.closest && (c.closest(ROOT_SEL) || (c.parentElement && /lightweight|tv-lw/i.test(c.parentElement.className || "")) || (c.width >= 200 && c.height >= 120))); }
      catch { v = false; }
      paneCache.set(c, v);
    }
    return v;
  }

  let lwTableCache = new WeakMap();
  function inLwTable(c) { let v = lwTableCache.get(c); if (v === undefined) { try { v = !!(c.closest && c.closest(ROOT_SEL)); } catch { v = false; } lwTableCache.set(c, v); } return v; }

  // ---------- install the canvas hooks (once, when this is a LW page) ----------
  let active = false, lineHook = null, lineIsCurve = () => false, noteSolidHook = () => {};
  function install() {
    if (active) return;
    active = true;

    const d = Object.getOwnPropertyDescriptor(proto, "fillStyle");
    Object.defineProperty(proto, "fillStyle", { configurable: true, enumerable: d.enumerable, get: d.get,
      set(v) { this.__bdLwOrig = v; if (on && candles && isChart(this.canvas)) d.set.call(this, remap(v)); else d.set.call(this, v); } });
    const sd = Object.getOwnPropertyDescriptor(proto, "strokeStyle");
    Object.defineProperty(proto, "strokeStyle", { configurable: true, enumerable: sd.enumerable, get: sd.get,
      set(v) { if (on && candles && isChart(this.canvas)) sd.set.call(this, remap(v)); else sd.set.call(this, v); } });

    const origFillRect = proto.fillRect, origStrokeRectL = proto.strokeRect, origFillPathL = proto.fill;
    const lk = { g: null, px: 1, yfrac: 0,
      fill(x, y, w, h) { origFillRect.call(lk.g, x, y, w, h); }, style(v) { fillDesc.set.call(lk.g, v); },
      stroke(v) { strokeDesc.set.call(lk.g, v); }, strokeRect(x, y, w, h) { origStrokeRectL.call(lk.g, x, y, w, h); },
      fillPath() { origFillPathL.call(lk.g); }, clear(x, y, w, h) { origClearL.call(lk.g, x, y, w, h); } };
    const origClearL = proto.clearRect, lastBodyL = new WeakMap(), paintL = new WeakMap(), stackedL = new Set();
    let partsTrack = null;   // were the last paint's bodies wide enough to tell them from wicks?
    const tracker = () => partsTrack || (window.__bdCandleLooks && window.__bdCandleLooks.paintTracker ? (partsTrack = window.__bdCandleLooks.paintTracker(() => { try { repaint(); } catch {} })) : null);
    // Draw a candle body / wick in the chosen look (glow, neon, glass…). Used for fillRect bodies and for bodies some
    // builds draw as a one-rectangle path (rect / roundRect + fill). Returns false when it isn't a candle.
    let inLook = false;   // while a look draws, its own drawing must not be taken for another candle (no recursion)
    function candleLook(g, c, x, y, w, h) {
      if (inLook) return false;
      const L = window.__bdCandleLooks, look = candles && L && L.META[candles.look] ? candles.look : "solid";
      const meta = L && L.META[look], glow = candles ? Math.max(candles.glow, meta ? meta.minGlow : 0) : 0;
      const P = L && candles ? candles.P : null;
      if (!(on && candles && (glow > 0 || (look !== "solid" && look !== "shift") || P) && c && isChart(c) && Math.abs(h) < c.height * 0.8 && isCandleCol(g.fillStyle))) return false;
      const t = g.getTransform(), sx = t.a || 1, sy = t.d || 1, col0 = toHexCol(g.fillStyle), isUp = col0 === candles.upHex;
      // Rainbow: the colours fan out across the chart, left to right (as on TradingView)
      let col = col0;
      if (look === "prism" && L.hueRotate && c.width) { const step = Math.max(0, Math.min(31, Math.floor(((x * sx + t.e) / c.width) * 32)));
        col = L.toHex(L.hueRotate(L.rgbOf(col0), -70 + (step / 31) * 140)); }
      const isBody = Math.abs(w * sx) >= 3 && Math.abs(h * sy) >= 3, tr = P ? tracker() : null;
      // a bordered candle comes as two nested rects in the same colour: style it once
      if (P && isBody && L.nestedDupe(lastBodyL, g, Math.min(x, x + w) * sx + t.e, Math.min(y, y + h) * sy + t.f, Math.abs(w * sx), Math.abs(h * sy), col0)) return true;
      lk.g = g; lk.px = 1 / sx; lk.yfrac = c.height ? (y * sy + t.f) / c.height : 0;
      g.save(); inLook = true;
      try {
        if (glow > 0) { g.shadowColor = L ? L.tone(look, col, lk) : col; g.shadowBlur = 3 + glow * 16; }
        if (L && P && isBody) { if (tr) tr.note(c, true, Math.abs(w * sx)); L.candle(g, look, x, y, w, h, col, isUp, lk, P); }
        else if (L && look !== "solid" && isBody) L.draw(g, look, x, y, w, h, col, isUp, lk);
        else {
          // a wick: your wick colour / width only when this chart's bodies are wide enough to tell them apart
          if (tr) tr.note(c, false, 0);
          const bw = tr ? tr.bw(c) : 0, ok = P && bw >= 3 && Math.abs(w * sx) < 3;
          if (L) fillDesc.set.call(g, ok ? L.wickOf(look, col, isUp, lk, P) : L.wick(look, col, lk));
          let wx = x, ww = w; if (ok && P.wickW) { const nw = Math.min(P.wickW, Math.max(1, bw - 2)) / sx; wx = x + w / 2 - nw / 2; ww = nw; }
          origFillRect.call(g, wx, y, ww, h);
        }
      } finally { inLook = false; g.restore(); }
      return true;
    }
    // the path being built is exactly one rectangle? (rect / roundRect, nothing else)
    const pbox = new WeakMap();
    const oRect = proto.rect, oRound = proto.roundRect;
    proto.rect = function (x, y, w, h) { if (on) { const b = pbox.get(this); pbox.set(this, b === undefined ? { x, y, w, h } : null); } return oRect.call(this, x, y, w, h); };
    if (oRound) proto.roundRect = function (x, y, w, h, ...r) { if (on) { const b = pbox.get(this); pbox.set(this, b === undefined ? { x, y, w, h } : null); } return oRound.call(this, x, y, w, h, ...r); };
    const origStrokeRectLw = proto.strokeRect;
    const toHexCol = (v) => { const r = rgbKey(v); return r ? "#" + r.key.split(",").map((n) => (+n).toString(16).padStart(2, "0")).join("") : v; };
    proto.fillRect = function (x, y, w, h) {
      const c = this.canvas;
      if (on && c && typeof this.__bdLwOrig === "string" && Math.abs(w) < c.width * 0.5 && Math.abs(h) < c.height * 0.5 && (inLwTable(c) || isChart(c))) noteFill(this.__bdLwOrig);
      if (on && c && isChart(c) && c.width > 200 && c.height > 120) {
        const t = this.getTransform(), sx = t.a || 1, sy = t.d || 1;
        // a (near) full-canvas rect = the chart background; clear it so a wallpaper shows through
        if (Math.abs(w * sx) >= c.width * 0.9 && Math.abs(h * sy) >= c.height * 0.9) return this.clearRect(x, y, w, h);
      } else if (on && c && inLwTable(c)) {
        // the price / time scale strips: a translucent dark panel instead of solid, so the wallpaper shows through but the numbers stay readable
        const t = this.getTransform(), sx = t.a || 1, sy = t.d || 1;
        if (Math.abs(w * sx) >= c.width * 0.9 && Math.abs(h * sy) >= c.height * 0.9) {
          // Style → Price scale → Backing: Default = the app's own; Colour = your colour; Auto / Glass = this soft dark tint
          const mode = lfx ? lfx.scaleBg : "auto";
          if (mode === "default") return origFillRect.call(this, x, y, w, h);
          const tint = mode === "color" ? `rgba(${hexToRgb(lfx.scaleBgColor).join(",")},0.72)` : "rgba(6,9,16,0.5)";
          const prev = this.fillStyle; fillDesc.set.call(this, tint); origFillRect.call(this, x, y, w, h); fillDesc.set.call(this, prev); return;
        }
      }
      if (on && c && isChart(c) && c.width > 200 && c.height > 120 && typeof this.__bdLwOrig === "string" && !isCandleCol(this.__bdLwOrig) && !isCandleCol(remap(this.__bdLwOrig))) {
        const L = window.__bdCandleLooks, t = this.getTransform(), W = Math.abs(w * (t.a || 1)), H = Math.abs(h * (t.d || 1));
        if (L && L.zone && W >= 12 && H >= 2 && W * H >= 150) {
          L.noteSeen(this.__bdLwOrig, "zone");
          // its own settings (Each indicator), or the all-indicators colour (greys stay grey, like grey lines)
          const zk = L.keyOf(this.__bdLwOrig), own = zk && lfx && lfx.indCustom && lfx.indCustom[zk.k];
          const all = zk && lfx && lfx.indMode && lfx.indMode !== "own" && !greyish(`rgb(${zk.k})`) && candlesKnown() && !ownCandle(zk.k);
          const dim = !!(zk && lfx && lfx.zoneDim && zk.a < 0.9 && !ownCandle(zk.k));   // Dim all zones
          const dprL = (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
          let shaped = lfx && (lfx.zoneShape !== "square" || lfx.zoneBorder !== "line" || lfx.zoneStyle !== "flat") && zk && zk.a < 0.9 && !ownCandle(zk.k)
            && H >= 8 * dprL && W >= 24 * dprL && !stackedL.has(zk.k + "|" + zk.a);   // not slivers (zoomed out), not the position tool
          if (shaped) {                      // two zone boxes touching edge to edge in one paint = a Long / Short tool: square
            const X = Math.min(x, x + w) * (t.a || 1) + t.e, Y = Math.min(y, y + h) * (t.d || 1) + t.f, key = zk.k + "|" + zk.a;
            let PB = paintL.get(c); if (!PB) { PB = []; paintL.set(c, PB); queueMicrotask(() => paintL.delete(c)); }
            for (const b of PB) if (b.k !== key && Math.abs(b.X - X) <= 3 && Math.abs(b.X + b.W - X - W) <= 3 && (Math.abs(b.Y + b.H - Y) <= 2.5 || Math.abs(Y + H - b.Y) <= 2.5)) { stackedL.add(key); stackedL.add(b.k); shaped = false; setTimeout(repaint, 0); }
            PB.push({ X, Y, W, H, k: key });
          }
          const z = !(own || all || dim) && shaped ? L.zoneOwn(this.__bdLwOrig) : own || all || dim ? L.zone(this.__bdLwOrig, { mode: all ? lfx.indMode : "own", color: lfx.indColor, up: candles && candles.upHex, down: candles && candles.downHex, accent: lfx.accent, custom: lfx.indCustom, glow: lfx.lineGlow, zoneFill: lfx.zoneFill, dim, grad: lfx.indGrad }, this) : null;
          if (z && W <= candleMaxW(c) && H < c.height * 0.8) noteShape(this.__bdLwOrig, x * (t.a || 1) + t.e, Math.max(y, y + h) * (t.d || 1) + t.f);   // keep learning the candles' shape
          if (z) { if (z.hide) return; const pF = this.fillStyle, pB = this.shadowBlur, pC = this.shadowColor;
            // the neon edge (see candlelooks zone()): boxes and bands only, not full-height shading or slivers
            const edge = z.e && H < c.height * 0.9 && W >= 6 && H >= 3 ? z.e : null;
            if (shaped && L.zoneBox && H < c.height * 0.9) {                 // rounded / pill / dashed / double / glow
              const zz = { ...z, e: edge }, k = { begin: () => this.beginPath(), fill: () => origFillPathL.call(this), stroke: () => origStrokeP.call(this),
                style: (v) => fillDesc.set.call(this, v), strokeStyle: (v) => strokeDesc.set.call(this, v) };
              inLook = true; try { if (L.zoneBox(this, k, x, y, w, h, zz, { shape: lfx.zoneShape, border: lfx.zoneBorder, style: lfx.zoneStyle, px: 1 / (t.a || 1) })) return; } finally { inLook = false; } }
            fillDesc.set.call(this, z.f); if (z.glow > 0 && !edge) { this.shadowColor = z.g; this.shadowBlur = 3 + z.glow * 22; }
            origFillRect.call(this, x, y, w, h); fillDesc.set.call(this, pF); this.shadowBlur = pB; this.shadowColor = pC;
            if (edge) { const pS = strokeDesc.get.call(this), pW = this.lineWidth, pD = this.getLineDash();
              strokeDesc.set.call(this, edge); this.lineWidth = Math.max(1, (typeof devicePixelRatio === "number" && devicePixelRatio) || 1) / (t.a || 1); this.setLineDash([]);
              if (z.glow > 0) { this.shadowColor = z.g; this.shadowBlur = 3 + z.glow * 18; }
              origStrokeRectLw.call(this, x, y, w, h);
              strokeDesc.set.call(this, pS); this.lineWidth = pW; this.setLineDash(pD); this.shadowBlur = pB; this.shadowColor = pC; }
            return; }
        }
      }
      drawCalls.fillRect++;
      if (on && c) noteSolidHook(this, x, y, w, h);
      if (on && c && isAxis(c) && lfx && lfx.chOn && lfx.chLabels && greyish(this.fillStyle) && labelBox(this, w, h)) {
        const p = this.fillStyle, col = pickCol(lfx.chColor, String(p)); fillDesc.set.call(this, col); origFillRect.call(this, x, y, w, h); fillDesc.set.call(this, p);
        lastBox.set(this, "xh:" + col); return;
      }
      if (on && c && (isAxis(c) || isPaneC(c))) {
        noteBox(this, w, h); if (labelBox(this, w, h)) noteTagRow(this, y, h);
        if (lfx && lfx.bracketOn && lfx.bracketFill && !greyish(this.fillStyle) && !isCandleCol(this.fillStyle)) {
          if (labelBox(this, w, h)) { const p = this.fillStyle; fillDesc.set.call(this, lfx.bracketFill); origFillRect.call(this, x, y, w, h); fillDesc.set.call(this, p); return; }
        }
      }
      if (on && isPaneC(c) && !inLook) {
        const t = this.getTransform(), W = Math.abs(w * (t.a || 1)), H = Math.abs(h * (t.d || 1));
        if (W > 0 && W <= candleMaxW(c) && H < c.height * 0.8) {
          noteShape(this.__bdLwOrig, x * (t.a || 1) + t.e, Math.max(y, y + h) * (t.d || 1) + t.f);
          const side = candles && shapeSides.size ? shapeSides.get((rgbKey(this.__bdLwOrig) || {}).key) : null;
          if (side) {                                          // a grey / black candle: paint it in your candle colour
            const p = this.fillStyle; fillDesc.set.call(this, side === "up" ? candles.upHex : candles.downHex);
            if (!candleLook(this, c, x, y, w, h)) origFillRect.call(this, x, y, w, h);
            fillDesc.set.call(this, p); return;
          }
        }
      }
      if (candleLook(this, c, x, y, w, h)) return;
      return origFillRect.call(this, x, y, w, h);
    };
    // Some (modified) builds draw candle bodies as paths (rounded bodies, custom series) instead of fillRect:
    // learn their colours from fill() too, and glow them the same way.
    const origFillP = proto.fill;
    proto.fill = function (...a) {
      const c = this.canvas;
      if (on && c && typeof this.__bdLwOrig === "string" && isChart(c)) { noteFill(this.__bdLwOrig); drawCalls.fill++; }
      if (on && c && !a.length) { const b = pbox.get(this); if (b) noteSolidHook(this, b.x, b.y, b.w, b.h); }
      if (on && c && !inLook && isAxis(c) && lfx && lfx.chOn && lfx.chLabels && greyish(this.fillStyle)) { const b = pbox.get(this);
        if (b && labelBox(this, b.w, b.h)) { const p = this.fillStyle, col = pickCol(lfx.chColor, String(p)); fillDesc.set.call(this, col); const r = origFillP.apply(this, a); fillDesc.set.call(this, p); lastBox.set(this, "xh:" + col); return r; } }
      if (on && c && !inLook && (isAxis(c) || isPaneC(c))) { const b = pbox.get(this); if (b && labelBox(this, b.w, b.h)) { noteBox(this, b.w, b.h); noteTagRow(this, b.y, b.h);
        if (lfx && lfx.bracketOn && lfx.bracketFill && !greyish(this.fillStyle) && !isCandleCol(this.fillStyle)) { const p = this.fillStyle; fillDesc.set.call(this, lfx.bracketFill); const r = origFillP.apply(this, a); fillDesc.set.call(this, p); return r; } } }
      if (on && c && !a.length && !inLook && isPaneC(c)) { const b = pbox.get(this);
        if (b) {                                             // candles drawn as one-rectangle shapes
          const t = this.getTransform(), W = Math.abs(b.w * (t.a || 1)), H = Math.abs(b.h * (t.d || 1));
          if (W > 0 && W <= candleMaxW(c) && H < c.height * 0.8) { noteShape(this.__bdLwOrig, b.x * (t.a || 1) + t.e, Math.max(b.y, b.y + b.h) * (t.d || 1) + t.f);
            const side = candles && shapeSides.size ? shapeSides.get((rgbKey(this.__bdLwOrig) || {}).key) : null;
            if (side) { const p = this.fillStyle; fillDesc.set.call(this, side === "up" ? candles.upHex : candles.downHex);
              if (!candleLook(this, c, b.x, b.y, b.w, b.h)) origFillP.apply(this, a); fillDesc.set.call(this, p); return; } }
        }
      }
      if (on && candles && c && !a.length && !inLook) { const b = pbox.get(this);
        if (b && candleLook(this, c, b.x, b.y, b.w, b.h)) { drawCalls.pathLook = (drawCalls.pathLook || 0) + 1; return; } }
      if (on && candles && candles.glow > 0 && c && isChart(c) && isCandleCol(this.fillStyle)) {
        const pB = this.shadowBlur, pC = this.shadowColor;
        this.shadowColor = this.fillStyle; this.shadowBlur = 3 + candles.glow * 16;
        const r = origFillP.apply(this, a); this.shadowBlur = pB; this.shadowColor = pC; return r;
      }
      return origFillP.apply(this, a);
    };
    const origStrokeP = proto.stroke;
    proto.stroke = function (...a) {
      const c = this.canvas;
      if (on && lfx && lineHook && !a.length && lineHook(this)) return;
      // Line glow: indicator lines and drawings are long paths that aren't straight across the chart (grid, crosshair,
      // price lines are), in a colour that isn't grey and isn't a candle
      const curve = on && !inLook && c && c.width > 200 && c.height > 120 && isChart(c) && lineIsCurve(this);
      if (curve && window.__bdCandleLooks && window.__bdCandleLooks.noteSeen) window.__bdCandleLooks.noteSeen(strokeDesc.get.call(this), "line");   // "Each indicator" list
      const custom = lfx && lfx.indCustom && Object.keys(lfx.indCustom).length > 0;
      if (curve && lfx && (lfx.lineGlow > 0 || lfx.indMode !== "own" || custom)) {
        // your indicator colours (Style > Indicators, and Each indicator), then the glow in that colour
        const cur = strokeDesc.get.call(this), L = window.__bdCandleLooks;
        const ind = (lfx.indMode !== "own" || custom) && L && L.indicator ? L.indicator(this, cur, { mode: lfx.indMode, color: lfx.indColor, up: candles && candles.upHex, down: candles && candles.downHex, accent: lfx.accent, custom: lfx.indCustom, grad: lfx.indGrad }) : null;
        if (ind && ind.hide) return;
        const glowAmt = ind && ind.glow !== undefined ? ind.glow : lfx.lineGlow;
        const pB = this.shadowBlur, pC = this.shadowColor, pW = this.lineWidth;
        if (ind) strokeDesc.set.call(this, ind.s);
        if (ind && ind.w) this.lineWidth = pW * (1 + ind.w * 0.75);
        if (glowAmt > 0) { this.shadowColor = ind ? ind.g : cur; this.shadowBlur = 2 + glowAmt * 14; }
        const r = origStrokeP.apply(this, a); this.shadowBlur = pB; this.shadowColor = pC; this.lineWidth = pW; if (ind) strokeDesc.set.call(this, cur); return r;
      }
      if (on && candles && candles.glow > 0 && c && isChart(c) && isCandleCol(this.strokeStyle)) {
        drawCalls.stroke++;
        const pB = this.shadowBlur, pC = this.shadowColor;
        this.shadowColor = this.strokeStyle; this.shadowBlur = 2 + candles.glow * 12;
        const r = origStrokeP.apply(this, a); this.shadowBlur = pB; this.shadowColor = pC; return r;
      }
      return origStrokeP.apply(this, a);
    };
    // ---------- chart lines: grid, crosshair, price line ----------
    // Lightweight Charts strokes each kind as one path of straight lines across the pane: the grid = several long
    // grey lines in one path; the crosshair = one dashed line (vertical + horizontal); the price line = one dashed
    // horizontal line in the candle colour. We record the path's segments and restyle at stroke time.
    const seg = new WeakMap();   // ctx -> { n, ok, x0, y0, last:[x,y] }
    const oBegin = proto.beginPath, oMove = proto.moveTo, oLine = proto.lineTo;
    const lineFx = () => on;   // (always: the "Each indicator" list needs to see the lines even with no styling on)
    // hz / hy / hp: the path is only horizontal straight lines (an indicator's levels, like prints); y in device px
    proto.beginPath = function () { if (lineFx()) seg.set(this, { n: 0, ok: true, h: 0, v: 0, p: null, hz: true, hy: null, hp: null }); pbox.delete(this); return oBegin.call(this); };
    proto.moveTo = function (x, y) { const k = lineFx() && seg.get(this); if (k) { k.p = [x, y]; if (k.hz) { const t = this.getTransform(); k.hp = y * (t.d || 1) + t.f; if (k.hy === null) k.hy = k.hp; } } if (on) pbox.set(this, null); return oMove.call(this, x, y); };
    proto.lineTo = function (x, y) {
      const k = lineFx() && seg.get(this);
      if (k && k.hz) { const t = this.getTransform(), Y = y * (t.d || 1) + t.f; if (k.hp === null || Math.abs(Y - k.hp) > 1.5) k.hz = false; else k.hp = Y; }
      if (k && !k.ok) k.n++;                    // a curve (indicator line): just count its points, for Line glow
      else if (k && k.ok) {
        const c = this.canvas, t = this.getTransform(), sx = t.a || 1, sy = t.d || 1, p = k.p;
        if (!p || !c) k.ok = false;
        else {
          const dx = Math.abs(x - p[0]) * sx, dy = Math.abs(y - p[1]) * sy;
          if (dy <= 1 && dx >= c.width * 0.6) k.h++; else if (dx <= 1 && dy >= c.height * 0.6) k.v++; else k.ok = false;
          k.n++; k.p = [x, y];
        }
      }
      if (on) pbox.set(this, null);
      return oLine.call(this, x, y);
    };
    for (const nm of ["arc", "arcTo", "quadraticCurveTo", "bezierCurveTo", "ellipse", "rect", "roundRect"]) { const o = proto[nm]; if (o) proto[nm] = function (...a) { if (on) { if (nm !== "rect" && nm !== "roundRect") pbox.set(this, null); const k = seg.get(this); if (k) k.hz = false; } return o.apply(this, a); }; }
    const DASH = { solid: [], dotted: [1, 3], dashed: [5, 5] };
    // grid colours are muted: little colour in them (dark navy greys count), or mostly transparent
    const greyish = (col) => { const r = rgbKey(col); if (!r) return false; const [R, G, B] = r.key.split(",").map(Number);
      return Math.max(R, G, B) - Math.min(R, G, B) < 42 || (r.a !== null && +r.a <= 0.3); };
    const pickCol = (opt, cur) => (opt === "candle" ? (candles ? candles.upHex : cur) : opt || lfx.accent || (candles ? candles.upHex : cur));
    function styleLines(ctx) {
      const k = seg.get(ctx), c = ctx.canvas;
      if (!k || !k.ok || !k.n || !c || !isChart(c)) return false;
      const cur = strokeDesc.get.call(ctx), dashed = ctx.getLineDash().length > 0;
      let part = null;
      // the price line is drawn in the candle colour: the chosen one, or (grey / black candles we recolour by shape)
      // the platform's original one; never take it for a crosshair line
      const r0 = rgbKey(cur), candleOrig = !!r0 && shapeSides.has(r0.key);
      strokeNo++;
      if (k.n === 1 && dashed && k.h && (isCandleCol(cur) || candleOrig)) part = lfx.plOn ? "pl" : null;
      else if (k.n === 1 && k.h && !greyish(cur) && !isCandleCol(cur)) part = lfx.bracketOn && (lfx.bracketLineColor || lfx.bracketLineW) ? "lvl" : null;   // an order / position line
      else if (k.n === 1 && dashed) part = lfx.chOn ? "ch" : null;
      // the grid: Lightweight Charts draws all its grid lines of one direction in ONE stroke (many segments). A single
      // grey / white line is a level an indicator draws (session high, VWAP band…): never restyle or hide it as grid.
      else if (greyish(cur) && k.n >= 2) part = lfx.gridOn ? "grid" : null;
      if (!part) return false;
      if (part === "grid" && lfx.gridStyle === "none") return true;
      const opt = part === "grid" ? [lfx.gridColor, lfx.gridW, lfx.gridStyle] : part === "ch" ? [lfx.chColor, lfx.chW, lfx.chStyle] : part === "lvl" ? [lfx.bracketLineColor || cur, lfx.bracketLineW, null] : [lfx.plColor, lfx.plW, lfx.plStyle];
      const sxx = ctx.getTransform().a || 1, pS = cur, pLW = ctx.lineWidth, pD = ctx.getLineDash(), pA = ctx.globalAlpha;
      strokeDesc.set.call(ctx, part === "lvl" ? opt[0] : pickCol(opt[0], cur)); ctx.lineWidth = part === "lvl" ? Math.max(pLW, (1 + opt[1]) / sxx) : (1 + opt[1]) / sxx;
      if (opt[2]) ctx.setLineDash(DASH[opt[2]].map((d) => d * (1 + opt[1] * 0.5) / sxx));
      if (part === "grid") ctx.globalAlpha = pA * lfx.gridAlpha;
      drawCalls.lines++;
      origStrokeP.call(ctx);
      strokeDesc.set.call(ctx, pS); ctx.lineWidth = pLW; ctx.setLineDash(pD); ctx.globalAlpha = pA;
      // Glow at the pointer: once both crosshair lines of this frame are known, a soft light where they cross
      if (part === "ch" && lfx.chGlow) {
        // each line keeps its own time: in a pane the pointer has left, only the vertical line is still drawn, and an
        // old horizontal position must not light up a second glow there
        const now = performance.now(), m = xhair.get(ctx) || {}, t = ctx.getTransform();
        if (k.v) { m.x = k.p[0] * (t.a || 1) + t.e; m.xt = now; m.vs = strokeNo; } else { m.y = k.p[1] * (t.d || 1) + t.f; m.yt = now; m.hs = strokeNo; }
        xhair.set(ctx, m);
        // only where the two crosshair lines cross: they're drawn one right after the other; any other dashed
        // horizontal line on the chart (a price or level line) must not light up a second glow
        if (m.x != null && m.y != null && Math.abs((m.xt || 0) - (m.yt || 0)) < 30 && Math.abs((m.vs || 0) - (m.hs || 0)) === 1) {
          if (window.__bdGlowDebug) window.__bdGlowDebug.push([Math.round(m.x), Math.round(m.y), String(cur)]);   // tests
          const R = 34 * ((typeof devicePixelRatio === "number" && devicePixelRatio) || 1), rgb = rgbKey(pickCol(lfx.chGlowColor || lfx.chColor, cur)),   // its own colour, or the crosshair's
            k3 = rgb ? rgb.key : "255,255,255";
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
          const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, R);
          g.addColorStop(0, `rgba(${k3},0.45)`); g.addColorStop(0.35, `rgba(${k3},0.14)`); g.addColorStop(1, `rgba(${k3},0)`);
          fillDesc.set.call(ctx, g); origFillRect.call(ctx, m.x - R, m.y - R, R * 2, R * 2); ctx.restore();
        }
      }
      return true;
    }
    const xhair = new WeakMap();   // canvas ctx -> where this frame's crosshair lines are
    let strokeNo = 0;              // counts restyled lines, to know which two were drawn back to back
    // an indicator line: a curve (3+ points, not straight across), or an indicator's LEVEL line (prints, pivots):
    // straight horizontal, solid, not a candle colour, not the grid (that's several lines in one stroke), and not an
    // order / position line (those have a coloured price tag on the scale at the same height)
    lineIsCurve = (ctx) => { const k = seg.get(ctx), col = strokeDesc.get.call(ctx); if (!k || typeof col !== "string" || isCandleCol(col)) return false;
      if (!k.ok && k.n >= 3 && !greyish(col)) return true;
      return k.hz && k.n >= 1 && k.hy !== null && !ctx.getLineDash().length && !(greyish(col) && k.n >= 2) && !(shapeSides.has((rgbKey(col) || {}).key)) && !onTagRow(k.hy) && settled(col, k.hy); };
    // a new level line counts only after ~1 s: by then an order line's price tag on the same row is known
    const levelFirst = new Map();
    // by colour: once settled it stays (no flashing back as lines move); the price-tag check still runs on every draw
    const settled = (col) => { const key = col, now = performance.now(), f = levelFirst.get(key);
      if (f === undefined) { if (levelFirst.size > 300) levelFirst.delete(levelFirst.keys().next().value); levelFirst.set(key, now);
        if (!levelT) levelT = setTimeout(() => { levelT = 0; if (on) repaint(); }, 1100);   // a still chart may not repaint by itself
        return false; } return now - f > 1000; };
    let levelT = 0;
    lineHook = styleLines;

    // ---------- price scale text, bracket labels, P&L and last price ----------
    // On the price-scale canvas Lightweight Charts draws each tag as a box and then its text; plain tick numbers
    // have no box. We remember the box drawn just before a text to tell them apart.
    const lastBox = new WeakMap();   // ctx -> fill colour of the label box drawn just before
    const PNL_RE = /^(?:p\s*(?:&|n|\/)?\s*l\s*:?\s*)?([+\-\u2212])?\s*([$\u20ac\u00a3\u00a5])?\s*([+\-\u2212])?\s*(\d{1,3}(?:,\d{3})*|\d+)(\.\d{1,2})\s*(usd|usdt|usdc|eur|gbp|jpy|aud|cad|chf|nzd|pts|points)?$/i;
    // the chart pane is big; the price scale (narrow) and time scale (short) canvases sit in the same table
    const isPaneC = (c) => c && isChart(c) && c.width > 200 && c.height > 120;
    const isAxis = (c) => c && inLwTable(c) && !(c.width > 200 && c.height > 120);
    const mask = (t) => String(t).replace(/[+\-\u2212]?\s*[$\u20ac\u00a3\u00a5]?\s*\d[\d.,\s]*/g, (m) => "\u2022".repeat(Math.max(3, Math.min(7, m.replace(/\D/g, "").length))));
    const privText = (t) => { if (!lfx || !lfx.privacy || lfx.privacyPnl === "show") return t; if (lfx.privacyPnl === "hide") return mask(t);
      return /[$\u20ac\u00a3\u00a5]|\b(USD|EUR|GBP)\b/i.test(String(t)) ? mask(t) : t; };
    const sizeUp = (font, px) => String(font).replace(/(\d+(?:\.\d+)?)px/, (m, n) => (+n + px) + "px");
    let pnlSum = 0, pnlFrame = -1, frameNo = 0, lastQuoteWrite = -1e9, lastQuoteVal = NaN, pnlWrite = -1e9, pnlU = "", pnlQueued = false, pnlLastVal = null, pnlTrail = 0;
    function publishPnl() {
      pnlQueued = false;
      const now = performance.now(), val = Math.round(pnlSum * 100) / 100, since = now - pnlWrite;
      if (val === pnlLastVal ? since < 1000 : since < 100) { if (val !== pnlLastVal && !pnlTrail) pnlTrail = setTimeout(() => { pnlTrail = 0; publishPnl(); }, 100 - since + 5); return; }
      pnlWrite = now; pnlLastVal = val; htmlEl().setAttribute("data-ws-pnl", JSON.stringify({ v: val, unit: pnlU, ts: Date.now() }));
    }
    (function tick() { frameNo++; requestAnimationFrame(tick); })();
    // a label box: 8–60 px tall; on the chart itself also wide (≥ 24 px, so candle and volume bars never count) and coloured
    const labelBox = (g, w, h) => { const c = g.canvas, t = g.getTransform(), H = Math.abs(h * (t.d || 1)), W = Math.abs(w * (t.a || 1));
      if (H < 8 || H > 60 || W < 12 || W > c.width * 1.01) return false;
      return isAxis(c) || (isPaneC(c) && W >= 24 && W < c.width * 0.5 && !greyish(g.fillStyle) && !isCandleCol(g.fillStyle)); };
    function noteBox(g, w, h) { if (labelBox(g, w, h)) lastBox.set(g, String(g.fillStyle)); }
    // rows (device y) of the coloured price tags on the price scale lately: order / position / price lines have one
    const tagRows = [];
    function noteTagRow(g, y, h) { const c = g.canvas; if (!c || !isAxis(c) || greyish(g.fillStyle)) return;   // grey = the crosshair's tag
      const t = g.getTransform(), Y = (y + h / 2) * (t.d || 1) + t.f, now = performance.now(), i = tagRows.findIndex((e) => Math.abs(e.y - Y) <= 3);
      if (i >= 0) tagRows[i] = { y: Y, t: now }; else { tagRows.push({ y: Y, t: now }); if (tagRows.length > 60) tagRows.shift(); } }
    const onTagRow = (Y) => { const now = performance.now(); for (const e of tagRows) if (now - e.t < 20000 && Math.abs(e.y - Y) <= 6) return true; return false; };
    const oText = proto.fillText, oStrokeText = proto.strokeText;
    // solid boxes drawn on the chart lately (an indicator's label box): the text inside keeps its own colours
    const solidLw = new WeakMap();
    function noteSolidLw(g, x, y, w, h) { const c = g.canvas; if (!c || !isPaneC(c) || !ltx) return;
      const r = rgbKey(String(g.fillStyle)); if (!r || (r.a !== null && +r.a < 0.6)) return;
      const t = g.getTransform(), W = Math.abs(w * (t.a || 1)), H = Math.abs(h * (t.d || 1)); if (W >= c.width * 0.6 || H >= c.height * 0.5) return;
      const x0 = x * (t.a || 1) + t.e, y0 = y * (t.d || 1) + t.f; let a = solidLw.get(g); if (!a) { a = []; solidLw.set(g, a); }
      a.push({ x0: Math.min(x0, x0 + w * (t.a || 1)), y0: Math.min(y0, y0 + h * (t.d || 1)), x1: Math.max(x0, x0 + w * (t.a || 1)), y1: Math.max(y0, y0 + h * (t.d || 1)), t: performance.now() }); if (a.length > 40) a.shift(); }
    function inSolidLw(g, x, y) { const a = solidLw.get(g); if (!a || !a.length) return false; const t = g.getTransform(), X = x * (t.a || 1) + t.e, Y = y * (t.d || 1) + t.f, now = performance.now();
      for (let i = a.length - 1; i >= 0; i--) { const b = a[i]; if (now - b.t > 150) break; if (X >= b.x0 - 2 && X <= b.x1 + 2 && Y >= b.y0 - 2 && Y <= b.y1 + 2) return true; } return false; }
    noteSolidHook = noteSolidLw;
    proto.fillText = function (t, x, y, ...rest) {
      const c = this.canvas;
      if (!on || !c || inLook) return oText.call(this, t, x, y, ...rest);
      if (isPaneC(c)) {                                   // text on the chart itself: a P&L readout (for Live mood: P&L)
        const m = typeof t === "string" && t.length < 40 && t.trim().match(PNL_RE);
        if (m && (m[1] || m[2] || m[3] || m[6] || /^p/i.test(t.trim()))) {
          const v = parseFloat((m[4] + m[5]).replace(/,/g, "")) * ((m[1] || m[3]) === "-" || (m[1] || m[3]) === "\u2212" ? -1 : 1);
          if (frameNo !== pnlFrame) { pnlFrame = frameNo; pnlSum = 0; } pnlSum += v; pnlU = m[2] || (m[6] || "").toUpperCase();
          if (!pnlQueued) { pnlQueued = true; queueMicrotask(publishPnl); }    // as soon as it changes (see hook.js)
          if (lfx && lfx.privacy) t = privText(t);
        }
        const pb = lastBox.get(this); lastBox.delete(this);
        if (pb && lfx && (lfx.bracketOn || lfx.privacy)) {     // the title box of an order / position line on the chart
          const pF = this.font, pS = this.fillStyle, sign = /^\s*\w*\s*[+]/.test(t) ? 1 : /^\s*\w*\s*[-\u2212]/.test(t) ? -1 : 0;
          if (lfx.bracketOn) { const col = sign > 0 && lfx.bracketProfit ? lfx.bracketProfit : sign < 0 && lfx.bracketLoss ? lfx.bracketLoss : lfx.bracketText;
            if (col) fillDesc.set.call(this, col); if (lfx.bracketSize) this.font = sizeUp(pF, lfx.bracketSize); }
          const r = oText.call(this, privText(t), x, y, ...rest); this.font = pF; fillDesc.set.call(this, pS); return r;
        }
        // Chart text (Style > Chart text): the platform's / an indicator's text on the chart, not inside its own box
        if (ltx && !inSolidLw(this, x, y)) {   // (even on Own: black text on a dark wallpaper is lightened)
          const L = window.__bdCandleLooks;
          if (L && L.chartText && L.chartText(this, { fill: (v) => fillDesc.set.call(this, v), stroke: (v) => strokeDesc.set.call(this, v), text: (...q) => oText.apply(this, q), strokeText: (...q) => oStrokeText.apply(this, q) },
            [t, x, y, ...rest], { ...ltx, up: candles && candles.upHex })) return;
        }
        return oText.call(this, t, x, y, ...rest);
      }
      if (!isAxis(c)) return oText.call(this, t, x, y, ...rest);
      const box = lastBox.get(this); lastBox.delete(this);
      const pF = this.font, pS = this.fillStyle, pB = this.shadowBlur, pC = this.shadowColor;
      if (box && box.startsWith("xh:")) {                // crosshair label we coloured: dark or light text, whichever reads
        const r = rgbKey(box.slice(3)), L = r ? r.key.split(",").reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0) / 255 : 0;
        fillDesc.set.call(this, L > 0.55 ? "#06110d" : "#ffffff");
      } else if (box && isCandleCol(box)) {                      // the last-price tag: remember the price (Live mood: day move)
        const n = parseFloat(String(t).replace(/[^\d.\-]/g, ""));
        // a new price straight away (the first one too: a quiet chart may draw its price tag only once), the same price once a second
        const now = performance.now(); if (isFinite(n) && (n !== lastQuoteVal || now - lastQuoteWrite > 1000)) { lastQuoteWrite = now; lastQuoteVal = n; htmlEl().setAttribute("data-bd-lwquote", JSON.stringify({ p: n, ts: Date.now() })); }
      } else if (box && !greyish(box)) {                 // a coloured tag that isn't the price: an order / position label
        if (lfx && lfx.bracketOn) {
          const sign = /^\s*[+]/.test(t) ? 1 : /^\s*[-\u2212]/.test(t) ? -1 : 0;
          const col = sign > 0 && lfx.bracketProfit ? lfx.bracketProfit : sign < 0 && lfx.bracketLoss ? lfx.bracketLoss : lfx.bracketText;
          if (col) fillDesc.set.call(this, col);
          if (lfx.bracketSize) this.font = sizeUp(pF, lfx.bracketSize);
        }
        t = privText(t);
      } else if (!box && lfx) {                           // plain price / time numbers
        if (lfx.scaleText) fillDesc.set.call(this, lfx.scaleText);
        let f = pF; if (lfx.scaleSize) f = sizeUp(f, lfx.scaleSize * 1.5);
        if (lfx.scaleFont !== "default" && lfx.scaleFamily) f = f.replace(/(\d+(?:\.\d+)?px)\s+.*$/, (m, sz) => sz + " " + lfx.scaleFamily);
        if (lfx.scaleBold && !/\bbold\b|\b[6-9]00\b/.test(f)) f = "bold " + f;
        this.font = f;
        if (lfx.scaleGlow > 0) { this.shadowColor = lfx.scaleText || String(pS); this.shadowBlur = 2 + lfx.scaleGlow * 8; }
      }
      const r = oText.call(this, t, x, y, ...rest);
      this.font = pF; fillDesc.set.call(this, pS); this.shadowBlur = pB; this.shadowColor = pC;
      return r;
    };

    setInterval(markRoots, 2000);

    setInterval(learnSides, 1500);
    learnSides(); setTimeout(learnSides, 400); setTimeout(learnSides, 900);
    htmlEl().setAttribute && htmlEl().setAttribute("data-bd-lw", "on");   // diagnostics: the Lightweight Charts adapter is active on this page
    // each chart in a layout matched to its own wallpaper (data-ws-charts from content.js; chart 1 = your colours)
    let chartCols = null, chartOfC = new WeakMap();
    const hx = (v) => (/^#[0-9a-f]{6}$/i.test(v || "") ? v.toLowerCase() : "");
    const readCharts = () => { let a = null; try { a = JSON.parse(htmlEl().getAttribute("data-ws-charts") || "null"); } catch {}
      // a chart styled on its own (Style each chart): its candles + chart styling, parsed exactly like the main ones
      const parseOwn = (q) => { const sf = lfx, st = ltx, sc = candles; readFx(q.fx); readCandles(q.cand || null);
        const r = { l: +q.l || 0, t: +q.t || 0, r: +q.r || 0, b: +q.b || 0, full: true, lfx, ltx, cand: candles, colors: [] };
        lfx = sf; ltx = st; candles = sc; if (window.__bdCandleLooks && window.__bdCandleLooks.setWallColors) window.__bdCandleLooks.setWallColors(lfx ? lfx.wallColors : []); return r; };
      chartCols = Array.isArray(a) && a.length > 1 ? a.slice(0, 16).map((q, i) => i && q && typeof q.fx === "string" ? parseOwn(q) : (i && q && hx(q.up) && hx(q.down)
        ? { l: +q.l || 0, t: +q.t || 0, r: +q.r || 0, b: +q.b || 0, up: hx(q.up), down: hx(q.down), accent: hx(q.accent), text: hx(q.text), colors: Array.isArray(q.colors) ? q.colors.map(hx).filter(Boolean).slice(0, 5) : [] }
        : i ? null : { l: +(q && q.l) || 0, t: +(q && q.t) || 0, r: +(q && q.r) || 0, b: +(q && q.b) || 0, main: true })) : null;
      if (chartCols && !chartCols.some((q, i) => i && q)) chartCols = null; chartOfC = new WeakMap(); };
    const chartFor = (c) => {
      if (!chartCols || !c || !c.isConnected) return null;
      let e = chartOfC.get(c); const now = performance.now();
      if (!e || now - e.t > 1500) { const r = c.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; let i = -1;
        chartCols.forEach((q, k) => { if (q && x >= q.l && x <= q.r && y >= q.t && y <= q.b) i = k; }); e = { t: now, i }; chartOfC.set(c, e); }
      const q = e.i > 0 ? chartCols[e.i] : null; if (!q || q.main) return null;
      if (q.full) { if (q.cand && !q.cand.cache) q.cand.cache = new Map(); return q; }
      if (!candles) return null;
      if (!q.cand || q.base !== candles) { q.base = candles; q.cand = { ...candles, up: hexToRgb(q.up), down: hexToRgb(q.down), upHex: q.up, downHex: q.down, cache: new Map() }; }
      return q; };
    const withChart = (fn) => function (...a) {
      const q = chartCols ? chartFor(this.canvas) : null;
      if (!q) return fn.apply(this, a);
      if (q.full) { const pc = candles, pf = lfx, pt = ltx, L = window.__bdCandleLooks; candles = q.cand; lfx = q.lfx; ltx = q.ltx; if (L && L.setWallColors) L.setWallColors(lfx ? lfx.wallColors : []);
        try { return fn.apply(this, a); } finally { candles = pc; lfx = pf; ltx = pt; if (L && L.setWallColors) L.setWallColors(lfx ? lfx.wallColors : []); } }
      const pc = candles, pa = lfx && lfx.accent, pt = ltx && ltx.color, L = window.__bdCandleLooks, wc = q.colors.length >= 2 && L && L.setWallColors;
      candles = q.cand; if (lfx && q.accent) lfx.accent = q.accent; if (ltx && q.text && ltx.mode === "custom") ltx.color = q.text; if (wc) L.setWallColors(q.colors);
      try { return fn.apply(this, a); } finally { candles = pc; if (lfx) lfx.accent = pa; if (ltx) ltx.color = pt; if (wc) L.setWallColors(lfx ? lfx.wallColors : []); }
    };
    for (const name of ["fillRect", "strokeRect", "fill", "stroke", "fillText", "strokeText"]) if (typeof proto[name] === "function") proto[name] = withChart(proto[name]);
    for (const prop of ["fillStyle", "strokeStyle"]) { const d = Object.getOwnPropertyDescriptor(proto, prop); if (d && d.set) Object.defineProperty(proto, prop, { configurable: true, enumerable: d.enumerable, get: d.get, set: withChart(d.set) }); }
    readCharts();
    new MutationObserver(() => { readCharts(); repaint(); }).observe(htmlEl(), { attributes: true, attributeFilter: ["data-ws-charts"] });
    repaint();
  }

  // Diagnostics (read by the panel's Diagnose button): what the adapter currently believes about this page.
  window.__bdLwInfo = () => ({ active, on, candles: candles ? { up: candles.upHex, down: candles.downHex } : null,
    sides: [...sides].slice(0, 12), learned: [...learnedDrawn], mono: [...shapeSides], shape: lastShape, lastTally: lastTally, canvases: document.querySelectorAll("[data-bd-lwroot] canvas, .tv-lightweight-charts canvas").length, roots: document.querySelectorAll(ROOT_SEL).length,
    drawCalls: { ...drawCalls }, lines: lfx });
  const drawCalls = { fillRect: 0, fill: 0, stroke: 0, lines: 0 };
  let lastTally = [];

  // Wait until the page actually has a Lightweight Charts chart (and isn't an Advanced Charts page).
  let tries = 0;
  (function waitForChart() {
    if (hasAdvanced()) return;                 // hook.js owns this page
    if (hasLightweight()) { install(); return; }
    // keep looking: on login-gated / single-page apps the chart can appear minutes after the page loads
    setTimeout(waitForChart, tries++ < 120 ? 250 : 1000);
  })();
})();
