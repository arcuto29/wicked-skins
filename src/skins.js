/* Built-in animated skins. Each factory gets a 2D canvas context and returns
   { resize(w,h), frame(t,dt) }. t = seconds, dt = seconds since last frame.
   The whole module is one function of (window, document), so the chart can also run it inside a background worker
   (window = the worker, document = a stand-in whose createElement gives an OffscreenCanvas). See content.js. */
(function () {
function priismSkins(window, document) {
  const rnd = (a, b) => a + Math.random() * (b - a);

  const matrix = (ctx, o = {}) => {
    let w = 0, h = 0, cols = [], size = Math.round(16 * (o.size || 1));
    const chars = "01アイウエオカキクケコサシスセソ";
    return {
      resize(W, H) {
        w = W; h = H;
        cols = Array.from({ length: Math.ceil(w / size) }, () => rnd(-h / size, 0));
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
      },
      frame(t, dt) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, 0, w, h);
        ctx.font = `${size}px monospace`;
        cols.forEach((y, i) => {
          ctx.fillStyle = "#c8ffd4";
          ctx.fillText(chars[(Math.random() * chars.length) | 0], i * size, y * size);
          ctx.fillStyle = "#00ff55";
          ctx.fillText(chars[(Math.random() * chars.length) | 0], i * size, (y - 1) * size);
          cols[i] = y * size > h && Math.random() > 0.975 ? 0 : y + dt * 18;
        });
      },
    };
  };

  const nebula = (ctx) => {
    let w = 0, h = 0, stars = [];
    const clouds = [
      { x: 0.3, y: 0.4, r: 0.5, hue: 265 },
      { x: 0.7, y: 0.6, r: 0.45, hue: 320 },
      { x: 0.5, y: 0.3, r: 0.4, hue: 210 },
    ];
    return {
      resize(W, H) {
        w = W; h = H;
        stars = Array.from({ length: 160 }, () => ({ x: rnd(0, w), y: rnd(0, h), s: rnd(0.4, 1.6), p: rnd(0, 6) }));
      },
      frame(t) {
        ctx.fillStyle = "#04030d"; ctx.fillRect(0, 0, w, h);
        clouds.forEach((c, i) => {
          const cx = w * (c.x + Math.sin(t * 0.05 + i) * 0.05);
          const cy = h * (c.y + Math.cos(t * 0.04 + i * 2) * 0.05);
          const r = Math.max(w, h) * c.r;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `hsla(${c.hue},80%,45%,0.35)`);
          g.addColorStop(1, `hsla(${c.hue},80%,30%,0)`);
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        });
        stars.forEach((s) => {
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.5 + s.p);
          ctx.fillStyle = "#fff";
          ctx.fillRect(s.x, s.y, s.s, s.s);
        });
        ctx.globalAlpha = 1;
      },
    };
  };

  const embers = (ctx) => {
    let w = 0, h = 0, ps = [];
    const spawn = (init) => ({
      x: rnd(0, w), y: init ? rnd(0, h) : h + 10,
      vy: rnd(20, 70), vx: rnd(-15, 15), r: rnd(1, 3), life: rnd(0.5, 1), ph: rnd(0, 6),
    });
    return {
      resize(W, H) { w = W; h = H; ps = Array.from({ length: 120 }, () => spawn(true)); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#0a0402"); g.addColorStop(1, "#2a0c02");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        ps.forEach((p, i) => {
          p.y -= p.vy * dt; p.x += (p.vx + Math.sin(t + p.ph) * 12) * dt;
          const a = Math.max(0, (p.y / h)) * p.life;
          ctx.fillStyle = `rgba(255,${(120 + 100 * p.life) | 0},40,${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          if (p.y < -10) ps[i] = spawn(false);
        });
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const synthwave = (ctx) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const hor = h * 0.55;
        const sky = ctx.createLinearGradient(0, 0, 0, hor);
        sky.addColorStop(0, "#0b0222"); sky.addColorStop(1, "#5a1a7a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hor);
        ctx.fillStyle = "#12011f"; ctx.fillRect(0, hor, w, h - hor);
        // sun
        const sg = ctx.createLinearGradient(0, hor - 160, 0, hor);
        sg.addColorStop(0, "#ffd34d"); sg.addColorStop(1, "#ff2e88");
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(w / 2, hor, Math.min(w, h) * 0.22, Math.PI, 0); ctx.fill();
        // grid
        ctx.strokeStyle = "rgba(255,60,200,0.7)"; ctx.lineWidth = 1;
        for (let i = -20; i <= 20; i++) {
          ctx.beginPath(); ctx.moveTo(w / 2 + i * 12, hor); ctx.lineTo(w / 2 + i * w * 0.12, h); ctx.stroke();
        }
        for (let i = 0; i < 14; i++) {
          const f = ((i + (t * 0.6) % 1) / 14) ** 2.2;
          const y = hor + f * (h - hor);
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      },
    };
  };

  const AMT = { k: "amount", label: "Amount", type: "range", min: 0.3, max: 2, step: 0.1, def: 1 };
  const starfield = (ctx, o = {}) => {
    let w = 0, h = 0, s = [];
    const mk = () => ({ x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(0.1, 1) });
    return {
      resize(W, H) { w = W; h = H; s = Array.from({ length: Math.round(220 * (o.amount || 1)) }, mk); },
      frame(t, dt) {
        ctx.fillStyle = "#02030a"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fff";
        s.forEach((p, i) => {
          p.z -= dt * 0.18;
          if (p.z <= 0.02) { s[i] = mk(); s[i].z = 1; return; }
          const x = w / 2 + (p.x / p.z) * w * 0.25, y = h / 2 + (p.y / p.z) * h * 0.25;
          const r = (1 - p.z) * 2.2;
          ctx.globalAlpha = 1 - p.z;
          ctx.fillRect(x, y, r, r);
        });
        ctx.globalAlpha = 1;
      },
    };
  };

  const rain = (ctx, o = {}) => {
    let w = 0, h = 0, d = [];
    const mk = () => ({ x: rnd(0, w), y: rnd(-h, 0), l: rnd(10, 28), v: rnd(500, 900) });
    return {
      resize(W, H) { w = W; h = H; d = Array.from({ length: Math.round(140 * (o.amount || 1)) }, mk); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#0a1220"); g.addColorStop(1, "#16243a");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(160,190,230,0.35)"; ctx.lineWidth = 1;
        ctx.beginPath();
        d.forEach((p, i) => {
          p.y += p.v * dt; p.x -= p.v * dt * 0.1;
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * 0.1, p.y - p.l);
          if (p.y > h) d[i] = { ...mk(), y: -20 };
        });
        ctx.stroke();
      },
    };
  };

  const graphite = (ctx) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const g = ctx.createRadialGradient(w * (0.5 + Math.sin(t * 0.1) * 0.1), h * 0.4, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
        g.addColorStop(0, "#2a2d36"); g.addColorStop(1, "#0b0c10");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      },
    };
  };

  // ---------- more live wallpapers ----------
  const TAU = Math.PI * 2;

  const ocean = (ctx) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#01121f"); sky.addColorStop(1, "#02324a");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 6; i++) {
          const base = h * (0.35 + i * 0.12), amp = 8 + i * 6, sp = 0.4 + i * 0.15;
          ctx.fillStyle = `hsla(${195 + i * 4},80%,${18 + i * 5}%,0.55)`;
          ctx.beginPath(); ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 12) ctx.lineTo(x, base + Math.sin(x * 0.008 + t * sp + i) * amp + Math.sin(x * 0.021 - t * sp * 1.7) * amp * 0.4);
          ctx.lineTo(w, h); ctx.fill();
        }
      },
    };
  };

  const fireflies = (ctx, o = {}) => {
    let w = 0, h = 0, f = [];
    return {
      resize(W, H) { w = W; h = H; const k = Math.max(0.25, Math.min(w, h) / 600); f = Array.from({ length: Math.round(70 * (o.amount || 1)) }, () => ({ x: rnd(0, w), y: rnd(0, h), a: rnd(0, TAU), s: rnd(8, 25) * k, p: rnd(0, TAU), r: rnd(1.5, 3.5) * k })); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#020806"); g.addColorStop(1, "#0b1d10");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const p of f) {
          p.a += (Math.random() - 0.5) * dt * 2;
          p.x = (p.x + Math.cos(p.a) * p.s * dt + w) % w; p.y = (p.y + Math.sin(p.a) * p.s * dt + h) % h;
          const glow = 0.5 + 0.5 * Math.sin(t * 2 + p.p);
          const rg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          rg.addColorStop(0, `rgba(220,255,120,${0.9 * glow})`); rg.addColorStop(1, "rgba(120,255,60,0)");
          ctx.fillStyle = rg; ctx.fillRect(p.x - p.r * 6, p.y - p.r * 6, p.r * 12, p.r * 12);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const snow = (ctx, o = {}) => {
    let w = 0, h = 0, s = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : -5, r: rnd(0.8, 3), v: rnd(15, 50), p: rnd(0, TAU) });
    return {
      resize(W, H) { w = W; h = H; s = Array.from({ length: Math.round(220 * (o.amount || 1)) }, () => mk(true)); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#0d1626"); g.addColorStop(1, "#2a3a55");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        s.forEach((p, i) => {
          p.y += p.v * dt * (p.r / 2); p.x += Math.sin(t * 0.8 + p.p) * 12 * dt;
          ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, TAU);
          if (p.y > h + 5) s[i] = mk(false);
        });
        ctx.fill();
      },
    };
  };

  const sakura = (ctx, o = {}) => {
    let w = 0, h = 0, p = [];
    const mk = (init) => ({ x: rnd(-50, w), y: init ? rnd(0, h) : -10, s: rnd(4, 9), r: rnd(0, TAU), vr: rnd(-2, 2), vx: rnd(10, 40), vy: rnd(20, 50), ph: rnd(0, TAU) });
    return {
      resize(W, H) { w = W; h = H; p = Array.from({ length: Math.round(90 * (o.amount || 1)) }, () => mk(true)); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#1a0a16"); g.addColorStop(1, "#3a1530");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,183,213,0.85)";
        p.forEach((q, i) => {
          q.x += (q.vx + Math.sin(t + q.ph) * 20) * dt; q.y += q.vy * dt; q.r += q.vr * dt;
          const c = Math.cos(q.r), sn = Math.sin(q.r), sy = 0.55 + 0.45 * Math.sin(t * 3 + q.ph);
          ctx.setTransform(c * q.s, sn * q.s, -sn * q.s * 0.6 * sy, c * q.s * 0.6 * sy, q.x, q.y); // rotate+squash, unit petal
          ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
          if (q.y > h + 10 || q.x > w + 50) p[i] = mk(false);
        });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      },
    };
  };

  const lavalamp = (ctx) => {
    let w = 0, h = 0, b = [];
    return {
      resize(W, H) { w = W; h = H; b = Array.from({ length: 9 }, (_, i) => ({ x: rnd(0.15, 0.85), r: rnd(0.08, 0.16), sp: rnd(0.04, 0.09), ph: rnd(0, TAU), hue: [330, 15, 280][i % 3] })); },
      frame(t) {
        ctx.fillStyle = "#12020c"; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const o of b) {
          const y = h * (0.5 + 0.42 * Math.sin(t * o.sp * TAU * 0.3 + o.ph));
          const x = w * (o.x + 0.05 * Math.sin(t * 0.3 + o.ph));
          const r = Math.min(w, h) * o.r * (1 + 0.15 * Math.sin(t + o.ph));
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
          g.addColorStop(0, `hsla(${o.hue},95%,60%,0.9)`); g.addColorStop(0.5, `hsla(${o.hue},95%,45%,0.35)`); g.addColorStop(1, `hsla(${o.hue},95%,40%,0)`);
          ctx.fillStyle = g; ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const plasma = (ctx) => {
    let w = 0, h = 0;
    const PW = 96, PH = 54, buf = document.createElement("canvas"); buf.width = PW; buf.height = PH;
    const bctx = buf.getContext("2d"), img = bctx.createImageData(PW, PH);
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const d = img.data;
        for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
          const v = Math.sin(x * 0.09 + t) + Math.sin(y * 0.11 - t * 0.7) + Math.sin((x + y) * 0.06 + t * 0.5) + Math.sin(Math.hypot(x - PW / 2, y - PH / 2) * 0.12 - t);
          const i = (y * PW + x) * 4;
          d[i] = 128 + 100 * Math.sin(v * Math.PI); d[i + 1] = 40 + 40 * Math.sin(v * Math.PI + 2); d[i + 2] = 150 + 100 * Math.sin(v * Math.PI + 4); d[i + 3] = 255;
        }
        bctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.drawImage(buf, 0, 0, w, h);
      },
    };
  };

  const hyperspace = (ctx) => {
    let w = 0, h = 0, s = [];
    const mk = () => ({ a: rnd(0, TAU), d: rnd(0.02, 0.3), v: rnd(0.4, 1.2), hue: rnd(190, 260) });
    return {
      resize(W, H) { w = W; h = H; s = Array.from({ length: 260 }, mk); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h); },
      frame(t, dt) {
        ctx.fillStyle = "rgba(0,0,8,0.35)"; ctx.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
        ctx.lineWidth = 1.4;
        s.forEach((p, i) => {
          const d0 = p.d; p.d *= 1 + p.v * dt * 2.2;
          if (p.d > 1.1) { s[i] = mk(); return; }
          ctx.strokeStyle = `hsla(${p.hue},90%,75%,${Math.min(1, p.d * 2)})`;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(p.a) * d0 * R, cy + Math.sin(p.a) * d0 * R); ctx.lineTo(cx + Math.cos(p.a) * p.d * R, cy + Math.sin(p.a) * p.d * R); ctx.stroke();
        });
      },
    };
  };

  const galaxy = (ctx) => {
    let w = 0, h = 0, st = [];
    const BUCKETS = ["hsla(40,90%,80%,0.95)", "hsla(210,80%,78%,0.85)", "hsla(235,80%,75%,0.75)", "hsla(260,80%,75%,0.65)", "hsla(280,80%,72%,0.55)", "hsla(300,80%,70%,0.45)"];
    return {
      resize(W, H) {
        w = W; h = H;
        st = Array.from({ length: 900 }, () => { const arm = (Math.random() * 3) | 0, r = Math.pow(Math.random(), 0.6);
          // bucket = colour group: warm core, then 5 blue→violet bands fading outwards
          const b = r < 0.25 ? 0 : 1 + Math.min(4, ((r - 0.25) / 0.15) | 0);
          return { r, a: arm * (TAU / 3) + r * 5 + rnd(-0.35, 0.35) * (1 - r * 0.5), s: rnd(0.5, 1.8), b }; });
      },
      frame(t) {
        ctx.fillStyle = "#02010a"; ctx.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.55;
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
        core.addColorStop(0, "rgba(255,220,170,0.55)"); core.addColorStop(1, "rgba(120,80,200,0)");
        ctx.fillStyle = core; ctx.fillRect(0, 0, w, h);
        for (let b = 0; b < BUCKETS.length; b++) {
          ctx.fillStyle = BUCKETS[b]; ctx.beginPath();
          for (const p of st) {
            if (p.b !== b) continue;
            const a = p.a + t * 0.05 * (1.2 - p.r);
            ctx.rect(cx + Math.cos(a) * p.r * R * 1.6, cy + Math.sin(a) * p.r * R * 0.75, p.s, p.s);
          }
          ctx.fill();
        }
      },
    };
  };

  const bokeh = (ctx, o = {}) => {
    let w = 0, h = 0, c = [];
    return {
      resize(W, H) { w = W; h = H; c = Array.from({ length: Math.round(28 * (o.amount || 1)) }, () => ({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0.03, 0.1), hue: rnd(20, 60) + (Math.random() < 0.4 ? 160 : 0), sp: rnd(0.01, 0.04), ph: rnd(0, TAU) })); },
      frame(t) {
        ctx.fillStyle = "#0a0806"; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (const o of c) {
          const x = w * ((o.x + t * o.sp) % 1.2 - 0.1), y = h * (o.y + 0.03 * Math.sin(t * 0.5 + o.ph)), r = Math.min(w, h) * o.r;
          const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
          g.addColorStop(0, `hsla(${o.hue},90%,60%,${0.18 + 0.1 * Math.sin(t + o.ph)})`); g.addColorStop(1, `hsla(${o.hue},90%,60%,0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const cybergrid = (ctx) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        ctx.fillStyle = "#020611"; ctx.fillRect(0, 0, w, h);
        const hor = h * 0.42;
        const glow = ctx.createLinearGradient(0, hor - 80, 0, hor + 10);
        glow.addColorStop(0, "rgba(0,240,255,0)"); glow.addColorStop(1, "rgba(0,240,255,0.25)");
        ctx.fillStyle = glow; ctx.fillRect(0, hor - 80, w, 90);
        ctx.strokeStyle = "rgba(0,240,255,0.55)"; ctx.lineWidth = 1;
        for (let i = -24; i <= 24; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 10, hor); ctx.lineTo(w / 2 + i * w * 0.09, h); ctx.stroke(); }
        for (let i = 0; i < 16; i++) { const f = ((i + (t * 0.8) % 1) / 16) ** 2; const y = hor + f * (h - hor); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        // mirrored grid on the ceiling
        ctx.strokeStyle = "rgba(255,0,200,0.25)";
        for (let i = 0; i < 10; i++) { const f = ((i + (t * 0.8) % 1) / 10) ** 2; const y = hor - 80 - f * (hor - 80); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      },
    };
  };

  const deepsea = (ctx) => {
    let w = 0, h = 0, bub = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : h + 10, r: rnd(1, 4), v: rnd(15, 45), ph: rnd(0, TAU) });
    return {
      resize(W, H) { w = W; h = H; bub = Array.from({ length: 70 }, () => mk(true)); },
      frame(t, dt) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#04324a"); g.addColorStop(1, "#000814");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 6; i++) { // god rays
          const x = w * (0.15 + i * 0.15) + Math.sin(t * 0.2 + i) * 40;
          const rg = ctx.createLinearGradient(x, 0, x + 120, h);
          rg.addColorStop(0, "rgba(120,220,255,0.12)"); rg.addColorStop(1, "rgba(120,220,255,0)");
          ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 200, h); ctx.lineTo(x + 60, h); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "rgba(180,240,255,0.5)";
        bub.forEach((b, i) => {
          b.y -= b.v * dt; b.x += Math.sin(t * 2 + b.ph) * 8 * dt;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke();
          if (b.y < -10) bub[i] = mk(false);
        });
      },
    };
  };

  const circuit = (ctx) => {
    let w = 0, h = 0, paths = [], G = 24;
    return {
      resize(W, H) {
        w = W; h = H; paths = [];
        for (let k = 0; k < 40; k++) {
          let x = Math.round(rnd(0, w) / G) * G, y = Math.round(rnd(0, h) / G) * G; const pts = [[x, y]];
          for (let s = 0; s < 8; s++) { if (Math.random() < 0.5) x += G * (Math.random() < 0.5 ? -1 : 1) * ((Math.random() * 4 + 1) | 0); else y += G * (Math.random() < 0.5 ? -1 : 1) * ((Math.random() * 3 + 1) | 0); pts.push([x, y]); }
          let len = 0; for (let i = 1; i < pts.length; i++) len += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
          paths.push({ pts, len, sp: rnd(60, 160), off: rnd(0, 1000), hue: Math.random() < 0.5 ? 160 : 190 });
        }
      },
      frame(t) {
        ctx.fillStyle = "#02090a"; ctx.fillRect(0, 0, w, h);
        ctx.lineWidth = 1.2;
        for (const hue of [160, 190]) {
          ctx.strokeStyle = `hsla(${hue},70%,30%,0.6)`; ctx.beginPath();
          for (const p of paths) if (p.hue === hue) p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
        for (const p of paths) {
          let d = (t * p.sp + p.off) % p.len;           // a pulse travelling along the trace
          for (let i = 1; i < p.pts.length; i++) {
            const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i], seg = Math.abs(bx - ax) + Math.abs(by - ay);
            if (d <= seg) { const f = seg ? d / seg : 0, x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
              ctx.fillStyle = `hsla(${p.hue},100%,60%,0.18)`; ctx.fillRect(x - 7, y - 7, 14, 14);
              ctx.fillStyle = `hsla(${p.hue},100%,70%,1)`; ctx.fillRect(x - 2, y - 2, 4, 4); break; }
            d -= seg;
          }
        }
      },
    };
  };

  const sunsetclouds = (ctx) => {
    let w = 0, h = 0, cl = [];
    return {
      resize(W, H) { w = W; h = H; cl = Array.from({ length: 14 }, () => ({ x: rnd(0, 1.3), y: rnd(0.08, 0.6), s: rnd(0.08, 0.2), v: rnd(0.004, 0.012) })); },
      frame(t) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#1b1036"); g.addColorStop(0.55, "#a53f5b"); g.addColorStop(1, "#f6a35b");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        for (const c of cl) {
          const x = w * (((c.x + t * c.v) % 1.4) - 0.2), y = h * c.y, r = Math.min(w, h) * c.s;
          ctx.fillStyle = "rgba(255,190,200,0.12)";
          for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + k * r * 0.6, y + Math.sin(k) * r * 0.15, r, r * 0.38, 0, 0, TAU); ctx.fill(); }
        }
      },
    };
  };

  const tickertape = (ctx) => {
    let w = 0, h = 0, rows = [];
    const SYMS = ["BTC", "ETH", "SOL", "NQ", "ES", "AAPL", "TSLA", "NVDA", "EUR", "GOLD", "OIL", "SPX"];
    const item = () => ({ s: SYMS[(Math.random() * SYMS.length) | 0], up: Math.random() < 0.3 });
    return {
      resize(W, H) { w = W; h = H; rows = Array.from({ length: Math.ceil(h / 40) }, (_, i) => ({ y: 30 + i * 40, sp: rnd(20, 60) * (i % 2 ? -1 : 1), off: rnd(0, 400), items: Array.from({ length: 30 }, item) })); },
      frame(t) {
        ctx.fillStyle = "#04060a"; ctx.fillRect(0, 0, w, h);
        ctx.font = "600 16px ui-monospace, monospace";
        for (const r of rows) {
          let x = ((r.off + t * r.sp) % 140) - 140;
          for (let k = 0; x < w + 140; k++, x += 140) {
            const it = r.items[(k + Math.floor((r.off + t * r.sp) / 140) + 3000) % r.items.length];
            // symbols only: no made-up % changes that could be mistaken for real market data
            ctx.fillStyle = it.up ? "rgba(0,255,150,0.13)" : "rgba(200,210,230,0.10)"; ctx.fillText(it.s, x, r.y);
          }
        }
      },
    };
  };

  // ===================== Skin pack 2 =====================
  // Same contract as above: factory(ctx) -> { resize(w,h), frame(t,dt) }. Sizes scale with the canvas (k) because the
  // wallpaper canvas is rendered at a reduced resolution and stretched.
  const T2 = Math.PI * 2;
  const kOf = (w, h) => Math.max(0.3, Math.min(w, h) / 600);
  // A vertical gradient filling the canvas. Wallpapers call this every frame with the same colours, so it's drawn once
  // into a cached copy and then copied 1:1 (several times cheaper than re-filling a gradient, with no GPU).
  const skyCache = new WeakMap();
  const sky = (ctx, w, h, stops) => {
    const key = w + "x" + h + JSON.stringify(stops), tf = ctx.getTransform && ctx.getTransform();
    const plain = !tf || (tf.a === 1 && tf.b === 0 && tf.c === 0 && tf.d === 1 && tf.e === 0 && tf.f === 0);
    let c = plain && skyCache.get(ctx);
    if (plain && (!c || c.key !== key)) {
      const o = document.createElement("canvas"); o.width = Math.max(2, w | 0); o.height = Math.max(2, h | 0);
      const g0 = o.getContext("2d"), g = g0.createLinearGradient(0, 0, 0, h); for (const [p, col] of stops) g.addColorStop(p, col);
      g0.fillStyle = g; g0.fillRect(0, 0, w, h); c = { key, o }; skyCache.set(ctx, c);
    }
    if (c && c.o.width === Math.max(2, w | 0)) { const ga = ctx.globalAlpha, op = ctx.globalCompositeOperation; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(c.o, 0, 0); ctx.globalAlpha = ga; ctx.globalCompositeOperation = op; return; }
    const g = ctx.createLinearGradient(0, 0, 0, h); for (const [o, col] of stops) g.addColorStop(o, col); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  const glowDot = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const offscreen = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(2, w | 0); c.height = Math.max(2, h | 0); return c; };
  const starsOf = (w, h, n, k, maxY = 1) => Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(0, h * maxY), r: rnd(0.5, 1.5) * k, p: rnd(0, T2) }));
  const drawStars = (ctx, st, t, a = 0.8) => { ctx.fillStyle = "#fff"; for (const s of st) { ctx.globalAlpha = a * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.p))); ctx.fillRect(s.x, s.y, s.r, s.r); } ctx.globalAlpha = 1; };

  const comets = (ctx) => {
    let w = 0, h = 0, k = 1, m = [], st = [];
    const spawn = () => { const a = rnd(0.5, 0.85), sp = rnd(380, 760) * k; return { x: rnd(0.25 * w, 1.2 * w), y: -rnd(0, 0.1 * h), c: Math.cos(a), s: Math.sin(a), v: sp, L: rnd(120, 300) * k, lw: rnd(1.6, 3) * k, hue: rnd(190, 230) }; };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 100, k); m = []; },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#070b1e"], [1, "#122145"]]);
        ctx.globalCompositeOperation = "lighter"; glowDot(ctx, w * 0.3, h * 0.35, Math.max(w, h) * 0.5, "60,90,200", 0.18); glowDot(ctx, w * 0.75, h * 0.7, Math.max(w, h) * 0.45, "150,70,180", 0.14); ctx.globalCompositeOperation = "source-over";
        drawStars(ctx, st, t, 0.9);
        if (Math.random() < dt * 2.8 && m.length < 12) m.push(spawn());
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        for (let i = m.length - 1; i >= 0; i--) {
          const c = m[i]; c.x -= c.c * c.v * dt; c.y += c.s * c.v * dt;
          if (c.y - c.L * c.s > h || c.x + c.L * c.c < 0) { m.splice(i, 1); continue; }
          const tx = c.x + c.c * c.L, ty = c.y - c.s * c.L, g = ctx.createLinearGradient(tx, ty, c.x, c.y);
          g.addColorStop(0, `hsla(${c.hue},90%,70%,0)`); g.addColorStop(1, `hsla(${c.hue},90%,88%,0.9)`);
          ctx.strokeStyle = g; ctx.lineWidth = c.lw; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(c.x, c.y); ctx.stroke();
          glowDot(ctx, c.x, c.y, 7 * k, "190,225,255", 0.5);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const wormhole = (ctx) => {
    let w = 0, h = 0, k = 1;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); },
      frame(t) {
        ctx.fillStyle = "#03030a"; ctx.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, maxR = Math.hypot(w, h) * 0.6, N = 26, sides = 6;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < N; i++) {
          const z = ((i / N) + t * 0.07) % 1, r = maxR * Math.pow(z, 2.4) + 2, a = Math.sin(Math.PI * z), rot = t * 0.25 + z * 2.6;
          ctx.strokeStyle = `hsla(${(t * 14 + z * 140 + 200) % 360},80%,${50 + 20 * z}%,${0.55 * a})`; ctx.lineWidth = (0.6 + 3.5 * z) * k; ctx.beginPath();
          for (let j = 0; j <= sides; j++) { const th = rot + (j / sides) * T2, x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r * 0.8; j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
        }
        glowDot(ctx, cx, cy, maxR * 0.2, "150,130,255", 0.5); ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const pulsar = (ctx) => {
    let w = 0, h = 0, k = 1, st = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 80, k); },
      frame(t) {
        sky(ctx, w, h, [[0, "#03040b"], [1, "#070a1a"]]); drawStars(ctx, st, t, 0.5);
        const cx = w * 0.5, cy = h * 0.48, maxR = Math.hypot(w, h) * 0.6;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 4; i++) { const z = (t * 0.16 + i / 4) % 1; ctx.strokeStyle = `rgba(120,200,255,${(1 - z) * 0.22})`; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(cx, cy, z * maxR, 0, T2); ctx.stroke(); }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.9);
        for (let d = 0; d < 2; d++) {
          ctx.save(); ctx.rotate(d * Math.PI); const L = maxR * 1.1, g = ctx.createLinearGradient(0, 0, L, 0);
          g.addColorStop(0, "rgba(210,238,255,0.55)"); g.addColorStop(0.5, "rgba(130,190,255,0.14)"); g.addColorStop(1, "rgba(120,180,255,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -4 * k); ctx.lineTo(L, -60 * k); ctx.lineTo(L, 60 * k); ctx.lineTo(0, 4 * k); ctx.fill(); ctx.restore();
        }
        ctx.restore();
        glowDot(ctx, cx, cy, 70 * k * (1 + 0.15 * Math.sin(t * 6)), "190,225,255", 0.65); ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const wildfire = (ctx) => {
    let w = 0, h = 0, k = 1, sp = [];
    const mk = () => ({ x: rnd(0, w), y: h + rnd(0, 20), vy: -rnd(40, 130) * k, vx: rnd(-14, 14) * k, life: rnd(0.6, 1), r: rnd(0.8, 2.2) * k });
    const L = [{ base: 0.74, amp: 0.2, hue: 12, al: 0.5, sp: 1.0 }, { base: 0.82, amp: 0.2, hue: 26, al: 0.46, sp: 1.4 }, { base: 0.92, amp: 0.18, hue: 42, al: 0.45, sp: 1.9 }];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); sp = Array.from({ length: 55 }, () => { const s = mk(); s.y = rnd(0, h); return s; }); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#070202"], [1, "#1c0703"]]); ctx.globalCompositeOperation = "lighter";
        L.forEach((l, i) => {
          const g = ctx.createLinearGradient(0, h * (l.base - l.amp * 2), 0, h);
          g.addColorStop(0, `hsla(${l.hue},100%,55%,0)`); g.addColorStop(0.5, `hsla(${l.hue},100%,50%,${l.al * 0.6})`); g.addColorStop(1, `hsla(${l.hue - 6},100%,46%,${l.al})`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, h);
          for (let x = 0; x <= w + 12; x += 12 * k + 2) ctx.lineTo(x, h * l.base - l.amp * h * (0.5 + 0.5 * Math.sin(x * 0.018 / k + t * l.sp * 2.2 + i)) * (0.55 + 0.45 * Math.sin(x * 0.007 / k - t * l.sp * 1.1)));
          ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
        });
        for (const s of sp) {
          s.x += s.vx * dt + Math.sin(t * 3 + s.y * 0.02) * 8 * dt; s.y += s.vy * dt; s.life -= dt * 0.35;
          if (s.life <= 0 || s.y < 0) Object.assign(s, mk());
          ctx.fillStyle = `rgba(255,${150 + s.life * 80 | 0},60,${s.life})`; ctx.fillRect(s.x, s.y, s.r, s.r);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const volcano = (ctx) => {
    let w = 0, h = 0, k = 1, sp = [], sm = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); sp = []; sm = []; },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050207"], [0.6, "#1a0a14"], [1, "#3b1209"]]);
        const cx = w * 0.5, cy = h * 0.6;
        ctx.globalCompositeOperation = "lighter"; glowDot(ctx, cx, cy, Math.max(w, h) * 0.55, "255,90,30", 0.3 + 0.06 * Math.sin(t * 2)); ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#0a0405"; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.18, h * 0.86); ctx.lineTo(w * 0.4, h * 0.64); ctx.lineTo(w * 0.46, h * 0.6);
        ctx.lineTo(w * 0.54, h * 0.6); ctx.lineTo(w * 0.6, h * 0.64); ctx.lineTo(w * 0.82, h * 0.86); ctx.lineTo(w, h * 0.9); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        for (const [dx, ex] of [[-0.02, -0.2], [0.01, 0.06], [0.03, 0.22]]) {
          const g = ctx.createLinearGradient(cx, cy, cx + ex * w, h); g.addColorStop(0, "rgba(255,150,60,0.9)"); g.addColorStop(1, "rgba(255,60,20,0)");
          ctx.strokeStyle = g; ctx.lineWidth = (2 + Math.sin(t * 2 + dx * 40)) * k; ctx.beginPath(); ctx.moveTo(cx + dx * w, cy + 4 * k); ctx.quadraticCurveTo(cx + ex * 0.4 * w, h * 0.78, cx + ex * w, h); ctx.stroke();
        }
        if (Math.random() < dt * 30 && sp.length < 90) { const a = -Math.PI / 2 + rnd(-0.55, 0.55), v = rnd(130, 320) * k; sp.push({ x: cx + rnd(-10, 10) * k, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, r: rnd(1.8, 3.6) * k }); }
        for (let i = sp.length - 1; i >= 0; i--) {
          const s = sp[i]; s.vy += 280 * k * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt * 0.55;
          if (s.life <= 0 || s.y > h) { sp.splice(i, 1); continue; }
          ctx.fillStyle = `rgba(255,${120 + s.life * 100 | 0},50,${s.life})`; ctx.fillRect(s.x, s.y, s.r, s.r);
        }
        ctx.globalCompositeOperation = "source-over";
        if (Math.random() < dt * 1.3 && sm.length < 26) sm.push({ x: cx + rnd(-8, 8) * k, y: cy, r: rnd(18, 30) * k, vy: -rnd(14, 30) * k, vx: rnd(-4, 10) * k, life: 1 });
        for (let i = sm.length - 1; i >= 0; i--) {
          const s = sm[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.r *= 1 + 0.25 * dt; s.life -= 0.12 * dt;
          if (s.life <= 0) { sm.splice(i, 1); continue; }
          glowDot(ctx, s.x, s.y, s.r, "70,50,52", 0.3 * s.life);
        }
      },
    };
  };

  const hexgrid = (ctx) => {
    let w = 0, h = 0, k = 1, s = 20, cells = [];
    const hex = (x, y, r) => { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); };
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); s = Math.max(14, 30 * k); let tries = 0;
        do { cells = []; const dx = s * Math.sqrt(3), dy = s * 1.5; for (let r = -1; r * dy < h + s; r++) for (let c = -1; c * dx < w + s; c++) cells.push({ x: c * dx + (r & 1 ? dx / 2 : 0), y: r * dy, e: 0 }); if (cells.length > 900) s *= 1.2; } while (cells.length > 900 && tries++ < 6);
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#02060d"], [1, "#041322"]]);
        if (Math.random() < dt * 16) cells[(Math.random() * cells.length) | 0].e = 1;
        ctx.lineWidth = Math.max(1, k); ctx.strokeStyle = "rgba(60,170,200,0.17)"; ctx.beginPath(); for (const c of cells) hex(c.x, c.y, s * 0.94); ctx.stroke();
        ctx.fillStyle = "rgba(60,230,255,1)";
        for (const c of cells) {
          const wv = Math.max(0, Math.sin((c.x + c.y) * 0.011 / k - t * 1.1) - 0.86) / 0.14 * 0.3, a = Math.max(c.e, wv);
          if (a > 0.03) { ctx.globalAlpha = a * 0.5; ctx.beginPath(); hex(c.x, c.y, s * 0.9); ctx.fill(); }
          c.e *= Math.exp(-dt * 1.4);
        }
        ctx.globalAlpha = 1;
      },
    };
  };

  const crt = (ctx) => {
    let w = 0, h = 0, k = 1, lh = 14, lines = [], scroll = 0;
    const WORDS = ["MOV", "ADD", "SUB", "JMP", "CMP", "PUSH", "POP", "CALL", "RET", "LOAD", "STORE", "BUY", "SELL", "FILL", "BID", "ASK", "TICK", "VWAP", "ORDER", "RISK"];
    const hex = () => (Math.random() * 65535 | 0).toString(16).toUpperCase().padStart(4, "0");
    const mkLine = () => { let s = hex() + "  "; const n = 2 + (Math.random() * 4 | 0); for (let i = 0; i < n; i++) s += WORDS[(Math.random() * WORDS.length) | 0] + " " + hex() + "   "; return s; };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); lh = Math.max(11, 16 * k); lines = Array.from({ length: Math.ceil(h / lh) + 2 }, mkLine); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#010503"], [1, "#04100a"]]);
        scroll += 20 * k * dt; while (scroll >= lh) { scroll -= lh; lines.shift(); lines.push(mkLine()); }
        ctx.font = `${Math.max(9, 12 * k)}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`; ctx.textBaseline = "top";
        for (let i = 0; i < lines.length; i++) { const f = i / lines.length; ctx.fillStyle = `rgba(70,255,150,${0.16 + 0.28 * f})`; ctx.fillText(lines[i], 16 * k, i * lh - scroll); }
        if (Math.sin(t * 5) > 0) { ctx.fillStyle = "rgba(120,255,180,0.7)"; ctx.fillRect(16 * k, h - lh * 1.6, 8 * k, lh * 0.8); }
        const fl = 0.9 + 0.1 * Math.sin(t * 37) + (Math.random() < 0.02 ? 0.06 : 0);
        ctx.globalAlpha = fl; glowDot(ctx, w / 2, h / 2, Math.max(w, h) * 0.7, "40,255,140", 0.1); ctx.globalAlpha = 1;
        const y = ((t * 0.12) % 1.4 - 0.2) * h, bg = ctx.createLinearGradient(0, y - 70 * k, 0, y + 70 * k);
        bg.addColorStop(0, "rgba(120,255,180,0)"); bg.addColorStop(0.5, "rgba(120,255,180,0.09)"); bg.addColorStop(1, "rgba(120,255,180,0)");
        ctx.fillStyle = bg; ctx.fillRect(0, y - 70 * k, w, 140 * k);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; const step = Math.max(3, 3.2 * k), lw = Math.max(1, k); for (let yy = 0; yy < h; yy += step) ctx.fillRect(0, yy, w, lw);
        const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)");
        ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
      },
    };
  };

  const laser = (ctx) => {
    let w = 0, h = 0, k = 1, b = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); b = Array.from({ length: 8 }, (_, i) => ({ x: w * (0.08 + 0.84 * i / 7), s: rnd(0.25, 0.7), p: rnd(0, T2), a: rnd(0.35, 0.8), h: i * 45 })); },
      frame(t) {
        sky(ctx, w, h, [[0, "#04030c"], [1, "#0a0618"]]); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        const L = Math.hypot(w, h) * 1.1;
        for (const q of b) {
          const ang = Math.PI / 2 + Math.sin(t * q.s + q.p) * q.a, x1 = q.x + Math.cos(ang) * L, y1 = Math.sin(ang) * L, col = `${(q.h + t * 12) % 360},100%,60%`;
          glowDot(ctx, q.x, 0, 60 * k, "200,150,255", 0.25);
          ctx.strokeStyle = `hsla(${col},0.09)`; ctx.lineWidth = 8 * k; ctx.beginPath(); ctx.moveTo(q.x, 0); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.strokeStyle = `hsla(${col},0.9)`; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(q.x, 0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const nightdrive = (ctx) => {
    let w = 0, h = 0, k = 1, str = [], dots = [];
    const mk = (init) => { const dir = Math.random() < 0.5 ? 1 : -1, y = rnd(0.62, 0.96) * h, m = (y / h - 0.6) / 0.4; return { y, dir, m, v: dir * rnd(120, 400) * k * (0.4 + m * 1.4), len: rnd(70, 240) * k * (0.5 + m * 1.3), x: init ? rnd(-w * 0.1, w * 1.1) : (dir > 0 ? -150 * k : w + 150 * k), col: dir > 0 ? "255,70,60" : "255,244,220" }; };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); str = Array.from({ length: 44 }, () => mk(true)); dots = Array.from({ length: 34 }, () => ({ x: rnd(0, w), y: h * 0.6 - rnd(0, 18) * k, r: rnd(3, 11) * k, c: ["255,200,120", "120,200,255", "255,90,120"][(Math.random() * 3) | 0], p: rnd(0, T2) })); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#05050f"], [0.45, "#1c0f35"], [0.6, "#6a2a6e"], [0.6, "#0c0a12"], [1, "#050508"]]);
        ctx.globalCompositeOperation = "lighter";
        for (const d of dots) glowDot(ctx, d.x, d.y, d.r * 2.6, d.c, 0.4 + 0.2 * Math.sin(t * 1.5 + d.p));
        ctx.lineCap = "round";
        for (const s of str) {
          s.x += s.v * dt;
          if ((s.dir > 0 && s.x - s.len > w) || (s.dir < 0 && s.x + s.len < 0)) Object.assign(s, mk(false));
          const g = ctx.createLinearGradient(s.x - s.dir * s.len, 0, s.x, 0); g.addColorStop(0, `rgba(${s.col},0)`); g.addColorStop(1, `rgba(${s.col},1)`);
          ctx.strokeStyle = g; ctx.lineWidth = (1.6 + 4 * s.m) * k; ctx.beginPath(); ctx.moveTo(s.x - s.dir * s.len, s.y); ctx.lineTo(s.x, s.y); ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const towers = (ctx) => {
    let w = 0, h = 0, k = 1, bg = null, warm = [], cool = [];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); bg = offscreen(w, h); const g = bg.getContext("2d");
        sky(g, w, h, [[0, "#0b0b24"], [0.7, "#2a1450"], [1, "#6b2a63"]]); warm = []; cool = [];
        for (let layer = 0; layer < 3; layer++) {
          const fr = layer === 2, base = h, shade = ["#1a1540", "#120f30", "#07060f"][layer]; let x = -rnd(0, 20) * k;
          while (x < w) {
            const bw = rnd(36, 90) * k * (fr ? 1 : 0.8), bh = h * rnd(0.22, 0.5) * [0.8, 0.95, 1.15][layer] ;
            g.fillStyle = shade; g.fillRect(x, base - bh, bw, bh);
            if (fr) {
              const ws = Math.max(2, 4.5 * k), step = ws * 2.1;
              for (let yy = base - bh + step; yy < base - step; yy += step) for (let xx = x + step * 0.6; xx < x + bw - ws; xx += step) (Math.random() < 0.7 ? warm : cool).push({ x: xx, y: yy, s: ws, on: Math.random() < 0.3 });
            } else { g.fillStyle = "rgba(255,200,120,0.18)"; const ws = Math.max(1.5, 3 * k), step = ws * 2.6; for (let yy = base - bh + step; yy < base - step; yy += step) for (let xx = x + step; xx < x + bw - ws; xx += step) if (Math.random() < 0.18) g.fillRect(xx, yy, ws, ws); }
            x += bw + rnd(0, 6) * k;
          }
        }
      },
      frame(t, dt) {
        ctx.drawImage(bg, 0, 0, w, h);
        for (const list of [warm, cool]) { const n = Math.max(1, Math.round(dt * 7)); for (let i = 0; i < n; i++) { const q = list[(Math.random() * list.length) | 0]; if (q) q.on = !q.on; } }
        ctx.fillStyle = "rgba(255,214,120,0.9)"; ctx.beginPath(); for (const q of warm) if (q.on) ctx.rect(q.x, q.y, q.s, q.s); ctx.fill();
        ctx.fillStyle = "rgba(150,210,255,0.85)"; ctx.beginPath(); for (const q of cool) if (q.on) ctx.rect(q.x, q.y, q.s, q.s); ctx.fill();
      },
    };
  };

  const zenwaves = (ctx) => {
    let w = 0, h = 0, k = 1;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); },
      frame(t) {
        sky(ctx, w, h, [[0, "#0a1a2e"], [1, "#123f52"]]);
        ctx.globalCompositeOperation = "lighter"; glowDot(ctx, w * 0.78, h * 0.24, Math.min(w, h) * 0.5, "200,230,255", 0.22); ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(235,246,255,0.85)"; ctx.beginPath(); ctx.arc(w * 0.78, h * 0.24, Math.min(w, h) * 0.05, 0, T2); ctx.fill();
        for (let i = 0; i < 5; i++) {
          const base = 0.5 + i * 0.1, amp = (14 + i * 6) * k, f1 = 0.006 / k * (1 + i * 0.25), s = 0.25 + i * 0.07;
          ctx.fillStyle = `hsla(${185 + i * 16},55%,${26 + i * 7}%,${0.3 + i * 0.1})`; ctx.beginPath(); ctx.moveTo(0, h);
          for (let x = 0; x <= w + 14; x += 14) ctx.lineTo(x, h * base + Math.sin(x * f1 + t * s + i) * amp + Math.sin(x * f1 * 2.1 - t * s * 0.7) * amp * 0.5);
          ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
        }
      },
    };
  };

  const mist = (ctx) => {
    let w = 0, h = 0, k = 1, bl = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); const m = Math.min(w, h); bl = Array.from({ length: 14 }, () => ({ x: rnd(0, w), y: rnd(0, h), r: m * rnd(0.22, 0.5), vx: rnd(-9, 9) * k, vy: rnd(-3, 3) * k, c: ["90,170,200", "150,120,210", "80,190,170", "120,150,220"][(Math.random() * 4) | 0] })); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#070b14"], [1, "#0f1826"]]); ctx.globalCompositeOperation = "lighter";
        for (const b of bl) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r; if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r; glowDot(ctx, b.x, b.y, b.r, b.c, 0.17); }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const bubbles = (ctx) => {
    let w = 0, h = 0, k = 1, bb = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : h + 20 * k, r: rnd(4, 17) * k, vy: rnd(14, 46) * k, ph: rnd(0, T2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); bb = Array.from({ length: 55 }, () => mk(true)); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#04202c"], [0.55, "#06485a"], [1, "#021018"]]);
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 4; i++) {
          const x0 = w * (0.12 + i * 0.25) + Math.sin(t * 0.2 + i) * 30 * k, wd = 60 * k, g = ctx.createLinearGradient(0, 0, 0, h * 0.9);
          g.addColorStop(0, `rgba(170,240,255,${0.07 + 0.03 * Math.sin(t * 0.5 + i)})`); g.addColorStop(1, "rgba(170,240,255,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + wd, 0); ctx.lineTo(x0 + wd * 2.2 - 90 * k, h * 0.9); ctx.lineTo(x0 - 90 * k, h * 0.9); ctx.closePath(); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        for (const b of bb) {
          b.y -= b.vy * dt; b.x += Math.sin(t * 1.2 + b.ph) * 10 * k * dt; if (b.y < -b.r * 2) Object.assign(b, mk(false));
          ctx.fillStyle = "rgba(150,220,255,0.07)"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, T2); ctx.fill();
          ctx.strokeStyle = "rgba(190,240,255,0.38)"; ctx.lineWidth = Math.max(1, k); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(1, b.r * 0.2), 0, T2); ctx.fill();
        }
      },
    };
  };

  const leaves = (ctx) => {
    let w = 0, h = 0, k = 1, lv = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : -20 * k, vy: rnd(24, 60) * k, s: rnd(10, 22) * k, rot: rnd(0, T2), vr: rnd(-1.4, 1.4), ph: rnd(0, T2), hue: rnd(8, 42), l: rnd(38, 54) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); lv = Array.from({ length: 38 }, () => mk(true)); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#1a0f0a"], [0.6, "#3b1d0f"], [1, "#6b3414"]]);
        ctx.globalCompositeOperation = "lighter"; glowDot(ctx, w * 0.82, h * 0.7, Math.min(w, h) * 0.65, "255,170,70", 0.26); ctx.globalCompositeOperation = "source-over";
        for (const l of lv) {
          l.y += l.vy * dt; l.x += (Math.sin(t * 0.9 + l.ph) * 26 * k + 10 * k) * dt; l.rot += l.vr * dt;
          if (l.y > h + 20 * k || l.x > w + 30 * k) Object.assign(l, mk(false));
          ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.fillStyle = `hsla(${l.hue},80%,${l.l}%,0.85)`;
          ctx.beginPath(); ctx.ellipse(0, 0, l.s, l.s * 0.45, 0, 0, T2); ctx.fill();
          ctx.strokeStyle = "rgba(60,20,0,0.4)"; ctx.lineWidth = Math.max(0.5, 0.7 * k); ctx.beginPath(); ctx.moveTo(-l.s, 0); ctx.lineTo(l.s, 0); ctx.stroke(); ctx.restore();
        }
      },
    };
  };

  const jellyfish = (ctx) => {
    let w = 0, h = 0, k = 1, jf = [];
    const mk = (init) => ({ x: rnd(0.05, 0.95) * w, y: init ? rnd(0, h) : h + 90 * k, s: rnd(38, 80) * k, vy: rnd(5, 14) * k, ph: rnd(0, T2), hue: [300, 190, 265, 330][(Math.random() * 4) | 0] });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); jf = Array.from({ length: 6 }, () => mk(true)); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#020816"], [0.5, "#041a33"], [1, "#031126"]]); ctx.globalCompositeOperation = "lighter";
        for (const j of jf) {
          j.y -= j.vy * dt; j.x += Math.sin(t * 0.3 + j.ph) * 6 * k * dt; if (j.y < -140 * k) Object.assign(j, mk(false));
          const pulse = Math.sin(t * 1.6 + j.ph), bw = j.s * (1 + 0.12 * pulse), bh = j.s * (0.8 - 0.15 * pulse);
          ctx.strokeStyle = `hsla(${j.hue},90%,72%,0.3)`; ctx.lineWidth = Math.max(1, k);
          for (let i = 0; i < 6; i++) { ctx.beginPath(); const x0 = j.x + (i - 2.5) * bw * 0.3; ctx.moveTo(x0, j.y); for (let q = 1; q <= 6; q++) ctx.lineTo(x0 + Math.sin(t * 2 + j.ph + i + q * 0.6) * bw * 0.16 * (q / 6), j.y + q * j.s * 0.24); ctx.stroke(); }
          ctx.save(); ctx.translate(j.x, j.y); ctx.scale(1, bh / bw);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, bw); g.addColorStop(0, `hsla(${j.hue},90%,72%,0.55)`); g.addColorStop(0.7, `hsla(${j.hue},90%,60%,0.25)`); g.addColorStop(1, `hsla(${j.hue},90%,55%,0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, bw, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const mkSprite = (hue, size = 48, sat = 90, lig = 58) => {
    const c = offscreen(size, size), g = c.getContext("2d"), r = size / 2, gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, `hsla(${hue},${sat}%,${lig + 22}%,1)`); gr.addColorStop(0.3, `hsla(${hue},${sat}%,${lig}%,0.5)`); gr.addColorStop(1, `hsla(${hue},${sat}%,${lig}%,0)`);
    g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
  };

  const blackhole = (ctx) => {
    let w = 0, h = 0, k = 1, cx = 0, cy = 0, R = 0, st = [], P = [], sty = [];
    const TILT = -0.16, cT = Math.cos(TILT), sT = Math.sin(TILT);
    const COLS = ["255,248,230", "255,222,160", "255,180,90", "246,128,50", "210,84,32", "150,52,26"];
    const mk = () => { const r = 1.4 + Math.pow(Math.random(), 1.6) * 4.6; return { r, a: rnd(0, T2), w: 1.1 / Math.pow(r, 1.5), s: rnd(1.1, 2.6), ca: 1, sa: 0, ci: clampN(Math.floor((r - 1.4) / 4.6 * 6), 0, 5) }; };
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); cx = w * 0.5; cy = h * 0.5; R = Math.min(w, h) * 0.15;
        st = starsOf(w, h, 130, k); P = Array.from({ length: 2100 }, mk);
        sty = COLS.map((c) => [0.3, 0.55, 0.8, 1].map((a) => `rgba(${c},${a})`));
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#010104"], [1, "#07040e"]]); drawStars(ctx, st, t, 0.5);
        ctx.globalCompositeOperation = "lighter"; glowDot(ctx, cx, cy, R * 6.5, "255,130,50", 0.13);
        for (const p of P) { p.a += p.w * dt * 2.6; p.ca = Math.cos(p.a); p.sa = Math.sin(p.a); }
        const lvl = (p, dim) => Math.max(0, Math.min(3, Math.floor((0.3 + 0.7 * (0.5 - 0.5 * p.ca)) * 4) - dim));
        for (const p of P) {   // back of the disk, hidden where it passes behind the hole
          if (p.sa >= 0) continue;
          const dx = p.ca * p.r * R, dy = p.sa * p.r * R * 0.17, X = cx + dx * cT - dy * sT, Y = cy + dx * sT + dy * cT;
          if ((X - cx) * (X - cx) + (Y - cy) * (Y - cy) < R * R) continue;
          ctx.fillStyle = sty[p.ci][lvl(p, 0)]; ctx.fillRect(X, Y, p.s * k, p.s * k);
        }
        for (const p of P) {   // lensing: the far side of the disk bends over and under the hole as a bright ring
          if (p.r > 3.2) continue;
          const RR = R * (1.08 + (p.r - 1.4) * 0.06), top = p.sa < 0;
          ctx.fillStyle = sty[Math.min(2, p.ci)][lvl(p, top ? 0 : 1)];
          ctx.fillRect(cx + p.ca * RR, cy + p.sa * RR * (top ? 1 : 0.9), p.s * k, p.s * k);
        }
        ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(cx, cy, R * 0.99, 0, T2); ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        [[9, 0.06], [4.4, 0.18], [1.6, 0.85]].forEach(([lw, a]) => { ctx.strokeStyle = `rgba(255,228,190,${a})`; ctx.lineWidth = lw * k; ctx.beginPath(); ctx.arc(cx, cy, R * 1.03, 0, T2); ctx.stroke(); });
        for (const p of P) {   // near side passes in front
          if (p.sa < 0) continue;
          const dx = p.ca * p.r * R, dy = p.sa * p.r * R * 0.17;
          ctx.fillStyle = sty[p.ci][lvl(p, 0)]; ctx.fillRect(cx + dx * cT - dy * sT, cy + dx * sT + dy * cT, p.s * k, p.s * k);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const julia = (ctx) => {
    let w = 0, h = 0, sw = 0, sh = 0, off = null, og = null, img = null, px = null;
    // a dark, muted palette: deep indigo -> violet -> teal. The set itself stays near-black so candles read clearly.
    const PAL = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) { const u = i / 256; PAL[i * 3] = 255 * (0.34 + 0.34 * Math.cos(T2 * (u + 0.62))); PAL[i * 3 + 1] = 255 * (0.26 + 0.26 * Math.cos(T2 * (u + 0.80))); PAL[i * 3 + 2] = 255 * (0.5 + 0.42 * Math.cos(T2 * (u + 0.94))); }
    return {
      resize(W, H) { w = W; h = H; sw = clampN(Math.floor(w / 3), 96, 220); sh = Math.max(54, Math.round(sw * h / w)); off = offscreen(sw, sh); og = off.getContext("2d"); img = og.createImageData(sw, sh); px = new Uint32Array(img.data.buffer); },
      frame(t) {
        const a = t * 0.06, cr = -0.7269 + 0.028 * Math.cos(a), ci = 0.1889 + 0.028 * Math.sin(a * 1.3), span = 3.2 / (1 + 0.1 * Math.sin(t * 0.07)), asp = sh / sw;
        let i = 0;
        for (let y = 0; y < sh; y++) {
          const zy0 = (y / sh - 0.5) * span * asp;
          for (let x = 0; x < sw; x++) {
            let zx = (x / sw - 0.5) * span, zy = zy0, n = 0, m2 = 0;
            for (; n < 46; n++) { const x2 = zx * zx, y2 = zy * zy; m2 = x2 + y2; if (m2 > 256) break; zy = 2 * zx * zy + ci; zx = x2 - y2 + cr; }
            if (n >= 46) { px[i++] = 0xff0c0608; continue; }
            const mu = n + 1 - Math.log(0.5 * Math.log(m2)) / Math.LN2, idx = ((mu * 6 + t * 5) | 0) & 255, f = 0.06 + 0.5 * (1 - Math.exp(-mu / 9)), p3 = idx * 3;
            px[i++] = 0xff000000 | ((PAL[p3 + 2] * f) << 16) | ((PAL[p3 + 1] * f) << 8) | (PAL[p3] * f);
          }
        }
        og.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "low"; ctx.drawImage(off, 0, 0, w, h);
      },
    };
  };

  const inkflow = (ctx) => {
    let w = 0, h = 0, k = 1, P = [], bk = [];
    const NB = 12, COL = Array.from({ length: NB }, (_, i) => `hsla(${196 + i * 11},95%,62%,0.5)`);
    const ang = (x, y, t) => { const s = 0.0034 / k; return (Math.sin(x * s * 1.7 + t * 0.23) + Math.sin(y * s * 2.1 - t * 0.19) + Math.sin((x + y) * s * 1.2 + t * 0.11) + Math.sin(Math.hypot(x - w / 2, y - h / 2) * s * 1.5 - t * 0.2)) * 0.95; };
    const mk = (init) => ({ x: rnd(0, w), y: rnd(0, h), life: rnd(2, 7) * (init ? Math.random() : 1) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); P = Array.from({ length: 950 }, () => mk(true)); bk = Array.from({ length: NB }, () => []); ctx.fillStyle = "#04050c"; ctx.fillRect(0, 0, w, h); },
      frame(t, dt) {
        ctx.fillStyle = `rgba(4,5,12,${clampN(1 - Math.exp(-dt * 4.5), 0.03, 0.22)})`; ctx.fillRect(0, 0, w, h);
        for (const b of bk) b.length = 0;
        const sp = 75 * k * dt;
        for (const p of P) {
          const a = ang(p.x, p.y, t), nx = p.x + Math.cos(a) * sp, ny = p.y + Math.sin(a) * sp, c = clampN(Math.floor((0.5 + 0.5 * Math.sin(a * 0.8 + t * 0.12)) * NB), 0, NB - 1);
          bk[c].push(p.x, p.y, nx, ny); p.x = nx; p.y = ny; p.life -= dt;
          if (p.life <= 0 || nx < -10 || ny < -10 || nx > w + 10 || ny > h + 10) Object.assign(p, mk(false));
        }
        ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = 1.5 * k; ctx.lineCap = "round";
        bk.forEach((b, i) => { if (!b.length) return; ctx.strokeStyle = COL[i]; ctx.beginPath(); for (let j = 0; j < b.length; j += 4) { ctx.moveTo(b[j], b[j + 1]); ctx.lineTo(b[j + 2], b[j + 3]); } ctx.stroke(); });
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const kaleido = (ctx) => {
    let w = 0, h = 0, k = 1, B = [], spr = [];
    const N = 8, TR = 15;
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); spr = Array.from({ length: 8 }, (_, i) => mkSprite(i * 45 + 190, 56, 85, 55));
        B = Array.from({ length: 12 }, () => ({ rad: rnd(0.16, 0.68), sr: rnd(0.08, 0.3), sa: rnd(0.06, 0.24), p: rnd(0, T2), p2: rnd(0, T2), s: rnd(0.02, 0.05), h: rnd(0, 140) }));
      },
      frame(t) {
        ctx.fillStyle = "#04020c"; ctx.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2, M = Math.min(w, h), wedge = T2 / N;
        const at = (b, tt) => { const wa = (0.5 + 0.5 * Math.sin(tt * b.sa + b.p2)) * wedge, rad = M * b.rad * (0.62 + 0.38 * Math.sin(tt * b.sr + b.p)); return [Math.cos(wa) * rad, Math.sin(wa) * rad]; };
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round";
        for (let m = 0; m < N; m++) {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(m * wedge + t * 0.025); if (m & 1) ctx.scale(1, -1);
          for (const b of B) {
            ctx.strokeStyle = `hsla(${(b.h + 190 + t * 3) % 360},85%,62%,0.4)`; ctx.lineWidth = 2 * k; ctx.beginPath();
            for (let s = 0; s < TR; s++) { const [x, y] = at(b, t - s * 0.35); s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
            ctx.stroke();
            const [hx, hy] = at(b, t), sz = M * b.s; ctx.globalAlpha = 0.7; ctx.drawImage(spr[(((b.h + t * 3) / 45) | 0) & 7], hx - sz, hy - sz, sz * 2, sz * 2); ctx.globalAlpha = 1;
          }
          ctx.restore();
        }
        glowDot(ctx, cx, cy, M * 0.12, "180,200,255", 0.1); ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const oilslick = (ctx) => {
    let w = 0, h = 0, sw = 0, sh = 0, off = null, og = null, img = null, px = null, bl = [];
    return {
      resize(W, H) {
        w = W; h = H; sw = clampN(Math.floor(w / 4), 80, 176); sh = Math.max(45, Math.round(sw * h / w)); off = offscreen(sw, sh); og = off.getContext("2d"); img = og.createImageData(sw, sh); px = new Uint32Array(img.data.buffer);
        bl = Array.from({ length: 6 }, () => ({ fx: rnd(0.05, 0.16), fy: rnd(0.04, 0.14), px: rnd(0, T2), py: rnd(0, T2), r: rnd(0.1, 0.17) }));
      },
      frame(t) {
        const B = bl.map((b) => ({ x: (0.5 + 0.38 * Math.sin(t * b.fx + b.px)) * sw, y: (0.5 + 0.36 * Math.sin(t * b.fy + b.py)) * sh, r2: b.r * sh * b.r * sh }));
        let i = 0;
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
          let f = 0; for (let q = 0; q < B.length; q++) { const b = B[q], dx = x - b.x, dy = y - b.y; f += b.r2 / (dx * dx + dy * dy + 1); }
          let r, g, bb;
          if (f < 0.8) { const v = f / 0.8, e = v * v * v; r = 4 + e * 12; g = 6 + e * 18; bb = 14 + e * 42; }   // faint cool halo around the drops
          else {
            // a dark, glossy drop: near-black chrome inside, with a thin rainbow film only at the edge
            const u = Math.min(f - 0.8, 2.2), rim = Math.exp(-u * 5.5), band = 0.5 + 0.5 * Math.cos(u * 4.2 + t * 0.1), lum = 0.05 + 0.09 * band + 0.95 * rim, ph = u * 1.1 + t * 0.02;
            r = (0.35 + 0.35 * Math.cos(T2 * ph)) * lum * 255 + rim * 30; g = (0.35 + 0.35 * Math.cos(T2 * (ph + 0.33))) * lum * 255 + rim * 30; bb = (0.4 + 0.4 * Math.cos(T2 * (ph + 0.67))) * lum * 255 + rim * 34;
          }
          px[i++] = 0xff000000 | ((bb > 255 ? 255 : bb) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
        }
        og.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "low"; ctx.drawImage(off, 0, 0, w, h);
      },
    };
  };

  const tesseract = (ctx) => {
    let w = 0, h = 0, k = 1;
    const V = [], E = [];
    for (let i = 0; i < 16; i++) V.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
    for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) E.push([i, j]); }
    const rot = (a, b, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return [a * c - b * s, a * s + b * c]; };
    // project 4D -> 3D -> 2D with a far camera, then scale to a fixed size so the shape never flies off the screen
    const project = (t, target, cx, cy) => {
      const P = V.map((v) => {
        let [x, y, z, q] = v;
        [x, q] = rot(x, q, t * 0.2); [y, z] = rot(y, z, t * 0.15); [x, y] = rot(x, y, t * 0.07); [z, q] = rot(z, q, t * 0.11);
        const f4 = 1 / (4.4 - q); x *= f4; y *= f4; z *= f4; const f3 = 1 / (3.6 - z * 3);
        return { x: x * f3, y: y * f3, d: q };
      });
      const r = Math.max(...P.map((p) => Math.hypot(p.x, p.y))) || 1;
      return P.map((p) => ({ X: cx + (p.x / r) * target, Y: cy + (p.y / r) * target, d: p.d }));
    };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); },
      frame(t) {
        sky(ctx, w, h, [[0, "#04060f"], [1, "#0a0820"]]);
        const cx = w / 2, cy = h / 2, M = Math.min(w, h);
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        [[0.42, 0.9, 1.7, 0], [0.22, 0.32, 1.1, 2.3]].forEach(([sc, al, lw, ph]) => {
          const P = project(t + ph, M * sc, cx, cy);
          for (const [a, b] of E) {
            const A = P[a], Bp = P[b], hue = (205 + (A.d + Bp.d) * 30 + t * 4) % 360;
            ctx.strokeStyle = `hsla(${hue},90%,60%,${0.07 * al})`; ctx.lineWidth = lw * 6 * k; ctx.beginPath(); ctx.moveTo(A.X, A.Y); ctx.lineTo(Bp.X, Bp.Y); ctx.stroke();
            ctx.strokeStyle = `hsla(${hue},90%,70%,${al * 0.8})`; ctx.lineWidth = lw * k; ctx.beginPath(); ctx.moveTo(A.X, A.Y); ctx.lineTo(Bp.X, Bp.Y); ctx.stroke();
          }
          for (const p of P) glowDot(ctx, p.X, p.Y, (6 + p.d * 2) * k * (sc > 0.3 ? 1 : 0.65), "190,225,255", 0.5 * al);
        });
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const helix = (ctx) => {
    let w = 0, h = 0, k = 1;
    const LAYERS = [{ y: 0.3, A: 0.06, L: 0.62, sp: 0.5, a: 0.28, lw: 3.4, rung: 5 }, { y: 0.55, A: 0.1, L: 0.46, sp: 0.8, a: 0.55, lw: 2.2, rung: 4 }, { y: 0.78, A: 0.15, L: 0.34, sp: 1.15, a: 0.95, lw: 1.7, rung: 3 }];
    const BASE = ["#33d6ff", "#ff4fb8", "#ffc14a", "#6dff9c"];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); },
      frame(t) {
        sky(ctx, w, h, [[0, "#04101c"], [1, "#071a2a"]]);
        ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        LAYERS.forEach((L, li) => {
          const cy = h * L.y, A = h * L.A, Lw = w * L.L, step = Math.max(5, 7 * k), al = L.a;
          for (let strand = 0; strand < 2; strand++) {
            const sg = strand ? -1 : 1;
            for (let x = 0; x < w; x += step) {
              const ph1 = (x / Lw) * T2 + t * L.sp, ph2 = ph1 + step / Lw * T2, y1 = cy + Math.sin(ph1) * A * sg, y2 = cy + Math.sin(ph2) * A * sg, z = Math.cos(ph1) * sg;
              const depth = 0.4 + 0.6 * (0.5 + 0.5 * z);
              ctx.strokeStyle = strand ? `rgba(255,90,190,${al * depth})` : `rgba(60,210,255,${al * depth})`; ctx.lineWidth = L.lw * k * (0.6 + 0.6 * depth);
              ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + step, y2); ctx.stroke();
            }
          }
          let n = 0;
          for (let x = 0; x < w; x += step * L.rung, n++) {
            const ph = (x / Lw) * T2 + t * L.sp, ya = cy + Math.sin(ph) * A, yb = cy - Math.sin(ph) * A, z = Math.cos(ph), depth = 0.35 + 0.65 * (0.5 + 0.5 * Math.abs(z));
            ctx.strokeStyle = `rgba(180,225,255,${al * 0.32 * depth})`; ctx.lineWidth = Math.max(1, k * (0.8 + li * 0.4)); ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x, yb); ctx.stroke();
            glowDot(ctx, x, ya, (3.5 + li * 2) * k * (0.7 + 0.5 * (0.5 + 0.5 * z)), n % 2 ? "255,120,200" : "70,220,255", al * 0.75);
            glowDot(ctx, x, yb, (3.5 + li * 2) * k * (0.7 + 0.5 * (0.5 - 0.5 * z)), n % 2 ? "255,200,90" : "110,255,160", al * 0.75);
          }
        });
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const synapse = (ctx) => {
    let w = 0, h = 0, k = 1, N = [], pulses = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); N = Array.from({ length: Math.round(clampN(w * h / 7500, 36, 78)) }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-14, 14) * k, vy: rnd(-14, 14) * k, p: rnd(0, T2) })); pulses = []; },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050912"], [1, "#0a1020"]]);
        const D = Math.min(w, h) * 0.26, D2 = D * D, ed = [];
        for (const n of N) { n.x += n.vx * dt; n.y += n.vy * dt; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; }
        ctx.globalCompositeOperation = "lighter"; ctx.lineWidth = Math.max(1, k);
        for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
          const dx = N[i].x - N[j].x, dy = N[i].y - N[j].y, d2 = dx * dx + dy * dy;
          if (d2 < D2) { const a = 1 - d2 / D2; ed.push([i, j]); ctx.strokeStyle = `rgba(90,170,255,${a * 0.38})`; ctx.beginPath(); ctx.moveTo(N[i].x, N[i].y); ctx.lineTo(N[j].x, N[j].y); ctx.stroke(); }
        }
        if (ed.length && Math.random() < dt * 5 && pulses.length < 34) { const e = ed[(Math.random() * ed.length) | 0], f = Math.random() < 0.5; pulses.push({ a: f ? e[0] : e[1], b: f ? e[1] : e[0], u: 0, s: rnd(0.8, 1.6), hue: Math.random() < 0.6 ? "255,90,200" : "255,200,90" }); }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i]; p.u += dt * p.s;
          if (p.u >= 1) { // arrive: fire onward along another nearby edge, or stop
            const nx = ed.filter((e) => e[0] === p.b || e[1] === p.b);
            if (nx.length && Math.random() < 0.8 && pulses.length < 40) { const e = nx[(Math.random() * nx.length) | 0]; pulses[i] = { a: p.b, b: e[0] === p.b ? e[1] : e[0], u: 0, s: p.s, hue: p.hue }; } else pulses.splice(i, 1);
            continue;
          }
          const A = N[p.a], B = N[p.b], x = A.x + (B.x - A.x) * p.u, y = A.y + (B.y - A.y) * p.u;
          glowDot(ctx, x, y, 11 * k, p.hue, 0.9);
        }
        for (const n of N) glowDot(ctx, n.x, n.y, (5 + 1.6 * Math.sin(t * 1.4 + n.p)) * k, "150,210,255", 0.75);
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  // Nebula: real gas clouds. The clouds are painted once into two small textures (seeded noise, so every preview
  // matches) and then only drift, turn and breathe — each frame is a few image draws plus stars, so it stays light.
  let nebTex = null;
  const nebTextures = () => {
    if (nebTex) return nebTex;
    const W = 384, H = 216, P = new Uint8Array(512);
    let seed = 1337; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 256; i++) P[i] = i;
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const x = P[i]; P[i] = P[j]; P[j] = x; }
    for (let i = 0; i < 256; i++) P[i + 256] = P[i];
    const fade = (u) => u * u * (3 - 2 * u);
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      const a = P[P[X] + Y], b = P[P[X + 1] + Y], c = P[P[X] + Y + 1], d = P[P[X + 1] + Y + 1], u = fade(xf), v = fade(yf);
      return ((a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v) / 255; };
    const fbm = (x, y, o) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); };
    const mk = (fn) => { const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data;
      for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) { const [R, G, B, A] = fn(x / H, y / H, x / W, y / H); d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = A; }
      g.putImageData(im, 0, 0); return c; };
    const cl = (v) => Math.max(0, Math.min(1, v));
    // soft wide dust: deep blue into violet, with dark lanes
    const dust = mk((x, y, u) => {
      const q = fbm(x * 2.2 + 3.1, y * 2.2, 4), n = fbm(x * 1.6 + q * 1.8, y * 1.6 - q * 1.2, 5);
      const lane = cl((fbm(x * 3.4 - 7, y * 3.4 + q, 4) - 0.42) * 3.2);
      const m = cl((n - 0.36) * 2.1) * (1 - lane * 0.85), hue = cl(u * 0.8 + q * 0.5 - 0.2);
      return [30 + 110 * hue, 40 + 30 * (1 - hue), 120 + 90 * (1 - hue * 0.4), 235 * m * m]; });
    // bright filaments: magenta into a hot pink-orange heart, teal at the edges
    const glow = mk((x, y, u, v) => {
      const q = fbm(x * 2.8 - 5, y * 2.8 + 2, 4), n = fbm(x * 2.4 + q * 2.4, y * 2.4 + q * 1.6, 5);
      const fil = Math.pow(1 - Math.abs(n * 2 - 1), 4), dx = u - 0.55, dy = v - 0.5, core = cl(1 - Math.sqrt(dx * dx * 2.2 + dy * dy * 3.2) * 1.5);
      const m = cl(fil * (0.35 + core * 1.1)), hot = cl(core * 1.3 + fil * 0.2 - 0.25), edge = cl(q * 1.4 - 0.75);
      return [cl(0.55 + hot * 0.45 - edge * 0.5) * 255, cl(0.12 + hot * 0.5 + edge * 0.55) * 255, cl(0.62 - hot * 0.35 + edge * 0.2) * 255, 255 * m]; });
    return (nebTex = { dust, glow });
  };
  const nebulaCore = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], big = [];
    const draw = (img, t, sp, rot, sc, ox, oy, a) => {
      const S = Math.max(w / img.width, h / img.height) * sc;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(w / 2 + Math.sin(t * sp) * w * ox, h / 2 + Math.cos(t * sp * 0.8) * h * oy);
      ctx.rotate(Math.sin(t * sp * 0.6) * rot); ctx.drawImage(img, -img.width * S / 2, -img.height * S / 2, img.width * S, img.height * S); ctx.restore();
    };
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); nebTextures();
        st = starsOf(w, h, 220, k);
        big = Array.from({ length: 7 }, () => ({ x: rnd(0.08, 0.92) * w, y: rnd(0.1, 0.9) * h, r: rnd(2.5, 5) * k, p: rnd(0, T2), c: Math.random() < 0.5 ? "190,220,255" : "255,215,235" }));
      },
      frame(t) {
        sky(ctx, w, h, [[0, "#03020a"], [1, "#07041a"]]);
        drawStars(ctx, st, t, 0.55);
        const T = nebTextures(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "low";   // soft glow textures: "high" costs a lot (most of the frame without a GPU) and looks the same
        ctx.globalCompositeOperation = "lighter";
        // kept a little below full strength so price-scale numbers and candles stay readable on top
        draw(T.dust, t, 0.03, 0.05, 1.3, 0.03, 0.03, 0.68);
        draw(T.glow, t + 40, 0.022, -0.06, 1.22 + Math.sin(t * 0.05) * 0.03, 0.025, 0.02, 0.5 + 0.1 * Math.sin(t * 0.21));
        draw(T.glow, t + 90, 0.017, 0.08, 1.55, 0.04, 0.03, 0.18);   // a second, softer pass gives the gas depth
        for (const b of big) {
          const tw = 0.75 + 0.25 * Math.sin(t * 0.9 + b.p), L = b.r * 7 * tw;
          glowDot(ctx, b.x, b.y, b.r * 5, b.c, 0.5 * tw);
          ctx.strokeStyle = `rgba(${b.c},${0.35 * tw})`; ctx.lineWidth = Math.max(1, k * 0.8);
          ctx.beginPath(); ctx.moveTo(b.x - L, b.y); ctx.lineTo(b.x + L, b.y); ctx.moveTo(b.x, b.y - L); ctx.lineTo(b.x, b.y + L); ctx.stroke();
          ctx.fillStyle = "#fff"; ctx.fillRect(b.x - k, b.y - k, 2 * k, 2 * k);
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };


  // ===================== Seasonal drops =====================
  // Featured in their month by the panel (Christmas in December, Halloween in October), available all year under
  // Seasonal. Calm like the rest: slow snow, softly twinkling lights, a moon and drifting mist.

  // Christmas Eve: a deep blue night, snow falling in two depths, a string of warm lights in soft swags, snowy pines.
  const christmas = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], flakes = [], lights = [], pines = null, bokeh = [];
    const LC = ["255,92,92", "96,224,150", "255,206,112", "255,242,220", "130,185,255"];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 70, k, 0.55);
        const n = Math.round(90 + 110 * Math.min(2, (w * h) / (1280 * 720)));
        flakes = Array.from({ length: n }, () => { const z = Math.random(); return { x: rnd(0, w), y: rnd(0, h), z, r: (0.6 + z * 1.9) * k, s: (9 + z * 26) * k, p: rnd(0, T2) }; });
        // a few big, soft out-of-focus lights drifting very slowly (like looking through a window)
        bokeh = Array.from({ length: 9 }, (_, i) => ({ x: rnd(0, w), y: rnd(h * 0.2, h * 0.75), r: rnd(40, 90) * k, c: LC[i % LC.length], p: rnd(0, T2), s: rnd(2, 5) * k }));
        // two soft swags of lights hanging across the top
        lights = []; const m = Math.max(16, Math.round(w / (64 * k)));
        for (let i = 0; i <= m; i++) { const u = i / m, f = (u * 2) % 1; lights.push({ x: u * w, y: h * 0.055 + h * 0.07 * Math.sin(Math.PI * f), c: LC[i % LC.length], p: rnd(0, T2) }); }
        // pines: drawn once (they don't move), with snow on their branches
        pines = offscreen(w, h); const g = pines.getContext("2d");
        const tree = (x, ht, col, snow) => {
          const base = h * 1.01, tiers = 4;
          for (let i = 0; i < tiers; i++) {
            const top = base - ht * (0.32 + i * 0.22), bot = base - ht * (i * 0.2), half = ht * (0.3 - i * 0.055);
            g.fillStyle = col; g.beginPath(); g.moveTo(x, top); g.lineTo(x + half, bot); g.lineTo(x - half, bot); g.closePath(); g.fill();
            g.fillStyle = snow; g.beginPath(); g.moveTo(x, top); g.lineTo(x + half * 0.42, top + (bot - top) * 0.42); g.quadraticCurveTo(x, top + (bot - top) * 0.32, x - half * 0.42, top + (bot - top) * 0.42); g.closePath(); g.fill();
          }
        };
        const row = (n, hMin, hMax, col, snow) => { for (let i = 0; i < n; i++) tree((i + 0.5 + rnd(-0.3, 0.3)) * (w / n), h * rnd(hMin, hMax), col, snow); };
        row(Math.max(6, Math.round(w / (120 * k))), 0.16, 0.26, "#0b1532", "rgba(200,220,255,0.18)");
        row(Math.max(4, Math.round(w / (210 * k))), 0.22, 0.36, "#060b1d", "rgba(225,238,255,0.32)");
        const gr = g.createLinearGradient(0, h * 0.9, 0, h); gr.addColorStop(0, "rgba(210,226,255,0)"); gr.addColorStop(1, "rgba(210,226,255,0.16)");
        g.fillStyle = gr; g.fillRect(0, h * 0.9, w, h * 0.1);                       // snow on the ground
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050a1d"], [0.6, "#0b1636"], [1, "#16244f"]]);
        drawStars(ctx, st, t, 0.42);
        glowDot(ctx, w * 0.5, h * 1.08, h * 0.75, "255,170,95", 0.11);              // a warm glow from the village below
        ctx.globalCompositeOperation = "lighter";
        for (const b of bokeh) { b.x += b.s * dt; if (b.x > w + b.r) b.x = -b.r; glowDot(ctx, b.x, b.y + Math.sin(t * 0.2 + b.p) * 8 * k, b.r, b.c, 0.07 + 0.03 * Math.sin(t * 0.4 + b.p)); }
        ctx.globalCompositeOperation = "source-over";
        for (const f of flakes) if (f.z < 0.5) drawFlake(f, t, dt);                  // far snow behind the trees
        ctx.drawImage(pines, 0, 0);
        // the wire, then the bulbs (each twinkles slowly on its own)
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = Math.max(1, 1.4 * k); ctx.beginPath();
        lights.forEach((l, i) => (i ? ctx.lineTo(l.x, l.y) : ctx.moveTo(l.x, l.y))); ctx.stroke();
        ctx.globalCompositeOperation = "lighter";
        for (const l of lights) { const tw = 0.62 + 0.38 * Math.sin(t * 0.9 + l.p); glowDot(ctx, l.x, l.y + 3 * k, 24 * k, l.c, 0.55 * tw); }
        ctx.globalCompositeOperation = "source-over";
        for (const l of lights) { ctx.fillStyle = `rgba(${l.c},0.95)`; ctx.beginPath(); ctx.ellipse(l.x, l.y + 3 * k, 2.4 * k, 3.4 * k, 0, 0, T2); ctx.fill(); }
        for (const f of flakes) if (f.z >= 0.5) drawFlake(f, t, dt);                 // near snow in front
      },
    };
    function drawFlake(f, t, dt) {
      f.y += f.s * dt; f.x += Math.sin(t * 0.5 + f.p) * (4 + f.z * 8) * k * dt;
      if (f.y > h + 4) { f.y = -4; f.x = rnd(0, w); } if (f.x < -4) f.x = w + 4; else if (f.x > w + 4) f.x = -4;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + f.z * 0.55})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, T2); ctx.fill();
    }
  };

  // Hallows Night: a big harvest moon in a violet sky, mist drifting low, jack-o'-lanterns glowing softly, a bare tree
  // and a few bats gliding slowly past.
  const hallows = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], bats = [], mist = [], lamps = [], land = null, mx = 0, my = 0, R = 0;
    const newBat = (init) => ({ x: init ? rnd(0, w) : -40 * k, y: h * rnd(0.12, 0.5), s: rnd(26, 46) * k, p: rnd(0, T2), z: rnd(0.6, 1.2), wait: init ? 0 : rnd(2, 9) });
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 90, k, 0.6);
        mx = w * 0.72; my = h * 0.27; R = Math.min(w, h) * 0.13;
        bats = Array.from({ length: 3 }, () => newBat(true));
        mist = Array.from({ length: 7 }, (_, i) => ({ x: rnd(0, w), y: h * rnd(0.72, 0.92), r: Math.max(w, h) * rnd(0.18, 0.32), s: rnd(6, 14) * k * (i % 2 ? 1 : -1) }));
        lamps = [[0.14, 1], [0.235, 0.78], [0.84, 0.9]].map(([u, z], i) => ({ x: w * u, y: h * 0.935, r: 26 * k * z, p: i * 2.1 }));
        // hills + a bare tree, drawn once
        land = offscreen(w, h); const g = land.getContext("2d");
        g.fillStyle = "#07030c"; g.beginPath(); g.moveTo(0, h);
        for (let x = 0; x <= w; x += 8 * k) g.lineTo(x, h * 0.86 - Math.sin(x / w * 5.2 + 0.6) * h * 0.035 - Math.sin(x / w * 13) * h * 0.012);
        g.lineTo(w, h); g.closePath(); g.fill();
        g.strokeStyle = "#07030c"; g.lineCap = "round";
        const branch = (x, y, len, ang, wd, depth) => {
          if (depth === 0 || len < 3 * k) return;
          const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
          g.lineWidth = wd; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
          branch(x2, y2, len * 0.72, ang - rnd(0.25, 0.6), wd * 0.68, depth - 1);
          branch(x2, y2, len * 0.66, ang + rnd(0.2, 0.55), wd * 0.66, depth - 1);
        };
        branch(w * 0.06, h * 0.88, h * 0.2, -Math.PI / 2 + 0.08, 9 * k, 7);
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#0a0416"], [0.55, "#1b0b2c"], [1, "#2b1124"]]);
        drawStars(ctx, st, t, 0.5);
        // the moon: a warm glow, then the disc with a few soft craters
        glowDot(ctx, mx, my, R * 3.4, "255,168,82", 0.2);
        const mg = ctx.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.1, mx, my, R);
        mg.addColorStop(0, "#ffe2b0"); mg.addColorStop(1, "#eea04a"); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, R, 0, T2); ctx.fill();
        for (const [a, b, c] of [[-0.28, -0.12, 0.22], [0.24, 0.22, 0.16], [0.02, 0.45, 0.1], [0.4, -0.3, 0.1]]) glowDot(ctx, mx + a * R, my + b * R, c * R, "170,92,40", 0.14);   // soft craters
        // bats glide slowly across, one at a time now and then
        ctx.fillStyle = "#0c0612";
        for (let i = 0; i < bats.length; i++) {
          const b = bats[i];
          if (b.wait > 0) { b.wait -= dt; continue; }
          b.x += b.s * dt; const y = b.y + Math.sin(t * 0.9 + b.p) * 10 * k, f = Math.sin(t * 6 + b.p), S = 15 * k * b.z;
          ctx.beginPath(); ctx.moveTo(b.x - S * 1.6, y - S * f * 0.7); ctx.quadraticCurveTo(b.x - S * 0.7, y + S * 0.15, b.x, y);
          ctx.quadraticCurveTo(b.x + S * 0.7, y + S * 0.15, b.x + S * 1.6, y - S * f * 0.7); ctx.quadraticCurveTo(b.x + S * 0.6, y - S * 0.1, b.x, y + S * 0.35);
          ctx.quadraticCurveTo(b.x - S * 0.6, y - S * 0.1, b.x - S * 1.6, y - S * f * 0.7); ctx.fill();
          if (b.x > w + 40 * k) bats[i] = newBat(false);
        }
        // low mist drifting
        for (const m of mist) { m.x += m.s * dt; if (m.x > w + m.r) m.x = -m.r; else if (m.x < -m.r) m.x = w + m.r; glowDot(ctx, m.x, m.y, m.r, "150,118,190", 0.07); }
        ctx.drawImage(land, 0, 0);
        // jack-o'-lanterns: a gentle candle flicker
        for (const l of lamps) {
          const fl = 0.78 + 0.22 * Math.sin(t * 2.3 + l.p) * Math.sin(t * 1.3 + l.p * 1.7);
          glowDot(ctx, l.x, l.y - l.r * 0.2, l.r * 3, "255,140,40", 0.22 * fl);
          const pg = ctx.createRadialGradient(l.x, l.y - l.r * 0.5, l.r * 0.1, l.x, l.y - l.r * 0.45, l.r);   // a pumpkin lit from inside
          pg.addColorStop(0, `rgba(${(200 + 40 * fl) | 0},96,24,1)`); pg.addColorStop(1, "#5a2408");
          ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(l.x, l.y - l.r * 0.45, l.r, l.r * 0.78, 0, 0, T2); ctx.fill();
          ctx.strokeStyle = "rgba(60,22,4,0.55)"; ctx.lineWidth = Math.max(1, l.r * 0.05);
          for (const q of [-0.45, 0.45]) { ctx.beginPath(); ctx.ellipse(l.x + q * l.r * 0.55, l.y - l.r * 0.45, l.r * 0.32, l.r * 0.76, 0, 0, T2); ctx.stroke(); }   // ribs
          ctx.fillStyle = "#0d0603"; ctx.fillRect(l.x - l.r * 0.08, l.y - l.r * 1.38, l.r * 0.16, l.r * 0.3);
          ctx.fillStyle = `rgba(255,${(214 + 30 * fl) | 0},${(120 + 60 * fl) | 0},${0.95 * fl})`;   // the carved face, bright from the candle
          const e = l.r * 0.2, cy = l.y - l.r * 0.62;
          for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(l.x + sx * l.r * 0.42, cy + e); ctx.lineTo(l.x + sx * l.r * 0.2, cy + e); ctx.lineTo(l.x + sx * l.r * 0.31, cy - e * 0.7); ctx.closePath(); ctx.fill(); }
          ctx.beginPath(); ctx.moveTo(l.x - l.r * 0.5, l.y - l.r * 0.32); ctx.quadraticCurveTo(l.x, l.y - l.r * 0.02, l.x + l.r * 0.5, l.y - l.r * 0.32); ctx.quadraticCurveTo(l.x, l.y - l.r * 0.18, l.x - l.r * 0.5, l.y - l.r * 0.32); ctx.fill();
        }
      },
    };
  };

  // A soft, flat-ish disc with a slightly brighter rim: how a light looks when it's out of focus (camera bokeh).
  const bokehDisc = (ctx, x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a * 0.6})`); g.addColorStop(0.62, `rgba(${rgb},${a * 0.52})`);
    g.addColorStop(0.86, `rgba(${rgb},${a * 0.62})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const snowOf = (w, h, k, n) => Array.from({ length: n }, () => { const z = Math.random(); return { x: rnd(0, w), y: rnd(0, h), z, r: (0.6 + z * 1.8) * k, s: (8 + z * 24) * k, p: rnd(0, T2) }; });
  function drawSnow(ctx, flakes, w, h, k, t, dt, front) {
    for (const f of flakes) {
      if (front !== undefined && (f.z >= 0.5) !== front) continue;
      f.y += f.s * dt; f.x += Math.sin(t * 0.5 + f.p) * (4 + f.z * 8) * k * dt;
      if (f.y > h + 4) { f.y = -4; f.x = rnd(0, w); } if (f.x < -4) f.x = w + 4; else if (f.x > w + 4) f.x = -4;
      ctx.fillStyle = `rgba(255,255,255,${0.32 + f.z * 0.55})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, T2); ctx.fill();
    }
  }

  // Tree Lights: Christmas-tree lights out of focus, glowing softly in the dark, with a few sharp twinkles.
  const treeLights = (ctx) => {
    let w = 0, h = 0, k = 1, orbs = [], sparks = [];
    const C = ["255,196,92", "255,96,88", "112,226,150", "255,236,206", "255,150,70", "120,170,255"];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h);
        const n = Math.round(26 + 18 * Math.min(2, (w * h) / (1280 * 720)));
        orbs = Array.from({ length: n }, (_, i) => ({ x: rnd(-0.05, 1.05) * w, y: rnd(-0.05, 1.05) * h, r: rnd(28, 92) * k, c: C[i % C.length], p: rnd(0, T2), vx: rnd(-3, 3) * k, vy: rnd(-4, -1) * k }));
        sparks = Array.from({ length: 40 }, () => ({ x: rnd(0, w), y: rnd(0, h), p: rnd(0, T2), s: rnd(0.4, 1) }));
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050906"], [0.6, "#08110c"], [1, "#100b06"]]);
        ctx.globalCompositeOperation = "lighter";
        for (const o of orbs) {
          o.x += o.vx * dt; o.y += o.vy * dt;
          if (o.y < -o.r) { o.y = h + o.r; o.x = rnd(0, w); } if (o.x < -o.r) o.x = w + o.r; else if (o.x > w + o.r) o.x = -o.r;
          bokehDisc(ctx, o.x, o.y, o.r * (0.96 + 0.04 * Math.sin(t * 0.5 + o.p)), o.c, 0.26 + 0.08 * Math.sin(t * 0.6 + o.p));
        }
        for (const s of sparks) { const a = Math.max(0, Math.sin(t * s.s + s.p)) ** 6; if (a > 0.02) glowDot(ctx, s.x, s.y, 6 * k, "255,240,210", 0.8 * a); }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  // Winter Village: snowy rooftops at night, warm windows, chimney smoke drifting up, snow and a crescent moon.
  const winterVillage = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], flakes = [], town = null, glow = null, moon = null, windows = [], chimneys = [], puffs = [];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 80, k, 0.5); flakes = snowOf(w, h, k, Math.round(80 + 80 * Math.min(2, (w * h) / (1280 * 720))));
        windows = []; chimneys = []; puffs = [];
        town = offscreen(w, h); const g = town.getContext("2d");
        const row = (baseY, hMin, hMax, col, roofSnow, lit) => {
          let x = -20 * k;
          while (x < w + 20 * k) {
            const bw = rnd(70, 130) * k, bh = rnd(hMin, hMax) * h, top = baseY - bh, roof = bw * rnd(0.35, 0.5);
            g.fillStyle = col; g.fillRect(x, top, bw, bh + h);
            g.beginPath(); g.moveTo(x - 6 * k, top); g.lineTo(x + bw / 2, top - roof); g.lineTo(x + bw + 6 * k, top); g.closePath(); g.fill();
            g.fillStyle = roofSnow; g.beginPath(); g.moveTo(x - 6 * k, top); g.lineTo(x + bw / 2, top - roof); g.lineTo(x + bw + 6 * k, top);
            g.lineTo(x + bw + 2 * k, top + 4 * k); g.lineTo(x + bw / 2, top - roof + 6 * k); g.lineTo(x - 2 * k, top + 4 * k); g.closePath(); g.fill();
            if (lit) {
              if (Math.random() < 0.6) { const cx = x + bw * rnd(0.6, 0.8), cy = top - roof * 0.45; g.fillStyle = col; g.fillRect(cx, cy - 16 * k, 10 * k, 20 * k); chimneys.push({ x: cx + 5 * k, y: cy - 16 * k }); }
              const cols = Math.max(1, Math.floor(bw / (34 * k))), rows = Math.max(1, Math.floor(bh / (38 * k)));
              for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (Math.random() < 0.55)
                windows.push({ x: x + (i + 0.5) * (bw / cols) - 6 * k, y: top + 16 * k + j * 36 * k, w: 12 * k, h: 15 * k, p: rnd(0, T2), c: Math.random() < 0.8 ? "255,196,110" : "255,150,90" });
            }
            x += bw + rnd(4, 18) * k;
          }
        };
        row(h * 0.82, 0.12, 0.2, "#152044", "rgba(200,218,250,0.3)", false);
        row(h * 0.97, 0.13, 0.24, "#070b1a", "rgba(230,240,255,0.55)", true);
        const gr = g.createLinearGradient(0, h * 0.94, 0, h); gr.addColorStop(0, "rgba(220,232,255,0)"); gr.addColorStop(1, "rgba(220,232,255,0.22)"); g.fillStyle = gr; g.fillRect(0, h * 0.94, w, h * 0.06);
        for (const c of chimneys) for (let i = 0; i < 4; i++) puffs.push({ c, a: i / 4 });
        // the windows' warm glow is drawn once; each frame it's added on top (cheap), with one slow shared breathing
        // a crescent moon: a disc with a second disc cut out of it (drawn once)
        const R = Math.min(w, h) * 0.06; moon = offscreen(R * 2 + 4, R * 2 + 4); const mg = moon.getContext("2d");
        mg.fillStyle = "#eef2ff"; mg.beginPath(); mg.arc(R + 2, R + 2, R, 0, T2); mg.fill();
        mg.globalCompositeOperation = "destination-out"; mg.beginPath(); mg.arc(R + 2 + R * 0.42, R + 2 - R * 0.18, R * 0.92, 0, T2); mg.fill();
        glow = offscreen(w, h); const gg = glow.getContext("2d");
        for (const o of windows) glowDot(gg, o.x + o.w / 2, o.y + o.h / 2, o.w * 2.2, o.c, 0.2);
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#040818"], [0.65, "#0b1533"], [1, "#16224a"]]);
        drawStars(ctx, st, t, 0.45);
        // crescent moon: a soft disc with a sky-coloured disc cut out of it
        const mx = w * 0.18, my = h * 0.2, R = Math.min(w, h) * 0.06;
        glowDot(ctx, mx, my, R * 4, "200,215,255", 0.14);
        ctx.drawImage(moon, mx - moon.width / 2, my - moon.height / 2);
        drawSnow(ctx, flakes, w, h, k, t, dt, false);
        // chimney smoke: soft puffs rising and fading
        for (const p of puffs) { p.a += dt * 0.08; if (p.a > 1) p.a -= 1;
          glowDot(ctx, p.c.x + Math.sin(t * 0.4 + p.a * 6) * 8 * k + p.a * 26 * k, p.c.y - p.a * 70 * k, (6 + p.a * 18) * k, "170,180,205", 0.14 * (1 - p.a)); }
        ctx.drawImage(town, 0, 0);
        // warm windows, each with a soft glow and a gentle flicker
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.5);
        ctx.drawImage(glow, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        for (const o of windows) { const f = 0.85 + 0.15 * Math.sin(t * 0.7 + o.p); ctx.fillStyle = `rgba(${o.c},${0.85 * f})`; ctx.fillRect(o.x, o.y, o.w, o.h);
          ctx.fillStyle = "rgba(20,14,10,0.55)"; ctx.fillRect(o.x + o.w / 2 - 0.6 * k, o.y, 1.2 * k, o.h); ctx.fillRect(o.x, o.y + o.h / 2 - 0.6 * k, o.w, 1.2 * k); }
        drawSnow(ctx, flakes, w, h, k, t, dt, true);
      },
    };
  };

  // Northern Noel: northern lights rippling over snowy hills, pines and a small cabin with a warm window.
  const northernNoel = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], flakes = [], land = null, win = null, sky4 = null;
    const BANDS = [{ y: 0.3, a: 0.09, sp: 0.05, c0: "60,255,170", c1: "60,200,255", hh: 0.26 }, { y: 0.4, a: 0.07, sp: -0.035, c0: "90,255,200", c1: "150,110,255", hh: 0.2 }, { y: 0.22, a: 0.06, sp: 0.025, c0: "150,255,210", c1: "60,160,255", hh: 0.16 }];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 110, k, 0.7); flakes = snowOf(w, h, k, Math.round(40 + 40 * Math.min(2, (w * h) / (1280 * 720))));
        land = offscreen(w, h); const g = land.getContext("2d");
        const hill = (base, amp, f, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 6 * k) g.lineTo(x, h * base - Math.sin(x / w * f + base * 9) * h * amp - Math.sin(x / w * f * 2.7) * h * amp * 0.3); g.lineTo(w, h); g.closePath(); g.fill(); };
        hill(0.8, 0.04, 4, "#cfdaf0"); hill(0.86, 0.035, 6, "#b4c3e0");
        const pine = (x, y, ht) => { g.fillStyle = "#0a1428"; for (let i = 0; i < 3; i++) { const top = y - ht * (0.45 + i * 0.27), bot = y - ht * i * 0.25, half = ht * (0.26 - i * 0.06); g.beginPath(); g.moveTo(x, top); g.lineTo(x + half, bot); g.lineTo(x - half, bot); g.closePath(); g.fill(); } };
        for (let i = 0; i < Math.max(8, Math.round(w / (80 * k))); i++) { const x = rnd(0, w); if (Math.abs(x - w * 0.62) < 60 * k) continue; pine(x, h * rnd(0.84, 0.9), h * rnd(0.08, 0.15)); }
        // the cabin
        const cx = w * 0.62, cy = h * 0.86, cw = 70 * k, ch = 42 * k;
        g.fillStyle = "#1a1220"; g.fillRect(cx - cw / 2, cy - ch, cw, ch);
        g.beginPath(); g.moveTo(cx - cw / 2 - 8 * k, cy - ch); g.lineTo(cx, cy - ch - 30 * k); g.lineTo(cx + cw / 2 + 8 * k, cy - ch); g.closePath(); g.fill();
        g.fillStyle = "rgba(235,242,255,0.9)"; g.beginPath(); g.moveTo(cx - cw / 2 - 8 * k, cy - ch); g.lineTo(cx, cy - ch - 30 * k); g.lineTo(cx + cw / 2 + 8 * k, cy - ch); g.lineTo(cx + cw / 2 + 4 * k, cy - ch + 5 * k); g.lineTo(cx, cy - ch - 24 * k); g.lineTo(cx - cw / 2 - 4 * k, cy - ch + 5 * k); g.closePath(); g.fill();
        win = { x: cx - 12 * k, y: cy - ch + 12 * k, w: 24 * k, h: 16 * k };
        sky4 = offscreen(w / 12, h / 12);       // the aurora is soft: drawn very small and enlarged, which softens its edges (cheaper than a blur)
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#02050f"], [0.6, "#061127"], [1, "#0c1d3a"]]);
        drawStars(ctx, st, t, 0.55);
        // aurora: each band is one soft ribbon (a filled wave with a vertical fade), slowly rippling
        const a4 = sky4.getContext("2d"); a4.setTransform(1, 0, 0, 1, 0, 0); a4.clearRect(0, 0, sky4.width, sky4.height); a4.setTransform(sky4.width / w, 0, 0, sky4.height / h, 0, 0);
        a4.globalCompositeOperation = "lighter";   // soft edges come from drawing it small and enlarging (a blur filter here cost most of the frame without a GPU)
        for (const b of BANDS) {
          const top = (x) => h * b.y + Math.sin(x / w * 5 + t * b.sp * 6) * h * b.a + Math.sin(x / w * 13 - t * b.sp * 9) * h * b.a * 0.35;
          const gr = a4.createLinearGradient(0, h * (b.y - b.a - 0.05), 0, h * (b.y + b.hh));
          gr.addColorStop(0, `rgba(${b.c1},0)`); gr.addColorStop(0.3, `rgba(${b.c1},0.16)`); gr.addColorStop(0.7, `rgba(${b.c0},0.22)`); gr.addColorStop(1, `rgba(${b.c0},0)`);
          a4.fillStyle = gr; a4.beginPath(); a4.moveTo(-w * 0.08, top(-w * 0.08));    // a little past both edges: no seams
          for (let x = -w * 0.08; x <= w * 1.08; x += 16 * k) a4.lineTo(x, top(x));
          for (let x = w * 1.08; x >= -w * 0.08; x -= 16 * k) a4.lineTo(x, top(x) + h * b.hh * (0.75 + 0.25 * Math.sin(x / w * 7 + t * 0.3)));
          a4.closePath(); a4.fill();
        }
        ctx.globalCompositeOperation = "lighter"; ctx.imageSmoothingEnabled = true; ctx.drawImage(sky4, 0, 0, w, h); ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(land, 0, 0);
        if (win) { const f = 0.88 + 0.12 * Math.sin(t * 0.8); glowDot(ctx, win.x + win.w / 2, win.y + win.h / 2, 42 * k, "255,180,90", 0.3 * f);
          ctx.fillStyle = `rgba(255,200,120,${0.92 * f})`; ctx.fillRect(win.x, win.y, win.w, win.h); ctx.fillStyle = "rgba(30,18,10,0.6)"; ctx.fillRect(win.x + win.w / 2 - k, win.y, 2 * k, win.h); }
        drawSnow(ctx, flakes, w, h, k, t, dt);
      },
    };
  };

  // ===================== Pack 4: detailed showpieces =====================

  // Koi Pond: looking down into a dark pond. Koi glide slowly (bodies that bend and follow the head, fins, waving
  // tails, patterned scales), light ripples across the water, lily pads float on top.
  const koiPond = (ctx) => {
    let w = 0, h = 0, k = 1, fish = [], pads = null, caust = null, base = null, ripples = [], nextRipple = 3;
    const PAL = [["#f3efe6", "#ff6328"], ["#ffb42e", "#ff7a1a"], ["#f3efe6", "#17161b"], ["#ff5a1f", "#f3efe6"], ["#ece5d4", "#ffcf3a"], ["#f3efe6", "#ff6328"]];
    const newFish = (i) => {
      const L = rnd(95, 150) * k, x = rnd(0.15, 0.85) * w, y = rnd(0.15, 0.85) * h, a = rnd(0, T2);
      const f = { x, y, a, sp: rnd(18, 30) * k, L, pal: PAL[i % PAL.length], ph: rnd(0, T2), trail: [], spots: [] };
      for (let j = 0; j < 5; j++) f.spots.push({ u: rnd(0.12, 0.75), side: rnd(-0.6, 0.6), r: rnd(0.12, 0.26) });
      for (let j = 0; j < 80; j++) f.trail.push([x - Math.cos(a) * j * 2.2 * k, y - Math.sin(a) * j * 2.2 * k]);
      return f;
    };
    // a point a given distance back along the fish's trail (its body follows where its head has been)
    const along = (tr, d) => { let acc = 0; for (let i = 1; i < tr.length; i++) { const dx = tr[i][0] - tr[i - 1][0], dy = tr[i][1] - tr[i - 1][1], s = Math.hypot(dx, dy); if (acc + s >= d) { const u = s ? (d - acc) / s : 0; return [tr[i - 1][0] + dx * u, tr[i - 1][1] + dy * u]; } acc += s; } return tr[tr.length - 1]; };
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); fish = Array.from({ length: 6 }, (_, i) => newFish(i)); ripples = [];
        // light on the water: soft bright patches, drawn small and blurred, then scrolled over the pond
        base = offscreen(w, h); const bgx = base.getContext("2d"), bg = bgx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
        bg.addColorStop(0, "#0d3c3f"); bg.addColorStop(1, "#03141a"); bgx.fillStyle = bg; bgx.fillRect(0, 0, w, h);
        const small = offscreen(w / 4, h / 4), cg = small.getContext("2d");
        for (let i = 0; i < 70; i++) glowDot(cg, rnd(0, small.width), rnd(0, small.height), rnd(4, 12), "160,240,220", rnd(0.12, 0.3));
        // drawn small (soft), stretched to full size once here, so each frame is a plain copy instead of a stretch
        caust = offscreen(w, h); { const fg = caust.getContext("2d"); fg.imageSmoothingEnabled = true; fg.drawImage(small, 0, 0, w, h); }
        // lily pads + a few flowers (they don't move)
        pads = offscreen(w, h); const g = pads.getContext("2d");
        const pad = (x, y, r, rot) => {
          g.save(); g.translate(x, y); g.rotate(rot);
          g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(5 * k, 8 * k, r, r, 0, 0.18, T2 - 0.18); g.lineTo(5 * k, 8 * k); g.fill();
          const pg = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); pg.addColorStop(0, "#5d9a4a"); pg.addColorStop(1, "#24502c");
          g.fillStyle = pg; g.beginPath(); g.arc(0, 0, r, 0.18, T2 - 0.18); g.lineTo(0, 0); g.closePath(); g.fill();
          g.strokeStyle = "rgba(170,220,140,0.25)"; g.lineWidth = Math.max(1, k * 0.8);
          for (let i = 0; i < 9; i++) { const an = 0.4 + i * (T2 - 0.8) / 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(an) * r * 0.92, Math.sin(an) * r * 0.92); g.stroke(); }
          g.restore();
        };
        const flower = (x, y, r) => {
          for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) {
            const an = i * T2 / 8 + ring * 0.4, rr = r * (ring ? 0.62 : 1);
            g.save(); g.translate(x, y); g.rotate(an); const fg = g.createLinearGradient(0, 0, rr, 0); fg.addColorStop(0, "#fff4f8"); fg.addColorStop(1, ring ? "#ff9cc0" : "#ffc4d8");
            g.fillStyle = fg; g.beginPath(); g.ellipse(rr * 0.5, 0, rr * 0.55, rr * 0.22, 0, 0, T2); g.fill(); g.restore();
          }
          glowDot(g, x, y, r * 0.35, "255,220,90", 0.95);
        };
        const spots = [[0.08, 0.15], [0.16, 0.24], [0.9, 0.12], [0.85, 0.82], [0.12, 0.85], [0.7, 0.92], [0.95, 0.5], [0.04, 0.55]];
        for (const [u, v] of spots) pad(u * w, v * h, rnd(34, 58) * k, rnd(0, T2));
        flower(0.16 * w + 10 * k, 0.24 * h - 6 * k, 15 * k); flower(0.85 * w - 8 * k, 0.82 * h + 4 * k, 13 * k);
      },
      frame(t, dt) {
        ctx.drawImage(base, 0, 0);
        ctx.globalCompositeOperation = "lighter"; ctx.imageSmoothingEnabled = true;
        const o1 = (t * 5 * k) % w, o2 = (t * 3.5 * k) % h;
        const r1 = Math.round(o1), r2 = Math.round(o2);
        ctx.globalAlpha = 0.22; ctx.drawImage(caust, r1, 0); ctx.drawImage(caust, r1 - caust.width, 0);
        ctx.globalAlpha = 0.14; ctx.drawImage(caust, 0, -r2); ctx.drawImage(caust, 0, caust.height - r2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
        // ripples now and then, where a fish nears the surface
        nextRipple -= dt;
        if (nextRipple <= 0) { const f = fish[(Math.random() * fish.length) | 0]; ripples.push({ x: f.x, y: f.y, r: 4 * k, a: 0.35 }); nextRipple = rnd(4, 9); }
        for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.r += 22 * k * dt; r.a -= 0.06 * dt;
          if (r.a <= 0) { ripples.splice(i, 1); continue; }
          ctx.strokeStyle = `rgba(200,255,240,${r.a})`; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, T2); ctx.stroke();
          ctx.strokeStyle = `rgba(200,255,240,${r.a * 0.5})`; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * 0.7, 0, T2); ctx.stroke(); }
        for (const f of fish) {
          // swim: wander gently, turn back towards the middle near the edges
          const cx = w / 2 - f.x, cy = h / 2 - f.y, edge = Math.min(f.x, w - f.x, f.y, h - f.y) < 0.12 * Math.min(w, h);
          let turn = Math.sin(t * 0.25 + f.ph) * 0.35 + Math.sin(t * 0.61 + f.ph * 2) * 0.2;
          if (edge) { const want = Math.atan2(cy, cx); let d = want - f.a; d = Math.atan2(Math.sin(d), Math.cos(d)); turn += d * 1.2; }
          f.a += turn * dt; f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt;
          f.trail.unshift([f.x, f.y]); if (f.trail.length > 120) f.trail.length = 120;
          drawKoi(f, t);
        }
        ctx.drawImage(pads, 0, 0);
      },
    };
    function drawKoi(f, t) {
      const N = 14, P = [], W = f.L * 0.17;
      for (let i = 0; i <= N; i++) P.push(along(f.trail, (i / N) * f.L * 0.82));
      const prof = (u) => W * (u < 0.25 ? 0.62 + u * 1.5 : 1.0 - (u - 0.25) * 1.18) * (u > 0.9 ? 0.6 : 1);
      const side = (s) => P.map((p, i) => { const q = P[Math.min(N, i + 1)], r = P[Math.max(0, i - 1)], ang = Math.atan2(r[1] - q[1], r[0] - q[0]) + Math.PI / 2, wd = prof(i / N) * s;
        return [p[0] + Math.cos(ang) * wd, p[1] + Math.sin(ang) * wd]; });
      const L = side(1), R = side(-1);
      const hd = Math.atan2(P[0][1] - P[1][1], P[0][0] - P[1][0]), nx = P[0][0] + Math.cos(hd) * W * 0.75, ny = P[0][1] + Math.sin(hd) * W * 0.75;
      const body = (g, dx = 0, dy = 0) => { g.beginPath(); g.moveTo(R[0][0] + dx, R[0][1] + dy); g.quadraticCurveTo(nx + (R[0][0] - P[0][0]) * 0.9 + dx, ny + (R[0][1] - P[0][1]) * 0.9 + dy, nx + dx, ny + dy);
        g.quadraticCurveTo(nx + (L[0][0] - P[0][0]) * 0.9 + dx, ny + (L[0][1] - P[0][1]) * 0.9 + dy, L[0][0] + dx, L[0][1] + dy);
        for (let i = 1; i <= N; i++) g.lineTo(L[i][0] + dx, L[i][1] + dy); for (let i = N; i >= 0; i--) g.lineTo(R[i][0] + dx, R[i][1] + dy); g.closePath(); };
      // tail fan, waving
      const tip = P[N], pre = P[N - 2], ta = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]) + Math.sin(t * 3 + f.ph) * 0.35, tl = f.L * 0.22;
      const tail = (g, dx = 0, dy = 0) => { g.beginPath(); g.moveTo(tip[0] + dx, tip[1] + dy);
        g.quadraticCurveTo(tip[0] + Math.cos(ta - 0.5) * tl * 0.7 + dx, tip[1] + Math.sin(ta - 0.5) * tl * 0.7 + dy, tip[0] + Math.cos(ta - 0.45) * tl + dx, tip[1] + Math.sin(ta - 0.45) * tl + dy);
        g.quadraticCurveTo(tip[0] + Math.cos(ta) * tl * 0.75 + dx, tip[1] + Math.sin(ta) * tl * 0.75 + dy, tip[0] + Math.cos(ta + 0.45) * tl + dx, tip[1] + Math.sin(ta + 0.45) * tl + dy);
        g.quadraticCurveTo(tip[0] + Math.cos(ta + 0.5) * tl * 0.7 + dx, tip[1] + Math.sin(ta + 0.5) * tl * 0.7 + dy, tip[0] + dx, tip[1] + dy); g.closePath(); };
      // shadow on the pond floor
      ctx.fillStyle = "rgba(0,0,0,0.28)"; body(ctx, 7 * k, 10 * k); ctx.fill(); tail(ctx, 7 * k, 10 * k); ctx.fill();
      // fins (pectorals, translucent)
      const hp = P[3], hq = P[5], ha = Math.atan2(hp[1] - hq[1], hp[0] - hq[0]), flap = Math.sin(t * 2.2 + f.ph) * 0.25;
      ctx.fillStyle = "rgba(255,240,225,0.4)";
      for (const sgn of [1, -1]) { ctx.save(); ctx.translate(hp[0], hp[1]); ctx.rotate(ha + sgn * (1.9 + flap)); ctx.beginPath(); ctx.ellipse(W * 0.9, 0, W * 0.9, W * 0.38, 0, 0, T2); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = "rgba(255,230,210,0.55)"; tail(ctx); ctx.fill();
      // body with its pattern
      ctx.fillStyle = f.pal[0]; body(ctx); ctx.fill();
      ctx.save(); body(ctx); ctx.clip(); ctx.fillStyle = f.pal[1];
      for (const sp of f.spots) { const p = P[Math.round(sp.u * N)], q = P[Math.min(N, Math.round(sp.u * N) + 1)], an = Math.atan2(p[1] - q[1], p[0] - q[0]) + Math.PI / 2, ww = prof(sp.u);
        ctx.beginPath(); ctx.ellipse(p[0] + Math.cos(an) * ww * sp.side, p[1] + Math.sin(an) * ww * sp.side, ww * sp.r * 4.2, ww * sp.r * 3, an, 0, T2); ctx.fill(); }
      const sh = ctx.createLinearGradient(L[4][0], L[4][1], R[4][0], R[4][1]); sh.addColorStop(0, "rgba(255,255,255,0.25)"); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = sh; body(ctx); ctx.fill(); ctx.restore();
      // eyes
      const e = P[1], ea = Math.atan2(P[0][1] - P[2][1], P[0][0] - P[2][0]) + Math.PI / 2;
      ctx.fillStyle = "#101014"; for (const sgn of [1, -1]) { ctx.beginPath(); ctx.arc(e[0] + Math.cos(ea) * W * 0.45 * sgn, e[1] + Math.sin(ea) * W * 0.45 * sgn, Math.max(1, 1.4 * k), 0, T2); ctx.fill(); }
    }
  };

  // Rain on Glass: a rainy window over a blurred city at night. Drops slide down in little runs, leaving a trail, and
  // each big drop shows the city upside down inside it, like a real one.
  const rainGlass = (ctx) => {
    let w = 0, h = 0, k = 1, city = null, sharp = null, fine = null, trails = null, comp = null, beads = [], drops = [];
    const C = ["255,170,80", "255,90,80", "90,200,255", "255,230,190", "170,120,255", "255,140,60"];
    const newDrop = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : rnd(-0.1, 0.4) * h, r: rnd(4, 10) * k, vy: 0, wait: rnd(0.5, 6), wob: rnd(0, T2) });
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h);
        // the city behind the glass: lights, out of focus (drawn once)
        city = offscreen(w, h); const g = city.getContext("2d");
        const sg = g.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "#070b1c"); sg.addColorStop(0.55, "#121434"); sg.addColorStop(1, "#24132a"); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        g.filter = `blur(${Math.round(6 * k)}px)`;
        for (let i = 0; i < 110; i++) { const y = h * (0.35 + Math.pow(Math.random(), 0.7) * 0.65), r = rnd(10, 46) * k; bokehDisc(g, rnd(-0.05, 1.05) * w, y, r, C[i % C.length], rnd(0.25, 0.55)); }
        for (let i = 0; i < 18; i++) { const x = rnd(0, w), y = rnd(0.55, 0.95) * h; g.fillStyle = `rgba(${C[i % C.length]},0.06)`; g.fillRect(x - 30 * k, y, 60 * k, h); }   // light spill on wet streets
        g.filter = "none";
        // the same city through clear glass (where a drop has wiped a path): less blur, a touch brighter
        sharp = offscreen(w, h); const sx = sharp.getContext("2d"); sx.filter = `blur(${Math.max(1, Math.round(1.5 * k))}px) brightness(1.12)`; sx.drawImage(city, 0, 0); sx.filter = "none";
        sx.globalCompositeOperation = "lighter"; for (let i = 0; i < 60; i++) { const y = h * (0.4 + Math.random() * 0.6); glowDot(sx, rnd(0, w), y, rnd(2, 6) * k, C[i % C.length], 0.5); } sx.globalCompositeOperation = "source-over";
        // fine droplets all over the glass (drawn once)
        fine = offscreen(w, h); const f = fine.getContext("2d");
        f.fillStyle = "rgba(150,160,195,0.09)"; f.fillRect(0, 0, w, h);   // mist on the glass
        const n = Math.round(900 * Math.min(2.2, (w * h) / (1280 * 720)));
        for (let i = 0; i < n; i++) {
          const x = rnd(0, w), y = rnd(0, h), r = rnd(0.6, 2.4) * k;
          f.fillStyle = "rgba(255,255,255,0.07)"; f.beginPath(); f.ellipse(x, y, r, r * 1.1, 0, 0, T2); f.fill();
          f.fillStyle = "rgba(0,0,0,0.22)"; f.beginPath(); f.ellipse(x, y + r * 0.35, r * 0.9, r * 0.7, 0, 0, Math.PI); f.fill();
          f.fillStyle = "rgba(255,255,255,0.45)"; f.fillRect(x - r * 0.35, y - r * 0.45, Math.max(0.7, r * 0.3), Math.max(0.7, r * 0.3));
        }
        trails = offscreen(w, h); comp = offscreen(w, h); beads = [];
        drops = Array.from({ length: Math.round(16 + 10 * Math.min(2, (w * h) / (1280 * 720))) }, () => newDrop(true));
      },
      frame(t, dt) {
        ctx.drawImage(city, 0, 0);
        // the trails fade slowly (the glass beads up again)
        const tg = trails.getContext("2d"); tg.globalCompositeOperation = "destination-out"; tg.fillStyle = `rgba(0,0,0,${Math.min(1, 0.12 * dt)})`; tg.fillRect(0, 0, w, h); tg.globalCompositeOperation = "source-over";
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          if (d.vy === 0) { d.wait -= dt; if (d.wait <= 0) d.vy = rnd(50, 140) * k; }
          else {
            d.y += d.vy * dt; d.x += Math.sin(t * 3 + d.wob) * 6 * k * dt; d.vy *= 1 - 0.6 * dt;
            tg.fillStyle = "rgba(255,255,255,0.9)"; tg.beginPath(); tg.ellipse(d.x, d.y - d.r * 0.6, d.r * 0.72, d.r * 1.1, 0, 0, T2); tg.fill();   // the clear path it wipes
            if (Math.random() < 5 * dt && beads.length < 260) beads.push({ x: d.x + rnd(-0.5, 0.5) * d.r, y: d.y - d.r * 2, r: d.r * rnd(0.18, 0.34), life: 1 });   // tiny beads left behind
            if (d.vy < 12 * k) { d.vy = 0; d.wait = rnd(1, 5); }
          }
          if (d.y - d.r > h) drops[i] = newDrop(false);
        }
        // the wiped paths show the city sharper; the misted glass (fine droplets) only where it hasn't been wiped
        const cg = comp.getContext("2d"); cg.globalCompositeOperation = "copy"; cg.drawImage(trails, 0, 0); cg.globalCompositeOperation = "source-in"; cg.drawImage(sharp, 0, 0);
        ctx.drawImage(fine, 0, 0); cg.globalCompositeOperation = "source-over"; ctx.drawImage(comp, 0, 0);
        for (let i = beads.length - 1; i >= 0; i--) { const b = beads[i]; b.life -= dt * 0.1; if (b.life <= 0) { beads.splice(i, 1); continue; }
          ctx.fillStyle = `rgba(0,0,0,${0.3 * b.life})`; ctx.beginPath(); ctx.arc(b.x, b.y + b.r * 0.3, b.r, 0, T2); ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.5 * b.life})`; ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.4, 0, T2); ctx.fill(); }
        // the big drops: a tiny upside-down city inside each, a dark rim at the bottom, a bright glint at the top
        for (const d of drops) {
          const rx = d.r, ry = d.r * (d.vy > 0 ? 1.25 : 1.1);
          ctx.save(); ctx.beginPath(); ctx.ellipse(d.x, d.y, rx, ry, 0, 0, T2); ctx.clip();
          const S = d.r * 7; ctx.translate(d.x, d.y); ctx.scale(1, -1);
          ctx.drawImage(city, Math.max(0, d.x - S), Math.max(0, d.y - S), S * 2, S * 2, -rx * 1.15, -ry * 1.15, rx * 2.3, ry * 2.3);
          ctx.restore();
          ctx.strokeStyle = "rgba(0,0,0,0.38)"; ctx.lineWidth = Math.max(1, d.r * 0.22); ctx.beginPath(); ctx.ellipse(d.x, d.y, rx, ry, 0, 0.15, Math.PI - 0.15); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.ellipse(d.x - rx * 0.35, d.y - ry * 0.45, rx * 0.22, ry * 0.16, -0.6, 0, T2); ctx.fill();
        }
      },
    };
  };

  // Ringed Giant: a huge ringed planet rising in the corner of deep space: banded clouds, the rings' shadow on the
  // planet, a soft atmosphere, stars, a faint nebula, and a small moon drifting across very slowly.
  const ringedGiant = (ctx) => {
    let w = 0, h = 0, k = 1, st = [], planet = null, px = 0, py = 0, neb = [], back = null;
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 260, k);
        neb = Array.from({ length: 5 }, (_, i) => ({ x: rnd(0, 0.6) * w, y: rnd(0, 0.6) * h, r: rnd(0.2, 0.4) * Math.max(w, h), c: ["80,60,160", "40,90,170", "120,50,130"][i % 3] }));
        // deep space + the faint nebula don't move: drawn once
        back = offscreen(w, h); { const g = back.getContext("2d"); sky(g, w, h, [[0, "#02030a"], [1, "#070815"]]); for (const n of neb) glowDot(g, n.x, n.y, n.r, n.c, 0.07); }
        const R = Math.min(w, h) * 0.42, S = Math.ceil(R * 5.2);
        planet = offscreen(S, S); const g = planet.getContext("2d"), c = S / 2; px = w * 0.8 - c; py = h * 0.7 - c;
        const TILT = -0.3, RY = 0.3;
        const ringsAt = (gg) => {   // the rings: many thin bands with gaps, in the planet's colours
          gg.save(); gg.translate(c, c); gg.rotate(TILT); gg.scale(1, RY);
          for (let r = R * 1.22; r < R * 2.35; r += R * 0.012) {
            const u = (r - R * 1.22) / (R * 1.13), gap = Math.abs(u - 0.58) < 0.035 || Math.abs(u - 0.86) < 0.012;
            if (gap) continue;
            const a = (0.22 + 0.5 * Math.abs(Math.sin(u * 31) * Math.sin(u * 7.3))) * (u < 0.1 ? u * 10 : 1) * (u > 0.94 ? (1 - u) * 16 : 1);
            gg.strokeStyle = `rgba(${(220 + 20 * Math.sin(u * 9)) | 0},${(196 + 22 * Math.sin(u * 13)) | 0},${(158 + 20 * Math.sin(u * 5)) | 0},${a})`;
            gg.lineWidth = R * 0.014; gg.beginPath(); gg.arc(0, 0, r, 0, T2); gg.stroke();
          }
          gg.restore();
        };
        ringsAt(g);                                            // the rings behind the planet
        // the planet: cloud bands, then night side, then atmosphere
        g.save(); g.beginPath(); g.arc(c, c, R, 0, T2); g.clip(); g.translate(c, c); g.rotate(TILT);
        for (let y = -R; y < R; y += R * 0.02) {
          const u = (y + R) / (2 * R), n = Math.sin(u * 37) * 0.5 + Math.sin(u * 91) * 0.25 + Math.sin(u * 13) * 0.35;
          g.fillStyle = `rgb(${(204 + 30 * n) | 0},${(168 + 26 * n) | 0},${(120 + 24 * n) | 0})`; g.fillRect(-R * 1.5, y, R * 3, R * 0.022);
        }
        g.fillStyle = "rgba(160,110,70,0.35)"; g.beginPath(); g.ellipse(R * 0.25, -R * 0.42, R * 0.16, R * 0.06, 0, 0, T2); g.fill();   // a storm
        g.fillStyle = "rgba(20,14,10,0.42)"; g.save(); g.scale(1, RY); g.beginPath(); g.arc(0, R * 0.9 / RY * 0.12, R * 1.9, Math.PI * 1.02, Math.PI * 1.98); g.lineWidth = R * 0.32 / RY * 0.25; g.strokeStyle = "rgba(20,14,10,0.35)"; g.stroke(); g.restore();   // the rings' shadow
        g.restore();
        const sh = g.createLinearGradient(c + R * 0.7, c - R * 0.7, c - R * 0.8, c + R * 0.8); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.45, "rgba(0,0,0,0.25)"); sh.addColorStop(0.75, "rgba(2,3,10,0.88)"); sh.addColorStop(1, "rgba(2,3,10,0.97)");
        g.fillStyle = sh; g.beginPath(); g.arc(c, c, R, 0, T2); g.fill();
        const at = g.createRadialGradient(c, c, R * 0.96, c, c, R * 1.06); at.addColorStop(0, "rgba(255,220,170,0)"); at.addColorStop(0.5, "rgba(255,214,160,0.3)"); at.addColorStop(1, "rgba(255,214,160,0)");
        g.fillStyle = at; g.beginPath(); g.arc(c, c, R * 1.06, 0, T2); g.fill();
        // the front half of the rings, over the planet
        // clipped to the planet disc so the rings outside it are not drawn twice
        g.save(); g.beginPath(); g.arc(c, c, R * 1.01, 0, T2); g.clip(); g.translate(c, c); g.rotate(TILT); g.beginPath(); g.rect(-S, 0, S * 2, S); g.setTransform(1, 0, 0, 1, 0, 0); g.clip(); ringsAt(g); g.restore();
      },
      frame(t) {
        ctx.drawImage(back, 0, 0);
        drawStars(ctx, st, t, 0.7);
        // a small moon crossing very slowly (about four minutes)
        const mu = (t * 0.004) % 1, mx = w * (-0.05 + mu * 1.1), my = h * (0.18 + 0.08 * Math.sin(mu * Math.PI)), mr = Math.min(w, h) * 0.018;
        ctx.fillStyle = "#cfcac2"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, T2); ctx.fill();
        ctx.fillStyle = "rgba(2,3,10,0.82)"; ctx.beginPath(); ctx.arc(mx - mr * 0.45, my + mr * 0.45, mr * 1.05, 0, T2); ctx.fill();
        ctx.drawImage(planet, px + Math.sin(t * 0.02) * 6 * k, py + Math.cos(t * 0.017) * 4 * k);
      },
    };
  };

  // Deep Blue: a giant manta ray gliding slowly through the deep ocean, under shifting sunbeams, with marine snow
  // drifting down and the odd stream of bubbles.
  const deepBlue = (ctx) => {
    let w = 0, h = 0, k = 1, snow = [], bubbles = [], beams = null, sea = null;
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h);
        snow = Array.from({ length: 160 }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(0.5, 1.8) * k, s: rnd(3, 10) * k, p: rnd(0, T2), a: rnd(0.15, 0.5) }));
        bubbles = [];
        // the sea itself (gradient + the shimmer of the surface) doesn't move: drawn once
        sea = offscreen(w, h); { const g = sea.getContext("2d"); sky(g, w, h, [[0, "#0b5f8e"], [0.45, "#063758"], [1, "#010c1c"]]);
          const sg = g.createLinearGradient(0, 0, 0, h * 0.08); sg.addColorStop(0, "rgba(200,245,255,0.18)"); sg.addColorStop(1, "rgba(200,245,255,0)"); g.fillStyle = sg; g.fillRect(0, 0, w, h * 0.08); }
        // sunbeams, drawn once at half size and blurred so their edges are soft; they drift gently each frame
        beams = [0, 1].map((layer) => { const B = offscreen(Math.ceil(w * 0.75), Math.ceil(h / 2)), g = B.getContext("2d"), bw = B.width, bh = B.height;
          g.filter = `blur(${Math.round(10 * k)}px)`;
          for (let i = 0; i < 6; i++) { const x = rnd(0, bw), top = rnd(6, 20) * k, bot = rnd(30, 80) * k, a = rnd(0.12, 0.24) * (layer ? 0.7 : 1);
            const gr = g.createLinearGradient(0, 0, 0, bh); gr.addColorStop(0, `rgba(170,230,255,${a})`); gr.addColorStop(0.7, `rgba(170,230,255,${a * 0.25})`); gr.addColorStop(1, "rgba(170,230,255,0)");
            g.fillStyle = gr; g.beginPath(); g.moveTo(x - top, -10); g.lineTo(x + top, -10); g.lineTo(x + bot + bh * 0.15, bh); g.lineTo(x - bot + bh * 0.15, bh); g.closePath(); g.fill(); }
          g.filter = "none";
          // shown 1.3x wider than the screen: stretch it once here, so each frame is a plain (cheap) copy
          const F = offscreen(Math.ceil(w * 1.3), Math.ceil(h)), fg = F.getContext("2d"); fg.imageSmoothingEnabled = true; fg.drawImage(B, 0, 0, F.width, F.height); return F; });
      },
      frame(t, dt) {
        ctx.drawImage(sea, 0, 0);
        // sunbeams from the surface, drifting (a plain shift: a slanted transform was slow to draw without a GPU)
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 2; i++) {
          const sx = Math.sin(t * (0.09 + i * 0.05) + i * 2) * w * 0.05, x0 = -w * 0.15 + (i ? w * 0.12 : 0);
          ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * (0.3 + i * 0.17) + i);
          ctx.drawImage(beams[i], Math.round(x0 + sx), 0);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        // marine snow
        for (const s of snow) { s.y += s.s * dt; s.x += Math.sin(t * 0.3 + s.p) * 3 * k * dt; if (s.y > h) { s.y = -2; s.x = rnd(0, w); }
          ctx.fillStyle = `rgba(210,240,255,${s.a})`; ctx.fillRect(s.x, s.y, s.r, s.r); }
        // the manta: a long slow loop across the scene, gently banking, wings beating slowly
        const u = t * 0.035 + 0.6, x = w * 0.5 + Math.cos(u) * w * 0.4, y = h * 0.52 + Math.sin(u * 2) * h * 0.14;
        const vx = -Math.sin(u) * w * 0.4, vy = Math.cos(u * 2) * h * 0.28, head = Math.atan2(vy, vx), depth = 0.82 + 0.18 * Math.sin(u + 1.3);
        drawManta(x, y, head, depth, t);
        // bubbles: a stream now and then from below
        if (Math.random() < dt * 0.25) { const bx = rnd(0.1, 0.9) * w; for (let i = 0; i < 6; i++) bubbles.push({ x: bx + rnd(-8, 8) * k, y: h + i * 18 * k, r: rnd(1.5, 4) * k, s: rnd(28, 46) * k, p: rnd(0, T2) }); }
        for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= b.s * dt; b.x += Math.sin(t * 2 + b.p) * 10 * k * dt; if (b.y < -10) { bubbles.splice(i, 1); continue; }
          ctx.strokeStyle = "rgba(210,245,255,0.5)"; ctx.lineWidth = Math.max(1, 0.8 * k); ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, T2); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(b.x - b.r * 0.4, b.y - b.r * 0.5, Math.max(1, b.r * 0.35), Math.max(1, b.r * 0.35)); }
      },
    };
    function drawManta(x, y, a, depth, t) {
      const L = Math.min(w, h) * 0.27 * depth, W = L * 2.1, flap = Math.sin(t * 0.9), tipY = W * 0.5 * (0.86 + 0.14 * flap), tipX = -L * 0.3 + flap * L * 0.06;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      const body = () => { ctx.beginPath(); ctx.moveTo(L * 0.42, 0);
        ctx.bezierCurveTo(L * 0.38, -W * 0.18, L * 0.1, -tipY * 0.8, tipX, -tipY);
        ctx.bezierCurveTo(-L * 0.12, -tipY * 0.7, -L * 0.3, -W * 0.16, -L * 0.36, 0);
        ctx.bezierCurveTo(-L * 0.3, W * 0.16, -L * 0.12, tipY * 0.7, tipX, tipY);
        ctx.bezierCurveTo(L * 0.1, tipY * 0.8, L * 0.38, W * 0.18, L * 0.42, 0); ctx.closePath(); };
      // a soft dark halo (a plain radial gradient: a live blurred shadow cost most of the frame without a GPU), then
      // the body: dark on top, lit along its leading edges
      ctx.save(); ctx.scale(1, W / L * 0.62); glowDot(ctx, -L * 0.02, 0, L * 0.78, "0,8,20", 0.55); ctx.restore();
      const g = ctx.createLinearGradient(L * 0.4, 0, -L * 0.4, 0); g.addColorStop(0, "#1a3d5e"); g.addColorStop(0.5, "#0d243c"); g.addColorStop(1, "#08182a");
      ctx.fillStyle = g; body(); ctx.fill();
      ctx.strokeStyle = "rgba(150,210,240,0.22)"; ctx.lineWidth = Math.max(1, 1.4 * k); body(); ctx.stroke();
      // the raised body down the middle, lit from above
      const bg = ctx.createLinearGradient(0, -W * 0.12, 0, W * 0.12); bg.addColorStop(0, "rgba(120,180,220,0.10)"); bg.addColorStop(0.5, "rgba(40,80,120,0.18)"); bg.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(-L * 0.02, 0, L * 0.4, W * 0.11, 0, 0, T2); ctx.fill();
      // cephalic fins: two horns pointing forward from the wide head
      ctx.fillStyle = "#0f2a44";
      for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(L * 0.36, s * L * 0.06); ctx.quadraticCurveTo(L * 0.56, s * L * 0.08, L * 0.6, s * L * 0.14); ctx.quadraticCurveTo(L * 0.5, s * L * 0.17, L * 0.34, s * L * 0.13); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = "#0b2036"; ctx.lineWidth = Math.max(1, 2 * k * depth); ctx.beginPath(); ctx.moveTo(-L * 0.34, 0);
      ctx.quadraticCurveTo(-L * 0.7, Math.sin(t * 1.2) * L * 0.08, -L * 1.05, Math.sin(t * 1.2 + 1) * L * 0.12); ctx.stroke();
      // faint pale markings on the back
      ctx.fillStyle = "rgba(190,225,245,0.08)"; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(L * 0.22, s * W * 0.1); ctx.quadraticCurveTo(L * 0.02, s * W * 0.17, -L * 0.14, s * W * 0.3); ctx.quadraticCurveTo(L * 0.0, s * W * 0.2, L * 0.12, s * W * 0.1); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  };
  // Cozy Room: a dark, warm room at night. A big window shows a rainy city, rain runs down the glass, a lamp glows,
  // a mug steams on the sill and a cat sleeps there, breathing slowly (its tail flicks now and then).
  const cozyRoom = (ctx) => {
    let w = 0, h = 0, k = 1, back = null, front = null, W = null, drops = [], lights = [], steam = [], cat = null;
    return {
      resize(Wd, Hd) {
        w = Wd; h = Hd; k = kOf(w, h);
        W = { x0: w * 0.2, x1: w * 0.95, y0: h * 0.07, y1: h * 0.7 };
        const vw = W.x1 - W.x0, vh = W.y1 - W.y0;
        back = offscreen(w, h); const g = back.getContext("2d");
        // the wall, faintly warm
        const wall = g.createLinearGradient(0, 0, w, h); wall.addColorStop(0, "#1a1012"); wall.addColorStop(1, "#08070a"); g.fillStyle = wall; g.fillRect(0, 0, w, h);
        // the city through the window: dusky sky, blurred buildings with lit windows, out-of-focus lights
        g.save(); g.beginPath(); g.rect(W.x0, W.y0, vw, vh); g.clip();
        const s = g.createLinearGradient(0, W.y0, 0, W.y1); s.addColorStop(0, "#0b1230"); s.addColorStop(0.6, "#1d1838"); s.addColorStop(1, "#33203a"); g.fillStyle = s; g.fillRect(W.x0, W.y0, vw, vh);
        g.filter = `blur(${Math.max(1, Math.round(1.6 * k))}px)`;
        for (let layer = 0; layer < 3; layer++) {
          const base = W.y1 - vh * (0.18 + layer * 0.12), col = ["#1b1830", "#141226", "#0d0c1b"][layer];
          for (let x = W.x0 - 20 * k; x < W.x1; ) {
            const bw = rnd(30, 80) * k * (1 + layer * 0.3), bh = rnd(0.15, 0.5) * vh * (1 - layer * 0.18);
            g.fillStyle = col; g.fillRect(x, base - bh + layer * vh * 0.12, bw, vh);
            for (let wy = base - bh + layer * vh * 0.12 + 6 * k; wy < W.y1; wy += 9 * k) for (let wx = x + 5 * k; wx < x + bw - 5 * k; wx += 8 * k)
              if (Math.random() < 0.22) { g.fillStyle = Math.random() < 0.7 ? "rgba(255,196,120,0.55)" : "rgba(150,200,255,0.5)"; g.fillRect(wx, wy, 3 * k, 4 * k); }
            x += bw + rnd(2, 10) * k;
          }
        }
        g.filter = `blur(${Math.round(5 * k)}px)`;
        const C = ["255,170,90", "255,110,90", "120,190,255", "255,220,160", "200,140,255"];
        for (let i = 0; i < 46; i++) bokehDisc(g, rnd(W.x0, W.x1), W.y0 + vh * rnd(0.45, 1), rnd(6, 20) * k, C[i % C.length], rnd(0.2, 0.45));
        g.filter = "none";
        // fine droplets beaded on the glass
        for (let i = 0; i < Math.round(500 * Math.min(2, (w * h) / (1280 * 720))); i++) { const x = rnd(W.x0, W.x1), y = rnd(W.y0, W.y1), r = rnd(0.5, 1.8) * k;
          g.fillStyle = "rgba(255,255,255,0.08)"; g.beginPath(); g.arc(x, y, r, 0, T2); g.fill(); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x - r * 0.3, y - r * 0.4, Math.max(0.6, r * 0.3), Math.max(0.6, r * 0.3)); }
        g.restore();
        // a few city windows that switch on and off, slowly
        lights = Array.from({ length: 14 }, () => ({ x: rnd(W.x0, W.x1), y: W.y0 + vh * rnd(0.55, 0.95), p: rnd(0, T2), s: rnd(0.05, 0.15) }));
        // in front of the glass: the lamp's warm light, the frame, curtain, sill, a plant and a mug
        front = offscreen(w, h); const f = front.getContext("2d");
        glowDot(f, w * 0.05, h * 0.6, Math.max(w, h) * 0.55, "255,160,80", 0.22);
        glowDot(f, W.x0 + vw * 0.08, W.y0 + vh * 0.6, vh * 0.45, "255,170,100", 0.08);        // the lamp reflected in the glass
        const fc = "#1c1416", t = Math.max(6, 10 * k);
        f.fillStyle = fc; f.fillRect(W.x0 - t, W.y0 - t, vw + t * 2, t); f.fillRect(W.x0 - t, W.y0, t, vh); f.fillRect(W.x1, W.y0, t, vh);
        f.fillRect(W.x0 + vw / 2 - t / 2, W.y0, t, vh); f.fillRect(W.x0, W.y0 + vh * 0.42, vw, t * 0.8);
        f.fillStyle = "rgba(255,180,120,0.12)"; f.fillRect(W.x0 - t, W.y0, 2 * k, vh); f.fillRect(W.x0 + vw / 2 - t / 2, W.y0, 1.5 * k, vh);   // lamp-lit edges
        // curtain on the left, in soft folds
        const cx0 = W.x0 - w * 0.09, cx1 = W.x0 + w * 0.035;
        for (let x = cx0; x < cx1; x += 6 * k) { const u = (x - cx0) / (cx1 - cx0), v = 0.5 + 0.5 * Math.sin(u * 22);
          f.fillStyle = `rgb(${(58 + 40 * v) | 0},${(30 + 20 * v) | 0},${(32 + 16 * v) | 0})`; f.fillRect(x, W.y0 - t * 2, 6.5 * k, h * 0.82); }
        const cs = f.createLinearGradient(cx0, 0, cx1, 0); cs.addColorStop(0, "rgba(0,0,0,0.5)"); cs.addColorStop(1, "rgba(0,0,0,0)"); f.fillStyle = cs; f.fillRect(cx0, W.y0 - t * 2, cx1 - cx0, h * 0.82);
        // the sill
        const sy = W.y1, sh = h * 0.04, sg = f.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, "#3a2820"); sg.addColorStop(1, "#1a110e");
        f.fillStyle = sg; f.fillRect(W.x0 - t * 2.2, sy, vw + t * 4.4, sh); f.fillStyle = "rgba(255,200,150,0.18)"; f.fillRect(W.x0 - t * 2.2, sy, vw + t * 4.4, 1.5 * k);
        f.fillStyle = "rgba(0,0,0,0.45)"; f.fillRect(W.x0 - t * 2.2, sy + sh, vw + t * 4.4, 6 * k);
        // a plant on the right of the sill
        const px = W.x1 - vw * 0.06, py = sy;
        f.fillStyle = "#2a1a14"; f.beginPath(); f.moveTo(px - 18 * k, py); f.lineTo(px + 18 * k, py); f.lineTo(px + 14 * k, py - 30 * k); f.lineTo(px - 14 * k, py - 30 * k); f.closePath(); f.fill();
        for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28, L = rnd(55, 95) * k;
          f.save(); f.translate(px, py - 30 * k); f.rotate(a); f.fillStyle = i % 2 ? "#0f1a12" : "#14231a"; f.beginPath(); f.ellipse(L * 0.5, 0, L * 0.5, L * 0.13, 0, 0, T2); f.fill(); f.restore(); }
        // a mug
        const mx = W.x0 + vw * 0.2, mw = 22 * k, mh = 26 * k;
        f.fillStyle = "#c9b8a8"; f.fillRect(mx - mw / 2, sy - mh, mw, mh); f.fillStyle = "rgba(0,0,0,0.35)"; f.fillRect(mx, sy - mh, mw / 2, mh);
        f.strokeStyle = "#c9b8a8"; f.lineWidth = 3 * k; f.beginPath(); f.arc(mx + mw / 2 + 3 * k, sy - mh / 2, 6 * k, -1.2, 1.2); f.stroke();
        steam = Array.from({ length: 12 }, (_, i) => ({ p: i / 12, x: rnd(-4, 4) * k }));
        // the cat: curled up asleep on the sill
        cat = { x: W.x0 + vw * 0.64, y: sy, s: Math.min(w, h) * 0.105, flick: 6 };
        drops = Array.from({ length: 12 }, () => ({ x: rnd(W.x0, W.x1), y: rnd(W.y0, W.y1), r: rnd(2.5, 5) * k, v: 0, wait: rnd(0, 6) }));
      },
      frame(t, dt) {
        ctx.drawImage(back, 0, 0);
        // city windows fading on and off
        for (const l of lights) { const a = Math.max(0, Math.sin(t * l.s + l.p)) * 0.6; if (a > 0.02) { ctx.fillStyle = `rgba(255,200,130,${a})`; ctx.fillRect(l.x, l.y, 3 * k, 4 * k); } }
        // rain running down the glass
        ctx.save(); ctx.beginPath(); ctx.rect(W.x0, W.y0, W.x1 - W.x0, W.y1 - W.y0); ctx.clip();
        for (const d of drops) {
          if (d.v === 0) { d.wait -= dt; if (d.wait <= 0) d.v = rnd(40, 110) * k; }
          else { d.y += d.v * dt; d.v *= 1 - 0.5 * dt; if (d.v < 10 * k) { d.v = 0; d.wait = rnd(1, 5); } }
          if (d.y > W.y1 + 10) { d.y = W.y0 + rnd(0, 0.3) * (W.y1 - W.y0); d.x = rnd(W.x0, W.x1); }
          if (d.v > 0) { const tr = ctx.createLinearGradient(0, d.y - d.r * 12, 0, d.y); tr.addColorStop(0, "rgba(255,255,255,0)"); tr.addColorStop(1, "rgba(255,255,255,0.12)");
            ctx.fillStyle = tr; ctx.fillRect(d.x - d.r * 0.4, d.y - d.r * 12, d.r * 0.8, d.r * 12); }
          ctx.fillStyle = "rgba(10,10,20,0.35)"; ctx.beginPath(); ctx.arc(d.x, d.y + d.r * 0.2, d.r, 0, T2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.35, 0, T2); ctx.fill();
        }
        ctx.restore();
        ctx.drawImage(front, 0, 0);
        // steam from the mug
        const mx = W.x0 + (W.x1 - W.x0) * 0.2, sy = W.y1 - 26 * k;
        for (const s of steam) { const u = (s.p + t * 0.08) % 1, y = sy - u * 70 * k, x = mx + s.x + Math.sin(t * 0.9 + u * 6) * 6 * k * u;
          glowDot(ctx, x, y, (5 + u * 12) * k, "235,225,215", 0.12 * Math.sin(u * Math.PI)); }
        drawCat(t, dt);
      },
    };
    function drawCat(t, dt) {
      const { x, y, s } = cat, br = 1 + 0.035 * Math.sin(t * 1.5);         // breathing
      cat.flick -= dt; let fl = 0; if (cat.flick < 0) { fl = Math.sin(-cat.flick * 6) * 0.5; if (cat.flick < -1) cat.flick = rnd(6, 14); }
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(0, 2 * k, s * 1.15, s * 0.12, 0, 0, T2); ctx.fill();
      // tail curling round the front
      ctx.strokeStyle = "#0e0a0c"; ctx.lineWidth = s * 0.16; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(s * 0.85, -s * 0.12);
      ctx.quadraticCurveTo(s * 0.7, s * 0.02, 0, -s * 0.02); ctx.quadraticCurveTo(-s * 0.5, -s * 0.04, -s * (0.75 + fl * 0.1), -s * (0.12 + fl * 0.25)); ctx.stroke();
      // body (a soft loaf) and head
      ctx.fillStyle = "#0e0a0c"; ctx.beginPath(); ctx.ellipse(s * 0.1, -s * 0.36 * br, s, s * 0.38 * br, 0, Math.PI, T2); ctx.lineTo(s * 1.1, 0); ctx.lineTo(-s * 0.9, 0); ctx.closePath(); ctx.fill();
      // the head resting on its paws, a little above the body line, ears up
      const hx = -s * 0.8, hy = -s * 0.44 - s * 0.02 * Math.sin(t * 1.5);
      const head = () => { ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.32, s * 0.27, -0.15, 0, T2);
        for (const [a, b, c] of [[-0.3, -0.1, -0.26], [0.04, 0.22, 0.06]]) { ctx.moveTo(hx + s * a, hy - s * 0.16); ctx.lineTo(hx + s * (a + b) / 2 - s * 0.02, hy - s * 0.48); ctx.lineTo(hx + s * b, hy - s * 0.2); }
        ctx.moveTo(hx + s * 0.3, hy + s * 0.2); ctx.ellipse(hx + s * 0.05, hy + s * 0.24, s * 0.26, s * 0.08, 0, 0, T2); };   // paws
      head(); ctx.fill();
      ctx.fillStyle = "rgba(60,40,60,0.9)"; for (const a of [-0.24, 0.12]) { ctx.beginPath(); ctx.moveTo(hx + s * a, hy - s * 0.18); ctx.lineTo(hx + s * (a + 0.07), hy - s * 0.38); ctx.lineTo(hx + s * (a + 0.13), hy - s * 0.2); ctx.fill(); }   // inner ears
      // closed eyes: two little curves catching the light
      ctx.strokeStyle = "rgba(200,190,240,0.45)"; ctx.lineWidth = Math.max(1, 1.1 * k);
      for (const a of [-0.16, 0.08]) { ctx.beginPath(); ctx.arc(hx + s * a, hy - s * 0.02, s * 0.05, 0.2, Math.PI - 0.2); ctx.stroke(); }
      // rim light from the city behind
      ctx.strokeStyle = "rgba(180,170,245,0.6)"; ctx.lineWidth = Math.max(1.2, 1.6 * k);
      ctx.beginPath(); ctx.ellipse(s * 0.1, -s * 0.36 * br, s, s * 0.38 * br, 0, Math.PI * 1.15, Math.PI * 1.95); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx, hy, s * 0.32, s * 0.27, -0.15, Math.PI * 1.1, Math.PI * 1.8); ctx.stroke();
      ctx.restore();
    }
  };

  // Tokyo Rooftop: a rainy neon city at night from a rooftop. Layers of towers with lit windows, glowing signs (one
  // flickers now and then), a red lattice tower with a blinking light, a train gliding along the elevated line, and
  // the wet roof reflecting it all.
  const tokyoRooftop = (ctx) => {
    let w = 0, h = 0, k = 1, back = null, front = null, flick = null, fl = null, rain = [], trainT = 3, horizon = 0, trackY = 0, tower = null;
    const NEON = ["255,63,164", "46,230,255", "255,179,71", "190,120,255", "120,255,170"];
    const sign = (g, x, y, sw, sh, c) => {          // a glowing sign: lit panel, bright rim, a few abstract "letters"
      g.save(); g.shadowColor = `rgba(${c},0.9)`; g.shadowBlur = 14 * k;
      g.fillStyle = `rgba(${c},0.22)`; g.fillRect(x, y, sw, sh); g.strokeStyle = `rgba(${c},0.95)`; g.lineWidth = Math.max(1, 1.6 * k); g.strokeRect(x, y, sw, sh);
      g.fillStyle = `rgba(${c},0.95)`; const vert = sh > sw;
      for (let i = 0; i < 4; i++) { if (vert) { const yy = y + sh * (0.1 + i * 0.22); g.fillRect(x + sw * 0.25, yy, sw * 0.5, sh * 0.1); g.fillRect(x + sw * 0.45, yy - sh * 0.03, sw * 0.1, sh * 0.16); }
        else { const xx = x + sw * (0.1 + i * 0.22); g.fillRect(xx, y + sh * 0.3, sw * 0.12, sh * 0.4); } }
      g.restore();
    };
    return {
      resize(Wd, Hd) {
        w = Wd; h = Hd; k = kOf(w, h); horizon = h * 0.6; trackY = h * 0.6;
        back = offscreen(w, h); const g = back.getContext("2d");
        sky(g, w, h, [[0, "#07061a"], [0.35, "#170c2c"], [0.6, "#3a1440"], [1, "#12081c"]]);
        glowDot(g, w * 0.5, horizon, Math.max(w, h) * 0.6, "255,80,160", 0.16);           // the city's glow in the low cloud
        // the lattice tower, far away
        const tx = w * 0.74, top = h * 0.16, base = horizon, tw = h * 0.07;
        g.strokeStyle = "rgba(255,90,70,0.75)"; g.lineWidth = Math.max(1, 1.4 * k); g.beginPath();
        g.moveTo(tx - tw, base); g.lineTo(tx, top); g.lineTo(tx + tw, base);
        for (let i = 1; i < 12; i++) { const u = i / 12, yy = base - (base - top) * u, hw = tw * (1 - u); g.moveTo(tx - hw, yy); g.lineTo(tx + hw, yy); if (i % 2) { g.moveTo(tx - hw, yy); g.lineTo(tx + tw * (1 - (i + 1) / 12), yy - (base - top) / 12); } }
        g.stroke(); g.fillStyle = "rgba(255,240,220,0.8)"; g.fillRect(tx - tw * 0.3, base - (base - top) * 0.62, tw * 0.6, 3 * k);   // the deck
        glowDot(g, tx, base - (base - top) * 0.4, tw * 2.2, "255,90,70", 0.12);
        tower = { x: tx, y: top };
        // skylines, far to near; the elevated railway sits between the middle and near rows
        const row = (gg, baseY, minH, maxH, col, winA, neon) => {
          for (let x = -20 * k; x < w + 20 * k; ) {
            const bw = rnd(40, 110) * k, bh = rnd(minH, maxH);
            gg.fillStyle = col; gg.fillRect(x, baseY - bh, bw, h - baseY + bh);
            for (let wy = baseY - bh + 7 * k; wy < baseY + h * 0.3; wy += 10 * k) for (let wx = x + 5 * k; wx < x + bw - 6 * k; wx += 9 * k)
              if (Math.random() < winA) { gg.fillStyle = Math.random() < 0.6 ? "rgba(255,210,150,0.6)" : "rgba(160,220,255,0.55)"; gg.fillRect(wx, wy, 4 * k, 5 * k); }
            if (neon && Math.random() < 0.55) { const c = NEON[(Math.random() * NEON.length) | 0], vert = Math.random() < 0.6;
              const sw = vert ? rnd(14, 22) * k : rnd(50, 90) * k, sh = vert ? rnd(60, 110) * k : rnd(14, 22) * k;
              sign(gg, x + rnd(4, Math.max(5, bw - sw - 4)), baseY - bh + rnd(8, 40) * k, sw, sh, c); }
            x += bw + rnd(0, 8) * k;
          }
        };
        row(g, horizon, h * 0.04, h * 0.16, "#1d1230", 0.12, false);
        row(g, horizon + h * 0.05, h * 0.08, h * 0.26, "#140c24", 0.18, true);
        // the elevated line
        g.fillStyle = "#0b0715"; g.fillRect(0, trackY, w, 7 * k);
        for (let x = 20 * k; x < w; x += 120 * k) g.fillRect(x, trackY, 8 * k, h - trackY);
        g.fillStyle = "rgba(255,120,200,0.25)"; g.fillRect(0, trackY, w, 1.2 * k);
        // the near row + the rooftop, drawn over the train
        front = offscreen(w, h); const f = front.getContext("2d");
        row(f, h * 0.83, h * 0.04, h * 0.17, "#0a0612", 0.22, true);
        // the flickering sign gets its own layer
        fl = { x: w * 0.12, y: h * 0.38, sw: 20 * k, sh: 110 * k, c: NEON[0] };
        flick = offscreen(fl.sw + 60 * k, fl.sh + 60 * k); sign(flick.getContext("2d"), 30 * k, 30 * k, fl.sw, fl.sh, fl.c);
        f.fillStyle = "#0a0612"; f.fillRect(fl.x - 20 * k, fl.y - 10 * k, 60 * k, h);         // the building it hangs on
        // the roof: wet concrete reflecting the neon, a railing, a water tank
        const ry = h * 0.86, rg = f.createLinearGradient(0, ry, 0, h); rg.addColorStop(0, "#120c1c"); rg.addColorStop(1, "#06040a"); f.fillStyle = rg; f.fillRect(0, ry, w, h - ry);
        f.save(); f.globalCompositeOperation = "lighter"; f.filter = `blur(${Math.round(4 * k)}px)`;
        for (let i = 0; i < 26; i++) { const c = NEON[i % NEON.length], x = rnd(0, w); f.fillStyle = `rgba(${c},${rnd(0.05, 0.14)})`; f.fillRect(x, ry + 4 * k, rnd(6, 30) * k, (h - ry) * rnd(0.4, 1)); }
        f.restore();
        f.fillStyle = "#05030a"; f.fillRect(0, ry - 4 * k, w, 6 * k); f.fillRect(0, ry - 46 * k, w, 3 * k); f.fillRect(0, ry - 24 * k, w, 2 * k);
        for (let x = 10 * k; x < w; x += 70 * k) f.fillRect(x, ry - 46 * k, 4 * k, 44 * k);
        const wx = w * 0.86, wtw = w * 0.07;
        f.fillRect(wx - wtw * 0.4, ry - h * 0.1, 4 * k, h * 0.1); f.fillRect(wx + wtw * 0.4, ry - h * 0.1, 4 * k, h * 0.1);
        f.beginPath(); f.ellipse(wx, ry - h * 0.1, wtw * 0.55, wtw * 0.12, 0, 0, T2); f.fill(); f.fillRect(wx - wtw * 0.55, ry - h * 0.24, wtw * 1.1, h * 0.14);
        f.beginPath(); f.moveTo(wx - wtw * 0.6, ry - h * 0.24); f.lineTo(wx, ry - h * 0.29); f.lineTo(wx + wtw * 0.6, ry - h * 0.24); f.fill();
        f.fillStyle = "rgba(255,90,170,0.25)"; f.fillRect(wx - wtw * 0.55, ry - h * 0.24, 1.5 * k, h * 0.14);   // neon catching its edge
        rain = Array.from({ length: Math.round(150 * Math.min(2, (w * h) / (1280 * 720))) }, () => ({ x: rnd(0, w), y: rnd(0, h), s: rnd(0.7, 1.3) }));
      },
      frame(t, dt) {
        ctx.drawImage(back, 0, 0);
        // the train: every half-minute or so, gliding left to right
        trainT -= dt;
        if (trainT < 0) {
          const dur = 16, u = -trainT / dur, L = w * 0.42, x = -L + u * (w + L * 2), ty = trackY - 16 * k;
          ctx.fillStyle = "#0d0918"; ctx.fillRect(x, ty, L, 15 * k);
          ctx.fillStyle = "rgba(255,226,170,0.85)"; for (let cx = x + 6 * k; cx < x + L - 8 * k; cx += 14 * k) ctx.fillRect(cx, ty + 4 * k, 8 * k, 5 * k);
          ctx.fillStyle = "rgba(46,230,255,0.7)"; ctx.fillRect(x, ty + 12 * k, L, 1.5 * k);
          glowDot(ctx, x + L, ty + 8 * k, 40 * k, "255,240,200", 0.35);
          if (u > 1) trainT = rnd(20, 40);
        }
        ctx.drawImage(front, 0, 0);
        // the sign that flickers: mostly on, with a stutter every so often
        const ph = (t * 0.13) % 1, on = ph < 0.9 || (Math.sin(t * 40) > 0.3);
        ctx.globalAlpha = on ? 0.85 + 0.15 * Math.sin(t * 2) : 0.15; ctx.drawImage(flick, fl.x - 30 * k, fl.y - 30 * k); ctx.globalAlpha = 1;
        // the tower's light blinks
        if (Math.sin(t * 2.2) > 0.6) glowDot(ctx, tower.x, tower.y, 9 * k, "255,60,60", 0.9);
        // drizzle, slanting slightly
        ctx.strokeStyle = "rgba(190,205,255,0.16)"; ctx.lineWidth = Math.max(1, 0.9 * k); ctx.beginPath();
        for (const r of rain) { r.y += 520 * k * r.s * dt; r.x += 60 * k * r.s * dt; if (r.y > h) { r.y = -20; r.x = rnd(-0.1, 1) * w; } if (r.x > w) r.x -= w;
          ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 3 * k * r.s, r.y - 22 * k * r.s); }
        ctx.stroke();
      },
    };
  };

  // ---------- a wallpaper's colours ----------
  // From RGBA pixel data: the strongest hue (accent) and a readable up / down candle pair. Used by the chart (auto
  // contrast, Skin colour, Auto-match) and by the panel's "Match everything".
  function paletteFromData(d, loose) {   // loose: also find sparse colour (the panel's Match everything)
    const bins = new Array(24).fill(null).map(() => ({ n: 0, r: 0, g: 0, b: 0, sat: 0 }));
    let colourful = 0, total = 0, lit = 0;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255; if (a < 0.4) continue;
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
      const sat = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      total++; if (l >= 0.08) lit++;
      if (sat < 0.18 || l < 0.08 || l > 0.95) continue;        // skip greys / near-black / near-white
      colourful++;
      let hue = 0;
      if (mx !== mn) { const dd = mx - mn;
        hue = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; hue *= 60; }
      const bi = Math.floor(hue / 15) % 24, wt = sat * (0.4 + 0.6 * (1 - Math.abs(l - 0.5) * 2));
      const bn = bins[bi]; bn.n += wt; bn.r += r * wt; bn.g += g * wt; bn.b += b * wt; bn.sat += sat * wt;
    }
    // mostly grey: nothing to match. Measured against the lit part, so sparse colour on black (Code Rain) still counts
    if (colourful < (loose ? Math.max(total * 0.0012, 12) : Math.max(total * 0.004, lit * 0.12))) return null;
    const avg = (bi) => { const bn = bins[bi]; return bn.n > 0 ? [bn.r / bn.n, bn.g / bn.n, bn.b / bn.n] : null; };
    const ranked = bins.map((b, i) => ({ i, n: b.n })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
    if (!ranked.length) return null;
    const top = ranked[0].i, accent = punch(avg(top));
    // Second colour = the strongest hue cluster that's clearly different from the first (>= ~90° away on the wheel).
    const far = (a, b) => { const d = Math.abs(a - b) * 15; return Math.min(d, 360 - d) >= 90; };
    let second = ranked.find((x) => far(x.i, top));
    const c1 = avg(top), c2 = second ? avg(second.i) : null;
    // Two distinct wallpaper colours → use both (greener one becomes "up"). One dominant colour → derive a
    // complementary pair around it so up/down stay clearly different and readable.
    let upRgb, downRgb;
    if (c2) {
      // "up" = the colour nearer green / teal / blue, "down" = the warmer one (red, orange, pink): traders read red as down
      const hueOfRgb = (c) => { const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const d = mx - mn;
        return ((mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60) % 360; };
      const toCool = (c) => { const d = Math.abs(hueOfRgb(c) - 165); return Math.min(d, 360 - d); };
      [upRgb, downRgb] = toCool(c1) <= toCool(c2) ? [c1, c2] : [c2, c1];
      upRgb = punch(upRgb); downRgb = punch(downRgb);
    } else {
      const accHue = top * 15;
      upRgb = punch(hslRgb(nearestNice(accHue, true)));
      downRgb = punch(hslRgb(nearestNice((accHue + 150) % 360, false)));
    }
    // colors: up to 5 of the wallpaper's own colours, strongest first, each at least ~40 deg apart on the colour wheel
    // and a real part of the picture (>= 6% of the strongest). Indicators and zones take these (Indicators: Wallpaper).
    const colors = [], pickedHues = [];
    for (const x of ranked) {
      if (colors.length >= 5 || x.n < ranked[0].n * 0.06) break;
      if (pickedHues.some((h) => { const d = Math.abs(h - x.i) * 15; return Math.min(d, 360 - d) < 40; })) continue;
      pickedHues.push(x.i); colors.push(hex(punch(avg(x.i))));
    }
    return { up: hex(upRgb), down: hex(downRgb), accent: hex(accent), colors };
  }
  const clampc = (v) => Math.max(0, Math.min(255, Math.round(v)));
  // rgb channels are 0..1 floats
  const hex = (rgb) => "#" + rgb.map((v) => clampc(v * 255).toString(16).padStart(2, "0")).join("");
  // boost saturation + set a readable lightness so candles pop on any art
  function punch(rgb) {
    if (!rgb) return [0, 0.88, 0.64];
    let [r, g, b] = rgb; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let l = (mx + mn) / 2;
    let h = 0, s = 0;
    if (mx !== mn) { const dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn);
      h = mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h /= 6; }
    s = Math.min(1, s * 1.5 + 0.35); l = Math.min(0.72, Math.max(0.5, l));
    return hslRgb([h * 360, s, l]);
  }
  // pick an "up" (green-leaning) or "down" (warm-leaning) hue near the accent but in a readable zone
  function nearestNice(hue, up) {
    const s = 0.85, l = 0.6;
    if (up) { const h = hue > 60 && hue < 200 ? hue : 150; return [h, s, l]; }
    const h = hue > 300 || hue < 60 ? hue : 340; return [h, s, l];
  }
  function hslRgb(hsl) {
    let [h, s, l] = hsl; h = ((h % 360) + 360) % 360 / 360;
    const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0), f(8), f(4)];
  }
  // ===================== Pack: night + trading =====================
  // Midnight: a quiet city at midnight. Deep night-blue sky, a thin crescent moon with a soft halo, faint clouds
  // drifting very slowly, and a dark skyline along the bottom where a window lights up or goes out now and then.
  // The chart area stays dark and even; everything is drawn once, a frame only copies and shifts it.
  const midnight = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, back = null, sky2 = null, clouds = null, glow = null, wins = [], city = null, cityY = 0;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); back = offscreen(w, h); const g = back.getContext("2d");
        const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, "#020309"); s.addColorStop(0.6, "#060b20"); s.addColorStop(1, "#0d1634"); g.fillStyle = s; g.fillRect(0, 0, w, h);
        glowDot(g, w * 0.5, h * 1.2, Math.max(w, h) * 0.75, "50,80,170", 0.2);          // the city's glow on the low sky
        for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(200,215,255,${rnd(0.06, 0.32).toFixed(2)})`; const r = rnd(0.6, 1.4) * k; g.fillRect(rnd(0, w), rnd(0, h * 0.62), r, r); }
        // the moon: a crescent (a disc with a sky-coloured disc over it), upper right, with a soft halo
        const mx = w * 0.8, my = h * 0.2, mr = Math.max(9, 26 * k);
        if (o.moon !== false) {
        glowDot(g, mx, my, mr * 7, "150,170,230", 0.10); glowDot(g, mx, my, mr * 2.4, "200,210,245", 0.12);
        const mc = offscreen(mr * 3, mr * 3), m = mc.getContext("2d");
        m.fillStyle = "#dfe6f7"; m.beginPath(); m.arc(mr * 1.5, mr * 1.5, mr, 0, T2); m.fill();
        m.globalCompositeOperation = "destination-out"; m.beginPath(); m.arc(mr * 1.5 + mr * 0.42, mr * 1.5 - mr * 0.18, mr * 0.9, 0, T2); m.fill();
        g.globalAlpha = 0.6; g.drawImage(mc, mx - mr * 1.5, my - mr * 1.5); g.globalAlpha = 1;   // soft, so prices read over it
        }
        // the skyline, drawn into its own layer (the windows twinkle on top of it)
        cityY = h * 0.8; city = offscreen(w, h - cityY + 2); const c = city.getContext("2d"); wins = [];
        for (let layer = 0; layer < 2; layer++) {
          const far = layer === 0; c.fillStyle = far ? "#0a1028" : "#04060f";
          for (let x = 0; x < w;) {
            const bw = rnd(26, 70) * k * (far ? 0.8 : 1), bh = (far ? rnd(0.25, 0.6) : rnd(0.15, 0.85)) * city.height;
            c.fillRect(x, city.height - bh, bw + 1, bh);
            if (!far) for (let wy = city.height - bh + 6 * k; wy < city.height - 4 * k; wy += 7 * k)
              for (let wx = x + 4 * k; wx < x + bw - 5 * k; wx += 7 * k) if (Math.random() < 0.16)
                wins.push({ x: wx, y: cityY + wy, warm: Math.random() < 0.8, on: Math.random() < 0.7, p: rnd(0, 400), sp: rnd(0.004, 0.012) });
            x += bw + (far ? rnd(-6, 4) : rnd(2, 10)) * k;
          }
        }
        // two faint cloud bands, drawn once twice as wide so they loop
        clouds = offscreen(w * 2, h * 0.5); const cl = clouds.getContext("2d");
        for (let i = 0; i < 26; i++) { const x = rnd(0, w), y = rnd(h * 0.05, h * 0.42), r = rnd(0.08, 0.2) * w;
          for (const dx of [0, w]) { cl.save(); cl.translate(x + dx, y); cl.scale(1, 0.18); glowDot(cl, 0, 0, r, "120,140,200", 0.05); cl.restore(); } }
        // a soft drifting glow, as a sprite (no gradient is built per frame)
        glow = offscreen(128, 128); glowDot(glow.getContext("2d"), 64, 64, 64, "70,60,190", 1);
      },
      frame(t) {
        ctx.drawImage(back, 0, 0);
        ctx.globalCompositeOperation = "lighter";
        const R = Math.max(w, h) * 0.42; ctx.globalAlpha = 0.07;
        ctx.drawImage(glow, w * (0.3 + 0.08 * Math.sin(t * 0.03)) - R, h * (0.45 + 0.06 * Math.cos(t * 0.025)) - R, R * 2, R * 2); ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        if (o.clouds !== false) { const off = (t * 3 * k) % w; ctx.drawImage(clouds, -off, 0); ctx.drawImage(clouds, -off + w * 2, 0); }
        if (o.skyline === false) return;
        ctx.drawImage(city, 0, cityY);
        // windows: each one switches on or off every few minutes (slow, never blinking)
        for (const q of wins) { const on = Math.sin(t * q.sp + q.p) > (q.on ? -0.4 : 0.4); if (!on) continue;
          ctx.fillStyle = q.warm ? "rgba(255,200,120,0.55)" : "rgba(170,210,255,0.45)"; ctx.fillRect(q.x, q.y, 2.4 * k, 3 * k); }
      },
    };
  };

  // Twinkle: true black (OLED pixels stay off) with stars that twinkle gently. The whole sky turns very slowly, so no
  // bright point ever stays in one place.
  const twinkle = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, st = [];
    const COL = ["255,255,255", "200,220,255", "255,236,210", "210,200,255"];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h);
        const n = Math.round((420 * Math.min(2, (w * h) / (1280 * 720)) + 60) * (o.amount || 1));
        st = Array.from({ length: n }, () => ({ a: rnd(0, T2), d: Math.sqrt(Math.random()) * Math.hypot(w, h) * 0.62, r: (Math.random() < 0.08 ? rnd(1.6, 2.4) : rnd(0.6, 1.4)) * k,
          p: rnd(0, T2), s: rnd(0.6, 1.8), c: COL[(Math.random() * COL.length) | 0], b: rnd(0.35, 1) })); },
      frame(t) {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
        const cx = w * 0.5, cy = h * 1.1, rot = t * 0.004;   // one turn every ~26 minutes
        for (const s of st) {
          const a = s.a + rot, x = cx + Math.cos(a) * s.d, y = cy + Math.sin(a) * s.d * 0.95 - h * 0.35;
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          const tw = 0.5 + 0.5 * Math.sin(t * s.s + s.p), al = s.b * (0.25 + 0.75 * tw * tw);
          ctx.fillStyle = `rgba(${s.c},${al.toFixed(3)})`; ctx.fillRect(x - s.r / 2, y - s.r / 2, s.r, s.r);
          if (o.sparkle !== false && s.r > 1.5 * k && tw > 0.8) {   // the brightest stars: a small soft sparkle at their peak
            const L = s.r * 3.2 * (tw - 0.8) * 5; ctx.fillStyle = `rgba(${s.c},${(al * 0.35).toFixed(3)})`;
            ctx.fillRect(x - L, y - 0.35 * k, L * 2, 0.7 * k); ctx.fillRect(x - 0.35 * k, y - L, 0.7 * k, L * 2); }
        }
      },
    };
  };

  // A small candle chart drawn into a screen (for the trading wallpapers): soft, low-contrast, never real data.
  // loop = true: the chart ends where it starts (drawn twice side by side it scrolls with no seam)
  const miniChart = (g, x, y, w, h, hue, n, seed, loop) => {
    let q = (Math.floor(seed * 1000) % 2147483646) + 1; const R = () => ((q = (q * 16807) % 2147483647) / 2147483647);
    const ph = [R() * T2, R() * T2, R() * T2], wave = (i) => 0.5 + 0.17 * Math.sin(T2 * i / n + ph[0]) + 0.09 * Math.sin(T2 * 2 * i / n + ph[1]) + 0.035 * Math.sin(T2 * 3 * i / n + ph[2]);
    let v = loop ? wave(n - 1) : 0.5 + 0.2 * Math.sin(seed), prev = v; const bw = w / n;
    for (let i = 0; i < n; i++) {
      v = loop ? wave(i) + (R() - 0.5) * 0.03 : Math.max(0.12, Math.min(0.88, v + (Math.sin(seed * 7 + i * 0.7) * 0.06 + (R() - 0.48) * 0.08)));
      const o = prev, c = v, hi = Math.max(o, c) + R() * 0.05, lo = Math.min(o, c) - R() * 0.05, up = c >= o;
      g.fillStyle = up ? `hsla(${hue},80%,60%,0.75)` : `hsla(${(hue + 190) % 360},75%,62%,0.7)`;
      const cx = x + i * bw + bw / 2; g.fillRect(cx - 0.5, y + h * (1 - hi), 1, h * (hi - lo));
      g.fillRect(cx - bw * 0.3, y + h * (1 - Math.max(o, c)), bw * 0.6, Math.max(1, h * Math.abs(c - o))); prev = c;
    }
  };

  // Trading Floor: a dark exchange floor in perspective. Rows of desks with glowing monitors fade into the haze, a
  // long quote board scrolls slowly overhead (symbols only, never made-up prices), a few screens refresh now and then.
  const tradingFloor = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, back = null, mons = [], board = null, bY = 0, bH = 0;
    const SYMS = ["NQ", "ES", "YM", "RTY", "CL", "GC", "SI", "BTC", "ETH", "EUR", "GBP", "JPY", "AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "SPY", "QQQ", "VIX", "ZN", "HG", "NG"];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); back = offscreen(w, h); const g = back.getContext("2d"); mons = [];
        const hz = h * 0.42, vx = w * 0.5;   // horizon + vanishing point
        const room = g.createLinearGradient(0, 0, 0, h); room.addColorStop(0, "#04060c"); room.addColorStop(0.42, "#0a1322"); room.addColorStop(1, "#05070d"); g.fillStyle = room; g.fillRect(0, 0, w, h);
        // ceiling light strips converging on the vanishing point
        for (let i = -6; i <= 6; i++) { const x0 = vx + i * w * 0.16; g.strokeStyle = `rgba(150,190,255,${0.05 + 0.02 * (6 - Math.abs(i)) / 6})`; g.lineWidth = Math.max(1, 3 * k * (1 - Math.abs(i) / 9));
          g.beginPath(); g.moveTo(x0, 0); g.lineTo(vx + i * w * 0.012, hz * 0.62); g.stroke(); }
        // desk rows, far to near: each row a band of monitors on a dark desk
        const rows = 9;
        for (let r = 0; r < rows; r++) {
          const z = r / (rows - 1), y = hz + (h - hz) * Math.pow(z, 1.65) * 0.92 + 6 * k, sc = 0.18 + z * 1.05, half = w * (0.12 + z * 0.62);
          const fog = 1 - z * 0.75;
          // desk
          g.fillStyle = `rgba(14,18,28,${0.6 + z * 0.4})`; g.fillRect(vx - half, y, half * 2, 10 * k * sc + 2);
          // monitors along the row, with a gap down the middle aisle
          const mw = 46 * k * sc, mh = 28 * k * sc, step = mw * 1.12;
          for (let x = vx - half; x < vx + half - mw; x += step) {
            if (Math.abs(x + mw / 2 - vx) < w * 0.03 * (0.3 + z)) continue;   // the aisle
            const hue = [150, 160, 195, 205, 40][(Math.random() * 5) | 0], scr = { x, y: y - mh - 2 * k * sc, w: mw, h: mh, hue, fog, p: rnd(0, 60) };
            g.fillStyle = "#06080e"; g.fillRect(scr.x - 1, scr.y - 1, mw + 2, mh + 2);
            g.fillStyle = `hsla(${hue},60%,${8 + 6 * fog}%,1)`; g.fillRect(scr.x, scr.y, mw, mh);
            if (mw > 9) miniChart(g, scr.x + mw * 0.08, scr.y + mh * 0.12, mw * 0.84, mh * 0.76, hue, Math.max(5, Math.round(mw / 3.5)), rnd(0, 100));
            glowDot(g, scr.x + mw / 2, scr.y + mh / 2, mw * 1.1, hue === 40 ? "255,190,110" : "90,200,230", 0.05 * fog);
            if (z > 0.35) mons.push(scr);
          }
          // haze over the far rows
          g.fillStyle = `rgba(10,19,34,${0.55 * (1 - z)})`; g.fillRect(0, y - mh - 6 * k, w, mh + 18 * k * sc);
        }
        // the floor's reflection of the light, and a vignette
        glowDot(g, vx, hz + h * 0.05, w * 0.55, "70,120,200", 0.08);
        const vg = g.createRadialGradient(vx, h * 0.55, h * 0.2, vx, h * 0.55, Math.max(w, h) * 0.8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.6)"); g.fillStyle = vg; g.fillRect(0, 0, w, h);
        // the quote board overhead: a dark band with LED symbols, drawn once wide, then scrolled
        bH = Math.max(14, 22 * k); bY = h * 0.08;
        const font = `700 ${Math.round(bH * 0.62)}px ui-monospace, Menlo, Consolas, monospace`, mc = offscreen(4, 4).getContext("2d"); mc.font = font;
        const loop = SYMS.reduce((a, s) => a + mc.measureText(s).width + bH * 1.6, 0);
        board = offscreen(Math.ceil(loop), bH); const b = board.getContext("2d");
        b.fillStyle = "#03050a"; b.fillRect(0, 0, board.width, bH); b.font = font; b.textBaseline = "middle";
        for (let x = bH * 0.8, i = 0; i < SYMS.length; i++) { const s = SYMS[i], up = Math.random() < 0.55;
          b.fillStyle = up ? "rgba(70,240,170,0.55)" : "rgba(255,120,120,0.45)"; b.fillText(s, x, bH / 2); x += b.measureText(s).width + bH * 1.6;
          b.fillStyle = "rgba(255,255,255,0.12)"; b.fillRect(x - bH * 0.8, bH * 0.3, 1, bH * 0.4); }
      },
      frame(t) {
        ctx.drawImage(back, 0, 0);
        // the quote board, scrolling slowly
        if (o.board !== false) {
        const off = (t * 18 * k) % board.width;
        ctx.globalAlpha = 0.9; for (let x = -off; x < w; x += board.width) ctx.drawImage(board, Math.round(x), bY); ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(120,170,255,0.12)"; ctx.fillRect(0, bY - 1, w, 1); ctx.fillRect(0, bY + bH, w, 1);
        }
        if (o.refresh === false) return;
        // a few screens gently brighten and fade, as if they refreshed
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < mons.length; i += 7) { const m = mons[i], a = Math.max(0, Math.sin(t * 0.25 + m.p)) * 0.12 * m.fog;
          if (a > 0.01) { ctx.fillStyle = `hsla(${m.hue},70%,60%,${a.toFixed(3)})`; ctx.fillRect(m.x, m.y, m.w, m.h); } }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  // Market Wall: a wall of trading screens, softly out of focus, their charts drifting slowly to the left.
  const marketWall = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, back = null, cells = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); back = offscreen(w, h); const g = back.getContext("2d"); cells = [];
        g.fillStyle = "#020306"; g.fillRect(0, 0, w, h);
        const cols = 5, rows = 3, gap = 10 * k, cw = (w - gap * (cols + 1)) / cols, ch = (h * 0.86 - gap * (rows + 1)) / rows, y0 = h * 0.07;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const x = gap + c * (cw + gap), y = y0 + gap + r * (ch + gap), hue = [150, 190, 210, 160, 30, 200, 145][(r * cols + c) % 7];
          // each screen's chart, drawn twice as wide and pre-blurred, so a frame only copies and shifts it
          const strip = offscreen(cw * 2, ch), sg = strip.getContext("2d");
          sg.fillStyle = `hsla(${hue},40%,7%,1)`; sg.fillRect(0, 0, strip.width, ch);
          sg.strokeStyle = "rgba(255,255,255,0.05)"; sg.lineWidth = 1; for (let gy = ch / 5; gy < ch; gy += ch / 5) { sg.beginPath(); sg.moveTo(0, gy); sg.lineTo(strip.width, gy); sg.stroke(); }
          const seed = rnd(0, 100); miniChart(sg, 0, ch * 0.12, cw, ch * 0.76, hue, 24, seed, true); miniChart(sg, cw, ch * 0.12, cw, ch * 0.76, hue, 24, seed, true);   // seamless loop
          const blurred = offscreen(cw * 2, ch), bg = blurred.getContext("2d"); const fb = (o.focus === undefined ? 1 : +o.focus) * Math.max(0.8, 1.3 * k); if (fb > 0.05) bg.filter = `blur(${fb.toFixed(1)}px)`; bg.drawImage(strip, 0, 0); bg.filter = "none";
          cells.push({ x, y, w: cw, h: ch, img: blurred, sp: rnd(3, 7) * k, p: rnd(0, cw), hue });
          // bezel + the screen's glow on the wall
          g.fillStyle = "#07090f"; g.fillRect(x - 2, y - 2, cw + 4, ch + 4);
          glowDot(g, x + cw / 2, y + ch / 2, Math.max(cw, ch) * 0.9, hue === 30 ? "255,170,90" : "80,190,230", 0.05);
        }
        // the vignette, drawn once at a small size and stretched each frame (a full-screen gradient per frame is slow)
        const vc = offscreen(160, 90), v = vc.getContext("2d"), vg = v.createRadialGradient(80, 45, 90 * 0.25, 80, 45, 160 * 0.75);
        vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)"); v.fillStyle = vg; v.fillRect(0, 0, 160, 90); cells.vg = vc;
      },
      frame(t) {
        ctx.drawImage(back, 0, 0);
        for (const c of cells) { const off = (c.p + (o.drift === false ? 0 : t) * c.sp) % c.w; ctx.drawImage(c.img, off, 0, c.w, c.h, c.x, c.y, c.w, c.h); }
        ctx.drawImage(cells.vg, 0, 0, w, h);
      },
    };
  };

  window.PriismPalette = { fromData: paletteFromData, hex };

  // ---------- wallpaper labels: quality (resolution) and OLED ----------
  // OLED screens turn true-black pixels off: a wallpaper suits them when most of it is true black, it's dark overall,
  // and no bright part stays in one place (that can burn in). Built-in wallpapers carry oled: true (measured with the
  // same rule, pwtest/oledscan.js); uploads and Workshop wallpapers are measured with measure().
  const qualityOf = (w, h) => { if (!w || !h) return ""; const sh = Math.min(w, h); return sh >= 2000 ? "4K" : sh >= 1400 ? "1440p" : sh >= 1000 ? "1080p" : sh >= 700 ? "720p" : "Low res"; };
  function oledFrom(frames) {   // frames: RGBA byte arrays of the same small size (one for a picture, a few for a video)
    if (!frames.length) return false; const n = frames[0].length / 4; let black = 0, lum = 0, stat = 0;
    for (let p = 0; p < n; p++) { let allBright = true;
      for (const d of frames) { const i = p * 4, mx = Math.max(d[i], d[i + 1], d[i + 2]), L = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
        if (mx <= 14) black++; lum += L; if (L < 0.45) allBright = false; }
      if (allBright) stat++; }
    const S = frames.length; return black / n / S >= 0.6 && lum / n / S <= 0.09 && stat / n <= 0.01;
  }
  // measure a picture / video (a Blob or a URL): { w, h, quality, oled }
  async function measureWall(src, type) {
    const url = typeof src === "string" ? src : URL.createObjectURL(src), c = document.createElement("canvas"); c.width = 192; c.height = 108;
    const g = c.getContext("2d", { willReadFrequently: true }), grab = (el) => { g.clearRect(0, 0, 192, 108); g.drawImage(el, 0, 0, 192, 108); return g.getImageData(0, 0, 192, 108).data.slice(); };
    try {
      if (type === "video" || (src && src.type && src.type.startsWith("video/"))) {
        const v = document.createElement("video"); v.muted = true; v.preload = "auto"; v.crossOrigin = "anonymous"; v.src = url;
        await new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error("can't read the video")); setTimeout(r, 8000); });
        const frames = [];
        for (const f of [0.15, 0.5, 0.85]) { if (!v.duration || !isFinite(v.duration)) break; v.currentTime = v.duration * f; await new Promise((r) => { v.onseeked = r; setTimeout(r, 2500); }); try { frames.push(grab(v)); } catch {} }
        if (!frames.length) try { frames.push(grab(v)); } catch {}
        return { w: v.videoWidth, h: v.videoHeight, quality: qualityOf(v.videoWidth, v.videoHeight), oled: oledFrom(frames) };
      }
      const im = new Image(); im.crossOrigin = "anonymous"; im.src = url; await im.decode();
      let fr = []; try { fr = [grab(im)]; } catch {}
      return { w: im.naturalWidth, h: im.naturalHeight, quality: qualityOf(im.naturalWidth, im.naturalHeight), oled: oledFrom(fr) };
    } finally { if (typeof src !== "string") URL.revokeObjectURL(url); }
  }
  window.PriismWallInfo = { qualityOf, oledFrom, measure: measureWall };
  // ---------- Live mood looks (shared by the chart and the panel's preview) ----------
  // look: glow (soft light around the edges) | horizon (a light rising from the bottom when up, the top when down;
  // no frame) | frame (a fine lit outline). col = #rrggbb, k = 0..1 how strong, dir = +1 up / -1 down.
  window.PriismMood = {
    LOOKS: ["glow", "horizon", "frame"],
    css(look, col, k, dir) {
      const a = (x) => col + Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0"), at = dir >= 0 ? "106%" : "-6%";
      if (look === "horizon") return { shadow: "none", bg: `radial-gradient(ellipse 130% ${45 + 35 * k}% at 50% ${at}, ${a(0.42)}, ${a(0.14)} 45%, transparent 78%)`, op: 0.25 + 0.75 * k };
      if (look === "frame") return { shadow: `inset 0 0 0 1.5px ${a(0.9)}, inset 0 0 ${10 + 22 * k}px 1px ${a(0.55)}`, bg: "none", op: 0.3 + 0.7 * k };
      return { shadow: `inset 0 0 ${40 + 110 * k}px ${2 + 10 * k}px ${a(0.6)}`, bg: `radial-gradient(ellipse 90% 60% at 50% ${at}, ${a(0.25)}, transparent 70%)`, op: 0.18 + 0.82 * k };
    },
  };
  // ---------- pattern skins (the chart frame + TradingView's bars) ----------
  // Small repeating tiles, drawn here (Priism's own art), in white on transparent: used as a MASK over a colour (one
  // colour, a gradient, rainbow, the Live mood colour), so any pattern takes any colours. [id, label, tile w, h, svg]
  const PAT = [
    ["carbon", "Carbon", 8, 8, '<rect width="4" height="4" opacity=".9"/><rect x="4" y="4" width="4" height="4" opacity=".9"/><rect x="4" width="4" height="4" opacity=".32"/><rect y="4" width="4" height="4" opacity=".32"/>'],
    ["hex", "Hex", 28, 48, '<path d="M0 8L14 0L28 8V24L14 32L0 24Z M14 32V48" fill="none" stroke="#fff" stroke-width="1.4"/>'],
    ["circuit", "Circuit", 32, 32, '<path d="M0 8H10L16 14V32 M16 0V4 M22 0V10L28 16H32 M4 24H10 M26 26H32" fill="none" stroke="#fff" stroke-width="1.3"/><circle cx="10" cy="24" r="1.8"/><circle cx="16" cy="4" r="1.8"/><circle cx="26" cy="26" r="1.8"/>'],
    ["stripes", "Stripes", 10, 10, '<path d="M-2 2L2 -2 M0 10L10 0 M8 12L12 8" stroke="#fff" stroke-width="2.2"/>'],
    ["dots", "Dots", 10, 10, '<circle cx="5" cy="5" r="1.5"/>'],
    ["grid", "Grid", 14, 14, '<path d="M14 0V14H0" fill="none" stroke="#fff" stroke-width="1"/>'],
    ["waves", "Waves", 24, 12, '<path d="M0 6Q6 0 12 6T24 6" fill="none" stroke="#fff" stroke-width="1.5"/>'],
    ["chevron", "Chevron", 16, 10, '<path d="M0 8L8 2L16 8" fill="none" stroke="#fff" stroke-width="1.7"/>'],
    ["diamond", "Diamond", 16, 16, '<path d="M8 1L15 8L8 15L1 8Z" fill="none" stroke="#fff" stroke-width="1.2"/>'],
    ["scales", "Scales", 20, 10, '<path d="M0 10A10 10 0 0 1 20 10 M-10 0A10 10 0 0 1 10 0 M10 0A10 10 0 0 1 30 0" fill="none" stroke="#fff" stroke-width="1.2"/>'],
    // textures (organic, made to tile seamlessly: what leaves one edge comes back on the other)
    ["zebra", "Zebra", 48, 48, '<path d="M0 6C12 0 20 12 32 6S44 2 48 6V12C40 10 30 18 18 13S6 10 0 12Z"/><path d="M0 22C10 18 22 27 34 21S44 19 48 22V27C38 26 30 33 20 29S8 25 0 28Z"/><path d="M0 38C14 33 20 44 30 39S42 35 48 38V43C40 42 34 47 24 45S10 41 0 44Z"/><path d="M30 13C34 16 38 15 40 18C36 18 33 17 30 13Z"/><path d="M8 29C12 32 15 31 17 34C13 34 10 33 8 29Z"/>'],
    ["camo", "Camo", 64, 64, '<path d="M6 8C14 2 24 6 22 14S10 22 6 18S0 12 6 8Z" opacity=".9"/><path d="M34 4C44 2 52 8 48 16S36 20 32 14S28 6 34 4Z" opacity=".5"/><path d="M40 30C50 26 60 32 58 40S46 50 40 46S32 34 40 30Z" opacity=".9"/><path d="M10 34C18 30 26 36 24 44S12 52 8 48S2 38 10 34Z" opacity=".5"/><path d="M26 50C32 48 38 52 36 58S28 62 24 58S20 52 26 50Z" opacity=".9"/><path d="M26 22C30 20 36 24 34 28S28 32 26 30S22 24 26 22Z" opacity=".3"/>'],
    ["leopard", "Leopard", 40, 40, '<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M6 8A5 5 0 0 1 14 6M15 10A5 5 0 0 1 9 15"/><path d="M26 20A5 5 0 0 1 34 19M34 24A5 5 0 0 1 27 27"/><path d="M8 28A4 4 0 0 1 15 29M14 33A4 4 0 0 1 8 33"/><path d="M27 4A3 3 0 0 1 32 6"/></g><circle cx="10" cy="11" r="1.6" opacity=".5"/><circle cx="30" cy="23" r="1.6" opacity=".5"/>'],
    ["topo", "Topo", 60, 60, '<g fill="none" stroke="#fff" stroke-width="1.1"><path d="M18 14C26 8 38 12 38 22S26 34 18 30S10 20 18 14Z"/><path d="M20 18C25 15 33 17 33 23S25 30 20 27S15 21 20 18Z"/><path d="M23 21C26 20 29 21 29 23S26 26 24 25S21 22 23 21Z"/><path d="M40 40C48 36 56 42 54 50S42 58 38 52S34 44 40 40Z"/><path d="M42 44C46 42 51 45 50 49S44 53 42 50S39 46 42 44Z"/><path d="M4 44C10 42 14 48 10 52S2 52 2 48S2 45 4 44Z"/></g>'],
    ["stars", "Stars", 64, 64, '<circle cx="6" cy="9" r="1.1"/><circle cx="23" cy="4" r=".7" opacity=".7"/><circle cx="40" cy="14" r="1.6"/><circle cx="57" cy="7" r=".8" opacity=".6"/><circle cx="12" cy="30" r=".6" opacity=".5"/><circle cx="31" cy="26" r="1" opacity=".85"/><circle cx="50" cy="36" r=".7" opacity=".6"/><circle cx="8" cy="50" r="1.4"/><circle cx="26" cy="46" r=".7" opacity=".6"/><circle cx="44" cy="56" r="1.1" opacity=".9"/><circle cx="60" cy="52" r=".6" opacity=".5"/><circle cx="36" cy="40" r=".5" opacity=".4"/>'],
    ["twinkle", "Twinkle", 48, 48, '<path d="M12 6Q12.6 11.4 18 12Q12.6 12.6 12 18Q11.4 12.6 6 12Q11.4 11.4 12 6Z"/><path d="M36 28Q36.4 31.6 40 32Q36.4 32.4 36 36Q35.6 32.4 32 32Q35.6 31.6 36 28Z" opacity=".8"/><circle cx="34" cy="10" r="1"/><circle cx="10" cy="38" r=".9" opacity=".7"/><circle cx="24" cy="24" r=".6" opacity=".6"/><circle cx="44" cy="44" r=".7" opacity=".6"/>'],
    ["solid", "Solid", 0, 0, ""],
  ];
  const PMETA = Object.fromEntries(PAT.map(([id, name, w, h, body]) => [id, { id, name, w, h, body }]));
  const svgOf = (p) => `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}" fill="#fff">${p.body}</svg>`;
  const urlOf = (id) => { const p = PMETA[id]; return p && p.w ? `url("data:image/svg+xml,${encodeURIComponent(svgOf(p))}")` : "none"; };
  const RAINBOW = ["#ff4d6d", "#ffb84d", "#f9f871", "#4dff9a", "#4dd8ff", "#7c6cff", "#ff4df0"];
  const GALAXY_CSS = ["radial-gradient(1.2px 1.2px at 12% 22%, #fff 60%, transparent 62%)", "radial-gradient(1px 1px at 37% 71%, #fff 60%, transparent 62%)",
    "radial-gradient(1.6px 1.6px at 61% 35%, #ffffffee 60%, transparent 62%)", "radial-gradient(1px 1px at 82% 64%, #dfe8ff 60%, transparent 62%)",
    "radial-gradient(1.3px 1.3px at 90% 15%, #fff 60%, transparent 62%)", "radial-gradient(.9px .9px at 24% 88%, #fff 60%, transparent 62%)",
    "radial-gradient(60% 80% at 20% 30%, #6a3cff99, transparent 70%)", "radial-gradient(50% 70% at 80% 70%, #ff3dae88, transparent 70%)",
    "radial-gradient(40% 60% at 55% 40%, #3dc8ff66, transparent 70%)", "linear-gradient(135deg, #0b0630, #1a0b4a 40%, #071a3a)"].join(", ");
  const imgs = {};
  window.PriismPatterns = {
    LIST: PAT.map(([id, name]) => [id, name]), META: PMETA, RAINBOW,
    // CSS: the mask image + its tile size (scale 0.5..2) for a pattern
    mask(id, scale) { const p = PMETA[id] || PMETA.carbon, s = Math.max(0.5, Math.min(2.5, +scale || 1));
      return { image: urlOf(p.id), size: p.w ? `${(p.w * s).toFixed(1)}px ${(p.h * s).toFixed(1)}px` : "auto", w: p.w * s, h: p.h * s }; },
    // CSS background for a colour choice. o = { mode, color, color2, up, down, accent, mood, round }
    // mode: accent | candles (up → down) | gradient (your two colours) | rainbow | custom | mood (the Live mood colour)
    //       | aurora (soft colours that slowly flow; the moving part is CSS, class bd-aurora)
    paint(o) {
      const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || ""), A = ok(o.accent) ? o.accent : "#7c6cff";
      if (o.mode === "candles") return `linear-gradient(135deg, ${ok(o.up) ? o.up : "#26a69a"}, ${ok(o.down) ? o.down : "#ef5350"})`;
      if (o.mode === "gradient") return `linear-gradient(135deg, ${ok(o.color) ? o.color : A}, ${ok(o.color2) ? o.color2 : "#ff4df0"})`;
      if (o.mode === "rainbow") return o.round ? `conic-gradient(from 200deg, ${RAINBOW.join(", ")}, ${RAINBOW[0]})` : `linear-gradient(90deg, ${RAINBOW.join(", ")})`;
      if (o.mode === "custom") return ok(o.color) ? o.color : A;
      if (o.mode === "mood") return `var(--bd-mood-col, ${A})`;
      if (o.mode === "aurora") return `linear-gradient(120deg, ${A}, #4dd8ff, #7c6cff, #ff4df0, #4dffb4, ${A})`;   // slowly flowing (bd-aurora)
      // a night sky: tiny stars over a purple / blue / pink nebula (best with the Solid pattern)
      if (o.mode === "galaxy") return GALAXY_CSS;
      // holographic foil: shifting pastel rainbow with a sheen
      if (o.mode === "holo") return `linear-gradient(115deg, rgba(255,255,255,.0) 30%, rgba(255,255,255,.55) 45%, rgba(255,255,255,0) 60%), conic-gradient(from 30deg, #ffb3f0, #b3c7ff, #b3fff1, #f9ffb3, #ffcfb3, #ffb3f0)`;
      return A;
    },
    // the same colours for a canvas (snapshots, clips, panel previews), over a box
    canvasPaint(g, o, x, y, w, h) {
      const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || ""), A = ok(o.accent) ? o.accent : "#7c6cff";
      const lin = (cols) => { const gr = g.createLinearGradient(x, y, x + w, y + h); cols.forEach((c, i) => gr.addColorStop(i / Math.max(1, cols.length - 1), c)); return gr; };
      if (o.mode === "candles") return lin([ok(o.up) ? o.up : "#26a69a", ok(o.down) ? o.down : "#ef5350"]);
      if (o.mode === "gradient") return lin([ok(o.color) ? o.color : A, ok(o.color2) ? o.color2 : "#ff4df0"]);
      if (o.mode === "rainbow") { if (o.round && g.createConicGradient) { const gr = g.createConicGradient((200 - 90) * Math.PI / 180, x + w / 2, y + h / 2); [...RAINBOW, RAINBOW[0]].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c)); return gr; }
        const gr = g.createLinearGradient(x, 0, x + w, 0); RAINBOW.forEach((c, i) => gr.addColorStop(i / (RAINBOW.length - 1), c)); return gr; }
      if (o.mode === "custom") return ok(o.color) ? o.color : A;
      if (o.mode === "mood") return ok(o.mood) ? o.mood : A;
      if (o.mode === "aurora") return lin([A, "#4dd8ff", "#7c6cff", "#ff4df0", "#4dffb4"]);
      if (o.mode === "holo") return lin(["#ffb3f0", "#b3c7ff", "#b3fff1", "#f9ffb3", "#ffcfb3", "#ffb3f0"]);
      if (o.mode === "galaxy") { const t = document.createElement("canvas"); t.width = Math.max(8, Math.ceil(w)); t.height = Math.max(8, Math.ceil(h)); const q = t.getContext("2d");
        const bg = q.createLinearGradient(0, 0, t.width, t.height); bg.addColorStop(0, "#0b0630"); bg.addColorStop(0.4, "#1a0b4a"); bg.addColorStop(1, "#071a3a"); q.fillStyle = bg; q.fillRect(0, 0, t.width, t.height);
        for (const [cx, cy, r, c] of [[0.2, 0.3, 0.6, "106,60,255,0.6"], [0.8, 0.7, 0.5, "255,61,174,0.55"], [0.55, 0.4, 0.4, "61,200,255,0.4"]]) {
          const R = r * Math.max(t.width, t.height), gr = q.createRadialGradient(cx * t.width, cy * t.height, 0, cx * t.width, cy * t.height, R); gr.addColorStop(0, `rgba(${c})`); gr.addColorStop(1, "rgba(0,0,0,0)"); q.fillStyle = gr; q.fillRect(0, 0, t.width, t.height); }
        q.fillStyle = "#fff"; let seed = 11; const rr = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let i = 0; i < (t.width * t.height) / 900; i++) { q.globalAlpha = 0.4 + rr() * 0.6; q.beginPath(); q.arc(rr() * t.width, rr() * t.height, 0.4 + rr() * 1.1, 0, Math.PI * 2); q.fill(); }
        q.globalAlpha = 1; return g.createPattern(t, "no-repeat"); }
      return A;
    },
    // the tile as an image (loaded once) for canvas drawing; null until it has loaded
    image(id) { const p = PMETA[id]; if (!p || !p.w) return null; let im = imgs[id];
      if (!im) { im = imgs[id] = new Image(); im.src = "data:image/svg+xml," + encodeURIComponent(svgOf(p)); } return im.complete && im.naturalWidth ? im : null; },
    // Draw a patterned band (a frame of width bw inside the box x,y,w,h; bw = 0: fill the whole box) on a canvas.
    // o = paint options + { pattern, scale, alpha, radius, edge, dpr }
    band(g, x, y, w, h, bw, o) {
      if (w < 4 || h < 4 || typeof document === "undefined") return;
      const dpr = o.dpr || 1, oc = document.createElement("canvas"); oc.width = Math.ceil(w); oc.height = Math.ceil(h);
      const q = oc.getContext("2d"), r = Math.max(0, +o.radius || 0) * dpr, B = bw * dpr;
      const rr = (X, Y, W, H, R) => { q.beginPath(); if (q.roundRect && R > 0) q.roundRect(X, Y, W, H, Math.max(0, Math.min(R, W / 2, H / 2))); else q.rect(X, Y, W, H); };
      q.fillStyle = this.canvasPaint(q, o, 0, 0, w, h); q.fillRect(0, 0, w, h);
      const im = o.pattern === "solid" ? null : this.image(o.pattern || "carbon");
      if (im) {                                     // keep the colour only where the pattern is
        const s = Math.max(0.5, Math.min(2.5, +o.scale || 1)) * dpr, t = document.createElement("canvas"), p = PMETA[o.pattern] || PMETA.carbon;
        t.width = Math.max(1, Math.round(p.w * s)); t.height = Math.max(1, Math.round(p.h * s)); t.getContext("2d").drawImage(im, 0, 0, t.width, t.height);
        q.globalCompositeOperation = "destination-in"; q.fillStyle = q.createPattern(t, "repeat"); q.fillRect(0, 0, w, h);
      } else if (o.pattern !== "solid") return;     // the tile isn't loaded yet
      q.globalCompositeOperation = "destination-in"; rr(0, 0, w, h, r); q.fillStyle = "#000"; q.fill();
      if (B > 0) { q.globalCompositeOperation = "destination-out"; rr(B, B, w - 2 * B, h - 2 * B, Math.max(0, r - B)); q.fill(); }
      if (o.edge && B > 0) {                         // a fine line along the inside edge
        q.globalCompositeOperation = "source-over"; q.strokeStyle = this.canvasPaint(q, o, 0, 0, w, h); q.lineWidth = 1.2 * dpr; q.globalAlpha = 0.9;
        rr(B - 0.6 * dpr, B - 0.6 * dpr, w - 2 * B + 1.2 * dpr, h - 2 * B + 1.2 * dpr, Math.max(0, r - B)); q.stroke(); }
      const pa = g.globalAlpha; g.globalAlpha = pa * Math.max(0, Math.min(1, +o.alpha || 0.5)); g.drawImage(oc, x, y); g.globalAlpha = pa;
    },
  };
  // ---------- trade panel: TradingView's Buy / Sell buttons (shared by the chart and the panel's preview) ----------
  // o = { buy, sell (#hex), shape: rounded | pill | square, style: solid | glass | outline | neon }. Returns the CSS
  // declarations for a Buy button and a Sell button (only how they look; what they do is TradingView's own).
  window.PriismTradeLook = (o) => {
    const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || ""), rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const lum = (c) => rgb(c).reduce((a, v, i) => a + (v / 255) * [0.2126, 0.7152, 0.0722][i], 0);
    const a = (c, x) => `rgba(${rgb(c).join(",")},${x})`;
    const rad = o.shape === "pill" ? "999px" : o.shape === "square" ? "2px" : "8px";
    const one = (c) => {
      const s = o.style || "solid", txt = lum(c) > 0.6 ? "#0b0e14" : "#ffffff";
      if (s === "glass") return { background: a(c, 0.28), color: "#ffffff", border: `1px solid ${a(c, 0.75)}`, "border-radius": rad, "backdrop-filter": "blur(10px) saturate(1.3)", "box-shadow": `inset 0 1px 0 rgba(255,255,255,.25)` };
      if (s === "outline") return { background: a(c, 0.08), color: c, border: `1.5px solid ${c}`, "border-radius": rad, "box-shadow": "none" };
      if (s === "neon") return { background: a(c, 0.14), color: "#ffffff", border: `1.5px solid ${c}`, "border-radius": rad, "box-shadow": `0 0 12px ${a(c, 0.7)}, inset 0 0 8px ${a(c, 0.35)}`, "text-shadow": `0 0 6px ${a(c, 0.9)}` };
      return { background: c, color: txt, border: `1px solid ${c}`, "border-radius": rad, "box-shadow": "none" };
    };
    return { buy: one(ok(o.buy) ? o.buy : "#2962ff"), sell: one(ok(o.sell) ? o.sell : "#f23645"), rad };
  };
  // ---------- fonts for the price scale, the ticker and TradingView's panels ----------
  // [id, label, bundled file in src/fonts (null = the computer's own), CSS family]. Bundled fonts are all SIL Open Font
  // Licence (see src/fonts/LICENSES.md) and load from Priism itself, never from the internet.
  const fam = (file, fallback) => `"Priism ${file}", ${fallback}`, SANS = "system-ui, sans-serif", MONO = 'ui-monospace, Menlo, Consolas, monospace';
  window.PriismFonts = [
    ["default", "Default", null, ""],
    ["inter", "Inter", "inter", fam("inter", SANS)], ["outfit", "Outfit", "outfit", fam("outfit", SANS)], ["grotesk", "Grotesk", "grotesk", fam("grotesk", SANS)],
    ["sora", "Sora", "sora", fam("sora", SANS)], ["rounded", "Rounded", "nunito", fam("nunito", '"SF Pro Rounded", ui-rounded, ' + SANS)],
    ["mono", "Mono", null, 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace'], ["jetbrains", "JetBrains", "jetbrains", fam("jetbrains", MONO)],
    ["plexmono", "Plex Mono", "plexmono", fam("plexmono", MONO)], ["sharetech", "Digital", "sharetech", fam("sharetech", MONO)],
    ["rajdhani", "Rajdhani", "rajdhani", fam("rajdhani", SANS)], ["chakra", "Chakra", "chakra", fam("chakra", SANS)],
    ["exo", "Exo", "exo", fam("exo", SANS)], ["orbitron", "Orbitron", "orbitron", fam("orbitron", SANS)],
  ];

  // ---------- Effects: weather and particles over ANY wallpaper (built-in or your own upload) ----------
  // Each effect draws on its own see-through layer above the wallpaper (cleared every frame), so it works the same
  // over a video, a picture or a live wallpaper, and never smears into wallpapers that build up over time.
  // o.amount 0.3..2. Calm by design: soft alphas, slow movement, lightning rare and gentle (never strobing).
  const area = (w, h) => Math.max(0.25, Math.min(2.5, (w * h) / (1280 * 720)));
  const fxRain = (ctx, o = {}, heavy) => {
    let w = 0, h = 0, k = 1, d = [];
    const mk = (init) => ({ x: rnd(-0.1, 1.1), y: init ? rnd(0, 1) : rnd(-0.2, 0), l: rnd(12, 26), v: rnd(0.9, 1.4), a: rnd(0.12, 0.3) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); d = Array.from({ length: Math.round((heavy ? 320 : 190) * (o.amount || 1) * area(w, h)) }, () => mk(true)); },
      frame(t, dt) {
        const wind = heavy ? 0.22 : 0.12;
        ctx.lineWidth = Math.max(1, 1.1 * k); ctx.lineCap = "round";
        for (let band = 0; band < 3; band++) {          // three alpha bands = three strokes per frame, not hundreds
          ctx.strokeStyle = `rgba(190,210,235,${[0.18, 0.28, 0.4][band]})`; ctx.beginPath();
          for (let i = band; i < d.length; i += 3) { const p = d[i];
            p.y += p.v * dt * (heavy ? 1.25 : 1); p.x -= p.v * dt * wind;
            if (p.y > 1.05 || p.x < -0.15) { d[i] = mk(false); continue; }
            const x = p.x * w, y = p.y * h, L = p.l * k; ctx.moveTo(x, y); ctx.lineTo(x + L * wind, y - L); }
          ctx.stroke();
        }
      },
    };
  };
  const fxStorm = (ctx, o = {}) => {
    const rain = fxRain(ctx, o, true);
    let w = 0, h = 0, k = 1, next = rnd(4, 9), flash = null;
    const bolt = () => { const pts = [[rnd(0.15, 0.85) * w, 0]]; let x = pts[0][0], y = 0; const end = rnd(0.35, 0.65) * h;
      while (y < end) { y += rnd(0.03, 0.07) * h; x += rnd(-0.04, 0.04) * w; pts.push([x, y]); } return pts; };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); rain.resize(W, H); },
      frame(t, dt) {
        rain.frame(t, dt);
        if (o.lightning === false) return;
        next -= dt;
        if (!flash && next <= 0) { flash = { t: 0, pts: bolt() }; next = rnd(9, 22) / Math.max(0.5, o.amount || 1); }
        if (!flash) return;
        flash.t += dt; const f = flash.t;
        // two soft pulses in ~0.45 s (well under 3 flashes a second), then gone
        const a = f < 0.12 ? f / 0.12 : f < 0.2 ? 1 - (f - 0.12) / 0.08 * 0.7 : f < 0.3 ? 0.3 + (f - 0.2) / 0.1 * 0.4 : Math.max(0, 0.7 - (f - 0.3) / 0.15 * 0.7);
        if (f > 0.45) { flash = null; return; }
        ctx.fillStyle = `rgba(200,215,255,${(0.13 * a).toFixed(3)})`; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = `rgba(235,240,255,${(0.75 * a).toFixed(3)})`; ctx.lineWidth = Math.max(1, 1.6 * k); ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(170,190,255,0.9)"; ctx.shadowBlur = 14 * k;
        ctx.beginPath(); flash.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.shadowBlur = 0;
      },
    };
  };
  const fxSnow = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, s = [];
    const mk = (init) => ({ x: rnd(0, 1), y: init ? rnd(0, 1) : -0.02, r: rnd(0.7, 2.6), v: rnd(0.02, 0.06), p: rnd(0, T2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); s = Array.from({ length: Math.round(200 * (o.amount || 1) * area(w, h)) }, () => mk(true)); },
      frame(t, dt) {
        ctx.fillStyle = "rgba(240,245,255,0.75)"; ctx.beginPath();
        for (let i = 0; i < s.length; i++) { const p = s[i];
          p.y += p.v * dt * (0.6 + p.r / 3); p.x += Math.sin(t * 0.6 + p.p) * 0.012 * dt;
          if (p.y > 1.02) { s[i] = mk(false); continue; }
          const x = ((p.x % 1) + 1) % 1 * w, y = p.y * h, r = p.r * k; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, T2); }
        ctx.fill();
      },
    };
  };
  const fxFog = (ctx, o = {}) => {
    let w = 0, h = 0, spr = null, b = [];
    return {
      resize(W, H) { w = W; h = H; spr = offscreen(128, 128); glowDot(spr.getContext("2d"), 64, 64, 64, "170,185,205", 1);
        b = Array.from({ length: Math.round(9 * (o.amount || 1)) + 3 }, () => ({ x: rnd(-0.2, 1.2), y: rnd(0.25, 1.05), r: rnd(0.25, 0.5), v: rnd(0.004, 0.012), a: rnd(0.05, 0.11) })); },
      frame(t, dt) {
        for (const q of b) { q.x += q.v * dt; if (q.x > 1.4) q.x = -0.4;
          const R = q.r * Math.max(w, h); ctx.globalAlpha = q.a * Math.min(1.4, o.amount || 1); ctx.drawImage(spr, q.x * w - R, q.y * h - R * 0.45, R * 2, R * 0.9); }
        ctx.globalAlpha = 1;
      },
    };
  };
  const fxMotes = (ctx, o = {}, embers) => {
    let w = 0, h = 0, k = 1, spr = null, m = [];
    const mk = (init) => ({ x: rnd(0, 1), y: init ? rnd(0, 1) : 1.03, r: rnd(0.6, 1.8), v: rnd(0.01, 0.04) * (embers ? 2.2 : 1), p: rnd(0, T2), s: rnd(0.4, 1.2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); spr = offscreen(32, 32); glowDot(spr.getContext("2d"), 16, 16, 16, embers ? "255,150,60" : "255,240,210", 1);
        m = Array.from({ length: Math.round((embers ? 60 : 45) * (o.amount || 1) * area(w, h)) }, () => mk(true)); },
      frame(t, dt) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < m.length; i++) { const p = m[i];
          p.y -= p.v * dt * (embers ? 1 : 0.4); p.x += Math.sin(t * 0.3 * p.s + p.p) * 0.01 * dt;
          if (p.y < -0.03) { m[i] = mk(false); continue; }
          const tw = 0.5 + 0.5 * Math.sin(t * (embers ? 3 : 1.1) * p.s + p.p), R = p.r * k * (embers ? 5 : 6);
          ctx.globalAlpha = (embers ? 0.25 + 0.55 * tw : 0.12 + 0.3 * tw) * (embers ? Math.min(1, (p.y + 0.05) * 1.6) : 1);
          ctx.drawImage(spr, p.x * w - R, p.y * h - R, R * 2, R * 2); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  // the music right now (set by content.js every frame while Music is on): effects can swell with it. 0 when silent.
  const beatNow = () => { const b = typeof window !== "undefined" && window.PriismBeat; return b && b.on ? b : null; };
  const fxFireflies = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, spr = null, f = [];
    const mk = () => ({ x: rnd(0, 1), y: rnd(0.15, 1), vx: rnd(-0.02, 0.02), vy: rnd(-0.015, 0.015), p: rnd(0, T2), s: rnd(0.5, 1.4), r: rnd(0.8, 1.6) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); spr = offscreen(32, 32); glowDot(spr.getContext("2d"), 16, 16, 16, "200,255,140", 1);
        f = Array.from({ length: Math.round(34 * (o.amount || 1) * area(w, h)) + 6 }, mk); },
      frame(t, dt) {
        const b = beatNow(), boost = b ? 1 + b.kick * 0.8 : 1;
        ctx.globalCompositeOperation = "lighter";
        for (const p of f) {
          p.vx += Math.sin(t * 0.4 * p.s + p.p) * 0.004 * dt; p.vy += Math.cos(t * 0.33 * p.s + p.p * 2) * 0.004 * dt;
          p.vx = Math.max(-0.03, Math.min(0.03, p.vx)); p.vy = Math.max(-0.025, Math.min(0.025, p.vy));
          p.x = ((p.x + p.vx * dt) % 1 + 1) % 1; p.y = Math.max(0.05, Math.min(1, p.y + p.vy * dt));
          const blink = Math.max(0, Math.sin(t * 1.3 * p.s + p.p)) ** 2, R = p.r * k * 11 * (0.7 + 0.3 * boost);
          ctx.globalAlpha = Math.min(1, (0.12 + 0.88 * blink) * boost); ctx.drawImage(spr, p.x * w - R, p.y * h - R, R * 2, R * 2); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  const fxBokeh = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, sp = [], b = [];
    const COLS = ["255,190,120", "120,200,255", "255,120,200", "180,140,255", "140,255,210"];
    const mk = (init) => ({ x: rnd(0, 1), y: init ? rnd(0, 1) : 1.15, r: rnd(18, 60), v: rnd(0.004, 0.014), c: (Math.random() * COLS.length) | 0, a: rnd(0.12, 0.3), p: rnd(0, T2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h);
        sp = COLS.map((c) => { const s = offscreen(96, 96), g = s.getContext("2d"), gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
          gr.addColorStop(0, `rgba(${c},0.55)`); gr.addColorStop(0.7, `rgba(${c},0.35)`); gr.addColorStop(0.86, `rgba(${c},0.6)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return s; });
        b = Array.from({ length: Math.round(16 * (o.amount || 1) * area(w, h)) + 4 }, () => mk(true)); },
      frame(t, dt) {
        const bt = beatNow(), boost = bt ? 1 + bt.level * 0.9 : 1;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < b.length; i++) { const q = b[i]; q.y -= q.v * dt; q.x += Math.sin(t * 0.15 + q.p) * 0.003 * dt;
          if (q.y < -0.15) { b[i] = mk(false); continue; }
          const R = q.r * k * (0.9 + 0.1 * Math.sin(t * 0.5 + q.p)); ctx.globalAlpha = Math.min(1, q.a * boost * (0.7 + 0.3 * Math.sin(t * 0.4 + q.p)));
          ctx.drawImage(sp[q.c], q.x * w - R, q.y * h - R, R * 2, R * 2); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  const fxRays = (ctx, o = {}) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const b = beatNow(), boost = b ? 1 + b.level * 0.7 : 1, n = Math.round(5 + 3 * (o.amount || 1)), ox = w * 0.18, oy = -h * 0.08;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < n; i++) {
          const ang = 0.35 + i * (0.9 / n) + Math.sin(t * 0.07 + i * 1.7) * 0.05, spread = 0.035 + 0.02 * Math.sin(t * 0.11 + i), L = Math.hypot(w, h) * 1.2;
          const a = (0.035 + 0.03 * Math.sin(t * 0.2 + i * 2.3)) * boost * Math.min(1.5, o.amount || 1);
          const gr = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * L, oy + Math.sin(ang) * L); gr.addColorStop(0, `rgba(255,236,200,${a.toFixed(3)})`); gr.addColorStop(1, "rgba(255,236,200,0)");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(ang - spread) * L, oy + Math.sin(ang - spread) * L); ctx.lineTo(ox + Math.cos(ang + spread) * L, oy + Math.sin(ang + spread) * L); ctx.closePath(); ctx.fill(); }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  const fxGrain = (ctx, o = {}) => {
    let w = 0, h = 0, tiles = [], f = 0, acc = 0;
    return {
      resize(W, H) { w = W; h = H; tiles = [0, 1, 2, 3].map(() => { const s = offscreen(128, 128), g = s.getContext("2d"), im = g.createImageData(128, 128);
        for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); return s; }); },
      frame(t, dt) {
        acc += dt; if (acc > 1 / 24) { acc = 0; f = (f + 1) % tiles.length; }                // film runs at 24 frames a second
        ctx.globalCompositeOperation = "overlay"; ctx.globalAlpha = 0.06 + 0.06 * Math.min(2, o.amount || 1);
        const pat = ctx.createPattern(tiles[f], "repeat"); ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  const fxScan = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, lines = null;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); lines = offscreen(4, 4); const g = lines.getContext("2d"); g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(0, 2, 4, 2); },
      frame(t) {
        ctx.globalAlpha = 0.18 + 0.14 * Math.min(1.5, o.amount || 1); ctx.fillStyle = ctx.createPattern(lines, "repeat"); ctx.fillRect(0, 0, w, h);
        const y = ((t * 0.08) % 1.2 - 0.1) * h, gr = ctx.createLinearGradient(0, y - 60 * k, 0, y + 60 * k);   // a slow bright band rolls down
        gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,0.05)"); gr.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(0, y - 60 * k, w, 120 * k);
        const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.35)");
        ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
      },
    };
  };
  const fxStars = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, s = [];
    const mk = () => ({ x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(0.15, 1) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); s = Array.from({ length: Math.round(260 * (o.amount || 1) * area(w, h)) + 40 }, mk); },
      frame(t, dt) {
        const b = beatNow(), sp = 0.07 * (b ? 1 + b.kick * 3 : 1);
        ctx.strokeStyle = "rgba(225,235,255,0.95)"; ctx.lineCap = "round";
        for (let i = 0; i < s.length; i++) { const p = s[i], z0 = p.z; p.z -= sp * dt; if (p.z < 0.05) { s[i] = mk(); s[i].z = 1; continue; }
          const X = w / 2 + (p.x / p.z) * w * 0.4, Y = h / 2 + (p.y / p.z) * h * 0.4; if (X < 0 || X > w || Y < 0 || Y > h) { s[i] = mk(); s[i].z = 1; continue; }
          const zt = Math.min(1, z0 + sp * 0.12), X0 = w / 2 + (p.x / zt) * w * 0.4, Y0 = h / 2 + (p.y / zt) * h * 0.4;   // a short streak behind it
          ctx.lineWidth = Math.max(0.8, (1 - p.z) * 3) * k; ctx.globalAlpha = Math.min(1, (1 - p.z) * 1.5); ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X + 0.01, Y); ctx.stroke(); }
        ctx.globalAlpha = 1;
      },
    };
  };
  const fxPetals = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, p = [];
    const mk = (init) => ({ x: rnd(-0.1, 1), y: init ? rnd(0, 1) : -0.05, v: rnd(0.025, 0.06), r: rnd(0, T2), vr: rnd(-1.2, 1.2), s: rnd(6, 12), sw: rnd(0, T2), c: Math.random() < 0.5 ? "255,183,206" : "255,214,226" });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); p = Array.from({ length: Math.round(40 * (o.amount || 1) * area(w, h)) + 6 }, () => mk(true)); },
      frame(t, dt) {
        for (let i = 0; i < p.length; i++) { const q = p[i]; q.y += q.v * dt; q.x += (0.015 + Math.sin(t * 0.7 + q.sw) * 0.02) * dt; q.r += q.vr * dt;
          if (q.y > 1.06 || q.x > 1.1) { p[i] = mk(false); continue; }
          const S = q.s * k; ctx.save(); ctx.translate(q.x * w, q.y * h); ctx.rotate(q.r); ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 2 + q.sw));
          ctx.fillStyle = `rgba(${q.c},0.75)`; ctx.beginPath(); ctx.moveTo(0, -S); ctx.quadraticCurveTo(S, 0, 0, S); ctx.quadraticCurveTo(-S, 0, 0, -S); ctx.fill(); ctx.restore(); }
      },
    };
  };
  const fxBubbles = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, b = [];
    const mk = (init) => ({ x: rnd(0, 1), y: init ? rnd(0, 1) : 1.05, r: rnd(3, 13), v: rnd(0.02, 0.06), p: rnd(0, T2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); b = Array.from({ length: Math.round(36 * (o.amount || 1) * area(w, h)) + 6 }, () => mk(true)); },
      frame(t, dt) {
        const bt = beatNow(), lift = bt ? 1 + bt.kick * 1.5 : 1;
        ctx.lineWidth = Math.max(1, 1.1 * k);
        for (let i = 0; i < b.length; i++) { const q = b[i]; q.y -= q.v * dt * lift; q.x += Math.sin(t * 1.2 + q.p) * 0.006 * dt;
          if (q.y < -0.05) { b[i] = mk(false); continue; }
          const R = q.r * k, X = q.x * w, Y = q.y * h; ctx.strokeStyle = "rgba(200,235,255,0.45)"; ctx.beginPath(); ctx.arc(X, Y, R, 0, T2); ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(X - R * 0.35, Y - R * 0.35, Math.max(0.6, R * 0.22), 0, T2); ctx.fill(); }
      },
    };
  };
  const fxSparkle = (ctx, o = {}) => {
    let w = 0, h = 0, k = 1, s = [];
    const mk = () => ({ x: rnd(0, 1), y: rnd(0, 1), p: rnd(0, T2), sp: rnd(0.6, 1.6), r: rnd(4, 10) });
    let spr = null;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); spr = offscreen(32, 32); glowDot(spr.getContext("2d"), 16, 16, 16, "255,240,210", 1); s = Array.from({ length: Math.round(60 * (o.amount || 1) * area(w, h)) + 10 }, mk); },
      frame(t) {
        const b = beatNow(), boost = b ? 1 + b.hat * 1.2 + b.kick * 0.5 : 1;
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgb(255,248,225)";
        for (let i = 0; i < s.length; i++) { const q = s[i], a = Math.max(0, Math.sin(t * q.sp + q.p)) ** 3 * boost; if (a < 0.02) { if (Math.sin(t * q.sp + q.p) < -0.99) s[i] = mk(); continue; }
          const R = q.r * k * (0.6 + 0.6 * Math.min(1.4, a)), X = q.x * w, Y = q.y * h; ctx.globalAlpha = Math.min(1, a) * 0.5; ctx.drawImage(spr, X - R * 1.6, Y - R * 1.6, R * 3.2, R * 3.2); ctx.globalAlpha = Math.min(1, a);
          ctx.beginPath(); ctx.moveTo(X, Y - R); ctx.quadraticCurveTo(X, Y, X + R, Y); ctx.quadraticCurveTo(X, Y, X, Y + R); ctx.quadraticCurveTo(X, Y, X - R, Y); ctx.quadraticCurveTo(X, Y, X, Y - R); ctx.fill(); }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  const fxAurora = (ctx, o = {}) => {
    let w = 0, h = 0;
    const RIB = [["80,255,190", 0.2, 0], ["120,150,255", 0.3, 2.1], ["220,120,255", 0.4, 4.2]];
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        const b = beatNow(), boost = b ? 1 + b.level * 0.8 : 1, A = Math.min(1.6, o.amount || 1), cols = Math.max(48, Math.min(120, Math.round(w / 12))), dx = w / cols;
        ctx.globalCompositeOperation = "lighter";
        for (const [c, y0, ph] of RIB) {
          for (let i = 0; i < cols; i++) { const x = Math.round(i * dx), x2 = Math.round((i + 1) * dx), u = (x + x2) / 2 / w;   // whole-pixel columns: no seams
            const yc = h * (y0 + 0.07 * Math.sin(u * 5 + t * 0.25 + ph) + 0.04 * Math.sin(u * 11 - t * 0.17 + ph)), th = h * (0.09 + 0.05 * Math.sin(u * 3 + t * 0.3 + ph));
            const a = (0.09 + 0.06 * Math.sin(u * 7 + t * 0.4 + ph)) * A * boost;
            const gr = ctx.createLinearGradient(0, yc - th * 2.2, 0, yc + th); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(0.7, `rgba(${c},${a.toFixed(3)})`); gr.addColorStop(1, `rgba(${c},0)`);
            ctx.fillStyle = gr; ctx.fillRect(x, yc - th * 2.2, x2 - x, th * 3.2); }
        }
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };
  window.PriismEffects = {
    rain:   { name: "Rain",         create: (c, o) => fxRain(c, o, false) },
    storm:  { name: "Thunderstorm", create: fxStorm, opts: [{ k: "lightning", label: "Lightning", type: "toggle", def: true }] },
    snow:   { name: "Snow",         create: fxSnow },
    fog:    { name: "Fog",          create: fxFog },
    dust:   { name: "Dust",         create: (c, o) => fxMotes(c, o, false) },
    embers: { name: "Embers",       create: (c, o) => fxMotes(c, o, true) },
    // the cool ones (the starred ones also swell with your music when Live mood follows Music)
    fireflies: { name: "Fireflies",   create: fxFireflies, music: true },
    bokeh:   { name: "Bokeh",         create: fxBokeh, music: true },
    rays:    { name: "Light rays",    create: fxRays, music: true },
    aurora:  { name: "Aurora",        create: fxAurora, music: true },
    stars:   { name: "Warp stars",    create: fxStars, music: true },
    sparkle: { name: "Sparkles",      create: fxSparkle, music: true },
    bubbles: { name: "Bubbles",       create: fxBubbles, music: true },
    petals:  { name: "Petals",        create: fxPetals },
    grain:   { name: "Film grain",    create: fxGrain },
    retro:   { name: "Retro screen",  create: fxScan },
  };

  // ---------- each wallpaper's own settings + Recolour ----------
  // A wallpaper can list settings (opts: [{ k, label, type: "range"|"toggle", min, max, step, def }]); its create(ctx, o)
  // gets the values, checked and with defaults filled in. Any wallpaper can also be Recoloured to your 2-3 colours:
  // after each frame a "color" layer gives every pixel your colours' hue while keeping its brightness (black stays
  // black, so OLED wallpapers stay OLED). saved = { amount: 1.4, rc: { c: ["#hex", ...], s: 0..1 } }.
  const optsOf = (def, saved) => { const r = {};
    for (const d of def.opts || []) { const v = saved ? saved[d.k] : undefined;
      r[d.k] = d.type === "toggle" ? (typeof v === "boolean" ? v : d.def) : (v !== undefined && v !== null && v !== "" && Number.isFinite(+v) ? Math.max(d.min, Math.min(d.max, +v)) : d.def); }
    return r; };
  const recolourOf = (saved) => { const rc = saved && saved.rc; if (!rc || !Array.isArray(rc.c)) return null;
    const c = rc.c.filter((x) => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 3), st = rc.s === undefined ? 0.85 : Math.max(0, Math.min(1, +rc.s || 0));
    return c.length && st > 0.01 ? { c, s: st } : null; };
  const recolourSprite = (cols) => { const c = offscreen(64, 36), g = c.getContext("2d");
    if (cols.length === 1) { g.fillStyle = cols[0]; g.fillRect(0, 0, 64, 36); return c; }
    const gr = g.createLinearGradient(0, 36, 64, 0); cols.forEach((x, i) => gr.addColorStop(i / (cols.length - 1), x)); g.fillStyle = gr; g.fillRect(0, 0, 64, 36); return c; };

  // =====================================================================================================================
  // Signature wallpapers (Imperial, Eclipse, Orion, Glacier, Void, Aurora, Neon City, Obsidian, Storm, Blood Moon).
  // Painted, not drawn from shapes: each one paints its scene once per size (per-pixel light, noise and shading, at
  // half size for the soft parts, full size for the fine detail), then every frame only places that painting and a
  // little light on top. The same seed is used at every size, so a thumbnail is the same picture as the wallpaper.
  // The middle of each picture is kept calm and a little darker, where price action sits.
  // =====================================================================================================================
  const SIG = (() => {
    // ---- seeded random + noise ----
    const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    const hash = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const sm = (t) => t * t * (3 - 2 * t);
    function noise(x, y, s) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = sm(xf), v = sm(yf);
      const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const fbm = (x, y, s, o = 5, lac = 2, g = 0.5) => { let a = 0, f = 1, amp = 0.5, n = 0; for (let i = 0; i < o; i++) { a += amp * noise(x * f, y * f, s + i * 17); n += amp; f *= lac; amp *= g; } return a / n; };
    const ridge = (x, y, s, o = 5) => { let a = 0, f = 1, amp = 0.5, n = 0, w = 1; for (let i = 0; i < o; i++) { let v = 1 - Math.abs(noise(x * f, y * f, s + i * 31) * 2 - 1); v *= v * w; w = Math.min(1, v * 2); a += v * amp; n += amp; f *= 2.03; amp *= 0.5; } return a / n; };
    const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
    const mix = (a, b, t) => a + (b - a) * t;
    // palette: luminance-like t (0..1) -> colour between stops [[t, r, g, b], ...]
    const ramp = (stops) => (t) => { t = clamp(t); let i = 1; while (i < stops.length - 1 && stops[i][0] < t) i++; const A = stops[i - 1], B = stops[i], f = clamp((t - A[0]) / (B[0] - A[0] || 1));
      return [mix(A[1], B[1], f), mix(A[2], B[2], f), mix(A[3], B[3], f)]; };
    // paint a canvas pixel by pixel: fn(u, v) -> [r, g, b, a?] with u, v in 0..1 (the same picture at any size)
    function paint(w, h, fn) {
      const c = offscreen(w, h), g = c.getContext("2d"), im = g.createImageData(c.width, c.height), d = im.data, W = c.width, H = c.height;
      for (let y = 0; y < H; y++) { const v = (y + 0.5) / H; for (let x = 0; x < W; x++) { const p = fn((x + 0.5) / W, v, x, y), i = (y * W + x) * 4;
        d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = p.length > 3 ? p[3] : 255; } }
      g.putImageData(im, 0, 0); return c;
    }
    // soft parts are painted at a fraction of the size and smoothed up (q = how many px per painted px)
    // (never painted wider than 1280 px: past that it is smoothed up, so a 4K wallpaper sets up as fast as a 1080p one)
    const soft = (w, h, q, fn) => { q = Math.max(q, Math.max(w, h) / 1280); return paint(Math.max(8, Math.round(w / q)), Math.max(8, Math.round(h / q)), fn); };
    const up = (g, c, w, h) => { g.imageSmoothingEnabled = true; if ("imageSmoothingQuality" in g) g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, w, h); };
    // fine grain, so gradients never band and the picture reads like a photograph (one tile, repeated)
    let grainTile = null;
    const grain = (g, w, h, a) => { if (!grainTile) { grainTile = paint(128, 128, (u, v, x, y) => { const n = hash(x, y, 9) * 255; return [n, n, n, 255]; }); }
      const p = g.createPattern(grainTile, "repeat"); g.save(); g.globalAlpha = a; g.globalCompositeOperation = "overlay"; g.fillStyle = p; g.fillRect(0, 0, w, h); g.restore(); };
    // the calm middle: a soft darker ellipse where the candles are, and a gentle vignette at the corners
    const calm = (g, w, h, a, vig) => {
      g.save(); g.translate(w * 0.5, h * 0.52); g.scale(w * 0.42, h * 0.34);
      let r = g.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, `rgba(0,0,0,${a})`); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(-1.5, -1.5, 3, 3); g.restore();
      g.save(); g.translate(w / 2, h / 2); g.scale(w * 0.75, h * 0.75); r = g.createRadialGradient(0, 0, 0.55, 0, 0, 1.05); r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, `rgba(0,0,0,${vig})`); g.fillStyle = r; g.fillRect(-1, -1, 2, 2); g.restore();
    };
    const stars = (g, w, h, n, seed, maxV = 1, k = 1) => { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * w, y = Math.pow(R(), 1.2) * h * maxV, b = R(), s = (0.4 + b * 1.1) * k;
      g.fillStyle = `rgba(${200 + b * 55 | 0},${210 + b * 45 | 0},255,${0.25 + b * 0.65})`; g.fillRect(x, y, s, s); if (b > 0.93) { g.globalAlpha = 0.25; g.fillRect(x - 2 * s, y + s / 2 - 0.5, 5 * s, 1); g.fillRect(x + s / 2 - 0.5, y - 2 * s, 1, 5 * s); g.globalAlpha = 1; } } };
    // a mountain range's top edge (ridged), for a band of the sky: returns ys per column (0..1 of the height)
    // (normalised, so every range has real peaks and saddles, whatever the noise gives)
    const range = (n, seed, base, amp, sc) => { const out = new Float32Array(n + 1); let lo = 1e9, hi = -1e9;
      for (let i = 0; i <= n; i++) { const u = i / n, v = 0.62 * Math.pow(ridge(u * sc, 0.3, seed, 6), 1.4) + 0.38 * ridge(u * sc * 2.7, 1.7, seed + 5, 5); out[i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
      for (let i = 0; i <= n; i++) out[i] = base - amp * ((out[i] - lo) / (hi - lo || 1)); return out; };
    // a lightning bolt: a jagged path with branches (midpoint displacement), in 0..1 units
    function bolt(R, x0, y0, x1, y1, rough, depth, out) {
      const pts = [[x0, y0], [x1, y1]];
      for (let it = 0; it < 7; it++) { const nx = []; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
        nx.push(a, [(a[0] + b[0]) / 2 + (R() - 0.5) * rough * L * (-dy / (L || 1)) * 2, (a[1] + b[1]) / 2 + (R() - 0.5) * rough * L * (dx / (L || 1)) * 2]); } nx.push(pts[pts.length - 1]); pts.splice(0, pts.length, ...nx); }
      out.push({ pts, w: depth ? 0.45 : 1 });
      if (depth < 2) for (let i = 8; i < pts.length - 8; i += 8 + Math.floor(R() * 14)) if (R() < 0.42) { const p = pts[i], ang = Math.atan2(y1 - y0, x1 - x0) + (R() < 0.5 ? -1 : 1) * (0.35 + R() * 0.6), L = Math.hypot(x1 - x0, y1 - y0) * (0.18 + R() * 0.3);
        bolt(R, p[0], p[1], p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L, rough * 1.1, depth + 1, out); }
      return out;
    }
    function drawBolts(g, list, w, h, k, col, a) {
      g.save(); g.globalCompositeOperation = "lighter"; g.lineJoin = "round"; g.lineCap = "round";
      for (const pass of [[14, 0.06], [6, 0.16], [2.2, 0.5], [1, 1]]) for (const b of list) { g.strokeStyle = pass[1] === 1 ? `rgba(255,255,255,${a * b.w})` : `rgba(${col},${a * pass[1] * b.w})`; g.lineWidth = pass[0] * k * (b.w > 0.5 ? 1 : 0.55);
        g.beginPath(); b.pts.forEach((p, i) => (i ? g.lineTo(p[0] * w, p[1] * h) : g.moveTo(p[0] * w, p[1] * h))); g.stroke(); }
      g.restore();
    }
    return { rng, noise, fbm, ridge, clamp, mix, ramp, paint, soft, up, grain, calm, stars, range, bolt, drawBolts, hash };
  })();

  // ---- Silk (Imperial): black silk folds with a metallic gold sheen ----
  // A height field of long, soft folds; each pixel is lit like satin: a dark base, a broad sheen across each fold and
  // a sharp highlight on its crest. A slow band of light slides across now and then.
  const sigSilk = (ctx) => {
    let w = 0, h = 0, base = null, k = 1;
    const tone = SIG.ramp([[0, 2, 2, 2], [0.2, 16, 11, 5], [0.42, 70, 46, 16], [0.62, 150, 104, 40], [0.8, 220, 172, 92], [0.93, 250, 222, 160], [1, 255, 248, 228]]);
    // long diagonal folds (a flowing sheet): the fold phase bends with a slow warp, so folds swell, twist and part
    const H = (u, v) => { const wa = SIG.fbm(u * 1.4 + 2, v * 1.4, 41, 4) * 3.2, a = u * 3.1 + v * 1.9 + wa;
      return Math.sin(a * 2.2) * 0.6 + Math.sin(a * 4.6 + v * 3 + 1.3) * 0.22 + Math.sin(a * 1.1 - v * 2.4) * 0.35; };
    return {
      resize(W, Hh) { w = W; h = Hh; k = kOf(w, h); const e = 0.0015;
        const tex = SIG.soft(w, h, 1.4, (u, v) => {
          const z = H(u, v), dx = (H(u + e, v) - z) / e, dy = (H(u, v + e) - z) / e, s0 = 0.085, L = Math.hypot(dx * s0, dy * s0, 1), nx = -dx * s0 / L, ny = -dy * s0 / L, nz = 1 / L;
          const lx = -0.5, ly = -0.55, lz = 0.67, diff = SIG.clamp(nx * lx + ny * ly + nz * lz);
          const hx = lx, hy = ly, hz = lz + 1, hl = Math.hypot(hx, hy, hz), spec = Math.pow(SIG.clamp((nx * hx + ny * hy + nz * hz) / hl), 70);
          const shadow = SIG.clamp(0.15 + 0.85 * SIG.fbm(u * 1.8 + 5, v * 1.8, 77, 3) * 1.25);   // whole folds fall into deep shadow
          const mid = SIG.clamp(Math.hypot((u - 0.5) * 1.3, (v - 0.52) * 1.7) * 1.6);             // calmer, darker in the middle
          const t = (Math.pow(diff, 4) * 0.5 + spec * 0.95) * shadow * (0.45 + 0.55 * mid);
          const c = tone(t); return [c[0], c[1], c[2]]; });
        base = offscreen(w, h); const g = base.getContext("2d"); SIG.up(g, tex, w, h); SIG.calm(g, w, h, 0.25, 0.5); SIG.grain(g, w, h, 0.045); },
      frame(t) { ctx.drawImage(base, 0, 0, w, h);
        const p = ((t * 0.018) % 1.6) - 0.3, x = p * w * 1.4 - w * 0.2;   // a slow sweep of light, every ~90 s
        if (x < -w * 0.25 || x > w * 1.25) return;   // (off screen most of the time)
        ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createLinearGradient(x - w * 0.2, 0, x + w * 0.2, 0);
        g.addColorStop(0, "rgba(255,210,140,0)"); g.addColorStop(0.5, "rgba(255,210,140,0.05)"); g.addColorStop(1, "rgba(255,210,140,0)"); ctx.fillStyle = g; ctx.fillRect(Math.max(0, x - w * 0.2), 0, w * 0.4, h); ctx.restore(); },
    };
  };

  // ---- Totality (Eclipse): a solar eclipse with a golden corona ----
  const sigEclipse = (ctx) => {
    let w = 0, h = 0, base = null, k = 1, cx = 0, cy = 0, R = 0, beads = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); cx = w * 0.68; cy = h * 0.27; R = Math.min(w, h) * 0.12;
        const tone = SIG.ramp([[0, 0, 0, 0], [0.12, 40, 16, 4], [0.32, 140, 70, 18], [0.55, 236, 160, 64], [0.78, 255, 222, 150], [1, 255, 250, 236]]);
        const ar = w / h, cu = cx / w, cv = cy / h, Rn = R / h;
        const cor = SIG.soft(w, h, 1.5, (u, v) => { const dx = (u - cu) * ar, dy = v - cv, r = Math.hypot(dx, dy) / Rn, a = Math.atan2(dy, dx);
          if (r < 0.99) return [0, 0, 0];
          const streak = SIG.fbm(Math.cos(a) * 2.2 + 9, Math.sin(a) * 2.2 + 9, 13, 4) * 0.6 + SIG.fbm(a * 9.5, r * 0.25, 29, 3) * 0.55;   // long streamers
          const fall = Math.pow(1 / Math.max(1, r), 2.6), inner = Math.exp(-(r - 1) * 9);
          const sky = 0.02 + 0.05 * SIG.fbm(u * 3, v * 3, 5, 3);
          const t = SIG.clamp(inner * 0.95 + fall * (0.55 + streak * 1.15) + sky);
          const c = tone(t); return [c[0], c[1], c[2]]; });
        base = offscreen(w, h); const g = base.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
        SIG.stars(g, w, h, Math.round(260 * (w * h) / (1600 * 900) + 40), 314, 1, k);
        g.globalCompositeOperation = "lighter"; SIG.up(g, cor, w, h); g.globalCompositeOperation = "source-over";
        // the chromosphere: a thin rose-red rim, then the moon
        const rim = g.createRadialGradient(cx, cy, R * 0.985, cx, cy, R * 1.05); rim.addColorStop(0, "rgba(255,120,150,0.95)"); rim.addColorStop(0.4, "rgba(255,90,90,0.35)"); rim.addColorStop(1, "rgba(255,80,80,0)");
        g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, R * 1.06, 0, T2); g.fill();
        const moon = g.createRadialGradient(cx - R * 0.25, cy - R * 0.25, R * 0.1, cx, cy, R); moon.addColorStop(0, "#0a0908"); moon.addColorStop(1, "#000");   // faint earthshine
        g.fillStyle = moon; g.beginPath(); g.arc(cx, cy, R, 0, T2); g.fill();
        SIG.calm(g, w, h, 0.18, 0.5); SIG.grain(g, w, h, 0.045);
        const Rr = SIG.rng(77); beads = Array.from({ length: 4 }, () => ({ a: -0.6 + Rr() * 1.1 + Math.PI * (Rr() < 0.5 ? 0 : 1), p: Rr() * T2, s: 0.6 + Rr() * 0.8 })); },
      frame(t) { ctx.drawImage(base, 0, 0, w, h);
        // Baily's beads: a few points of sunlight glinting at the moon's edge
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const b of beads) { const x = cx + Math.cos(b.a) * R, y = cy + Math.sin(b.a) * R, a = 0.35 + 0.35 * Math.sin(t * 0.7 * b.s + b.p);
          glowDot(ctx, x, y, R * 0.22, "255,236,200", a * 0.5); glowDot(ctx, x, y, R * 0.05, "255,255,245", a); }
        ctx.restore(); },
    };
  };

  // ---- Obsidian: black faceted metal with gold edges ----
  // A low-poly surface; each facet is lit by a slow-moving light like polished black metal, and the creases that
  // catch the light get a thin gold line. Dense and bright at the edges, smooth and dark in the middle.
  const sigObsidian = (ctx) => {
    let w = 0, h = 0, k = 1, tris = [], base = null;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); const R = SIG.rng(2024), cols = Math.round(14 * Math.max(1, w / h) * 1.2), rows = 13, P = [];
        for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) { const u = i / cols, v = j / rows, edge = i === 0 || j === 0 || i === cols || j === rows;
          const jit = edge ? 0 : 0.42, x = (u + (R() - 0.5) * jit / cols) * w, y = (v + (R() - 0.5) * jit / rows) * h;
          const d = Math.hypot((u - 0.5) * 1.6, (v - 0.52) * 1.9), z = (SIG.fbm(u * 3.1, v * 3.1, 61, 4) - 0.5) * (40 + 180 * SIG.clamp(d)) * k;   // flatter in the middle
          row.push([x, y, z]); } P.push(row); }
        tris = [];
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i], d = P[j + 1][i + 1];
          const f = (p, q, r) => { const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2], vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz) || 1; if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
            const cxp = (p[0] + q[0] + r[0]) / 3, cyp = (p[1] + q[1] + r[1]) / 3; tris.push({ p, q, r, n: [nx / L, ny / L, nz / L], d: Math.hypot((cxp / w - 0.5) * 1.6, (cyp / h - 0.52) * 1.9) }); };
          if ((i + j) % 2) { f(a, b, d); f(a, d, c); } else { f(a, b, c); f(b, d, c); } }
        // the fixed part: a dark sheen under the facets (smooth fall-off), painted once
        base = offscreen(w, h); const g = base.getContext("2d"); const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#0c0b0a"); bg.addColorStop(1, "#030303"); g.fillStyle = bg; g.fillRect(0, 0, w, h); },
      frame(t) {
        const la = Math.round(t * 0.05 / 0.025) * 0.025;   // the light moves slowly: re-lit only when it has moved a little (every 0.5 s)
        if (!this._lit || this._la !== la || this._lit.width !== Math.round(w)) {
          if (!this._lit || this._lit.width !== Math.round(w)) this._lit = offscreen(w, h);
          this._la = la; const g = this._lit.getContext("2d"); g.drawImage(base, 0, 0, w, h);
          const lx = Math.cos(la) * 0.55, ly = -0.5 + Math.sin(la) * 0.25, lz = 0.66, L = Math.hypot(lx, ly, lz), Lx = lx / L, Ly = ly / L, Lz = lz / L, hz = Lz + 1, hl = Math.hypot(Lx, Ly, hz);
          for (const T of tris) { const [nx, ny, nz] = T.n, dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz), spec = Math.pow(Math.max(0, (nx * Lx + ny * Ly + nz * hz) / hl), 90);
            const v = 6 + dif * 16 * (0.4 + 0.6 * T.d) + spec * 46 * T.d;   // black metal: only a dull sheen, a little brighter at the edges
            g.fillStyle = `rgb(${v + spec * 8 | 0},${v + spec * 4 | 0},${v * 0.95 | 0})`; g.beginPath(); g.moveTo(T.p[0], T.p[1]); g.lineTo(T.q[0], T.q[1]); g.lineTo(T.r[0], T.r[1]); g.closePath(); g.fill();
            g.strokeStyle = g.fillStyle; g.lineWidth = 0.8; g.stroke();
            if (T.d > 0.3) { const e = Math.pow(Math.max(0, (nx * Lx + ny * Ly + nz * hz) / hl), 24) * T.d; if (e > 0.04) {   // gold on the creases that catch the light
              g.strokeStyle = `rgba(226,176,88,${Math.min(0.9, e * 1.8)})`; g.lineWidth = Math.max(0.8, 1.1 * k); g.beginPath(); g.moveTo(T.p[0], T.p[1]); g.lineTo(T.q[0], T.q[1]); g.stroke();
              if (e > 0.5) { g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(255,200,110,${(e - 0.5) * 0.4})`; g.lineWidth = 4 * k; g.stroke(); g.restore(); } } } }
          SIG.calm(g, w, h, 0.4, 0.6); SIG.grain(g, w, h, 0.04);
        }
        ctx.drawImage(this._lit, 0, 0, w, h);
      },
    };
  };

  const sigStorm = (ctx, o) => {
    let w = 0, h = 0, k = 1, base = null, lit = null, ridge = null, next = 1.5, flash = null, R = SIG.rng(99);
    const ground = !!(o && o.ground), strikes = !(o && o.lightning === false);
    const cloud = (u, v, s) => { const wx = SIG.fbm(u * 2.2 + 3, v * 2.2, s + 3, 4), wy = SIG.fbm(u * 2.2, v * 2.2 + 7, s + 4, 4);
      return SIG.fbm(u * 3.4 + wx * 1.6, v * 2.4 + wy * 1.2, s, 6); };
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h);
        const dark = SIG.ramp([[0, 5, 6, 11], [0.25, 18, 21, 32], [0.5, 50, 56, 76], [0.72, 104, 112, 140], [0.9, 160, 168, 194], [1, 210, 216, 232]]);
        const glow = SIG.ramp([[0, 0, 0, 0], [0.4, 30, 40, 90], [0.7, 120, 140, 230], [1, 235, 240, 255]]);
        const fieldC = (u, v) => { const c = cloud(u, v, 11), top = SIG.clamp(1 - v * 1.15), shade = SIG.clamp(c - SIG.fbm(u * 3.4 + 0.02, v * 2.4 - 0.03, 11, 5) + 0.5);   // lit from above
          return { d: SIG.clamp((c - 0.28) * 2.6) * (0.5 + 0.5 * top), s: shade }; };
        base = offscreen(w, h); lit = offscreen(w, h);
        const B = SIG.soft(w, h, 2, (u, v) => { const f = fieldC(u, v), t = f.d * (0.6 + 0.7 * f.s) * (0.62 + 0.38 * SIG.clamp(Math.abs(u - 0.5) * 2 + (0.6 - v))); const c = dark(t); return [c[0], c[1], c[2]]; });
        const Lg = SIG.soft(w, h, 2, (u, v) => { const f = fieldC(u, v), c = glow(f.d * (0.7 + 0.5 * f.s)); return [c[0], c[1], c[2]]; });
        let g = base.getContext("2d"); SIG.up(g, B, w, h);
        g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.16; SIG.up(g, Lg, w, h); g.restore();   // a faint glow inside, as if lightning is far off
        g = lit.getContext("2d"); SIG.up(g, Lg, w, h);
        if (ground) { ridge = [SIG.range(220, 7, 0.83, 0.2, 2.2), SIG.range(220, 9, 0.92, 0.17, 3.4)];
          const bg = base.getContext("2d");
          ridge.forEach((rr, li) => { bg.fillStyle = li ? "#030305" : "#0a0b12"; bg.beginPath(); bg.moveTo(0, h); rr.forEach((y, i) => bg.lineTo((i / (rr.length - 1)) * w, y * h)); bg.lineTo(w, h); bg.closePath(); bg.fill(); }); }
        g = base.getContext("2d"); SIG.calm(g, w, h, 0.25, 0.55); SIG.grain(g, w, h, 0.05); },
      frame(t, dt) {
        ctx.drawImage(base, 0, 0, w, h);
        if (!strikes) return;
        next -= dt || 0.016;
        if (next <= 0 && !flash) { const x0 = 0.12 + R() * 0.76, y1 = ground ? 0.78 + R() * 0.1 : 0.55 + R() * 0.35;   // a strike, away from the very middle
          const x = Math.abs(x0 - 0.5) < 0.14 ? (x0 < 0.5 ? x0 - 0.16 : x0 + 0.16) : x0;
          flash = { t: 0, bolts: SIG.bolt(R, x, -0.02, x + (R() - 0.5) * 0.18, y1, 0.22, 0, []), x }; next = 4 + R() * 7; }
        if (flash) { flash.t += dt || 0.016; const ft = flash.t, a = ft < 0.06 ? 1 : ft < 0.12 ? 0.35 : ft < 0.2 ? 0.85 : Math.max(0, 1 - (ft - 0.2) / 0.55);
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.5; ctx.drawImage(lit, 0, 0, w, h); ctx.restore();   // the clouds light up from inside
          SIG.drawBolts(ctx, flash.bolts, w, h, k, "150,170,255", a);
          if (ft > 0.8) flash = null; }
      },
    };
  };

  // ---- Moonlit Ridge (with Moon off and Fog up: Glacier): lit icy peaks in layers of mist ----
  const sigRidge = (ctx, o) => {
    let w = 0, h = 0, k = 1, base = null, fog = null;
    const moon = !(o && o.moon === false), fogAmt = o && o.fog !== undefined ? +o.fog : 0.6;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h);
        base = offscreen(w, h); const g = base.getContext("2d");
        const sg = g.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "#050a16"); sg.addColorStop(0.5, "#122440"); sg.addColorStop(1, "#33506e"); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        if (moon) { SIG.stars(g, w, h * 0.5, Math.round(160 * w * h / 1.44e6) + 30, 21, 1, k); const mx = w * 0.78, my = h * 0.16, mr = Math.min(w, h) * 0.042; glowDot(g, mx, my, mr * 10, "170,200,255", 0.2);
          const md = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr); md.addColorStop(0, "#fbfdff"); md.addColorStop(1, "#c3d1e6"); g.fillStyle = md; g.beginPath(); g.arc(mx, my, mr, 0, T2); g.fill(); }
        // four ranges, far to near. Each: a ridged silhouette; inside, light faces (facing the upper left) vs shadow
        // faces from a 2-D ridged field, snow near the peaks; farther ranges are paler and lost in the haze.
        const L = [[0.6, 0.28, 1.6, 101], [0.7, 0.28, 2.3, 103], [0.8, 0.26, 3.1, 107], [0.92, 0.22, 4.4, 109]];
        L.forEach(([b, a, sc, sd], li) => {
          const N = 500, tops = SIG.range(N, sd, b, a, sc), far = 1 - li / (L.length - 1);
          const rock = [[14, 22, 36], [10, 16, 28], [7, 11, 20], [4, 7, 13]][li], air = [58 + 34 * far, 80 + 36 * far, 112 + 34 * far];
          // each face is lit by the slope of its own ridge (light from the upper left), with vertical gullies below
          const slope = new Float32Array(N + 1); for (let i = 0; i <= N; i++) { let sm = 0; for (let d = 3; d <= 23; d += 5) sm += (tops[Math.min(N, i + d)] - tops[Math.max(0, i - d)]) * N / (2 * d); slope[i] = sm / 5; }
          const ph = Math.max(8, Math.round(h / Math.max(1.4, Math.max(w, h) / 1280)));
          const m = SIG.soft(w, h, 1.4, (u, v) => {
            const fi = u * N, i0 = Math.min(N - 1, Math.floor(fi)), i = Math.round(fi), top = SIG.mix(tops[i0], tops[i0 + 1], fi - i0);
            const edgeA = SIG.clamp((v - top) * ph + 0.5); if (edgeA <= 0) return [0, 0, 0, 0];
            const depth = SIG.clamp((v - top) / a), gul = SIG.ridge(u * sc * 5 + v * 2.2, v * sc * 3.2, sd + 50, 4), face = SIG.clamp(0.5 - slope[i] * 1.2);
            const lit = SIG.clamp(SIG.mix(face, 0.35, SIG.clamp(depth * 1.6)) + (gul - 0.5) * 0.24);
            const snow = SIG.clamp((lit - 0.55) * 3.5) * SIG.clamp(1 - depth * 4.5) * SIG.clamp(gul * 1.3);
            let r = rock[0] + lit * 26, gg = rock[1] + lit * 34, bb = rock[2] + lit * 46;
            r = mix3(r, 226, snow); gg = mix3(gg, 236, snow); bb = mix3(bb, 250, snow);
            const haze = 0.08 + far * 0.5 - depth * 0.1; return [mix3(r, air[0], haze), mix3(gg, air[1], haze), mix3(bb, air[2], haze), 255 * edgeA]; });
          SIG.up(g, m, w, h);
          if (fogAmt > 0) { const fy = (b + 0.04) * h, fg = g.createLinearGradient(0, fy - h * 0.14, 0, fy + h * 0.06); fg.addColorStop(0, "rgba(160,190,222,0)"); fg.addColorStop(0.72, `rgba(160,190,222,${0.3 * fogAmt})`); fg.addColorStop(1, "rgba(160,190,222,0)"); g.fillStyle = fg; g.fillRect(0, fy - h * 0.14, w, h * 0.2); }
        });
        SIG.calm(g, w, h, 0.5, 0.5); SIG.grain(g, w, h, 0.045);
        fog = fogAmt > 0 ? SIG.soft(w * 2, h, 4, (u, v) => { const f = SIG.fbm(u * 6, v * 5, 71, 5), band = Math.exp(-Math.pow((v - 0.72) * 4.5, 2)); return [200, 220, 240, SIG.clamp((f - 0.42) * 2.2) * band * 150 * fogAmt]; }) : null; },
      frame(t) { ctx.drawImage(base, 0, 0, w, h);
        if (fog) { const x = -((t * 6 * k) % (w * 2)); ctx.drawImage(fog, x, 0, w * 2, h); ctx.drawImage(fog, x + w * 2, 0, w * 2, h); } },
    };
  };
  const mix3 = (a, b, t) => a + (b - a) * t;

  // ---- Polar Lights (Aurora): aurora curtains over dark mountains, reflected in a still lake ----
  const sigAurora = (ctx) => {
    let w = 0, h = 0, k = 1, sky = null, cur = null, land = null;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h);
        sky = offscreen(w, h); let g = sky.getContext("2d"); const sg = g.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "#02040a"); sg.addColorStop(0.7, "#071425"); sg.addColorStop(1, "#0a1a2a"); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        SIG.stars(g, w, h * 0.7, Math.round(300 * w * h / 1.44e6) + 40, 55, 1, k);
        // the curtains, painted 1.5x as wide so they can drift
        const green = [60, 255, 160], teal = [40, 210, 220], violet = [160, 90, 255];
        cur = SIG.soft(w * 1.5, h, 1.8, (u, v) => { const x = u * 1.5;
          const yb = 0.42 + 0.12 * Math.sin(x * 4.1 + 1) + 0.06 * Math.sin(x * 9.3) + 0.05 * (SIG.fbm(x * 2, 0.3, 5, 3) - 0.5);   // the curtain's lower edge
          const d = yb - v; if (d < -0.03 || v > 0.62) return [0, 0, 0, 0];
          const rays = Math.pow(SIG.fbm(x * 38, v * 1.6, 9, 3), 2.2) * 1.8, body = Math.exp(-Math.max(0, d) * 5) * (d < 0 ? Math.exp(d * 60) : 1);
          const fold = 0.55 + 0.45 * SIG.fbm(x * 3.5, 0.5, 15, 3), I = SIG.clamp(body * rays * fold);
          const tt = SIG.clamp(d * 3.2), c = tt < 0.5 ? teal.map((q, i) => mix3(green[i], q, tt * 2)) : teal.map((q, i) => mix3(q, violet[i], (tt - 0.5) * 2));
          return [c[0], c[1], c[2], I * 235]; });
        { const big = offscreen(w * 1.5, h); SIG.up(big.getContext("2d"), cur, w * 1.5, h); cur = big; }   // upscaled once, not every frame
        land = offscreen(w, h); g = land.getContext("2d");
        const tops = SIG.range(300, 33, 0.72, 0.16, 2.6), lake = 0.78;
        g.fillStyle = "rgba(2,6,12,0.45)"; g.fillRect(0, lake * h, w, h - lake * h);   // the lake's darker water (over its reflection)
        g.fillStyle = "#030608"; g.beginPath(); g.moveTo(0, lake * h); tops.forEach((y, i) => g.lineTo((i / 300) * w, Math.min(y, lake) * h)); g.lineTo(w, lake * h); g.closePath(); g.fill();
        // rim light on the ridgeline from the aurora
        g.strokeStyle = "rgba(90,255,190,0.25)"; g.lineWidth = 1.2 * k; g.beginPath(); tops.forEach((y, i) => (i ? g.lineTo((i / 300) * w, Math.min(y, lake) * h) : g.moveTo(0, Math.min(y, lake) * h))); g.stroke();
        SIG.calm(g, w, h, 0.22, 0.5);
        this._lake = lake; },
      frame(t) {
        // the curtains drift less than a pixel a frame: the picture is composed again only when they've moved a pixel
        const off = Math.round((t * 4 * k) % (w * 0.5)), a = Math.round((0.85 + 0.15 * Math.sin(t * 0.25)) * 40) / 40, key = off + "|" + a;
        if (!this._c || this._c.width !== Math.round(w)) { this._c = offscreen(w, h); this._key = ""; }
        if (this._key !== key) { this._key = key; const g = this._c.getContext("2d");
          g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(sky, 0, 0, w, h);
          g.globalCompositeOperation = "lighter"; g.globalAlpha = a; g.drawImage(cur, -off, 0, w * 1.5, h);
          const L = this._lake * h;   // the lake: the sky above it, upside down, a little darker
          g.save(); g.globalAlpha = 0.35; g.translate(0, 2 * L); g.scale(1, -1); g.beginPath(); g.rect(0, L - h * 0.4, w, h * 0.4); g.clip(); g.drawImage(cur, -off, 0, w * 1.5, h); g.restore();
          g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(land, 0, 0, w, h); }
        ctx.drawImage(this._c, 0, 0, w, h); },
    };
  };

  // ---- Skyline (Neon City): a city at night in three depths, neon on the edges, a wet street reflecting it ----
  const sigCity = (ctx) => {
    let w = 0, h = 0, k = 1, base = null, signs = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); const R = SIG.rng(808), street = 0.8;
        base = offscreen(w, h); const g = base.getContext("2d");
        const sg = g.createLinearGradient(0, 0, 0, street * h); sg.addColorStop(0, "#04030c"); sg.addColorStop(0.6, "#120a2a"); sg.addColorStop(1, "#2a1240"); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        const haze = SIG.soft(w, h, 4, (u, v) => { const c = SIG.fbm(u * 3, v * 5, 4, 4); return [80, 40, 140, SIG.clamp((c - 0.45) * 2) * 60 * SIG.clamp(1 - Math.abs(v - 0.55) * 2.5)]; }); SIG.up(g, haze, w, h);
        const layers = [[0.35, 0.22, "#0d0a1c", 0.12, 26], [0.5, 0.32, "#090717", 0.35, 18], [0.62, 0.42, "#050410", 0.75, 12]];
        signs = [];
        layers.forEach(([minH, maxH, col, wins, n], li) => {
          let x = -R() * w * 0.05;
          while (x < w) { const bw = (w / n) * (0.6 + R() * 0.9), bh = (minH + R() * (maxH - minH)) * h * (Math.abs(x / w - 0.5) < 0.18 ? 0.75 : 1), y = street * h - bh;   // lower in the middle
            g.fillStyle = col; g.fillRect(x, y, bw, bh + 1);
            if (wins > 0) { const cw = Math.max(2, 3 * k), ch = Math.max(2, 4 * k), gx = cw * 2.2, gy = ch * 2.1;
              for (let yy = y + ch * 2; yy < street * h - ch; yy += gy) for (let xx = x + cw; xx < x + bw - cw; xx += gx) if (R() < wins * 0.35) {
                const warm = R() < 0.55; g.fillStyle = warm ? `rgba(255,${180 + R() * 50 | 0},120,${0.25 + R() * 0.5})` : `rgba(${120 + R() * 60 | 0},200,255,${0.2 + R() * 0.45})`; g.fillRect(xx, yy, cw, ch); } }
            if (li === 2 && R() < 0.5) { const nc = R() < 0.5 ? "0,230,255" : "255,60,200"; g.strokeStyle = `rgba(${nc},0.85)`; g.lineWidth = 1.5 * k; g.strokeRect(x + 0.5, y + 0.5, bw - 1, bh);
              g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${nc},0.18)`; g.lineWidth = 7 * k; g.strokeRect(x, y, bw, bh); g.restore();
              if (R() < 0.6) signs.push({ x: x + bw * 0.5, y: y + bh * (0.2 + R() * 0.3), c: nc, p: R() * T2, s: (8 + R() * 10) * k }); }
            x += bw + R() * w * 0.008; } });
        // the wet street: everything above, upside down, darker and smeared
        const L = street * h; g.save(); g.globalAlpha = 0.42; g.translate(0, 2 * L); g.scale(1, -1); g.drawImage(base, 0, 0, w, h); g.restore();
        const wet = g.createLinearGradient(0, L, 0, h); wet.addColorStop(0, "rgba(10,6,20,0.35)"); wet.addColorStop(1, "rgba(4,3,8,0.92)"); g.fillStyle = wet; g.fillRect(0, L, w, h - L);
        g.fillStyle = "rgba(255,60,200,0.35)"; g.fillRect(0, L, w, Math.max(1, k));
        SIG.calm(g, w, h, 0.28, 0.55); SIG.grain(g, w, h, 0.05); },
      frame(t) { ctx.drawImage(base, 0, 0, w, h);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (const s of signs) { const a = 0.55 + 0.25 * Math.sin(t * 1.3 + s.p) + (Math.sin(t * 9 + s.p * 7) > 0.995 ? -0.4 : 0); glowDot(ctx, s.x, s.y, s.s * 3, s.c, a * 0.35); ctx.fillStyle = `rgba(${s.c},${a})`; ctx.fillRect(s.x - s.s, s.y - s.s * 0.18, s.s * 2, s.s * 0.36); }
        ctx.restore(); },
    };
  };

  // ---- Void: deep purple energy waves on black ----
  // Many thin luminous ribbons that flow across the picture, a soft glow under them; they breathe slowly.
  const sigVoid = (ctx) => {
    let w = 0, h = 0, k = 1, glow = null, lines = null;
    const draw = (g, W, H, kk, ph, wide) => { g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (let i = 0; i < 46; i++) { const f = i / 45, band = Math.sin(f * Math.PI), y0 = 0.5 + (f - 0.5) * 0.9;
        const hue = 268 + 40 * Math.sin(f * 5.1), a = wide ? 0.05 + band * 0.06 : 0.1 + band * 0.42;
        g.strokeStyle = `hsla(${hue},95%,${wide ? 55 : 70}%,${a})`; g.lineWidth = (wide ? 18 : 0.9 + band * 0.9) * kk; g.beginPath();
        for (let s = 0; s <= 140; s++) { const u = s / 140, x = u * W, curve = 0.18 * Math.sin(u * 3.2 + f * 2.4 + ph) + 0.07 * Math.sin(u * 7.1 - f * 4 + ph * 1.3) + 0.04 * Math.sin(u * 13 + f * 9);
          const pinch = 0.55 + 0.45 * Math.abs(Math.sin(u * 2.6 + 0.6)), y = (0.5 + (y0 - 0.5) * pinch + curve) * H; s ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke(); }
      g.restore(); };
    return {
      resize(W, H) { w = W; h = H; k = Math.min(w, h) / 600;   // (true scale, so a thumbnail has the same thin ribbons)
        const gl = offscreen(w / 4, h / 4), gg = gl.getContext("2d"); gg.fillStyle = "#000"; gg.fillRect(0, 0, w, h); draw(gg, w / 4, h / 4, k / 4, 0, true);
        glow = offscreen(w, h); const g = glow.getContext("2d"); g.fillStyle = "#020104"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "lighter"; SIG.up(g, gl, w, h); g.globalCompositeOperation = "source-over"; SIG.calm(g, w, h, 0.34, 0.55);
        // the ribbons, once per size (1.1x wide, so they can sway), already softened in the middle
        lines = offscreen(w * 1.1, h); const lg = lines.getContext("2d"); draw(lg, w * 1.1, h, k, 0.4, false);
        lg.globalCompositeOperation = "destination-out"; lg.translate(w * 0.55, h * 0.52); lg.scale(w * 0.42, h * 0.34);
        const r = lg.createRadialGradient(0, 0, 0, 0, 0, 1); r.addColorStop(0, "rgba(0,0,0,0.4)"); r.addColorStop(1, "rgba(0,0,0,0)"); lg.fillStyle = r; lg.fillRect(-1.5, -1.5, 3, 3); },
      frame(t) {
        ctx.drawImage(glow, 0, 0, w, h);
        const sway = Math.sin(t * 0.05) * w * 0.045, breathe = 0.82 + 0.18 * Math.sin(t * 0.21);
        ctx.save(); ctx.globalAlpha = breathe; ctx.drawImage(lines, -w * 0.05 + sway, 0, w * 1.1, h); ctx.restore(); },
    };
  };

  // ---- Blood Moon: a huge red moon behind dark drifting clouds ----
  const sigBlood = (ctx) => {
    let w = 0, h = 0, k = 1, base = null, cl = null, mx = 0, my = 0, mr = 0;
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); mx = w * 0.7; my = h * 0.3; mr = Math.min(w, h) * 0.2;
        base = offscreen(w, h); const g = base.getContext("2d"); const sg = g.createLinearGradient(0, 0, 0, h); sg.addColorStop(0, "#020001"); sg.addColorStop(0.7, "#0a0103"); sg.addColorStop(1, "#160306"); g.fillStyle = sg; g.fillRect(0, 0, w, h);
        SIG.stars(g, w, h * 0.8, Math.round(120 * w * h / 1.44e6) + 20, 66, 1, k * 0.8);
        glowDot(g, mx, my, mr * 5, "150,14,8", 0.28); glowDot(g, mx, my, mr * 1.7, "255,70,30", 0.3);
        const tone = SIG.ramp([[0, 52, 6, 3], [0.35, 140, 26, 10], [0.65, 214, 66, 28], [0.88, 250, 120, 62], [1, 255, 170, 110]]), d = Math.ceil(mr * 2);
        const moon = SIG.paint(d, d, (u, v) => { const x = u * 2 - 1, y = v * 2 - 1, r = Math.hypot(x, y); if (r > 1) return [0, 0, 0, 0];
          const z = Math.sqrt(1 - r * r), shade = SIG.clamp(0.25 + 0.75 * (z * 0.7 - x * 0.25 - y * 0.2));
          const maria = SIG.fbm(x * 2.2 + 4, y * 2.2, 12, 5), crat = Math.pow(SIG.ridge(x * 5, y * 5, 19, 3), 3) * 0.25;
          const t = SIG.clamp((0.62 - (maria - 0.5) * 0.9 + crat) * shade), c = tone(t), edge = SIG.clamp((1 - r) * mr * 0.9); return [c[0], c[1], c[2], 255 * edge]; });
        g.drawImage(moon, mx - mr, my - mr, d, d);
        const hz = SIG.soft(w, h, 3, (u, v) => { const f = SIG.fbm(u * 2, v * 6, 8, 4); return [12, 2, 3, SIG.clamp((v - 0.72) * 3.5) * (180 + f * 75)]; }); SIG.up(g, hz, w, h);   // low dark hills of cloud
        SIG.calm(g, w, h, 0.22, 0.55); SIG.grain(g, w, h, 0.05);
        cl = SIG.soft(w * 2, h, 2.5, (u, v) => { const x = u * 2; const c = SIG.fbm(x * 2.6 + SIG.fbm(x, v, 3, 3), v * 4.2, 31, 6), band = SIG.clamp(1 - Math.abs(v - 0.33) * 2.6);
          const a = SIG.clamp((c - 0.47) * 3) * band, rim = SIG.clamp((c - 0.47) * 6) - SIG.clamp((c - 0.55) * 6);
          const lit = SIG.clamp(1 - Math.hypot((x / 2 - 0.35) * 1.8, (v - 0.3) * 2.4) * 1.6);   // edges facing the moon glow red
          return [mix3(10, 235, rim * (0.25 + 0.75 * lit)), mix3(2, 58, rim * (0.25 + 0.75 * lit)), mix3(3, 34, rim * (0.25 + 0.75 * lit)), a * 245]; }); },
      frame(t) { ctx.drawImage(base, 0, 0, w, h); const x = -((t * 5 * k) % (w * 2)); ctx.drawImage(cl, x, 0, w * 2, h); ctx.drawImage(cl, x + w * 2, 0, w * 2, h); },
    };
  };

  function makeSkin(id, ctx, saved) {
    // "fx:<effect>": an effect layer (see-through, cleared every frame). saved = { amount, lightning... }
    if (typeof id === "string" && id.startsWith("fx:")) {
      const e = window.PriismEffects[id.slice(3)] || window.PriismEffects.rain, o = { ...(saved || {}) };
      o.amount = Math.max(0.3, Math.min(2, +o.amount || 1));
      const fx = e.create(ctx, o); let W = 0, H = 0;
      return { resize(w, h) { W = w; H = h; fx.resize(w, h); }, frame(t, dt) { const cv = ctx.canvas; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); fx.frame(t, dt); } };
    }
    const def = window.WickedSkins[id] || window.WickedSkins.aurora, sk = def.create(ctx, optsOf(def, saved)), rc = recolourOf(saved);
    if (!rc) return sk;
    let spr = null;
    const paint = () => { if (!spr) return; const cv = ctx.canvas; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "color"; ctx.globalAlpha = rc.s;
      ctx.drawImage(spr, 0, 0, cv.width, cv.height); ctx.restore(); };
    return { resize(W, H) { spr = spr || recolourSprite(rc.c); sk.resize(W, H); }, frame(t, dt) { sk.frame(t, dt); paint(); } };
  }
  window.PriismMakeSkin = makeSkin;
  window.PriismSkinOpts = { optsOf, recolourOf };

  window.WickedSkins = {
    aurora:    { name: "Aurora",          cat: "Wild", create: sigAurora },
    nebula:    { name: "Stardust",    cat: "Cosmos",  create: nebula },
    starfield: { name: "Deep Field", cat: "Cosmos",  create: starfield, oled: true , opts: [AMT] },
    embers:    { name: "Cinders",    cat: "Fire",   create: embers },
    matrix:    { name: "Code Rain",    cat: "Electric",   create: matrix, oled: true, opts: [{ k: "size", label: "Size", type: "range", min: 0.7, max: 1.8, step: 0.1, def: 1 }] },
    synthwave: { name: "Retro Sun", cat: "Electric",   create: synthwave },
    rain:      { name: "Night Drizzle", cat: "Urban",   create: rain , opts: [AMT] },
    graphite:  { name: "Slate",  cat: "Chill",   create: graphite },
    ocean:     { name: "Tide",     cat: "Chill",   create: ocean },
    deepsea:   { name: "Abyssal Glow",  cat: "Chill",   create: deepsea },
    bokeh:     { name: "Soft Focus",     cat: "Chill",   create: bokeh, oled: true , opts: [AMT] },
    fireflies: { name: "Glowbugs", cat: "Wild", create: fireflies , opts: [AMT] },
    sakura:    { name: "Petal Drift",    cat: "Wild", create: sakura , opts: [AMT] },
    snow:      { name: "Snowfall",  cat: "Elements", create: snow , opts: [AMT] },
    storm:     { name: "Storm",        cat: "Elements", create: sigStorm, opts: [{ k: "lightning", label: "Lightning", type: "toggle", def: true }, { k: "ground", label: "Mountains", type: "toggle", def: false }] },
    sunset:    { name: "Dusk Clouds", cat: "Elements", create: sunsetclouds },
    galaxy:    { name: "Spiral Galaxy",    cat: "Cosmos",  create: galaxy, oled: true },
    hyperspace:{ name: "Lightspeed", cat: "Cosmos", create: hyperspace, oled: true },
    lavalamp:  { name: "Lava Lamp", cat: "Fire",   create: lavalamp },
    plasma:    { name: "Plasma",    cat: "Electric",   create: plasma },
    cybergrid: { name: "Cyber Grid", cat: "Electric",  create: cybergrid },
    circuit:   { name: "Circuit",   cat: "Electric",   create: circuit, oled: true },
    neoncity:  { name: "Neon City", cat: "Urban", create: sigCity },
    tickertape:   { name: "Ticker Tape",   cat: "Markets", create: tickertape, oled: true },
    tradingfloor: { name: "Trading Floor", cat: "Markets", create: tradingFloor, wow: true,
      opts: [{ k: "board", label: "Quote board", type: "toggle", def: true }, { k: "refresh", label: "Screens refresh", type: "toggle", def: true }] },
    marketwall:   { name: "Market Wall",   cat: "Markets", create: marketWall,
      opts: [{ k: "focus", label: "Blur", type: "range", min: 0, max: 3, step: 0.25, def: 1 }, { k: "drift", label: "Charts drift", type: "toggle", def: true }] },
    midnight:     { name: "Midnight Moon", cat: "Chill",   create: midnight,
      opts: [{ k: "moon", label: "Moon", type: "toggle", def: true }, { k: "clouds", label: "Clouds", type: "toggle", def: true }, { k: "skyline", label: "Skyline", type: "toggle", def: true }] },
    twinkle:      { name: "Twinkle",       cat: "Cosmos",  create: twinkle, oled: true,
      opts: [{ ...AMT, label: "Stars" }, { k: "sparkle", label: "Sparkle", type: "toggle", def: true }] },
    // pack 2
    eclipse:     { name: "Eclipse",        cat: "Cosmos",   create: sigEclipse },
    comets:      { name: "Meteor Shower",  cat: "Cosmos",   create: comets },
    wormhole:    { name: "Wormhole",       cat: "Cosmos",   create: wormhole, oled: true },
    pulsar:      { name: "Pulsar",         cat: "Cosmos",   create: pulsar },
    wildfire:    { name: "Wildfire",       cat: "Fire",     create: wildfire },
    volcano:     { name: "Caldera",        cat: "Fire",     create: volcano },
    hexgrid:     { name: "Hive",           cat: "Electric", create: hexgrid },
    crt:         { name: "Old Terminal",   cat: "Electric", create: crt },
    laser:       { name: "Laser Show",     cat: "Electric", create: laser },
    nightdrive:  { name: "Night Drive",    cat: "Urban",    create: nightdrive },
    towers:      { name: "Midnight Towers",cat: "Urban",    create: towers },
    zenwaves:    { name: "Zen Waves",      cat: "Chill",    create: zenwaves },
    mist:        { name: "Fog Bank",       cat: "Chill",    create: mist },
    bubbles:     { name: "Reef Light",     cat: "Chill",    create: bubbles },
    silk:        { name: "Imperial",       cat: "Chill",    create: sigSilk },
    obsidian:    { name: "Obsidian",       cat: "Abstract", create: sigObsidian },
    void:        { name: "Void",           cat: "Abstract", create: sigVoid, oled: true },
    leaves:      { name: "Autumn Drift",   cat: "Wild",     create: leaves },
    mountains:   { name: "Glacier",        cat: "Wild",     create: sigRidge, opts: [{ k: "moon", label: "Moon", type: "toggle", def: true }, { k: "fog", label: "Mist", type: "range", min: 0, max: 1, step: 0.05, def: 0.6 }] },
    bloodmoon:   { name: "Blood Moon",     cat: "Cosmos",   create: sigBlood },
    jellyfish:   { name: "Jellyfish",      cat: "Wild",     create: jellyfish },
    // pack 3: the "wow" set
    blackhole:   { name: "Event Horizon",  cat: "Cosmos",   create: blackhole, wow: true },
    julia:       { name: "Fractal Bloom",  cat: "Abstract", create: julia, wow: true },
    inkflow:     { name: "Ink Flow",       cat: "Abstract", create: inkflow, wow: true },
    kaleido:     { name: "Kaleidoscope",   cat: "Abstract", create: kaleido, wow: true, oled: true },
    oilslick:    { name: "Oil Slick",      cat: "Abstract", create: oilslick, wow: true },
    tesseract:   { name: "Tesseract",      cat: "Abstract", create: tesseract, wow: true },
    helix:       { name: "Double Helix",   cat: "Wild",     create: helix, wow: true },
    synapse:     { name: "Synapse",        cat: "Electric", create: synapse, wow: true },
    nebulacore:  { name: "Nebula",         cat: "Cosmos",   create: nebulaCore, wow: true },
    // pack 4: detailed showpieces
    koi:         { name: "Koi Pond",       cat: "Chill",    create: koiPond, wow: true },
    rainglass:   { name: "Rain on Glass",  cat: "Urban",    create: rainGlass, wow: true },
    ringed:      { name: "Ringed Giant",   cat: "Cosmos",   create: ringedGiant, wow: true },
    deepblue:    { name: "Deep Blue",      cat: "Chill",    create: deepBlue, wow: true },
    cozyroom:    { name: "Cozy Room",      cat: "Chill",    create: cozyRoom, wow: true },
    tokyo:       { name: "Tokyo Rooftop",  cat: "Urban",    create: tokyoRooftop, wow: true },
    // seasonal drops (featured in their month by the panel)
    christmas:   { name: "Christmas Eve",  cat: "Seasonal", create: christmas, season: "christmas" },
    treelights:  { name: "Tree Lights",    cat: "Seasonal", create: treeLights, season: "christmas" },
    village:     { name: "Winter Village", cat: "Seasonal", create: winterVillage, season: "christmas" },
    noel:        { name: "Northern Noel",  cat: "Seasonal", create: northernNoel, season: "christmas" },
    hallows:     { name: "Hallows Night",  cat: "Seasonal", create: hallows, season: "halloween" },
  };
  // Retired because they were too busy behind a chart. Not listed any more, but anyone who had one selected (or saved
  // in a look, session or symbol) gets the calm Fog Bank instead of a broken wallpaper. Non-enumerable = hidden from lists.
  for (const old of ["equalizer", "candlefall", "depthmap", "ghostcharts"]) Object.defineProperty(window.WickedSkins, old, { value: window.WickedSkins.mist, enumerable: false });
}
priismSkins(window, document);
window.__priismSkinsSrc = "(" + priismSkins.toString() + ")";   // for the off-main-thread wallpaper worker
})();

// ---------- Live candle atmosphere, zone lights and wallpaper clarity (window.PriismAtmo) ----------
// Drawn by content.js on two canvases in each wallpaper tile: BEHIND the chart (the chart's own canvases sit on top),
// so smoke and light never cover a candle, a wick, a price label or an order. Positions come from the chart itself
// (hook.js / lw.js publish where the live candle and the zones are, after each paint). The panel uses the same code
// for its preview. Coordinates are page (CSS px) coordinates.
(function () {
  if (window.PriismAtmo) return;
  const rgbHex = (h) => (/^#[0-9a-f]{6}$/i.test(h || "") ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null);
  const rgbAny = (v) => (Array.isArray(v) ? v : typeof v === "string" && /^\d{1,3},\d{1,3},\d{1,3}$/.test(v) ? v.split(",").map(Number) : rgbHex(v));
  const mix = (a, b, f) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * f);
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const WHITE = [255, 255, 255], CYAN = [94, 231, 255], VIOLET = [164, 107, 255];
  // a soft round light in one colour (made once, then just stretched and placed: no blur, no per-frame gradients)
  const SPR = new Map();
  function sprite(c) {
    const q = c.map((v) => Math.round(v / 8) * 8), key = q.join(",");
    let s = SPR.get(key); if (s) return s;
    if (SPR.size > 64) SPR.clear();
    s = document.createElement("canvas"); s.width = s.height = 64;
    const g = s.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(q, 1)); gr.addColorStop(0.35, rgba(q, 0.55)); gr.addColorStop(0.7, rgba(q, 0.14)); gr.addColorStop(1, rgba(q, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); SPR.set(key, s); return s;
  }
  // a horizontal band of light along one zone edge
  function strip(g, x, y, w, c, a, th) {
    if (a <= 0.01 || w <= 0) return;
    const gr = g.createLinearGradient(0, y - th, 0, y + th);
    gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(0.5, rgba(c, a * 0.55)); gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(x, y - th, w, 2 * th);
    g.fillStyle = rgba(mix(c, WHITE, 0.35), a * 0.85); g.fillRect(x, y - 0.5, w, 1);
  }
  function perim(x, y, w, h, d) {             // a point d px along a box's outline (clockwise from the top-left)
    const P = 2 * (w + h); d = ((d % P) + P) % P;
    if (d < w) return [x + d, y]; d -= w; if (d < h) return [x + w, y + d]; d -= h; if (d < w) return [x + w - d, y + h]; d -= w; return [x, y + h - d];
  }
  // o (settings): { fx: off|smoke|vapor|mist, trail, aura, color (hex or null = the candle's), op 0..1, len (candles),
  //   fade (ms), zfx: { near, ripple, flow, dir, fusion }, reduce (reduced motion), lite }
  function engine() {
    const S = new Map();
    const st = (p) => { const key = Math.round(p.l) + "," + Math.round(p.t); let s = S.get(key);
      if (!s) S.set(key, (s = { parts: [], ghosts: [], emit: 0, lastG: 0, zs: new Map(), aura: null, anchor: null, col: null, seen: 0 })); return s; };
    function zones(g, p, s, L, cy, o, now) {
      const D = Math.max(36, p.h * 0.1), T = now / 1000, Z = o.zfx || {}, seen = new Set();
      let fuse = null, busy = false;
      for (const z of p.zones || []) {
        const [x, y, w, h, k] = z, c = rgbAny(k); if (!c || w < 16 || h < 4) continue;
        const key = Math.round(y) + "|" + Math.round(h) + "|" + k; seen.add(key);
        const inside = cy >= y - 1 && cy <= y + h + 1;
        let zs = s.zs.get(key);
        if (!zs) { zs = { inside, from: null, rip: null, ripT: 0, y, h, t: now, pc: cy }; s.zs.set(key, zs); }
        else {
          // only a real touch counts: the zone didn't move or resize (no zoom / rescale) and we saw price a moment ago
          const stable = Math.abs(zs.y - y) <= 1.5 && Math.abs(zs.h - h) <= 1.5 && now - zs.t < 2000;
          if (!zs.inside && inside && stable) {
            zs.from = zs.pc < y ? "top" : "bottom";
            if (Z.ripple && !o.reduce && now - zs.ripT > 3000) { zs.rip = { t: now, x: clamp(L.x, x + 8, x + w - 8) }; zs.ripT = now; }
          }
          if (!inside) zs.from = null;
          Object.assign(zs, { inside, y, h, t: now, pc: cy });
        }
        const breath = o.reduce ? 1 : 0.82 + 0.18 * Math.sin(T * 2.1);
        const d = inside ? 0 : cy < y ? y - cy : cy - (y + h), near = !inside && d < D;
        if (inside) {
          if (Z.fusion && !fuse) fuse = c;
          if (Z.dir && zs.from) { strip(g, x, zs.from === "top" ? y : y + h, w, c, 0.75 * breath, 8); busy = busy || !o.reduce; }
        } else if (Z.near && near) strip(g, x, cy < y ? y : y + h, w, c, Math.pow(1 - d / D, 1.6) * 0.8, 7);
        if (Z.flow && (inside || near) && !o.reduce) {           // a soft light travelling round the outline
          const P = 2 * (w + h), head = ((T / 3.6) % 1) * P, spr = sprite(mix(c, WHITE, 0.3));
          for (let i = 0; i < 16; i++) { const [px, py] = perim(x, y, w, h, head - i * 5); g.globalAlpha = 0.7 * (1 - i / 16) * (inside ? 1 : 0.6); g.drawImage(spr, px - 5, py - 5, 10, 10); }
          g.globalAlpha = 1; busy = true;
        }
        if (zs.rip) {                                            // one ripple along the touched edge
          const u = (now - zs.rip.t) / 1100, ey = zs.from === "bottom" ? y + h : y;
          if (u >= 1) zs.rip = null;
          else { busy = true; g.lineWidth = 1.6;
            for (const uu of [u, u - 0.2]) { if (uu <= 0) continue; const rx = 6 + uu * Math.min(w * 0.45, 180);
              g.strokeStyle = rgba(mix(c, WHITE, 0.3), 0.7 * Math.pow(1 - uu, 1.5)); g.beginPath(); g.ellipse(zs.rip.x, ey, rx, rx * 0.18 + 2, 0, 0, Math.PI * 2); g.stroke(); } }
        }
      }
      for (const [key, zs] of s.zs) if (!seen.has(key) && now - zs.t > 3000) s.zs.delete(key);
      return { fuse, busy };
    }
    // draws every pane's effects; returns true while something is still moving (the caller keeps animating)
    function frame(g, panes, o, now, dt) {
      let busy = false; dt = clamp(dt || 0.016, 0, 0.1);
      const seenKeys = new Set();
      for (const p of panes) {
        const s = st(p); seenKeys.add(Math.round(p.l) + "," + Math.round(p.t)); s.seen = now;
        const L = p.live, base = L ? rgbAny(o.color) || rgbAny(L.c) || CYAN : s.col || CYAN;
        if (L) s.col = base;
        const cy = L ? (L.up ? L.y0 : L.y1) : 0, len = clamp(+o.len || 4, 1, 12), fade = clamp(+o.fade || 450, 150, 3000), op = clamp(o.op === undefined ? 0.15 : +o.op, 0, 1);
        g.save(); g.beginPath(); g.rect(p.l, p.t, p.w, p.h); g.clip();
        let fuse = null;
        if (L && o.zfx && (o.zfx.near || o.zfx.ripple || o.zfx.flow || o.zfx.dir || o.zfx.fusion)) { const r = zones(g, p, s, L, cy, o, now); fuse = r.fuse; busy = busy || r.busy; }
        if (L && o.fx === "mist") {                                 // soft cyan / violet mist round the live price
          const T = o.reduce ? 0 : now / 1000, cA = rgbAny(o.color), cols = cA ? [cA, mix(cA, WHITE, 0.3)] : [CYAN, VIOLET];
          const cx0 = L.x - len * L.sp * 0.45, R = Math.max(30, L.sp * 3.2), n = o.lite ? 3 : 6;
          for (let j = 0; j < n; j++) { const a = T * 0.22 * (j % 2 ? 1 : -1) + j * 1.05, x = cx0 + Math.cos(a) * len * L.sp * 0.55, y = cy + Math.sin(a * 1.3) * R * 0.45, r = R * (0.8 + 0.35 * Math.sin(j * 1.7));
            g.globalAlpha = op * 0.9; g.drawImage(sprite(cols[j % 2]), x - r, y - r, 2 * r, 2 * r); }
          g.globalAlpha = 1; busy = busy || !o.reduce;
        }
        if (L && o.fx === "vapor") {                                // smooth ribbons drifting back from the live candle
          const T = o.reduce ? 0 : now / 1000, ln = len * L.sp * 1.4, n = o.lite ? 2 : 3; g.lineCap = "round";
          for (let i = 0; i < n; i++) { const amp = Math.max(4, L.sp * 0.55) * (1 - i * 0.2), gr = g.createLinearGradient(L.x, 0, L.x - ln, 0);
            gr.addColorStop(0, rgba(mix(base, WHITE, 0.2), op * 1.5 * (1 - i * 0.25))); gr.addColorStop(1, rgba(base, 0));
            g.strokeStyle = gr; g.lineWidth = Math.max(2, L.bw * 0.75) * (1 - i * 0.25); g.beginPath();
            for (let k = 0; k <= 20; k++) { const f = k / 20, x = L.x - f * ln, y = cy - f * L.sp * 0.6 * (i + 0.5) + Math.sin(f * 5 + T * 1.7 + i * 2.1) * amp * f; k ? g.lineTo(x, y) : g.moveTo(x, y); }
            g.stroke(); }
          busy = busy || !o.reduce;
        }
        // Phantom Smoke: puffs leave the live candle's close and drift back (to the left) and up, then fade
        if (L && o.fx === "smoke" && !o.reduce) {
          s.emit += (o.lite ? 14 : 36) * dt;
          const cap = o.lite ? 16 : 48;
          while (s.emit >= 1 && s.parts.length < cap) { s.emit -= 1;
            s.parts.push({ dx: (Math.random() - 0.5) * L.bw * 0.7, dy: (Math.random() - 0.5) * Math.max(2, L.bw * 0.3), mx: -len * L.sp * (0.75 + 0.5 * Math.random()),
              my: -(L.sp * 0.9 + 6) * (0.3 + 0.6 * Math.random()), life: fade * (0.8 + 0.4 * Math.random()), age: 0, s0: L.bw * 0.55 + 2, s1: L.bw * 1.2 + L.sp * 0.7 + 6 }); }
          s.emit = Math.min(s.emit, 2);
        }
        if (s.parts.length) {
          if (L) s.anchor = { x: L.x, y: cy }; const A = s.anchor, spr = sprite(mix(base, WHITE, 0.25));
          for (let i = s.parts.length - 1; i >= 0; i--) { const q = s.parts[i]; q.age += dt * 1000; const u = q.age / q.life;
            if (u >= 1 || !A) { s.parts.splice(i, 1); continue; }
            const e = 1 - (1 - u) * (1 - u), r = q.s0 + (q.s1 - q.s0) * u;
            g.globalAlpha = op * (u < 0.12 ? u / 0.12 : 1) * Math.pow(1 - u, 1.4);
            g.drawImage(spr, A.x + q.dx + q.mx * e - r, A.y + q.dy + q.my * e - r, 2 * r, 2 * r); }
          g.globalAlpha = 1; busy = true;
        }
        // Afterimage: fading copies of the live body, sliding back
        if (L && o.trail && !o.reduce && now - s.lastG > (o.lite ? 120 : 70)) { s.lastG = now; s.ghosts.push({ t: now, y0: L.y0, y1: L.y1, bw: L.bw }); }
        if (s.ghosts.length) {
          for (let i = s.ghosts.length - 1; i >= 0; i--) { const q = s.ghosts[i], u = (now - q.t) / fade;
            if (u >= 1 || !L) { s.ghosts.splice(i, 1); continue; }
            const x = L.x - u * len * L.sp, a = Math.min(0.9, op * 1.6) * Math.pow(1 - u, 2), hh = Math.max(1, q.y1 - q.y0);
            g.fillStyle = rgba(base, a * 0.4); g.fillRect(x - q.bw / 2 - 2, q.y0 - 2, q.bw + 4, hh + 4);
            g.fillStyle = rgba(mix(base, WHITE, 0.15), a); g.fillRect(x - q.bw / 2, q.y0, q.bw, hh); }
          busy = true;
        }
        // Live candle aura (and Zone fusion: the glow takes the colour of the zone price is in)
        if (L && (o.aura || fuse)) {
          const target = fuse ? mix(base, fuse, 0.7) : base;
          s.aura = s.aura ? mix(s.aura, target, Math.min(1, dt * 5)) : target;
          if (Math.abs(s.aura[0] - target[0]) + Math.abs(s.aura[1] - target[1]) + Math.abs(s.aura[2] - target[2]) > 3) busy = true;
          const k = o.reduce ? 1 : 0.88 + 0.12 * Math.sin(now / 1000 * 2.2), R = Math.max(L.bw * 2.4, (L.lo - L.hi) * 0.7, 16), my = (L.y0 + L.y1) / 2;
          g.globalCompositeOperation = "lighter"; g.globalAlpha = (o.aura ? 0.32 : 0.24) * k;
          g.drawImage(sprite(s.aura), L.x - R, my - R * 0.9, 2 * R, 1.8 * R);
          g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; busy = busy || !o.reduce;
        } else s.aura = null;
        g.restore();
      }
      for (const [key, s] of S) if (!seenKeys.has(key) && now - s.seen > 4000) S.delete(key);
      return busy;
    }
    return { frame, reset() { S.clear(); } };
  }
  // ----- clarity: drawn once per change (not animated) -----
  // tile = { x, y, w, h, grid (32x18 brightness of the wallpaper, 0..1), vis (how much of it shows: opacity x (1 - dim)) }
  // rects = the charts' price areas (the canvases candles are drawn on). o = { contrast: off | soft | strong }
  // (Picture › Smart dim)
  const GW = 32, GH = 18, mapC = document.createElement("canvas"); mapC.width = GW; mapC.height = GH;
  const mapG = mapC.getContext("2d");
  function clarity(g, tile, rects, panes, o) {
    if (o.contrast && o.contrast !== "off" && tile.grid && tile.grid.length === GW * GH) {
      // Smart dim: only where the wallpaper is bright, a soft shade behind the chart (none where it's already dark)
      const img = mapG.createImageData(GW, GH), k = o.contrast === "strong" ? 0.72 : 0.5, vis = clamp(tile.vis === undefined ? 1 : tile.vis, 0, 1);
      let any = false;
      for (let i = 0; i < GW * GH; i++) { const e = clamp((tile.grid[i] * vis - 0.36) / 0.38, 0, 1), a = Math.round(255 * e * k); img.data[i * 4 + 3] = a; if (a > 4) any = true; }
      if (any) { mapG.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; if (g.imageSmoothingQuality) g.imageSmoothingQuality = "high";
        for (const r of rects) { g.save(); g.beginPath(); g.rect(r.l, r.t, r.w, r.h); g.clip(); g.drawImage(mapC, tile.x, tile.y, tile.w, tile.h); g.restore(); } }
    }
  }
  window.PriismAtmo = { engine, clarity, sprite, GW, GH };
})();
