/* Priism Skins — candle looks (shared).
   One place that knows how to draw every candle look, used by:
     - hook.js (TradingView Advanced Charts) and lw.js (Lightweight Charts apps) on the real chart, and
     - the panel, to draw the little preview on each look card,
   so a preview always matches what the chart really shows.
   Pure drawing: no reading of the chart, nothing sent anywhere. Every look works with any up/down colours.

   draw(g, look, x, y, w, h, col, isUp, k) draws one candle BODY (wicks use wick()). Coordinates are the caller's
   user-space values (the canvas transform is already applied). k = {
     fill(x,y,w,h)   — the real fillRect (unhooked)        style(v)  — set fillStyle without remapping
     stroke(v)       — set strokeStyle without remapping    strokeRect(x,y,w,h) — the real strokeRect
     px              — one device pixel in user units        yfrac     — 0 top .. 1 bottom of the chart (Heat)
   } */
(function () {
  if (window.__bdCandleLooks) return;

  const LOOKS = [
    // id, label, hint, minGlow (some looks are made of light, so they always glow a little)
    ["solid", "Solid", "Clean, flat candles in your colours.", 0],
    ["neon", "Neon", "Glowing outlines with a faint fill.", 0.55],
    ["glass", "Glass", "See-through bodies with a bright top edge, like frosted glass.", 0],
    ["chrome", "Chrome", "Polished metal: reflective bands in your candle colour.", 0],
    ["ice", "Ice", "Pale, frosted bodies with a cold shine.", 0],
    ["lava", "Lava", "Molten from the bottom up, with a warm glow.", 0.35],
    ["fade", "Fade", "Brightest where the candle closed, fading toward the open.", 0],
    ["outline", "Outline", "Hollow, thin outlines. Very calm.", 0],
    ["bevel", "3D", "Raised blocks with a light side and a shadow side.", 0],
    ["holo", "Holo", "Iridescent bodies that shimmer through nearby colours.", 0],
    ["ghost", "Ghost", "Barely-there bodies with solid open and close caps.", 0],
    ["pill", "Rounded", "Soft, rounded bodies.", 0],
    ["pixel", "Pixel", "Retro 8-bit blocks.", 0],
    ["heat", "Heat", "Colours warm up the higher price goes on the chart.", 0],
    ["prism", "Rainbow", "Colours fan out across the chart, left to right.", 0],
    ["shift", "Cycle", "Colours keep flowing over time. Indicator lines cycle too.", 0],
  ];
  const IDS = LOOKS.map((l) => l[0]);
  const META = Object.fromEntries(LOOKS.map(([id, name, hint, minGlow]) => [id, { id, name, hint, minGlow }]));

  // ---------- colour helpers ----------
  const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const css = (c, a) => (a === undefined || a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
  const mixc = (c, t, f) => [0, 1, 2].map((i) => c[i] + (t[i] - c[i]) * f);
  const WHITE = [255, 255, 255], BLACK = [0, 0, 0], HOT = [255, 243, 176];
  const cache = new Map();
  function memo(key, make) { let v = cache.get(key); if (v === undefined) { v = make(); if (cache.size > 600) cache.clear(); cache.set(key, v); } return v; }
  function hueRotate(c, deg) {
    let [r, g, b] = c.map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    h = (h + deg + 360) % 360;
    const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }
  const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

  // Colour a look uses for the whole candle before drawing (Heat changes it by height on the chart).
  function tone(look, col, k) {
    if (look !== "heat") return col;
    const step = Math.max(0, Math.min(15, Math.floor((k.yfrac || 0) * 16)));
    return memo("heat" + col + step, () => toHex(hueRotate(rgbOf(col), (0.5 - step / 15) * 70)));   // higher = warmer
  }
  // Wick colour for a look (most keep the candle colour).
  function wick(look, col, k) {
    if (look === "ice") return memo("iw" + col, () => css(mixc(rgbOf(col), WHITE, 0.5)));
    if (look === "ghost" || look === "glass") return memo("gw" + col, () => css(rgbOf(col), 0.7));
    return tone(look, col, k || {});
  }

  // ---------- bodies ----------
  function draw(g, look, x, y, w, h, col, isUp, k) {
    const px = k.px || 1, c = rgbOf(col);
    if (h < 0) { y += h; h = -h; }
    if (w < 0) { x += w; w = -w; }
    const tiny = h < 2.5 * px || w < 2.5 * px;           // doji / squeezed candles: just draw them solid
    if (tiny || look === "solid" || look === "shift" || look === "prism" || look === "heat") {
      k.style(look === "heat" ? tone(look, col, k) : col); k.fill(x, y, w, h); return;
    }
    switch (look) {
      case "neon": {
        g.globalAlpha *= 0.22; k.style(col); k.fill(x, y, w, h); g.globalAlpha /= 0.22;
        k.stroke(col); g.lineWidth = Math.max(px, 1.4 * px); k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "glass": {
        k.style(css(c, 0.3)); k.fill(x, y, w, h);
        const gr = g.createLinearGradient(0, y, 0, y + Math.max(px, h * 0.5));
        gr.addColorStop(0, "rgba(255,255,255,0.42)"); gr.addColorStop(1, "rgba(255,255,255,0)");
        k.style(gr); k.fill(x, y, w, Math.max(px, h * 0.5));
        k.style(css(mixc(c, WHITE, 0.35))); k.fill(x, y, w, px);                 // bright top edge
        k.stroke(css(c, 0.95)); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "chrome": {
        const gr = g.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, css(mixc(c, BLACK, 0.5))); gr.addColorStop(0.22, css(c)); gr.addColorStop(0.42, css(mixc(c, WHITE, 0.78)));
        gr.addColorStop(0.58, css(c)); gr.addColorStop(1, css(mixc(c, BLACK, 0.6)));
        k.style(gr); k.fill(x, y, w, h); return;
      }
      case "ice": {
        k.style(css(mixc(c, WHITE, 0.55), 0.9)); k.fill(x, y, w, h);
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, "rgba(255,255,255,0.6)"); gr.addColorStop(0.55, "rgba(255,255,255,0)");
        k.style(gr); k.fill(x, y, w, h);
        k.stroke(css(mixc(c, WHITE, 0.8))); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "lava": {
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, css(mixc(c, BLACK, 0.4))); gr.addColorStop(0.55, css(c)); gr.addColorStop(1, css(mixc(c, HOT, 0.75)));
        k.style(gr); k.fill(x, y, w, h); return;
      }
      case "fade": {
        // brightest at the close: the top for a rising candle, the bottom for a falling one
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, css(c, isUp ? 1 : 0.14)); gr.addColorStop(1, css(c, isUp ? 0.14 : 1));
        k.style(gr); k.fill(x, y, w, h); return;
      }
      case "outline": {
        k.stroke(col); g.lineWidth = Math.max(px, 1.2 * px); k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "bevel": {
        k.style(col); k.fill(x, y, w, h);
        const lw = Math.max(px, Math.round(w * 0.28 / px) * px), dw = Math.max(px, Math.round(w * 0.22 / px) * px);
        k.style(css(mixc(c, WHITE, 0.38))); k.fill(x, y, lw, h); k.fill(x, y, w, px);
        k.style(css(mixc(c, BLACK, 0.42))); k.fill(x + w - dw, y, dw, h); k.fill(x, y + h - px, w, px);
        return;
      }
      case "holo": {
        const gr = g.createLinearGradient(x, y, x + w, y + h);
        gr.addColorStop(0, css(hueRotate(c, -45))); gr.addColorStop(0.35, css(mixc(c, WHITE, 0.35)));
        gr.addColorStop(0.6, css(c)); gr.addColorStop(1, css(hueRotate(c, 45)));
        k.style(gr); k.fill(x, y, w, h); return;
      }
      case "ghost": {
        k.style(css(c, 0.14)); k.fill(x, y, w, h);
        const cap = Math.max(px, Math.min(2 * px, h / 3));
        k.style(col); k.fill(x, y, w, cap); k.fill(x, y + h - cap, w, cap); return;
      }
      case "pill": {
        const r = Math.min(w / 2, h / 2, 6 * px);
        k.style(col); g.beginPath();
        if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h);
        k.fillPath(); return;
      }
      case "pixel": {
        const b = Math.max(2 * px, Math.round(w / px) * px), gap = px;
        k.style(col);
        const n = Math.min(80, Math.ceil(h / b));
        for (let i = 0; i < n; i++) { const yy = y + i * b, hh = Math.min(b - gap, y + h - yy); if (hh > 0) k.fill(x, yy, w, hh); }
        return;
      }
      default: k.style(col); k.fill(x, y, w, h);
    }
  }

  // ---------- previews (the panel's look cards) ----------
  // A small fixed run of candles, so every card shows the same chart and only the look differs.
  const SAMPLE = [[18, 52, 8, 60], [52, 36, 28, 58], [36, 70, 32, 78], [70, 54, 46, 76], [54, 88, 50, 96], [88, 70, 64, 92]];   // open, close, low, high (0..100)
  function preview(canvas, look, up, down, glow) {
    const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    const dpr = W / (canvas.clientWidth || W) || 1;
    const n = SAMPLE.length, slot = W / (n + 0.6), bw = Math.max(3, slot * 0.62);
    const Y = (v) => H - 6 * dpr - (v / 100) * (H - 12 * dpr);
    const m = META[look] || META.solid, gl = Math.max(glow || 0, m.minGlow);
    const k = { fill: (a, b, c, d) => g.fillRect(a, b, c, d), style: (v) => { g.fillStyle = v; }, stroke: (v) => { g.strokeStyle = v; },
      strokeRect: (a, b, c, d) => g.strokeRect(a, b, c, d), fillPath: () => g.fill(), px: dpr, yfrac: 0 };
    SAMPLE.forEach(([o, c, l, hi], i) => {
      const isUp = c >= o, base = isUp ? up : down;
      let col = base;
      if (look === "prism") col = toHex(hueRotate(rgbOf(base), -70 + (i / (n - 1)) * 140));
      if (look === "shift") col = toHex(hueRotate(rgbOf(base), i * 14));
      const cx = slot * (i + 0.8), top = Y(Math.max(o, c)), bot = Y(Math.min(o, c));
      k.yfrac = top / H;
      g.save();
      if (gl > 0) { g.shadowColor = tone(look, col, k); g.shadowBlur = (4 + gl * 18) * dpr * 0.6; }
      g.fillStyle = wick(look, col, k); g.fillRect(Math.round(cx - dpr / 2), Y(hi), dpr, Y(l) - Y(hi));
      draw(g, look, Math.round(cx - bw / 2), top, Math.round(bw), Math.max(dpr, bot - top), col, isUp, k);
      g.restore();
    });
  }

  window.__bdCandleLooks = { LOOKS, IDS, META, draw, wick, tone, preview, hueRotate, toHex, rgbOf };
})();
