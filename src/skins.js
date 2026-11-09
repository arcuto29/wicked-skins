/* Built-in animated skins. Each factory gets a 2D canvas context and returns
   { resize(w,h), frame(t,dt) }. t = seconds, dt = seconds since last frame.
   The whole module is one function of (window, document), so the chart can also run it inside a background worker
   (window = the worker, document = a stand-in whose createElement gives an OffscreenCanvas). See content.js. */
(function () {
function priismSkins(window, document) {
  const rnd = (a, b) => a + Math.random() * (b - a);

  const aurora = (ctx) => {
    let w = 0, h = 0;
    const bands = [
      { hue: 150, y: 0.35, amp: 0.12, sp: 0.15 },
      { hue: 190, y: 0.45, amp: 0.15, sp: 0.11 },
      { hue: 280, y: 0.55, amp: 0.10, sp: 0.09 },
    ];
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        ctx.fillStyle = "#050a14";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        bands.forEach((b, i) => {
          const g = ctx.createLinearGradient(0, h * (b.y - 0.3), 0, h * (b.y + 0.3));
          g.addColorStop(0, `hsla(${b.hue},90%,60%,0)`);
          g.addColorStop(0.5, `hsla(${b.hue},90%,55%,0.28)`);
          g.addColorStop(1, `hsla(${b.hue},90%,50%,0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 20) {
            const y = h * b.y + Math.sin(x * 0.004 + t * b.sp * 4 + i) * h * b.amp
                    + Math.sin(x * 0.011 - t * b.sp * 2) * h * 0.03;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
        });
        ctx.globalCompositeOperation = "source-over";
      },
    };
  };

  const matrix = (ctx) => {
    let w = 0, h = 0, cols = [], size = 16;
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

  const starfield = (ctx) => {
    let w = 0, h = 0, s = [];
    const mk = () => ({ x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(0.1, 1) });
    return {
      resize(W, H) { w = W; h = H; s = Array.from({ length: 220 }, mk); },
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

  const rain = (ctx) => {
    let w = 0, h = 0, d = [];
    const mk = () => ({ x: rnd(0, w), y: rnd(-h, 0), l: rnd(10, 28), v: rnd(500, 900) });
    return {
      resize(W, H) { w = W; h = H; d = Array.from({ length: 140 }, mk); },
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

  const fireflies = (ctx) => {
    let w = 0, h = 0, f = [];
    return {
      resize(W, H) { w = W; h = H; const k = Math.max(0.25, Math.min(w, h) / 600); f = Array.from({ length: 70 }, () => ({ x: rnd(0, w), y: rnd(0, h), a: rnd(0, TAU), s: rnd(8, 25) * k, p: rnd(0, TAU), r: rnd(1.5, 3.5) * k })); },
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

  const snow = (ctx) => {
    let w = 0, h = 0, s = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(0, h) : -5, r: rnd(0.8, 3), v: rnd(15, 50), p: rnd(0, TAU) });
    return {
      resize(W, H) { w = W; h = H; s = Array.from({ length: 220 }, () => mk(true)); },
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

  const storm = (ctx) => {
    let w = 0, h = 0, d = [], flash = 0, next = 2, bolt = null;
    const mk = () => ({ x: rnd(-50, w), y: rnd(-h, 0), l: rnd(14, 30), v: rnd(700, 1100) });
    return {
      resize(W, H) { w = W; h = H; d = Array.from({ length: 180 }, mk); },
      frame(t, dt) {
        next -= dt;
        if (next <= 0) {
          flash = 1; next = rnd(3, 9);
          let x = rnd(w * 0.2, w * 0.8), y = 0; bolt = [[x, y]];
          while (y < h * 0.75) { x += rnd(-30, 30); y += rnd(15, 40); bolt.push([x, y]); }
        }
        const L = 6 + flash * 30;
        ctx.fillStyle = `rgb(${L},${L + 4},${L + 14})`; ctx.fillRect(0, 0, w, h);
        if (bolt && flash > 0.4) {
          ctx.strokeStyle = `rgba(220,230,255,${flash})`; ctx.lineWidth = 2; ctx.shadowColor = "#9bb7ff"; ctx.shadowBlur = 18;
          ctx.beginPath(); bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
          ctx.shadowBlur = 0;
        }
        flash = Math.max(0, flash - dt * 2.2);
        ctx.strokeStyle = "rgba(170,190,230,0.3)"; ctx.lineWidth = 1; ctx.beginPath();
        d.forEach((p, i) => {
          p.y += p.v * dt; p.x += p.v * dt * 0.2;
          ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.l * 0.2, p.y - p.l);
          if (p.y > h) d[i] = { ...mk(), y: -20 };
        });
        ctx.stroke();
      },
    };
  };

  const sakura = (ctx) => {
    let w = 0, h = 0, p = [];
    const mk = (init) => ({ x: rnd(-50, w), y: init ? rnd(0, h) : -10, s: rnd(4, 9), r: rnd(0, TAU), vr: rnd(-2, 2), vx: rnd(10, 40), vy: rnd(20, 50), ph: rnd(0, TAU) });
    return {
      resize(W, H) { w = W; h = H; p = Array.from({ length: 90 }, () => mk(true)); },
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

  const bokeh = (ctx) => {
    let w = 0, h = 0, c = [];
    return {
      resize(W, H) { w = W; h = H; c = Array.from({ length: 28 }, () => ({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(0.03, 0.1), hue: rnd(20, 60) + (Math.random() < 0.4 ? 160 : 0), sp: rnd(0.01, 0.04), ph: rnd(0, TAU) })); },
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

  const neoncity = (ctx) => {
    let w = 0, h = 0, bld = [];
    return {
      resize(W, H) {
        w = W; h = H; bld = []; let x = 0;
        while (x < w) { const bw = rnd(30, 80), bh = rnd(h * 0.15, h * 0.6); bld.push({ x, bw, bh, hue: [300, 190, 330][(Math.random() * 3) | 0], win: Array.from({ length: 40 }, () => Math.random() < 0.45) }); x += bw + rnd(2, 8); }
      },
      frame(t) {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#07021a"); sky.addColorStop(1, "#2a0838");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
        for (const b of bld) {
          const y = h - b.bh;
          ctx.fillStyle = "#08040f"; ctx.fillRect(b.x, y, b.bw, b.bh);
          ctx.fillStyle = `hsla(${b.hue},100%,60%,0.9)`; ctx.fillRect(b.x, y, b.bw, 2);
          let k = 0;
          for (let wy = y + 10; wy < h - 6; wy += 14) for (let wx = b.x + 6; wx < b.x + b.bw - 6; wx += 12) {
            const on = b.win[k++ % 40] !== (Math.sin(t * 0.5 + k * 1.7 + b.x) > 0.97);
            if (on) { ctx.fillStyle = `hsla(${b.hue},90%,70%,0.55)`; ctx.fillRect(wx, wy, 5, 7); }
          }
        }
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
  const sky = (ctx, w, h, stops) => { const g = ctx.createLinearGradient(0, 0, 0, h); for (const [o, c] of stops) g.addColorStop(o, c); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); };
  const glowDot = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const offscreen = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(2, w | 0); c.height = Math.max(2, h | 0); return c; };
  const starsOf = (w, h, n, k, maxY = 1) => Array.from({ length: n }, () => ({ x: rnd(0, w), y: rnd(0, h * maxY), r: rnd(0.5, 1.5) * k, p: rnd(0, T2) }));
  const drawStars = (ctx, st, t, a = 0.8) => { ctx.fillStyle = "#fff"; for (const s of st) { ctx.globalAlpha = a * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.3 + s.p))); ctx.fillRect(s.x, s.y, s.r, s.r); } ctx.globalAlpha = 1; };

  const eclipse = (ctx) => {
    let w = 0, h = 0, k = 1, st = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 90, k); },
      frame(t) {
        sky(ctx, w, h, [[0, "#02030a"], [1, "#0a0a1c"]]); drawStars(ctx, st, t, 0.7);
        const cx = w * 0.5, cy = h * 0.46, R = Math.min(w, h) * 0.17, pulse = 1 + 0.03 * Math.sin(t * 0.7);
        ctx.globalCompositeOperation = "lighter";
        glowDot(ctx, cx, cy, R * 4.2 * pulse, "255,160,80", 0.2); glowDot(ctx, cx, cy, R * 2.3 * pulse, "255,225,170", 0.32);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.02); ctx.beginPath();
        for (let i = 0; i < 40; i++) { const a = (i / 40) * T2, len = R * (1.7 + 1.5 * Math.abs(Math.sin(i * 12.9898 + t * 0.12 * (1 + (i % 3) * 0.3)))), da = 0.028;
          ctx.moveTo(Math.cos(a - da) * R, Math.sin(a - da) * R); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.lineTo(Math.cos(a + da) * R, Math.sin(a + da) * R); }
        ctx.fillStyle = "rgba(255,220,160,0.07)"; ctx.fill(); ctx.restore();
        const ring = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.32);
        ring.addColorStop(0, "rgba(255,244,220,0.95)"); ring.addColorStop(0.22, "rgba(255,196,120,0.5)"); ring.addColorStop(1, "rgba(255,150,70,0)");
        ctx.fillStyle = ring; ctx.fillRect(cx - R * 1.4, cy - R * 1.4, R * 2.8, R * 2.8);
        ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, T2); ctx.fill();
      },
    };
  };

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

  const silk = (ctx) => {
    let w = 0, h = 0;
    return {
      resize(W, H) { w = W; h = H; },
      frame(t) {
        ctx.fillStyle = "#05060c"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 5; i++) {
          const x = w * (0.5 + 0.35 * Math.sin(t * 0.11 * (i + 1) + i * 2)), y = h * (0.5 + 0.3 * Math.cos(t * 0.09 * (i + 2) + i)), r = Math.max(w, h) * (0.35 + 0.12 * Math.sin(t * 0.2 + i));
          const g = ctx.createRadialGradient(x, y, 0, x, y, r), hue = (t * 6 + i * 52) % 360;
          g.addColorStop(0, `hsla(${hue},85%,55%,0.42)`); g.addColorStop(1, `hsla(${hue},85%,45%,0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = "source-over";
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

  const mountains = (ctx) => {
    let w = 0, h = 0, k = 1, bg = null, st = [];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); st = starsOf(w, h, 110, k, 0.5); bg = offscreen(w, h); const g = bg.getContext("2d");
        sky(g, w, h, [[0, "#050a1c"], [0.6, "#10224a"], [1, "#38406e"]]); glowDot(g, w * 0.7, h * 0.2, Math.min(w, h) * 0.4, "200,215,255", 0.2);
        g.fillStyle = "rgba(240,244,255,0.92)"; g.beginPath(); g.arc(w * 0.7, h * 0.2, Math.min(w, h) * 0.035, 0, T2); g.fill();
        const cols = ["#27386a", "#1a2750", "#0f1a38", "#05070f"], bases = [0.62, 0.7, 0.8, 0.92];
        for (let L = 0; L < 4; L++) {
          const p1 = rnd(0, T2), p2 = rnd(0, T2), p3 = rnd(0, T2), a1 = 0.09 - L * 0.012, f = (0.004 + L * 0.002) / k;
          g.fillStyle = cols[L]; g.beginPath(); g.moveTo(0, h);
          for (let x = 0; x <= w + 6; x += 6) g.lineTo(x, h * bases[L] - (Math.sin(x * f + p1) * a1 + Math.sin(x * f * 2.3 + p2) * a1 * 0.5 + Math.sin(x * f * 5.1 + p3) * a1 * 0.18 + a1) * h);
          g.lineTo(w, h); g.closePath(); g.fill();
        }
      },
      frame(t) {
        ctx.drawImage(bg, 0, 0, w, h); drawStars(ctx, st, t, 0.8);
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 3; i++) { const x = (((t * 7 * k * (i + 1) + i * w * 0.4) % (w * 1.6)) - w * 0.3); ctx.save(); ctx.translate(x, h * (0.7 + i * 0.07)); ctx.scale(3.2, 0.3); glowDot(ctx, 0, 0, w * 0.22, "150,170,220", 0.12); ctx.restore(); }
        ctx.globalCompositeOperation = "source-over";
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
        og.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(off, 0, 0, w, h);
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
        og.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(off, 0, 0, w, h);
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
        const T = nebTextures(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
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
    return { up: hex(upRgb), down: hex(downRgb), accent: hex(accent) };
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
  window.PriismPalette = { fromData: paletteFromData, hex };

  window.WickedSkins = {
    aurora:    { name: "Polar Lights",    cat: "Wild", create: aurora },
    nebula:    { name: "Stardust",    cat: "Cosmos",  create: nebula },
    starfield: { name: "Deep Field", cat: "Cosmos",  create: starfield },
    embers:    { name: "Cinders",    cat: "Fire",   create: embers },
    matrix:    { name: "Code Rain",    cat: "Electric",   create: matrix },
    synthwave: { name: "Retro Sun", cat: "Electric",   create: synthwave },
    rain:      { name: "Night Drizzle", cat: "Urban",   create: rain },
    graphite:  { name: "Slate",  cat: "Chill",   create: graphite },
    ocean:     { name: "Tide",     cat: "Chill",   create: ocean },
    deepsea:   { name: "Abyssal Glow",  cat: "Chill",   create: deepsea },
    bokeh:     { name: "Soft Focus",     cat: "Chill",   create: bokeh },
    fireflies: { name: "Glowbugs", cat: "Wild", create: fireflies },
    sakura:    { name: "Petal Drift",    cat: "Wild", create: sakura },
    snow:      { name: "Snowfall",  cat: "Elements", create: snow },
    storm:     { name: "Thunderstorm", cat: "Elements", create: storm },
    sunset:    { name: "Dusk Clouds", cat: "Elements", create: sunsetclouds },
    galaxy:    { name: "Spiral Galaxy",    cat: "Cosmos",  create: galaxy },
    hyperspace:{ name: "Lightspeed", cat: "Cosmos", create: hyperspace },
    lavalamp:  { name: "Lava Lamp", cat: "Fire",   create: lavalamp },
    plasma:    { name: "Plasma",    cat: "Electric",   create: plasma },
    cybergrid: { name: "Cyber Grid", cat: "Electric",  create: cybergrid },
    circuit:   { name: "Circuit",   cat: "Electric",   create: circuit },
    neoncity:  { name: "Skyline", cat: "Urban",   create: neoncity },
    tickertape:   { name: "Ticker Tape",   cat: "Markets", create: tickertape },
    // pack 2
    eclipse:     { name: "Totality",       cat: "Cosmos",   create: eclipse },
    comets:      { name: "Meteor Shower",  cat: "Cosmos",   create: comets },
    wormhole:    { name: "Wormhole",       cat: "Cosmos",   create: wormhole },
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
    silk:        { name: "Silk",           cat: "Chill",    create: silk },
    leaves:      { name: "Autumn Drift",   cat: "Wild",     create: leaves },
    mountains:   { name: "Moonlit Ridge",  cat: "Wild",     create: mountains },
    jellyfish:   { name: "Jellyfish",      cat: "Wild",     create: jellyfish },
    // pack 3: the "wow" set
    blackhole:   { name: "Event Horizon",  cat: "Cosmos",   create: blackhole, wow: true },
    julia:       { name: "Fractal Bloom",  cat: "Abstract", create: julia, wow: true },
    inkflow:     { name: "Ink Flow",       cat: "Abstract", create: inkflow, wow: true },
    kaleido:     { name: "Kaleidoscope",   cat: "Abstract", create: kaleido, wow: true },
    oilslick:    { name: "Oil Slick",      cat: "Abstract", create: oilslick, wow: true },
    tesseract:   { name: "Tesseract",      cat: "Abstract", create: tesseract, wow: true },
    helix:       { name: "Double Helix",   cat: "Wild",     create: helix, wow: true },
    synapse:     { name: "Synapse",        cat: "Electric", create: synapse, wow: true },
    nebulacore:  { name: "Nebula",         cat: "Cosmos",   create: nebulaCore, wow: true },
    // seasonal drops (featured in their month by the panel)
    christmas:   { name: "Christmas Eve",  cat: "Seasonal", create: christmas, season: "christmas" },
    hallows:     { name: "Hallows Night",  cat: "Seasonal", create: hallows, season: "halloween" },
  };
  // Retired because they were too busy behind a chart. Not listed any more, but anyone who had one selected (or saved
  // in a look, session or symbol) gets the calm Fog Bank instead of a broken wallpaper. Non-enumerable = hidden from lists.
  for (const old of ["equalizer", "candlefall", "depthmap", "ghostcharts"]) Object.defineProperty(window.WickedSkins, old, { value: window.WickedSkins.mist, enumerable: false });
}
priismSkins(window, document);
window.__priismSkinsSrc = "(" + priismSkins.toString() + ")";   // for the off-main-thread wallpaper worker
})();
