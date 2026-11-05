/* Live demo for the homepage: an animated candlestick chart over an animated wallpaper, with preset buttons
   visitors click to re-skin it instantly. Self-contained (no extension needed) so it runs on the static site.
   Mirrors the real product's look: wallpaper behind, recoloured candles, a glassy price scale and a watermark. */
(function () {
  const host = document.getElementById("demo");
  if (!host) return;
  const cv = host.querySelector("canvas"), ctx = cv.getContext("2d");
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- a few wallpaper renderers (compact versions of the real skins) ----------
  const skins = {
    cybergrid(g, w, h, t) {
      g.fillStyle = "#05070f"; g.fillRect(0, 0, w, h);
      const hz = h * 0.52; g.strokeStyle = "rgba(0,200,255,0.35)"; g.lineWidth = 1;
      for (let i = 1; i < 14; i++) { const y = hz + (h - hz) * Math.pow(i / 14, 2); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      const off = (t * 40) % (w / 12);
      for (let i = -1; i < 26; i++) { const x = w / 2 + (i - 12) * (w / 12); g.beginPath(); g.moveTo(w / 2 + (x - w / 2) * 0.1, hz); g.lineTo(x, h); g.stroke(); }
      const sun = g.createLinearGradient(0, hz - 120, 0, hz); sun.addColorStop(0, "rgba(255,40,150,0.0)"); sun.addColorStop(1, "rgba(255,40,150,0.25)");
      g.fillStyle = sun; g.fillRect(0, hz - 120, w, 120);
    },
    starfield(g, w, h, t) {
      g.fillStyle = "#04060c"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { const x = (i * 97.3) % w, y = (i * 53.7 % h), a = 0.3 + 0.7 * Math.abs(Math.sin(t + i)); g.fillStyle = `rgba(200,220,255,${a * 0.6})`; g.fillRect(x, y, 1.5, 1.5); }
    },
    galaxy(g, w, h, t) {
      g.fillStyle = "#070513"; g.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2; for (let i = 0; i < 240; i++) { const a = i * 0.14 + t * 0.15, r = i * 0.9; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.6;
        g.fillStyle = `hsla(${(i * 1.2 + t * 20) % 360},80%,65%,0.5)`; g.fillRect(x, y, 2, 2); }
    },
    embers(g, w, h, t) {
      g.fillStyle = "#120402"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const x = (i * 71 + t * 20) % w, y = h - ((i * 37 + t * 60) % (h + 40)); const a = y / h; g.fillStyle = `rgba(255,${100 + 120 * (1 - a)},30,${0.5 * (1 - a) + 0.2})`; g.fillRect(x, y, 2.5, 2.5); }
    },
    ocean(g, w, h, t) {
      const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#02131f"); grd.addColorStop(1, "#063b57"); g.fillStyle = grd; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(120,220,255,0.25)"; for (let k = 0; k < 5; k++) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * (0.3 + k * 0.13) + Math.sin(x * 0.02 + t * 1.5 + k) * 10; x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    },
    aurora(g, w, h, t) {
      g.fillStyle = "#050a14"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "lighter";
      [[150, .38], [190, .5], [285, .6]].forEach(([hue, yy], i) => { const grd = g.createLinearGradient(0, h * (yy - .2), 0, h * (yy + .2));
        grd.addColorStop(0, `hsla(${hue},90%,60%,0)`); grd.addColorStop(.5, `hsla(${hue},90%,55%,.3)`); grd.addColorStop(1, `hsla(${hue},90%,50%,0)`); g.fillStyle = grd;
        g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 12) g.lineTo(x, h * yy + Math.sin(x * .01 + t + i) * h * .08); g.lineTo(w, h); g.fill(); });
      g.globalCompositeOperation = "source-over";
    },
    matrix(g, w, h, t) {
      g.fillStyle = "#020a04"; g.fillRect(0, 0, w, h); g.font = "12px monospace";
      for (let c = 0; c < w / 14; c++) { for (let r = 0; r < 6; r++) { const y = ((t * 80 + c * 40 + r * 18) % (h + 60)); g.fillStyle = `rgba(0,255,70,${0.15 + 0.15 * r})`; g.fillText(Math.random() > .5 ? "1" : "0", c * 14, y); } }
    },
  };

  // ---------- presets (skin + candle colours + scale accent) ----------
  const presets = [
    { name: "Neon Night", skin: "cybergrid", up: "#fcee0a", down: "#00f0ff", accent: "#7df9ff", dim: .25 },
    { name: "Blackout", skin: "starfield", up: "#ffffff", down: "#2a2d36", accent: "#ffffff", dim: .5 },
    { name: "Cosmic", skin: "galaxy", up: "#b388ff", down: "#ff6ec7", accent: "#d6b8ff", dim: .2 },
    { name: "Inferno", skin: "embers", up: "#ffb300", down: "#ff3d00", accent: "#ffcc80", dim: .3 },
    { name: "Ocean", skin: "ocean", up: "#8be9ff", down: "#3d5afe", accent: "#8be9ff", dim: .3 },
    { name: "Aurora", skin: "aurora", up: "#00ffa3", down: "#ff2e97", accent: "#9affd6", dim: .3 },
    { name: "Terminal", skin: "matrix", up: "#00ff41", down: "#0b6623", accent: "#00ff41", dim: .4 },
  ];
  let active = presets[0];

  // ---------- fake but realistic candle series ----------
  const N = 60; let candles = [];
  (function seed() { let p = 100; for (let i = 0; i < N; i++) { const o = p, c = p + (Math.random() - 0.48) * 6; const hi = Math.max(o, c) + Math.random() * 3, lo = Math.min(o, c) - Math.random() * 3; candles.push({ o, c, h: hi, l: lo }); p = c; } })();
  let lastStep = 0;
  function step() { const last = candles[candles.length - 1]; const o = last.c, c = o + (Math.random() - 0.48) * 6; candles.push({ o, c, h: Math.max(o, c) + Math.random() * 3, l: Math.min(o, c) - Math.random() * 3 }); candles.shift(); }

  function resize() { const r = host.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); addEventListener("resize", resize);

  function draw(t) {
    const w = cv.width / (Math.min(2, devicePixelRatio || 1)), h = cv.height / (Math.min(2, devicePixelRatio || 1));
    (skins[active.skin] || skins.cybergrid)(ctx, w, h, t);
    ctx.fillStyle = `rgba(0,0,0,${active.dim})`; ctx.fillRect(0, 0, w, h);               // dim
    // candles
    const padR = 64, plot = w - padR; let lo = Infinity, hi = -Infinity;
    for (const k of candles) { lo = Math.min(lo, k.l); hi = Math.max(hi, k.h); }
    const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
    const y = (v) => h - ((v - lo) / (hi - lo)) * h; const cw = plot / N;
    candles.forEach((k, i) => { const x = i * cw + cw / 2; const col = k.c >= k.o ? active.up : active.down;
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
      ctx.fillStyle = col; const top = y(Math.max(k.o, k.c)), bh = Math.max(1.5, Math.abs(y(k.o) - y(k.c))); ctx.fillRect(x - cw * 0.32, top, cw * 0.64, bh); });
    // glassy price scale
    ctx.save(); ctx.fillStyle = "rgba(8,11,18,0.5)"; ctx.fillRect(plot, 0, padR, h);
    ctx.fillStyle = active.accent; ctx.font = "600 11px ui-monospace, monospace"; ctx.textBaseline = "middle";
    for (let i = 0; i <= 6; i++) { const v = lo + (hi - lo) * (i / 6); ctx.fillText(v.toFixed(1), plot + 6, h - (i / 6) * h); }
    // live price tag
    const last = candles[candles.length - 1]; const ly = y(last.c); ctx.fillStyle = last.c >= last.o ? active.up : active.down;
    ctx.fillRect(plot, ly - 9, padR, 18); ctx.fillStyle = "#06110d"; ctx.fillText(last.c.toFixed(1), plot + 6, ly);
    ctx.restore();
    // watermark
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "700 12px system-ui, sans-serif"; ctx.fillText("◆ Priism Skins", 14, h - 16);
  }

  let raf, t0 = performance.now();
  function loop(now) { raf = requestAnimationFrame(loop); const t = (now - t0) / 1000;
    if (!prefersReduced && now - lastStep > 900) { lastStep = now; step(); }
    draw(t); }
  // pause when offscreen to save battery
  const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); raf = 0; } });
  io.observe(host);

  // ---------- preset buttons ----------
  const bar = document.getElementById("demoPresets");
  presets.forEach((p, i) => { const b = document.createElement("button"); b.className = "demo-chip" + (i === 0 ? " on" : ""); b.textContent = p.name;
    b.onclick = () => { active = p; [...bar.children].forEach((c) => c.classList.toggle("on", c === b)); }; bar.appendChild(b); });
})();
