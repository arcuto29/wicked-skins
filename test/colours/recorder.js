// Colour recorder for the flicker tests (test/colours/flicker.e2e.js). Injected with Playwright's addInitScript, so it
// runs before Priism's hook: it wraps the browser's own canvas drawing calls and the hook then wraps it. Every draw
// therefore reaches this recorder with the colour that actually lands on the canvas (after Priism changed it).
//
// The test gives each element a native colour used by nothing else on the chart (window.__colRec.watch). Then:
//   draws    every drawing call in a watched colour, with the frame it happened in. A draw in the NATIVE colour while
//            Priism is on means the original colour reached the canvas.
//   pixels   once per frame, after the chart painted, the pane canvases are read and native-coloured pixels counted.
//            This is what was on screen in that frame, whatever drew it (cached images included). (Priism makes the
//            chart's background see-through, so a thin line's soft edge keeps its exact colour at part opacity: any
//            pixel more than ~15% opaque in the native colour counts.)
// Nothing here changes what is drawn.
(() => {
  if (window.__colRec) return;
  const P = CanvasRenderingContext2D.prototype;
  const fsD = Object.getOwnPropertyDescriptor(P, "fillStyle"), ssD = Object.getOwnPropertyDescriptor(P, "strokeStyle");
  const R = (window.__colRec = { frame: 0, on: false, step: "", watch: [], draws: [], counts: {}, px: {}, pxFrames: [], pxEvery: 1, installedFirst: true });
  const tick = () => { R.frame++; R.lastTick = performance.now(); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const parse = (s) => {
    if (typeof s !== "string") return null;
    let m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), m[2] ? parseInt(m[2], 16) / 255 : 1];
    m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/i.exec(s);
    if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : +m[4]];
    return null;
  };
  const cache = new Map();
  const near = (a, b, tol) => Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
  function classify(style) {
    if (typeof style !== "string") return null;
    let v = cache.get(style); if (v !== undefined) return v;
    const c = parse(style); v = null;
    if (c && c[3] > 0.05) for (const w of R.watch) if (near(c, w.rgb, 3)) { v = w; break; }
    if (cache.size < 5000) cache.set(style, v);
    return v;
  }
  R.snaps = [];
  R.reset = () => { cache.clear(); R.snapNext = true; R.snapFlash = false; };
  const where = (c) => {
    if (!c || !c.isConnected) return "offscreen";
    if (c.closest && c.closest(".price-axis, .time-axis, [class*='price-axis'], [class*='time-axis']")) return "scale";
    // Lightweight Charts: its scales are the narrow (price) and short (time) canvases of the chart's table
    if (c.closest && c.closest("[data-bd-lwroot], .tv-lightweight-charts")) { const r = c.getBoundingClientRect(); if (r.width < 140 || r.height < 60) return "scale"; }
    return c.closest && c.closest(".chart-markup-table, .tv-lightweight-charts, [class*='chart']") ? "pane" : "other";
  };
  function rec(ctx, method, style, a) {
    if (!R.on) return;
    const w = classify(style); if (!w) return;
    const place = where(ctx.canvas), k = `${R.step}|${w.name}|${w.kind}|${place}`;
    R.counts[k] = (R.counts[k] || 0) + 1;
    if (w.kind === "native" && R.draws.length < 20000) {
      const t = ctx.getTransform();
      R.draws.push({ f: R.frame, t: Math.round(performance.now()), step: R.step, name: w.name, m: method, col: String(style), place,
        y: a && a.length >= 2 && typeof a[1] === "number" ? Math.round(a[1] * (t.d || 1) + t.f) : null, alpha: ctx.globalAlpha,
        path: method === "stroke" || method === "fill" ? R.pathOf(ctx) : "", cv: R.cid(ctx.canvas), priismOn: !!(document.documentElement && document.documentElement.classList.contains("bd-on")), fxSet: !!(document.documentElement && document.documentElement.getAttribute("data-ws-fx")), lwOn: !!window.__bdLwOn, lw: ctx.lineWidth, dash: ctx.getLineDash().join(",") });
    }
    if (w.kind === "chosen" && R.draws.length < 20000 && (method === "stroke" || method === "fill"))
      R.draws.push({ f: R.frame, t: Math.round(performance.now()), step: R.step, name: w.name, kind: "chosen", m: method, place, path: R.pathOf(ctx), cv: R.cid(ctx.canvas) });
  }
  const wrapS = (name) => { const o = P[name]; P[name] = function () { try { rec(this, name, ssD.get.call(this), arguments); } catch {} return o.apply(this, arguments); }; };
  const wrapF = (name) => { const o = P[name]; P[name] = function () { try { rec(this, name, fsD.get.call(this), arguments); } catch {} return o.apply(this, arguments); }; };
  // the path being stroked (device px, first few points), so a native draw can be told apart (which part of what)
  const pts = new WeakMap();
  { const b = P.beginPath; P.beginPath = function () { if (R.on) pts.set(this, []); return b.apply(this, arguments); }; }
  for (const n of ["moveTo", "lineTo"]) { const o = P[n]; P[n] = function (x, y) { if (R.on) { const a = pts.get(this); if (a && a.length < 6) { const t = this.getTransform(); a.push(n[0] + Math.round(x * t.a + t.e) + "," + Math.round(y * t.d + t.f)); } } return o.apply(this, arguments); }; }
  for (const n of ["rect", "roundRect"]) { const o = P[n]; if (!o) continue; P[n] = function (x, y, w, h) { if (R.on) { const a = pts.get(this); if (a && a.length < 6) { const t = this.getTransform(); a.push(n[0] + "(" + Math.round(x * t.a + t.e) + "," + Math.round(y * t.d + t.f) + " " + Math.round(w * t.a) + "x" + Math.round(h * t.d) + ")"); } } return o.apply(this, arguments); }; }
  const cid = new WeakMap(); let cn = 0; R.cid = (c) => { let v = cid.get(c); if (!v) { v = ++cn; cid.set(c, v); } return v; };
  R.pathOf = (ctx) => (pts.get(ctx) || []).join(" ");
  { const o = P.fillText; P.fillText = function (t, x, y) { try { if (R.on && R.detail && R.texts.length < 3000 && this.canvas && this.canvas.isConnected) { const m = this.getTransform();
      R.texts.push({ f: R.frame, t: Math.round(performance.now()), step: R.step, cv: R.cid(this.canvas), text: String(t).slice(0, 20), y: Math.round(y * m.d + m.f), x: Math.round(x * m.a + m.e), font: this.font }); } } catch {} return o.apply(this, arguments); }; }
  R.texts = [];
  { const o = P.drawImage; P.drawImage = function (img) { try { if (R.on && R.detail && R.texts.length < 3000 && this.canvas && this.canvas.isConnected && img && img.width < 400) { const m = this.getTransform(), r = [...arguments].slice(1);
      const dy = r.length >= 8 ? r[5] : r[1], dh = r.length >= 8 ? r[7] : r.length >= 4 ? r[3] : img.height, dx = r.length >= 8 ? r[4] : r[0], dw = r.length >= 8 ? r[6] : r.length >= 4 ? r[2] : img.width;
      R.texts.push({ f: R.frame, t: Math.round(performance.now()), step: R.step, cv: R.cid(this.canvas), text: "IMG " + img.width + "x" + img.height + (img.isConnected ? " on" : " off"), y: Math.round(dy * m.d + m.f), x: Math.round(dx * m.a + m.e), font: Math.round(dw * m.a) + "x" + Math.round(dh * m.d) }); } } catch {} return o.apply(this, arguments); }; }
  wrapS("stroke"); wrapS("strokeRect"); wrapS("strokeText");
  wrapF("fill"); wrapF("fillRect"); wrapF("fillText");
  R.mine = P.stroke;
  // What was on screen: after each frame's paint, native-coloured pixels on the chart's canvases.
  function sample() {
    if (!R.on || !R.watch.some((w) => w.kind === "native" && w.px)) return;
    if (R.frame % R.pxEvery) return;
    const res = {};
    for (const c of document.querySelectorAll("canvas")) {
      if (c.width < 40 || c.height < 40 || !c.isConnected) continue;
      const r = c.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
      let d; try { d = c.getContext("2d", { willReadFrequently: false }).getImageData(0, 0, c.width, c.height).data; } catch { continue; }
      const place = where(c);
      for (const w of R.watch) {
        if (w.kind !== "native" || !w.px) continue;
        let n = 0; const rows = {};
        for (let i = 0; i < d.length; i += 8) if (d[i + 3] > 40 && Math.abs(d[i] - w.rgb[0]) <= 6 && Math.abs(d[i + 1] - w.rgb[1]) <= 6 && Math.abs(d[i + 2] - w.rgb[2]) <= 6) {
          n++; const p = i / 4, y = Math.floor(p / c.width), x = p % c.width, r = rows[y] || (rows[y] = [x, x, 0]); if (x < r[0]) r[0] = x; if (x > r[1]) r[1] = x; r[2]++; }
        if (n) { const k = w.name + "|" + place; res[k] = (res[k] || 0) + n;
          if (place === "pane") res[k + "|rows"] = Object.entries(rows).slice(0, 8).map(([y, r]) => `y${y} x${r[0]}-${r[1]} n${r[2]} a${d[(+y * c.width + r[0]) * 4 + 3]}`).join("; "); }
      }
    }
    // stills for the PR: the step's first frame, and the first frame with native colour on the chart
    const flash = Object.keys(res).some((k) => k.endsWith("|pane"));
    if (R.snaps && R.snaps.length < 24 && (R.snapNext || (flash && !R.snapFlash))) {
      try { const c = [...document.querySelectorAll(".chart-markup-table canvas, [data-bd-lwroot] canvas, .tv-lightweight-charts canvas")].filter((c) => c.isConnected && c.width > 300)
          .sort((a, b) => b.width * b.height - a.width * a.height)[0];
        // full size, every drawn pixel at full opacity in its own colour (the chart's background is see-through under
        // Priism, so a thin line's soft edge is its exact colour, part opaque): the colours in the still are the drawn ones
        if (c) { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height), p = d.data;
          for (let i = 0; i < p.length; i += 4) { if (p[i + 3] > 40) p[i + 3] = 255; else { p[i] = 11; p[i + 1] = 14; p[i + 2] = 20; p[i + 3] = 255; } }
          const t = document.createElement("canvas"); t.width = c.width; t.height = c.height; t.getContext("2d").putImageData(d, 0, 0);
          R.snaps.push({ step: R.step, f: R.frame, kind: R.snapNext ? "first" : "flash", url: t.toDataURL("image/png") }); }
      } catch {}
      if (R.snapNext) R.snapNext = false; else R.snapFlash = true;
    }
    const keys = Object.keys(res);
    for (const k of keys) { if (typeof res[k] !== "number") continue; const s = R.step + "|" + k; R.px[s] = Math.max(R.px[s] || 0, res[k]); }
    if (keys.length && R.pxFrames.length < 3000) R.pxFrames.push({ f: R.frame, step: R.step, res });
  }
  const loop = () => { requestAnimationFrame(() => { R.lastSample = performance.now(); setTimeout(sample, 0); loop(); }); };
  loop();
  // a frame whose first document is replaced (the chart's blob: frame on the trading terminal / TopstepX) drops the
  // callbacks asked for before: start the loops again if they stopped
  R.kick = () => { const now = performance.now();
    if (now - (R.lastTick || 0) > 300) requestAnimationFrame(tick);
    if (now - (R.lastSample || 0) > 300) loop(); };
})();
