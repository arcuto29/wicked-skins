/* Priism Skins — TradingView LIGHTWEIGHT CHARTS adapter (MAIN world).
   The main hook (hook.js) skins TradingView's *Advanced Charts* (tradingview.com, prop platforms). Some sites
   (e.g. nq.vision) instead use TradingView's *Lightweight Charts* — a different engine: no window.TradingViewApi,
   no .chart-markup-table, different candle draw. This module adds support for that engine:
     1. Candle recolour — remap the series' up/down colours to the chosen ones as they're drawn.
     2. Transparent background — clear the chart's full-canvas background fill so a wallpaper shows through.
   It activates ONLY when Lightweight Charts is present AND Advanced Charts is not, so it never fights hook.js.
   There are NO broker position/order "bracket" pills in Lightweight Charts, so that feature does not apply here.
   Nothing is read or sent anywhere; this only changes how the chart is drawn. */
(function () {
  const LW_VERSION = 1;
  if (window.__bdLwHooked && (window.__bdLwVer || 1) >= LW_VERSION) return;
  window.__bdLwHooked = true;
  window.__bdLwVer = LW_VERSION;

  const proto = CanvasRenderingContext2D.prototype;
  const EMPTY = { classList: { contains: () => false }, getAttribute: () => null };
  const htmlEl = () => document.documentElement || EMPTY;

  // ---------- is this a Lightweight Charts page (and NOT Advanced Charts)? ----------
  function hasAdvanced() {
    try { return !!(window.TradingViewApi || window.tradingViewApi || document.querySelector(".chart-markup-table, .chart-container")); }
    catch { return false; }
  }
  function hasLightweight() {
    try {
      if (window.LightweightCharts) return true;
      if (document.querySelector(".tv-lightweight-charts, [class*='lightweight']")) return true;
      // fallback: a canvas whose wrapper looks like a LW table, or the LW "attribution" link is present
      if (document.querySelector("a#tv-attr-logo, a[href*='tradingview.com'][class*='tv']")) return true;
      return false;
    } catch { return false; }
  }

  // ---------- settings (same channel as hook.js) ----------
  const cache = new Map();          // colour-string -> { key:"r,g,b", a } | null   (declared early: readCandles clears it)
  let on = htmlEl().classList.contains("bd-on");
  let candles = null;   // { up:[r,g,b], down:[r,g,b], upHex, downHex, glow, look }
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function readCandles() {
    cache.clear();
    try {
      const raw = htmlEl().getAttribute("data-ws-candles");
      const c = raw ? JSON.parse(raw) : null;
      if (c && /^#[0-9a-f]{6}$/i.test(c.up) && /^#[0-9a-f]{6}$/i.test(c.down)) {
        candles = { up: hexToRgb(c.up), down: hexToRgb(c.down), upHex: c.up.toLowerCase(), downHex: c.down.toLowerCase(),
          glow: Math.max(0, Math.min(1, +c.glow || 0)), look: ["solid", "neon", "prism", "shift"].includes(c.look) ? c.look : "solid" };
      } else candles = null;
    } catch { candles = null; }
  }
  const settingsObserver = new MutationObserver(() => {
    on = htmlEl().classList.contains("bd-on"); readCandles();
  });
  (function watch() {
    const el = document.documentElement;
    if (!el) return setTimeout(watch, 10);
    settingsObserver.observe(el, { attributes: true, attributeFilter: ["class", "data-ws-candles"] });
    on = el.classList.contains("bd-on"); readCandles();
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
    const cands = [...tally].filter(([c, n]) => n >= 15).map(([c, n]) => [rgbKey(c), n]).filter(([r]) => r && r.a === null && colourful(r.key))
      .sort((a, b) => b[1] - a[1]).slice(0, 2);
    tally.clear();
    if (cands.length < 2) return [];
    const dGreen = (k) => Math.min(Math.abs(hueOf(k) - 140), 360 - Math.abs(hueOf(k) - 140));
    const [a, b] = cands.map(([r]) => r.key);
    return dGreen(a) <= dGreen(b) ? [[a, "up"], [b, "down"]] : [[b, "up"], [a, "down"]];
  }

  function learnSides() {
    if (!active) return;
    const best = new Map();
    const add = (c, side, rank) => { const r = rgbKey(c); if (!r) return; const cur = best.get(r.key);
      if (!cur || rank > cur.rank) best.set(r.key, { side, rank, tie: false }); else if (rank === cur.rank && side !== cur.side) cur.tie = true; };
    for (const [c, s] of DEFAULTS) add(c, s, 0);
    const api = learnFromApi(); for (const [c, s] of api) add(c, s, 3);
    if (!api.length) for (const [k, s] of learnFromDrawing()) { const cur = best.get(k); if (!cur) best.set(k, { side: s, rank: 2, tie: false }); }
    const next = new Map(); for (const [k, v] of best) if (!v.tie) next.set(k, v.side);
    const sig = [...next].sort().join("|");
    if (sig !== sidesSig) { sides = next; sidesSig = sig; cache.clear(); }
  }

  // ---------- remap ----------
  const remapCache = new Map();
  function remap(v) {
    if (!candles || typeof v !== "string") return v;
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
  const paneCache = new WeakMap();
  function isChart(c) {
    if (!c) return false;
    let v = paneCache.get(c);
    if (v === undefined) {
      try { v = !!(c.closest && (c.closest(".tv-lightweight-charts") || (c.parentElement && /lightweight|tv-lw/i.test(c.parentElement.className || "")) || (c.width >= 200 && c.height >= 120))); }
      catch { v = false; }
      paneCache.set(c, v);
    }
    return v;
  }

  // ---------- install the canvas hooks (once, when this is a LW page) ----------
  let active = false;
  function install() {
    if (active) return;
    active = true;

    const d = Object.getOwnPropertyDescriptor(proto, "fillStyle");
    Object.defineProperty(proto, "fillStyle", { configurable: true, enumerable: d.enumerable, get: d.get,
      set(v) { if (on && candles && isChart(this.canvas)) { noteFill(typeof v === "string" ? v : null); d.set.call(this, remap(v)); } else d.set.call(this, v); } });
    const sd = Object.getOwnPropertyDescriptor(proto, "strokeStyle");
    Object.defineProperty(proto, "strokeStyle", { configurable: true, enumerable: sd.enumerable, get: sd.get,
      set(v) { if (on && candles && isChart(this.canvas)) sd.set.call(this, remap(v)); else sd.set.call(this, v); } });

    const origFillRect = proto.fillRect;
    proto.fillRect = function (x, y, w, h) {
      const c = this.canvas;
      if (on && c && isChart(c) && c.width > 200 && c.height > 120) {
        const t = this.getTransform(), sx = t.a || 1, sy = t.d || 1;
        // a (near) full-canvas rect = the chart background; clear it so a wallpaper shows through
        if (Math.abs(w * sx) >= c.width * 0.9 && Math.abs(h * sy) >= c.height * 0.9) return this.clearRect(x, y, w, h);
      }
      return origFillRect.call(this, x, y, w, h);
    };

    setInterval(learnSides, 1500);
    learnSides();
  }

  // Wait until the page actually has a Lightweight Charts chart (and isn't an Advanced Charts page).
  let tries = 0;
  (function waitForChart() {
    if (hasAdvanced()) return;                 // hook.js owns this page
    if (hasLightweight()) { install(); return; }
    if (tries++ < 120) setTimeout(waitForChart, 250);   // up to ~30s for a late-loading chart
  })();
})();
