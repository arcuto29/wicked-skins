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
  // TradingView defaults: up #089981 / #26a69a, down #F23645 / #ef5350 (volume uses rgba of the latter pair).
  const UP_HEX = new Set(["#089981", "#26a69a"]);
  const DOWN_HEX = new Set(["#f23645", "#ef5350"]);
  const RGBA = /^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/;

  function remap(v) {
    if (!candles || typeof v !== "string") return v;
    let out = remapCache.get(v);
    if (out !== undefined) return out;
    out = v;
    const s = v.toLowerCase().replace(/\s/g, "");
    let side = null, alpha = null;
    if (UP_HEX.has(s)) side = "up";
    else if (DOWN_HEX.has(s)) side = "down";
    else {
      const m = s.match(RGBA);
      if (m) {
        const key = m[1] + "," + m[2] + "," + m[3];
        if (key === "8,153,129" || key === "38,166,154") side = "up";
        else if (key === "242,54,69" || key === "239,83,80") side = "down";
        if (side && m[4] !== undefined) alpha = m[4];
      }
    }
    if (side) {
      const c = side === "up" ? candles.up : candles.down;
      out = alpha === null ? (side === "up" ? candles.upHex : candles.downHex) : `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
    }
    if (remapCache.size < 500) remapCache.set(v, out);
    return out;
  }

  for (const prop of ["fillStyle", "strokeStyle"]) {
    const d = Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.set) continue;
    Object.defineProperty(proto, prop, {
      configurable: true,
      enumerable: d.enumerable,
      get: d.get,
      set(v) { d.set.call(this, remap(v)); },
    });
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
