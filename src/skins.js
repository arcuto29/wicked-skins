/* Built-in animated skins. Each factory gets a 2D canvas context and returns
   { resize(w,h), frame(t,dt) }. t = seconds, dt = seconds since last frame. */
(function () {
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
  };
})();
