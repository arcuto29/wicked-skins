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
  if (window.__bdCandleLooks && window.__bdCandleLooks.live) return;   // an older copy (before an update) is replaced
  // Lite glow (slow computers / Power saver, set by hook.js / lw.js from content.js): every glow's blur is drawn
  // smaller. Canvas blur is the costliest thing on a chart without a fast graphics card.
  if (!window.__bdLiteBlur && window.CanvasRenderingContext2D) {
    window.__bdLiteBlur = true;
    const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, "shadowBlur");
    if (d && d.set) Object.defineProperty(P, "shadowBlur", { configurable: true, enumerable: d.enumerable, get: d.get,
      set(v) { d.set.call(this, window.__bdLite && v > 2 ? 2 + (v - 2) * 0.15 : v); } });
  }

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
    ["matte", "Matte", "Soft, slightly muted bodies with a fine edge. Easy on the eyes.", 0],
    ["frame", "Frame", "A bold outline around a half-filled body.", 0],
    ["halo", "Halo", "See-through bodies ringed with light.", 0.2],
    ["core", "Core", "Dark bodies with a bright core of colour down the middle.", 0],
    ["split", "Split", "Half solid, half see-through, like a candle cut in two.", 0],
    ["duo", "Duo", "Two-tone: a light top half and a deeper bottom half.", 0],
    ["gem", "Gem", "Cut like a gem: a light facet and a shadow facet.", 0],
    ["lifted", "Lifted", "Solid bodies floating above the chart with a soft shadow.", 0],
    ["lines", "Lines", "Fine lines across a faint body, like an old screen.", 0],
    ["dusk", "Dusk", "Each body fades into a warmer shade of your colour.", 0],
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
      case "matte": {
        k.style(css(mixc(c, [128, 128, 128], 0.28))); k.fill(x, y, w, h);
        k.stroke(css(mixc(c, WHITE, 0.25), 0.8)); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "frame": {
        const b = Math.max(px, Math.min(2 * px, w / 4));
        k.style(css(c, 0.42)); k.fill(x, y, w, h);
        k.stroke(col); g.lineWidth = b; k.strokeRect(x + b / 2, y + b / 2, w - b, h - b); return;
      }
      case "halo": {
        k.style(css(c, 0.1)); k.fill(x, y, w, h);
        k.stroke(css(mixc(c, WHITE, 0.3))); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px);
        if (w > 6 * px && h > 6 * px) { k.stroke(css(c, 0.35)); k.strokeRect(x + 2.5 * px, y + 2.5 * px, w - 5 * px, h - 5 * px); }
        return;
      }
      case "core": {
        k.style(css(mixc(c, BLACK, 0.68))); k.fill(x, y, w, h);
        const cw = Math.max(px, Math.round(w * 0.34 / px) * px);
        k.style(css(mixc(c, WHITE, 0.15))); k.fill(x + (w - cw) / 2, y, cw, h);
        k.stroke(css(c, 0.85)); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "split": {
        const hw = Math.round(w / 2 / px) * px;
        k.style(col); k.fill(x, y, hw, h);
        k.style(css(c, 0.3)); k.fill(x + hw, y, w - hw, h);
        k.stroke(css(c, 0.9)); g.lineWidth = px; k.strokeRect(x + px / 2, y + px / 2, w - px, h - px); return;
      }
      case "duo": {
        const hh = Math.round(h / 2 / px) * px;
        k.style(css(mixc(c, WHITE, 0.25))); k.fill(x, y, w, hh);
        k.style(css(mixc(c, BLACK, 0.3))); k.fill(x, y + hh, w, h - hh); return;
      }
      case "gem": {
        k.style(col); k.fill(x, y, w, h);
        k.style(css(mixc(c, WHITE, 0.32))); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x, y + Math.min(h, w * 1.2)); g.closePath(); k.fillPath();
        k.style(css(mixc(c, BLACK, 0.35))); g.beginPath(); g.moveTo(x + w, y + h); g.lineTo(x, y + h); g.lineTo(x + w, y + h - Math.min(h, w * 1.2)); g.closePath(); k.fillPath();
        return;
      }
      case "lifted": {
        const o = Math.max(px, 2 * px);
        k.style("rgba(0,0,0,0.45)"); k.fill(x + o, y + o, w, h);
        k.style(col); k.fill(x, y, w, h);
        k.style(css(mixc(c, WHITE, 0.45))); k.fill(x, y, w, px); return;
      }
      case "lines": {
        k.style(css(c, 0.18)); k.fill(x, y, w, h);
        k.style(col); const step = 3 * px, n = Math.min(200, Math.ceil(h / step));
        for (let i = 0; i < n; i++) k.fill(x, y + i * step, w, Math.min(px, y + h - (y + i * step)));
        k.fill(x, y + h - px, w, px); return;
      }
      case "dusk": {
        const gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, css(c)); gr.addColorStop(1, css(mixc(hueRotate(c, isUp ? 35 : -35), BLACK, 0.15)));
        k.style(gr); k.fill(x, y, w, h); return;
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

  // ---------- candle parts: wick / border colours, hollow bodies, widths (Candles > Candle parts) ----------
  // P = { wick: "same"|"soft"|"custom", wickUp, wickDown, border: "none"|"custom", borderUp, borderDown, borderW (1-3),
  //       hollow: "none"|"up"|"down"|"both", wickW (0 = the platform's, 1-4 device px), bodyW (0.4-1 of the body) }
  // or null when nothing is changed (then the chart draws exactly as before).
  const HEX = /^#[0-9a-f]{6}$/i;
  function parts(o) {
    if (!o || typeof o !== "object") return null;
    const hx = (v) => (HEX.test(v || "") ? String(v).toLowerCase() : "");
    const P = { wick: ["soft", "custom"].includes(o.wick) ? o.wick : "same", wickUp: hx(o.wickUp), wickDown: hx(o.wickDown),
      border: o.border === "custom" ? "custom" : "none", borderUp: hx(o.borderUp), borderDown: hx(o.borderDown),
      borderW: Math.max(1, Math.min(3, Math.round(+o.borderW || 1))), hollow: ["up", "down", "both"].includes(o.hollow) ? o.hollow : "none",
      wickW: Math.max(0, Math.min(4, Math.round(+o.wickW || 0))), bodyW: Math.max(0.4, Math.min(1, +o.bodyW || 1)) };
    const any = P.wick !== "same" || P.border !== "none" || P.hollow !== "none" || P.wickW > 0 || P.bodyW < 0.99;
    return any ? P : null;
  }
  // the wick's colour with your parts (falls back to the look's own wick colour)
  function wickOf(look, col, isUp, k, P) {
    if (P && P.wick === "custom") { const c = isUp ? P.wickUp : P.wickDown; if (c) return c; }
    if (P && P.wick === "soft") return memo("sw" + col, () => css(rgbOf(col), 0.5));
    return wick(look, col, k);
  }
  // a wick rect with your wick width: x/w changed around the wick's centre (device px -> user units via k.px)
  function wickRect(x, w, k, P) {
    if (!P || !P.wickW) return [x, w];
    const px = k.px || 1, nw = P.wickW * px; return [x + w / 2 - nw / 2, nw];
  }
  // One candle body with your parts. The hollow body clears what's under it on the chart canvas (the bit of wick
  // inside it) so the wallpaper shows through, then draws its outline.
  function candle(g, look, x, y, w, h, col, isUp, k, P) {
    if (!P) return draw(g, look, x, y, w, h, col, isUp, k);
    if (h < 0) { y += h; h = -h; }
    if (w < 0) { x += w; w = -w; }
    const px = k.px || 1;
    if (P.bodyW < 0.99) { const nw = Math.max(3 * px, w * P.bodyW); x += (w - nw) / 2; w = nw; }
    const hollow = P.hollow === "both" || P.hollow === (isUp ? "up" : "down");
    const bc = (P.border === "custom" && (isUp ? P.borderUp : P.borderDown)) || (hollow ? col : "");
    const bw = Math.min(P.borderW * px, Math.max(px, Math.min(w, h) / 3));
    if (hollow && w > 2.5 * bw && h > 2.5 * bw) {
      if (k.clear) k.clear(x, y, w, h);
      k.stroke(bc); g.lineWidth = bw; k.strokeRect(x + bw / 2, y + bw / 2, w - bw, h - bw); return;
    }
    draw(g, look, x, y, w, h, col, isUp, k);
    if (bc) { k.stroke(bc); g.lineWidth = bw; k.strokeRect(x + bw / 2, y + bw / 2, w - bw, h - bw); }
  }
  // A bordered candle is drawn by the platform as two nested rects in the same colour (border, then the body inside
  // it, or the other way round). true = this rect is the second of such a pair: skip it, the candle is already drawn.
  // last = a WeakMap(ctx -> last rect). X/Y/W/H in device px.
  function nestedDupe(last, g, X, Y, W, H, col) {
    const lb = last.get(g), cur = { x: X, y: Y, w: W, h: H, col };
    const inside = (a, o) => a.x >= o.x - 0.5 && a.y >= o.y - 0.5 && a.x + a.w <= o.x + o.w + 0.5 && a.y + a.h <= o.y + o.h + 0.5;
    const near = (a, o) => Math.abs(a.x - o.x) <= 2.5 && Math.abs(a.y - o.y) <= 2.5 && Math.abs(a.x + a.w - o.x - o.w) <= 2.5 && Math.abs(a.y + a.h - o.y - o.h) <= 2.5;
    if (lb && lb.col === col && near(cur, lb) && (inside(cur, lb) || inside(lb, cur))) { last.delete(g); live.touch(); return true; }
    last.set(g, cur); return false;
  }

  // Which narrow rects are wicks? Zoomed in, bodies are wide and wicks are thin; zoomed far out, bodies are thin too
  // and look just like wicks. The chart paints a whole pane in one go, so we remember, per canvas, whether the LAST
  // paint had real bodies (3+ device px) and how wide: wick colours / widths only apply when it did.
  // onChange(c) is called when a canvas starts having bodies (so the host can repaint once to style its wicks).
  function paintTracker(onChange) {
    const st = new WeakMap();
    return {
      note(c, isBody, W) {
        let s = st.get(c); if (!s) { s = { bw: 0, cur: null }; st.set(c, s); }
        if (!s.cur) { s.cur = { b: 0, mw: 0 }; queueMicrotask(() => { const was = s.bw; s.bw = s.cur && s.cur.b ? s.cur.mw : 0; s.cur = null; if (!was && s.bw && onChange) onChange(c); }); }
        if (isBody) { s.cur.b++; if (W > s.cur.mw) s.cur.mw = W; }
      },
      bw(c) { const s = st.get(c); return s ? Math.max(s.bw, s.cur ? s.cur.mw : 0) : 0; },
    };
  }

  // ---------- previews (the panel's look cards) ----------
  // A small fixed run of candles, so every card shows the same chart and only the look differs.
  const SAMPLE = [[18, 52, 8, 60], [52, 36, 28, 58], [36, 70, 32, 78], [70, 54, 46, 76], [54, 88, 50, 96], [88, 70, 64, 92]];   // open, close, low, high (0..100)
  function preview(canvas, look0, up, down, glow, bg, partsCfg, liveLook) {   // liveLook: the last (live) candle in its own look
    const g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    if (bg) { try { g.drawImage(bg, 0, 0, W, H); g.fillStyle = "rgba(0,0,0,0.38)"; g.fillRect(0, 0, W, H); } catch {} }   // your wallpaper, dimmed like the chart
    const dpr = W / (canvas.clientWidth || W) || 1;
    const n = SAMPLE.length, slot = W / (n + 0.6), bw = Math.max(3, slot * 0.62);
    const Y = (v) => H - 6 * dpr - (v / 100) * (H - 12 * dpr);
    const k = { fill: (a, b, c, d) => g.fillRect(a, b, c, d), style: (v) => { g.fillStyle = v; }, stroke: (v) => { g.strokeStyle = v; },
      strokeRect: (a, b, c, d) => g.strokeRect(a, b, c, d), fillPath: () => g.fill(), px: dpr, yfrac: 0 };
    const P = parts(partsCfg), wk = P && P.wickW ? null : dpr;
    if (P && P.hollow !== "none") k.clear = (a, b, c, d) => { if (!bg) { g.clearRect(a, b, c, d); return; }
      g.save(); g.beginPath(); g.rect(a, b, c, d); g.clip(); g.shadowBlur = 0; g.drawImage(bg, 0, 0, W, H); g.fillStyle = "rgba(0,0,0,0.38)"; g.fillRect(0, 0, W, H); g.restore(); };
    SAMPLE.forEach(([o, c, l, hi], i) => {
      const look = liveLook && i === n - 1 ? liveLook : look0, gl = Math.max(glow || 0, (META[look] || META.solid).minGlow);
      const isUp = c >= o, base = isUp ? up : down;
      let col = base;
      if (look === "prism") col = toHex(hueRotate(rgbOf(base), -70 + (i / (n - 1)) * 140));
      if (look === "shift") col = toHex(hueRotate(rgbOf(base), i * 14));
      const cx = slot * (i + 0.8), top = Y(Math.max(o, c)), bot = Y(Math.min(o, c));
      k.yfrac = top / H;
      g.save();
      if (gl > 0) { g.shadowColor = tone(look, col, k); g.shadowBlur = (4 + gl * 18) * dpr * 0.6; }
      { const [wx, ww] = wk ? [Math.round(cx - dpr / 2), dpr] : wickRect(cx - dpr / 2, dpr, k, P);
        g.fillStyle = wickOf(look, col, isUp, k, P); g.fillRect(wx, Y(hi), ww, Y(l) - Y(hi)); }
      candle(g, look, Math.round(cx - bw / 2), top, Math.round(bw), Math.max(dpr, bot - top), col, isUp, k, P);
      g.restore();
    });
  }

  // ---------- indicator colours (Style > Chart lines & ticker > Indicator colours) ----------
  // Shared by hook.js (TradingView) and lw.js (Lightweight Charts platforms like nq.vision). Each indicator keeps its
  // own slot (by its original colour, in the order first drawn), so two moving averages stay told apart: they get
  // neighbouring shades of the chosen colours. o = { mode, color, up, down, accent }.
  // Each indicator's slot (which shade / which Rainbow start it gets) is handed out once, in the order first drawn,
  // and then KEPT: it never resets. (It used to start over past 24 colours, and with many zones, as prints indicators
  // draw, the slots were re-dealt all the time, so every zone's colour and every Rainbow jumped while price moved.)
  // The first indicator still gets your exact Custom / candle colour. Past 2000 colours new ones get a fixed hash slot.
  const slots = new Map();
  const slotOf = (orig) => { let i = slots.get(orig); if (i !== undefined) return i;
    if (slots.size < 2000) i = slots.size;
    else { let h = 2166136261; const s = String(orig); for (let j = 0; j < s.length; j++) { h ^= s.charCodeAt(j); h = Math.imul(h, 16777619); } return (h >>> 0) % 997; }
    slots.set(orig, i); return i; };
  const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h || "");
  const shade = (hex, deg) => toHex(hueRotate(rgbOf(hex), deg));
  // the wallpaper's own colours (set by hook.js / lw.js from what the page measured), for "Wallpaper"
  let wallCols = [];
  function setWallColors(a) { wallCols = Array.isArray(a) ? a.filter(isHex).slice(0, 5) : []; }
  function indPalette(o) {
    // Wallpaper: each indicator / zone takes one of the wallpaper's real colours; past those, shades in between
    if (o.mode === "wallpaper" && wallCols.length >= 2) {
      const out = [...wallCols];
      for (let i = 0; i < wallCols.length && out.length < 10; i++) out.push(shade(wallCols[i], 24));
      return out;
    }
    if (o.mode === "candles") return isHex(o.up) && isHex(o.down) ? [o.up, o.down, shade(o.up, 38), shade(o.down, -38), shade(o.up, -38), shade(o.down, 38)] : null;
    const base = o.mode === "custom" ? o.color : o.mode === "wallpaper" ? o.accent : null;
    return isHex(base) ? [base, shade(base, 42), shade(base, -42), shade(base, 90), shade(base, -90), shade(base, 180)] : null;
  }
  const hsl = (h, a) => `hsl(${Math.round(((h % 360) + 360) % 360)} 95% 62%${a !== undefined && a < 1 ? " / " + +a.toFixed(3) : ""})`;
  // "Gradient": calmer than Rainbow (the whole spectrum): a few gradients that each stay in one colour family, left to
  // right across the chart. Each indicator gets its own, so they stay easy to tell apart.
  const GRADS = [
    ["#2fe6c8", "#3a9bff", "#8a6cff"],   // aurora: teal, blue, violet
    ["#ff9a62", "#ff5c9a", "#a46bff"],   // sunset: coral, pink, purple
    ["#5ee7ff", "#4f7dff", "#c86bff"],   // ice: cyan, blue, orchid
    ["#ffd36e", "#ff8f5a", "#ff5f7e"],   // ember: gold, orange, rose
    ["#7cf5a0", "#2fd6d0", "#3a86ff"],   // lagoon: mint, teal, blue
    ["#f8a5ff", "#a78bff", "#5bc8ff"],   // lilac: pink, lavender, sky
  ];
  const rgba = (hex, a) => (a >= 0.99 ? hex : `rgba(${rgbOf(hex).join(",")},${+a.toFixed(3)})`);
  const grads = new WeakMap();   // ctx -> Map(key -> rainbow gradient), so a gradient is made once per canvas size
  // ---------- each indicator on its own (Style > Indicators > Each indicator) ----------
  // Indicators are told apart by their own colour on the chart (a line's stroke, a zone's fill). We note every colour
  // drawn as an indicator line or zone, publish the list for the panel, and apply your settings for that colour.
  const keyCache = new Map();
  function keyOf(v) {          // any canvas colour -> { k: "r,g,b", a: alpha } or null
    if (typeof v !== "string") return null;
    let r = keyCache.get(v); if (r !== undefined) return r; r = null;
    let m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) r = { k: [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(","), a: 1 };
    else if ((m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(v))) r = { k: [m[1], m[2], m[3]].map(Number).join(","), a: m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : +m[4] };
    if (keyCache.size > 500) keyCache.clear(); keyCache.set(v, r); return r;
  }
  const seen = new Map();      // "r,g,b" -> { kind: "line" | "zone", n, a }
  let names = new Map(), seenSig = "";
  function noteSeen(orig, kind) {
    const r = keyOf(orig); if (!r) return null;
    let e = seen.get(r.k);
    if (!e) { if (seen.size > 40) return r; e = { kind, n: 0, a: r.a }; seen.set(r.k, e); }
    e.n++; if (kind === "zone") e.kind = "zone";   // filled at least once = a zone (its edges may be stroked in the same colour)
    return r;
  }
  // names for the colours, where the platform tells us (tradingview.com: each indicator's plot colours)
  function setNames(m) { names = m; }
  setInterval(() => {      // publish what's on the chart (named indicators first, then by how often they're drawn)
    try {
      const list = [...seen].sort((a, b) => (names.has(b[0]) - names.has(a[0])) || b[1].n - a[1].n).slice(0, 24)
        .map(([k, e]) => ({ k, kind: e.kind, a: +e.a.toFixed(2), name: names.get(k) || "" }));
      const sig = JSON.stringify(list);
      if (sig !== seenSig) { seenSig = sig; document.documentElement.setAttribute("data-bd-indseen", sig); }
      for (const e of seen.values()) e.n = Math.min(e.n, 50);
    } catch {}
  }, 2000);
  const custOf = (o, orig) => { if (!o || !o.custom) return null; const r = keyOf(orig); return r ? { r, e: o.custom[r.k] || null } : null; };
  const withAlpha = (hex, a) => (a >= 0.99 ? hex : `rgba(${rgbOf(hex).join(",")},${+a.toFixed(3)})`);
  // A zone (an indicator's filled box / band): { hide } | { f: fill, g: glow colour, glow: 0..1 } | null = as it is
  // Its own settings (Each indicator) win; otherwise the all-indicators colour (o.mode) applies, at the zone's own
  // see-through-ness, so a band stays a soft band. Rainbow works on zones too (ctx: the gradient is per canvas).
  // A see-through zone (alpha < 0.9) also gets e: a crisp edge in the same colours, nearly solid, so the zone reads
  // as a neon box while its inside stays see-through (you still see the price and candles in it). The glow goes on
  // that edge (the Glow slider, or the zone's own glow), never on the whole fill. Solid fills (volume bars) get none.
  function zone(orig, o, ctx) {
    const c = custOf(o, orig), e = c && c.e;
    if (e && e.h) return { hide: true };
    const r = keyOf(orig); if (!r) return null;
    const force = e && (e.c === "rainbow" || e.c === "gradient") ? e.c : false;
    const all = ctx ? indicatorAll(ctx, orig, o, force, r.a) : null;
    const see = r.a < 0.9, glowAll = o && o.glow > 0 ? +o.glow : 0;
    const edgeOf = (fill) => (see && ctx ? fill : null);
    if (!e && !all && o && o.dim && see) return { f: `rgba(${r.k},${+zoneAlpha(r.a, o).toFixed(3)})`, g: `rgb(${r.k})`, glow: glowAll, e: null };   // Dim all zones: own colour, softer
    if (!e) return all ? { f: all.s, g: all.g, glow: glowAll, e: edgeOf(indicatorAll(ctx, orig, o, force, 0.9, true).s) } : null;
    const hex = /^#[0-9a-f]{6}$/i.test(e.c || "") ? e.c : null, gl = e.g !== undefined && e.g !== null && e.g !== "" ? +e.g || 0 : glowAll;
    if (hex) return { f: withAlpha(hex, see ? zoneAlpha(r.a, o) : r.a), g: hex, glow: gl, e: edgeOf(withAlpha(hex, 0.9)) };
    if (all) return { f: all.s, g: all.g, glow: gl, e: edgeOf(indicatorAll(ctx, orig, o, force, 0.9, true).s) };
    return { f: o && o.dim && see ? `rgba(${r.k},${+zoneAlpha(r.a, o).toFixed(3)})` : orig, g: `rgb(${r.k})`, glow: gl, e: edgeOf(`rgba(${r.k},0.9)`) };
  }

  // ---------- zone shapes + borders (Style > Indicators > Zones: Shape, Border) ----------
  // Draws one rectangular zone (its fill, then its border) in a shape: square (as drawn), rounded corners, or a pill
  // with fully round ends. k = { begin, fill, stroke }: the REAL canvas calls (unhooked). z = zone() result.
  // st = { shape, border, px }. Returns false if there's nothing special to do (the caller draws it as before).
  function zoneBox(g, k, x, y, w, h, z, st) {
    if (!st || (st.shape === "square" && st.border === "line" && (!st.style || st.style === "flat"))) return false;
    if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; }
    // Rounded = soft corners (a third of the height, at most 10 px); Pill = fully round ends. Pill only rounds the
    // ends of a zone that's clearly wider than tall: on a tall or squarish box (a session box) it would be an oval,
    // so those get Rounded corners.
    const px = st.px || 1, pill = st.shape === "pill" && w >= h * 2;
    const r = pill ? h / 2 : st.shape === "rounded" || st.shape === "pill" ? Math.max(Math.min(2 * px, h / 2), Math.min(h * 0.3, w / 2, 10 * px)) : 0;
    const path = (inset) => { k.begin(); const a = x + inset, b = y + inset, c = Math.max(0, w - 2 * inset), d = Math.max(0, h - 2 * inset), rr = Math.max(0, r - inset);
      if (rr > 0 && g.roundRect) g.roundRect(a, b, c, d, rr); else g.rect(a, b, c, d); };
    const pSB = g.shadowBlur, pSC = g.shadowColor, pW = g.lineWidth, pD = g.getLineDash ? g.getLineDash() : [];
    const edge = z.e || (st.border !== "line" || st.style === "hollow" ? z.g : null), glow = z.glow || 0;
    // fill (it glows itself only when there is no border to carry the glow)
    // the fill, in its style: Flat, Fade (strong at the start, fading into the future), Shine (lit from the top),
    // Glass (top-lit with a fine highlight), Hollow (no fill, the border only)
    const style = st.style || "flat", rk = typeof z.f === "string" ? keyOf(z.f) : null;
    const fillRgba = (a) => (rk ? `rgba(${rk.k},${Math.max(0, Math.min(1, a)).toFixed(3)})` : z.f);
    if (style !== "hollow") {
      let f = z.f;
      if (rk && style === "fade") { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, fillRgba(rk.a * 1.9)); gr.addColorStop(0.55, fillRgba(rk.a * 0.9)); gr.addColorStop(1, fillRgba(rk.a * 0.12)); f = gr; }
      else if (rk && style === "glass") { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, fillRgba(rk.a * 1.8)); gr.addColorStop(1, fillRgba(rk.a * 0.45)); f = gr; }
      path(0); k.style(f); if (glow > 0 && (!edge || st.border === "none")) { g.shadowColor = z.g; g.shadowBlur = 3 + glow * 22; } k.fill();
      g.shadowBlur = pSB; g.shadowColor = pSC;
      if (style === "shine" || style === "glass") {           // a soft light from the top edge
        const gr = g.createLinearGradient(0, y, 0, y + h * (style === "glass" ? 0.5 : 0.65)); gr.addColorStop(0, `rgba(255,255,255,${style === "glass" ? 0.16 : 0.22})`); gr.addColorStop(1, "rgba(255,255,255,0)");
        path(0); k.style(gr); k.fill();
        if (style === "glass" && h > 6 * px) { k.strokeStyle("rgba(255,255,255,0.35)"); g.lineWidth = px; k.begin(); const rr = Math.max(0, r - px); g.moveTo(x + rr + px, y + 1.5 * px); g.lineTo(x + w - rr - px, y + 1.5 * px); k.stroke(); }
      }
    }
    if (edge && st.border !== "none") {
      const lw = Math.max(1, px) * (st.border === "glow" ? 1.6 : 1);
      k.strokeStyle(edge); g.lineWidth = lw; if (g.setLineDash) g.setLineDash(st.border === "dashed" ? [6 * px, 4 * px] : []);
      if (glow > 0 || st.border === "glow") { g.shadowColor = z.g; g.shadowBlur = st.border === "glow" ? 8 + glow * 20 : 3 + glow * 18; }
      path(lw / 2); k.stroke();
      if (st.border === "double" && h > 8 * px && w > 8 * px) {   // a second, fainter line inside
        g.shadowBlur = 0; g.globalAlpha *= 0.55; path(lw / 2 + 3 * px); k.stroke(); g.globalAlpha /= 0.55; }
    }
    g.shadowBlur = pSB; g.shadowColor = pSC; g.lineWidth = pW; if (g.setLineDash) g.setLineDash(pD);
    return true;
  }
  // a see-through zone left in its own colours, when only its shape / border is styled
  function zoneOwn(orig) { const r = keyOf(orig); if (!r || r.a >= 0.9) return null; return { f: orig, g: `rgb(${r.k})`, glow: 0, e: `rgba(${r.k},0.9)` }; }
  const ZONE_SHAPES = ["square", "rounded", "pill"], ZONE_BORDERS = ["line", "dashed", "double", "glow", "none"], ZONE_STYLES = ["flat", "fade", "shine", "glass", "hollow"];

  // What to draw one indicator line with: { s: stroke style (a colour or a rainbow gradient), g: its glow colour,
  // glow: its own glow (or undefined = the Glow slider), w: extra width, hide }, or null to leave the line as it is.
  function indicator(ctx, orig, o) {
    const c = custOf(o, orig), e = c && c.e;
    if (e && e.h) return { hide: true };
    const base = indicatorAll(ctx, orig, o, e && (e.c === "rainbow" || e.c === "gradient") ? e.c : false);
    if (!e) return base;
    const hex = /^#[0-9a-f]{6}$/i.test(e.c || "") ? e.c : null;
    const r = hex ? { s: withAlpha(hex, c.r.a), g: hex } : base || { s: orig, g: `rgb(${c.r.k})` };
    if (e.g !== undefined && e.g !== null && e.g !== "") r.glow = +e.g;
    if (+e.w > 0) r.w = +e.w;
    return r;
  }
  // alpha: a zone's own see-through-ness (lines: undefined = as drawn). A line and the zone in its colour (RSI and its
  // band) share a slot, so they get the same shade.
  // How see-through a recoloured zone's fill is (Style > Indicators > Zones): Soft keeps the price easy to read
  // through it; the zone still reads clearly by its edge.
  const zoneAlpha = (a, o) => { const cap = Math.max(0.04, Math.min(0.45, o && o.zoneFill > 0 ? +o.zoneFill : 0.12));
    return Math.min(cap, Math.max(+a, Math.min(cap, +a * 3))); };   // faint ones lifted (Bollinger is 5%), strong ones softened
  // the gradient for one indicator: your own colours (Gradient colours, 2-3), each indicator shifted a little round the
  // colour wheel so they stay told apart (but never out of your colours); or one of the built-in gradients
  const GSHIFT = [0, 14, -14, 28, -28];   // small steps only: every indicator stays in your colours
  const gradOf = (o, i) => (o && Array.isArray(o.grad) && o.grad.length >= 2 ? (i % 5 ? o.grad.map((c) => shade(c, GSHIFT[i % 5])) : o.grad) : GRADS[i % GRADS.length]);
  // edge: a zone's outline, kept crisp (never softened like the fill)
  function indicatorAll(ctx, orig, o, force, alpha, edge) {
    if (!o || ((!o.mode || o.mode === "own") && !force)) return null;
    const kk = keyOf(String(orig)), i = slotOf(kk ? kk.k : String(orig));
    const al = alpha === undefined || alpha >= 0.99 ? 1 : edge ? +alpha : zoneAlpha(alpha, o);
    // force: "rainbow" | "gradient" = this indicator's own choice (Each indicator), else the all-indicators mode
    const kind = force === "rainbow" || force === "gradient" ? force : o.mode;
    if (kind === "rainbow" || kind === "gradient") {   // left to right across the chart
      const rb = kind === "rainbow", G = gradOf(o, i), off = (i * 67) % 360;
      const t = ctx.getTransform(), a = t.a || 1, w = ctx.canvas.width, key = kind + "|" + w + "|" + t.e + "|" + a + "|" + (rb ? off : G.join("")) + "|" + al.toFixed(2);
      let m = grads.get(ctx); if (!m) { m = new Map(); grads.set(ctx, m); }
      let gr = m.get(key);
      if (!gr) { if (m.size > 30) m.clear(); gr = ctx.createLinearGradient((0 - t.e) / a, 0, (w - t.e) / a, 0);
        if (rb) for (let j = 0; j <= 6; j++) gr.addColorStop(j / 6, hsl(off + j * 60, al));   // the whole spectrum; each indicator starts at its own hue
        else G.forEach((c, j) => gr.addColorStop(j / (G.length - 1), rgba(c, al)));
        m.set(key, gr); }
      return { s: gr, g: rb ? hsl(off + 180) : G[1] };
    }
    const P = memo("ind|" + o.mode + o.color + o.up + o.down + o.accent + (o.mode === "wallpaper" ? wallCols.join("") : ""), () => indPalette(o));
    return P ? { s: withAlpha(P[i % P.length], al), g: P[i % P.length] } : null;
  }

  // ---------- chart text (Style > Chart text): text indicators draw ON the chart (labels, levels, values, prints) ----------
  // Shared by hook.js (TradingView) and lw.js (Lightweight Charts platforms). The hooks decide WHICH text (not order
  // pills, scales, crosshair labels, or text inside a label's own box); this draws it. o = { mode, color, outline,
  // size, bg: "dark" | "light", up }. k = the untouched canvas calls { fill(v), stroke(v), text(...), strokeText(...) }.
  // Returns false to let the caller draw the text as it is.
  const TXT_SIZE = [0, 2, 4], TXT_LINE = [0, 2.6, 4.2];
  function readableText(r, dark) {
    const [R, G, B] = r.k.split(",").map(Number), mx = Math.max(R, G, B), mn = Math.min(R, G, B), lum = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
    if ((mx - mn) / 255 < 0.18) return dark ? "#eef1f6" : "#14161f";                 // grey / black / white text: clear white or ink
    const mix = (t, f) => toHex([R, G, B].map((v, i) => Math.round(v + (t[i] - v) * f)));
    if (dark && lum < 0.5) return mix([255, 255, 255], 0.5);                           // a dark colour on a dark wallpaper: lighter, same hue
    if (!dark && lum > 0.6) return mix([0, 0, 0], 0.45);
    return null;                                                                       // already reads: keep its own colour
  }
  function chartText(ctx, k, args, o) {
    const own = String(ctx.fillStyle), r = keyOf(own);
    if (!r || r.a < 0.3 || typeof args[0] !== "string" || !args[0].trim()) return false;   // faint text (a watermark) stays as it is
    const dark = o.bg !== "light";
    let col = null;
    if (o.mode === "custom" && isHex(o.color)) col = o.color;
    else if (o.mode === "candle" && isHex(o.up)) col = o.up;
    else if (o.mode === "readable") col = readableText(r, dark);
    else if (dark) {   // Own: only black / near-black grey text on a dark wallpaper (made for a light chart) is lightened
      const [R, G, B] = r.k.split(",").map(Number);
      if (Math.max(R, G, B) - Math.min(R, G, B) < 46 && (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255 < 0.33) col = "#e6e9f0";
    }
    const out = o.outline > 0 ? o.outline : o.mode === "readable" ? 1 : 0, add = TXT_SIZE[o.size] || 0;
    if (!col && !out && !add) return false;
    const pFont = ctx.font, pW = ctx.lineWidth, pJ = ctx.lineJoin, pM = ctx.miterLimit, pS = ctx.strokeStyle;
    if (add) ctx.font = pFont.replace(/(\d+(?:\.\d+)?)px/, (m0, n) => (+n + add) + "px");
    if (out) {   // a thin outline UNDER the letters, in the wallpaper's opposite tone: crisp on any background
      const sx = ctx.getTransform().a || 1, dpr = (typeof devicePixelRatio === "number" && devicePixelRatio) || 1;
      k.stroke(dark ? "rgba(6,8,12,0.88)" : "rgba(255,255,255,0.92)"); ctx.lineWidth = TXT_LINE[out] * dpr / sx; ctx.lineJoin = "round"; ctx.miterLimit = 2;
      k.strokeText(...args);
    }
    if (col) k.fill(col);
    k.text(...args);
    if (col) k.fill(own);
    ctx.font = pFont; ctx.lineWidth = pW; ctx.lineJoin = pJ; ctx.miterLimit = pM; if (out) k.stroke(pS);
    return true;
  }

  // ---------- closed candles vs the live candle ----------
  // "Closed candles" can have a look of their own, so the candle still forming stands out. Charts draw each pass of
  // candle parts (borders, wicks, bodies) left to right, so the live candle is the LAST bar of a pass. Each bar's parts
  // are held back until the next bar starts (then they're drawn as closed candles) or until the pass ends (something
  // else gets drawn, the next pass starts, or the paint is over): then we know whether it was the newest bar.
  // add(g, X, W, part): X / W in device px; part(live) draws that part (in its own saved state).
  // The newest bar only counts as live when it's the newest bar of the data, not just the last one on screen
  // (scrolled back in history, the bar at the right edge is an old one): there's room to its right (the chart's
  // right margin), or its body ends on the last-price line (the line across the chart in the candle colour, at the
  // live price; charts with no right margin).
  const live = (() => {
    const S = new WeakMap(), open = new Set(), painted = new Set();
    let queued = false, busy = false, seq = 0, wrapped = false;
    const st = (g) => { let s = S.get(g); if (!s) S.set(g, s = { grp: null, sp: 0, run: 0, liveCx: null, maxCx: -1e9, maxOk: false, cols: new Set(), priceY: null }); return s; };
    const onPrice = (s, grp) => s.priceY !== null && grp.ys.some((y) => Math.abs(y - s.priceY) <= 2);
    function end(g, s, runEnd) {
      const grp = s.grp; if (!grp) return; s.grp = null; open.delete(g);
      const W = g.canvas ? g.canvas.width : 0, ok = s.sp >= 4 && (W - grp.cx > s.sp * 1.15 + 1 || (W - grp.cx > -s.sp && onPrice(s, grp)));
      s.run++;
      if (grp.cx > s.maxCx) { s.maxCx = grp.cx; s.maxOk = ok; }
      // a pass of 3+ bars ending here, or (charts that start a new path for every candle) where the live bar was last paint
      const isLive = runEnd && ok && (s.run >= 3 || (s.liveCx !== null && Math.abs(grp.cx - s.liveCx) < s.sp * 0.6));
      if (runEnd) s.run = 0;
      busy = true; try { for (const p of grp.parts) { try { p(isLive); } catch (e) { const q = (window.__bdLiveErr = window.__bdLiveErr || []); if (q.length < 20) q.push(String(e && e.message || e)); } } } finally { busy = false; }
    }
    function settle() {
      queued = false;
      for (const g of [...open]) { const s = S.get(g); if (s) end(g, s, true); }
      for (const g of painted) { const s = S.get(g); if (s) { s.liveCx = s.maxOk ? s.maxCx : null; s.maxCx = -1e9; s.maxOk = false; s.run = 0; s.cols.clear(); } }
      painted.clear();
    }
    const flush = (g) => { if (!busy && open.size && open.has(g)) { const s = S.get(g); if (s) end(g, s, true); } };
    // anything else drawn on that canvas ends the pass first (so it keeps its place on top of the candles)
    function wrap() {
      wrapped = true;
      const P = CanvasRenderingContext2D.prototype;
      for (const m of ["beginPath", "fillText", "strokeText", "drawImage", "strokeRect", "clearRect", "putImageData"]) {
        const o = P[m]; if (typeof o !== "function") continue;
        P[m] = function (...a) { if (open.size) flush(this); return o.apply(this, a); };
      }
      const oR = P.fillRect;   // a plain rect that isn't a candle part (nothing was added or recognised during it)
      P.fillRect = function (...a) { if (!open.size || busy) return oR.apply(this, a); const n = seq, r = oR.apply(this, a); if (seq === n) flush(this); return r; };
      // the last-price line: one straight line across the chart, in a candle colour (remembered for the next paint)
      const oM = P.moveTo, oL = P.lineTo, oS = P.stroke;
      P.moveTo = function (x, y) { if (!busy && S.has(this)) { const t = this.getTransform(); this.__bdPl = [x * t.a + t.e, y * t.d + t.f, 0, 0, 0]; } return oM.call(this, x, y); };
      P.lineTo = function (x, y) { const p = this.__bdPl; if (p) { const t = this.getTransform(); p[2] = x * t.a + t.e; p[3] = y * t.d + t.f; p[4]++; } return oL.call(this, x, y); };
      P.stroke = function (...a) { const p = this.__bdPl;
        if (p && !a.length && p[4] === 1 && Math.abs(p[3] - p[1]) <= 1 && this.canvas && Math.abs(p[2] - p[0]) >= this.canvas.width * 0.6) {
          const s = S.get(this); if (s && s.cols.has(String(this.strokeStyle).toLowerCase())) s.priceY = (p[1] + p[3]) / 2; }
        return oS.apply(this, a); };
      const oB = P.beginPath; P.beginPath = function () { if (this.__bdPl) this.__bdPl = null; return oB.call(this); };
    }
    return {
      get busy() { return busy; },
      touch() { seq++; },   // a candle part that was recognised but not drawn (the inner rect of a bordered candle)
      // col: the candle colour; Y0 / Y1: a body's top and bottom in device px (for the last-price line)
      add(g, X, W, part, col, Y0, Y1) {
        if (!wrapped) wrap();
        seq++;
        const s = st(g), cx = X + W / 2; painted.add(g);
        if (col && s.cols.size < 16) s.cols.add(String(col).toLowerCase());
        if (!queued) { queued = true; queueMicrotask(settle); }
        const grp = s.grp, body = W >= 2 && Y0 !== undefined;
        if (grp && ((cx >= grp.l - 1 && cx <= grp.r + 1) || (grp.cx >= X - 1 && grp.cx <= X + W + 1))) {   // same bar
          grp.parts.push(part); if (X < grp.l) grp.l = X; if (X + W > grp.r) grp.r = X + W; if (body) grp.ys.push(Y0, Y1); return;
        }
        if (grp) { if (cx > grp.cx) { s.sp = cx - grp.cx; end(g, s, false); } else end(g, s, true); }   // next bar / a new pass
        s.grp = { cx, l: X, r: X + W, parts: [part], ys: body ? [Y0, Y1] : [] }; open.add(g);
      },
      flush,
    };
  })();

  window.__bdCandleLooks = { LOOKS, IDS, META, draw, wick, tone, preview, zoneBox, zoneOwn, ZONE_SHAPES, ZONE_BORDERS, ZONE_STYLES, parts, wickOf, wickRect, candle, nestedDupe, paintTracker, hueRotate, toHex, rgbOf, indicator, zone, noteSeen, setNames, keyOf, chartText, setWallColors, live };
})();
