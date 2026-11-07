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

  const equalizer = (ctx) => {
    let w = 0, h = 0, k = 1, bars = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); const n = Math.max(12, Math.floor(w / (13 * k))); bars = Array.from({ length: n }, () => ({ v: 0.2, pk: 0.2, p: rnd(0, T2), f: rnd(0.8, 2.2), f2: rnd(2, 5) })); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#05030c"], [1, "#10061c"]]);
        const n = bars.length, bw = w / n, gap = Math.max(1, bw * 0.18), g = ctx.createLinearGradient(0, h, 0, h * 0.2);
        g.addColorStop(0, "rgba(130,60,255,0.6)"); g.addColorStop(0.6, "rgba(40,200,255,0.55)"); g.addColorStop(1, "rgba(120,255,200,0.55)");
        for (let i = 0; i < n; i++) {
          const b = bars[i], tg = Math.max(0.04, Math.min(0.9, (0.35 + 0.25 * Math.sin(t * b.f + b.p) + 0.2 * Math.sin(t * b.f2 + b.p * 2)) * (0.65 + 0.35 * Math.sin((i / n) * Math.PI))));
          b.v += (tg - b.v) * Math.min(1, dt * 9); b.pk = Math.max(b.pk - dt * 0.25, b.v);
          const bh = b.v * h * 0.85; ctx.fillStyle = g; ctx.fillRect(i * bw + gap, h - bh, bw - gap * 2, bh);
          ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(i * bw + gap, h - b.pk * h * 0.85 - 3 * k, bw - gap * 2, 2 * k);
        }
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

  const candlefall = (ctx) => {
    let w = 0, h = 0, k = 1, cs = [];
    const mk = (init) => ({ x: rnd(0, w), y: init ? rnd(-h * 0.2, h) : -30 * k, v: rnd(18, 60) * k, bw: rnd(7, 15) * k, bh: rnd(14, 42) * k, wk: rnd(6, 18) * k, up: Math.random() < 0.5, a: rnd(0.3, 0.7), ph: rnd(0, T2) });
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); cs = Array.from({ length: 80 }, () => mk(true)); },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#060a14"], [1, "#0d1626"]]);
        for (const c of cs) {
          c.y += c.v * dt; if (c.y - c.wk > h) Object.assign(c, mk(false));
          const x = c.x + Math.sin(t * 0.6 + c.ph) * 6 * k; ctx.fillStyle = c.up ? `rgba(38,200,160,${c.a})` : `rgba(240,80,100,${c.a})`;
          ctx.fillRect(x + c.bw / 2 - 0.5 * k, c.y - c.wk, Math.max(1, k), c.bh + 2 * c.wk); ctx.fillRect(x, c.y, c.bw, c.bh);
        }
      },
    };
  };

  const depthmap = (ctx) => {
    let w = 0, h = 0, k = 1, rows = [], fl = [];
    return {
      resize(W, H) { w = W; h = H; k = kOf(w, h); const n = Math.max(10, Math.floor(h / (9 * k))); rows = Array.from({ length: n }, () => ({ p: rnd(0, T2), f: rnd(0.4, 1.5), p2: rnd(0, T2), f2: rnd(1.5, 3.5), len: 0 })); fl = []; },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050910"], [1, "#0a1220"]]);
        const n = rows.length, rh = h / n;
        for (let i = 0; i < n; i++) {
          const r = rows[i], mid = 1 - Math.abs(i / n - 0.5) * 2, top = i < n / 2;
          r.len = w * (0.08 + 0.42 * (0.5 + 0.3 * Math.sin(t * r.f + r.p) + 0.2 * Math.sin(t * r.f2 + r.p2)) * (0.35 + 0.65 * mid));
          ctx.fillStyle = top ? "rgba(240,80,100,0.34)" : "rgba(38,200,160,0.34)";
          top ? ctx.fillRect(w - r.len, i * rh + 1, r.len, rh - 2) : ctx.fillRect(0, i * rh + 1, r.len, rh - 2);
        }
        if (Math.random() < dt * 6 && fl.length < 12) fl.push({ i: (Math.random() * n) | 0, e: 1 });
        for (let q = fl.length - 1; q >= 0; q--) {
          const f = fl[q], r = rows[f.i], top = f.i < n / 2; f.e -= dt * 1.6; if (f.e <= 0) { fl.splice(q, 1); continue; }
          ctx.fillStyle = `rgba(255,255,255,${f.e * 0.6})`; top ? ctx.fillRect(w - r.len - 4 * k, f.i * rh + 1, 4 * k, rh - 2) : ctx.fillRect(r.len, f.i * rh + 1, 4 * k, rh - 2);
        }
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(0, h / 2 - 0.5 * k, w, Math.max(1, k));
      },
    };
  };

  const ghostcharts = (ctx) => {
    let w = 0, h = 0, k = 1, step = 10, ln = [];
    const cols = ["60,220,190", "255,100,160", "255,190,80", "110,160,255", "190,130,255", "90,230,255"];
    return {
      resize(W, H) {
        w = W; h = H; k = kOf(w, h); step = Math.max(6, 10 * k); const n = Math.ceil(w / step) + 3;
        ln = cols.map((c, i) => { let v = 0; const pts = Array.from({ length: n }, () => (v += rnd(-1, 1) * 0.012)); return { pts, c, y0: 0.2 + i * 0.12, off: 0, sp: rnd(14, 34) * k, vol: rnd(0.008, 0.02) }; });
      },
      frame(t, dt) {
        sky(ctx, w, h, [[0, "#050810"], [1, "#0a101c"]]);
        ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = Math.max(1, k); ctx.beginPath(); for (let i = 1; i < 8; i++) { ctx.moveTo(0, h * i / 8); ctx.lineTo(w, h * i / 8); } ctx.stroke();
        ctx.lineJoin = "round";
        for (const l of ln) {
          l.off += l.sp * dt;
          while (l.off >= step) { l.off -= step; l.pts.shift(); l.pts.push(l.pts[l.pts.length - 1] + rnd(-1, 1) * l.vol * 1.6); }
          const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, `rgba(${l.c},0)`); g.addColorStop(0.5, `rgba(${l.c},0.55)`); g.addColorStop(1, `rgba(${l.c},0.24)`);
          ctx.strokeStyle = g; ctx.lineWidth = 1.7 * k; ctx.beginPath();
          const mid = l.pts[(l.pts.length / 2) | 0];
          l.pts.forEach((p, i) => { const x = i * step - l.off, y = h * (l.y0 + (p - mid) * 2.2); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.stroke();
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
    equalizer:   { name: "Equalizer",      cat: "Electric", create: equalizer },
    nightdrive:  { name: "Night Drive",    cat: "Urban",    create: nightdrive },
    towers:      { name: "Midnight Towers",cat: "Urban",    create: towers },
    zenwaves:    { name: "Zen Waves",      cat: "Chill",    create: zenwaves },
    mist:        { name: "Fog Bank",       cat: "Chill",    create: mist },
    bubbles:     { name: "Reef Light",     cat: "Chill",    create: bubbles },
    silk:        { name: "Silk",           cat: "Chill",    create: silk },
    leaves:      { name: "Autumn Drift",   cat: "Wild",     create: leaves },
    mountains:   { name: "Moonlit Ridge",  cat: "Wild",     create: mountains },
    jellyfish:   { name: "Jellyfish",      cat: "Wild",     create: jellyfish },
    candlefall:  { name: "Candle Rain",    cat: "Markets",  create: candlefall },
    depthmap:    { name: "Order Ladder",   cat: "Markets",  create: depthmap },
    ghostcharts: { name: "Ghost Charts",   cat: "Markets",  create: ghostcharts },
  };
})();
