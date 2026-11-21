// Candle scaling audit on the real TradingView trading terminal: horizontal zoom (bar spacing), vertical price scale,
// both together, and rapid repeated changes. For every state it reads the chart canvas itself and compares it with
// the rects TradingView drew in that same paint, so it measures what is on screen, not what was meant.
//
//   LOOKS=neon,glass (or all)  MODES=H,V,HV,RAPID,DRAG  OFF=1 (also a Priism-off baseline)  REPO=<tree>  TAG=<name>
//   node zoomaudit.js
//
// Per state and look:
//   bodies      TradingView's candle bodies in that paint (>= 1 px)
//   styled      bodies Priism drew in the look (L.draw / L.candle) / bodies >= 3 px
//   empty       bodies with no ink at all inside them (a candle that vanished)
//   plain       bodies drawn in the solid fallback (no look) although >= 2 px in both directions
//   stray       saturated pixels outside every rect TradingView drew (+2 px), blur off: stale or overflowing ink
//   bloom       saturated pixels outside the rects with blur on, per body: how far glow spreads, relative to body area
//   fillMean    mean alpha inside bodies (0..255): how solid a look reads at that size
// RAPID: frame intervals (p50 / p95 / max ms) while scales change every frame, Priism on vs off.
// The original bar-spacing-only audit is zoomaudit-v1.js.
const { chromium } = require("playwright"); const path = require("path"), crypto = require("crypto"), fs = require("fs"), cp = require("child_process");
const SITE = "https://trading-terminal.tradingview-widget.com", REPO = process.env.REPO || "/projects/sandbox/wicked-skins";
const TAG = process.env.TAG || "main", EXT = "/projects/sandbox/pwtest/ext-zaud-" + TAG, OUT = "/projects/sandbox/previews/zaudit-" + TAG;
const MODES = (process.env.MODES || "H,V,HV,RAPID,DRAG").split(",");
fs.rmSync(EXT, { recursive: true, force: true }); fs.mkdirSync(EXT, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
cp.execSync(`cd ${REPO} && tar --exclude=.git --exclude=node_modules --exclude=dist --exclude=store --exclude=site --exclude=android --exclude=desktop -cf - . | tar -xf - -C ${EXT}`);
{ const p = EXT + "/manifest.json", m = JSON.parse(fs.readFileSync(p)); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(p, JSON.stringify(m)); }
const ALL = fs.readFileSync(EXT + "/src/candlelooks.js", "utf8").match(/const LOOKS = \[([\s\S]*?)\n  \];/)[1].match(/\["([a-z]+)",/g).map((s) => s.slice(2, -2));
const LOOKS = !process.env.LOOKS || process.env.LOOKS === "all" ? ALL : process.env.LOOKS.split(",");
const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
const UP = "#00ffa3", DOWN = "#ff2e97";
// the states: bar spacing (px) and vertical zoom (1 = auto; 4 = the price range shown is 4x smaller, so candles 4x taller)
const H = [2, 3, 4, 6, 8, 10, 13, 16, 25, 40].map((sp) => ({ sp, vz: 1 }));
const V = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64].map((vz) => ({ sp: 10, vz }));
const HV = [[3, 0.25], [3, 8], [6, 16], [16, 0.25], [40, 0.25], [40, 16], [2, 16]].map(([sp, vz]) => ({ sp, vz }));
(async () => {
  const prof = path.join(__dirname, "profile-zaud-" + TAG + "-" + Date.now());
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, ...(process.env.DPR ? ["--force-device-scale-factor=" + process.env.DPR] : [])], viewport: { width: 1500, height: 860 } });
  await new Promise((r) => setTimeout(r, 1200)); for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  const page = ctx.pages()[0] || await ctx.newPage(), pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  await set({ invite: { code: "PRIISM-TEST-ZAUD", ok: true, status: "ok", checked: 4e12, since: 1 }, welcomePending: 0, enabled: true, skin: "graphite", opacity: 0.3,
    candleOn: true, candleUp: UP, candleDown: DOWN, candleLook: "neon", candleGlow: 0.3, autoQuality: false, powerSaver: false });
  await page.bringToFront(); await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(14000);
  let f = null; for (const x of page.frames()) if (await x.evaluate(() => !!document.querySelector(".chart-markup-table")).catch(() => false)) { f = x; break; }
  if (!f) throw new Error("no chart frame");
  await f.evaluate(({ UP, DOWN }) => {
    // ---- instrumentation (outermost wrappers: TradingView's own calls, before Priism's hook sees them) ----
    const P = CanvasRenderingContext2D.prototype, of = P.fillRect;
    const S = window.__za = { paints: new WeakMap(), main: null, look: 0, lookT: 0, noBlur: false };
    P.fillRect = function (x, y, w, h) {
      const c = this.canvas;
      if (c && c.width > 400 && c.height > 300 && c.isConnected) {
        const t = this.getTransform(), X = Math.min(x, x + w) * t.a + t.e, Y = Math.min(y, y + h) * t.d + t.f, W = Math.abs(w * t.a), Hh = Math.abs(h * t.d);
        let p = S.paints.get(c);
        if (!p || (W >= c.width * 0.97 && Hh >= c.height * 0.97)) { p = { rects: [], n: 0 }; S.paints.set(c, p); }   // the background starts a paint
        else p.rects.push([X, Y, W, Hh, String(this.fillStyle).toLowerCase()]);
        p.n++;
      }
      return of.call(this, x, y, w, h);
    };
    // blur off on request (to see stray ink exactly), on top of Priism's own Lite switch
    const d = Object.getOwnPropertyDescriptor(P, "shadowBlur");
    Object.defineProperty(P, "shadowBlur", { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, S.noBlur ? 0 : v); } });
    // Priism's look calls (count + time)
    const L = window.__bdCandleLooks;
    S.xs = [];   // centres (device px) of the bodies Priism styled in this measurement
    if (L) for (const fn of ["draw", "candle"]) { const o = L[fn]; L[fn] = function (g, look, x, y, w, h) { const t0 = performance.now();
      try { const t = g.getTransform(); if (S.xs.length < 5000) S.xs.push((x + w / 2) * t.a + t.e); return o.apply(this, arguments); } finally { S.look++; S.lookT += performance.now() - t0; } }; }
    const hexOf = (s) => { const m = /^#([0-9a-f]{6})$/.exec(s); if (m) return s; const r = /rgba?\(([^)]+)\)/.exec(s); if (!r) return null; const v = r[1].split(",").map(Number); if (v[3] !== undefined && v[3] < 0.95) return null; return "#" + v.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join(""); };
    const sat = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx ? (mx - mn) / mx : 0; };
    // ---- measure the main pane canvas against the rects of its last paint ----
    window.__zaMeasure = () => {
      const cs = [...document.querySelectorAll(".chart-markup-table.pane canvas")];
      let c = null, best = -1; for (const x of cs) { const p = S.paints.get(x); if (p && p.rects.length > best) { best = p.rects.length; c = x; } }
      if (!c) return { err: "no paint" };
      const p = S.paints.get(c), W = c.width, Hc = c.height, img = c.getContext("2d").getImageData(0, 0, W, Hc).data;
      // candle rects: opaque fills in our candle colours (TradingView's own colours are remapped to them by Priism;
      // with Priism off they are TradingView's two most used opaque colours)
      const cnt = new Map(); for (const r of p.rects) { const hx = hexOf(r[4]); if (hx && r[2] < 200 && r[3] > 0) cnt.set(hx, (cnt.get(hx) || 0) + 1); }
      const cols = window.__zaOff ? [...cnt].sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]) : [UP, DOWN];
      const cand = p.rects.filter((r) => cols.includes(hexOf(r[4])) && r[2] < W * 0.3);   // (bar-sized: no height limit, a stretched candle can be taller than the pane)
      // per bar (by centre): the widest rect is the body, narrower ones the wick
      const bodiesOf = (cand) => {   // per candle: the widest rect is its body; a rect whose centre lies inside a body is that candle's wick / border
        const out = []; for (const r of [...cand].sort((a, z) => z[2] - a[2] || z[3] - a[3])) { const cx = r[0] + r[2] / 2;
          if (!out.some((b) => cx >= b[0] - 1 && cx <= b[0] + b[2] + 1 && r[2] <= b[2])) out.push(r); }
        return out.filter((b) => b[2] >= 1); };
      const bodies = bodiesOf(cand);
      // allowed area: every rect TradingView drew in this paint (+2 px), and long horizontal lines (last price)
      const allow = new Uint8Array(W * Hc);
      for (const r of p.rects) { const x0 = Math.max(0, Math.floor(r[0] - 2)), x1 = Math.min(W, Math.ceil(r[0] + r[2] + 2)), y0 = Math.max(0, Math.floor(r[1] - 2)), y1 = Math.min(Hc, Math.ceil(r[1] + r[3] + 2));
        for (let y = y0; y < y1; y++) allow.fill(1, y * W + x0, y * W + x1); }
      let stray = 0; const rowInk = new Uint32Array(Hc), strayRows = new Uint32Array(Hc);
      for (let y = 0; y < Hc; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (img[i + 3] > 25 && sat(img[i], img[i + 1], img[i + 2]) > 0.3) { rowInk[y]++; if (!allow[y * W + x]) strayRows[y]++; } }
      for (let y = 0; y < Hc; y++) if (rowInk[y] < W * 0.55) stray += strayRows[y];   // (rows with a line across the chart are the last-price line)
      let empty = 0, fillSum = 0, fillN = 0; const byW = {};
      for (const b of bodies) { const x0 = Math.round(b[0]), x1 = Math.round(b[0] + b[2]), y0 = Math.round(b[1]), y1 = Math.round(b[1] + b[3]); let ink = 0, a = 0, n = 0;
        for (let y = Math.max(0, y0); y < Math.min(Hc, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) { const al = img[(y * W + x) * 4 + 3]; n++; a += al; if (al > 20) ink++; }
        if (n && !ink) empty++;
        if (n) { fillSum += a / n; fillN++; const k = Math.round(b[2]); (byW[k] = byW[k] || []).push(a / n); } }
      const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[s.length >> 1].toFixed(1) : null; };
      // big bodies (>= 3 px both ways) that got no look at all (drawn as TradingView's plain rect)
      const xs = S.xs, unstyled = window.__zaOff ? 0 : bodies.filter((b) => b[2] >= 3 && b[3] >= 3 && !xs.some((x) => Math.abs(x - (b[0] + b[2] / 2)) <= 1.5)).length;
      const tallest = Math.max(0, ...bodies.map((b) => b[3]));
      // a fingerprint of the whole pane (blur off): identical pixels before and after a change = the look is unchanged
      let hsh = 2166136261; for (let i = 0; i < img.length; i += 4) { hsh ^= img[i] ^ (img[i + 1] << 8) ^ (img[i + 2] << 16) ^ (img[i + 3] << 24); hsh = Math.imul(hsh, 16777619); }
      return { hash: (hsh >>> 0).toString(36), unstyled, tallest: +tallest.toFixed(0), bodies: bodies.length, bodyW: med(bodies.map((b) => b[2])), bodyH: med(bodies.map((b) => b[3])), big: bodies.filter((b) => b[2] >= 3 && b[3] >= 3).length,
        thin2: bodies.filter((b) => b[2] >= 2 && b[3] >= 2 && (b[2] < 3 || b[3] < 3)).length, empty, stray, fillMean: fillN ? +(fillSum / fillN).toFixed(1) : null,
        rects: p.rects.length, canvas: [W, Hc] };
    };
  }, { UP, DOWN });
  const ts = (sp) => page.evaluate((sp) => window.tvWidget.activeChart().getTimeScale().setBarSpacing(sp), sp);
  let base = null;
  const vz = async (z) => page.evaluate(({ z, base }) => { const ps = window.tvWidget.activeChart().getPanes()[0].getMainSourcePriceScale();
    if (z === 1) { ps.setAutoScale(true); return null; }
    const r = base || ps.getVisiblePriceRange(), m = (r.from + r.to) / 2, h = (r.to - r.from) / 2 / z; ps.setAutoScale(false); ps.setVisiblePriceRange({ from: m - h, to: m + h }); return r; }, { z, base });
  // the auto range at spacing 10, used as "1x" for every vertical zoom
  await ts(10); await vz(1); await page.waitForTimeout(600); base = await page.evaluate(() => window.tvWidget.activeChart().getPanes()[0].getMainSourcePriceScale().getVisiblePriceRange());
  const settle = () => f.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
  const state = async (s) => { await page.mouse.move(2, 850); await ts(s.sp); await vz(s.vz); await page.waitForTimeout(450); await settle(); };
  // a repaint that's guaranteed: re-apply the same state (TradingView repaints on any scale call)
  const measureAt = async (s, blurOff) => { await f.evaluate((b) => { window.__za.noBlur = b; window.__za.look = 0; window.__za.lookT = 0; window.__za.xs = []; }, blurOff); await ts(s.sp + 0.001); await ts(s.sp); await vz(s.vz); await page.waitForTimeout(250); await settle();
    return f.evaluate(() => ({ ...window.__zaMeasure(), look: window.__za.look, lookMs: +window.__za.lookT.toFixed(1) })); };
  const shot = async (name) => { const pane = await f.evaluate(() => { const r = document.querySelector(".chart-markup-table.pane").getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
    await page.screenshot({ path: `${OUT}/${name}.png`, clip: { x: pane.l + pane.w * 0.55, y: pane.t, width: pane.w * 0.45, height: pane.h * 0.85 } }); };
  const result = { tag: TAG, repo: REPO, dpr: await f.evaluate(() => { const c = document.querySelector(".chart-markup-table.pane canvas"); return +(c.width / c.clientWidth).toFixed(3); }), looks: {} };
  const states = [...(MODES.includes("H") ? H.map((s) => ({ ...s, m: "H" })) : []), ...(MODES.includes("V") ? V.map((s) => ({ ...s, m: "V" })) : []), ...(MODES.includes("HV") ? HV.map((s) => ({ ...s, m: "HV" })) : [])];
  const SHOTS = new Set(["H2", "H4", "H8", "H40", "V0.25", "V16", "HV3x8", "HV40x16", "HV2x16"]);
  const runLook = async (look, off) => {
    await set(off ? { enabled: false } : { enabled: true, candleLook: look }); await f.evaluate((o) => { window.__zaOff = o; }, !!off); await page.waitForTimeout(900);
    const rows = [];
    for (const s of states) {
      await state(s);
      const geo = await measureAt(s, true), glow = await measureAt(s, false);
      const name = s.m === "HV" ? `HV${s.sp}x${s.vz}` : s.m === "H" ? `H${s.sp}` : `V${s.vz}`;
      rows.push({ st: name, sp: s.sp, vz: s.vz, bodies: geo.bodies, bodyW: geo.bodyW, bodyH: geo.bodyH, big: geo.big, thin2: geo.thin2, styled: geo.look, hash: geo.hash, unstyled: geo.unstyled, tallest: geo.tallest, empty: geo.empty, stray: geo.stray,
        bloomPerBody: geo.bodies ? +((glow.stray - geo.stray) / geo.bodies).toFixed(1) : null, fillMean: geo.fillMean, lookMs: glow.lookMs });
      if ((look === "neon" || look === "lines" || look === "pixel" || look === "liquid" || off) && SHOTS.has(name)) await shot(`${off ? "off" : look}-${name}`);
    }
    return rows;
  };
  if (process.env.OFF) { result.off = await runLook("solid", true); console.log("OFF", JSON.stringify(result.off.map((r) => [r.st, r.bodies, r.empty, r.stray]))); }
  for (const look of LOOKS) {
    if (states.length) { result.looks[look] = await runLook(look, false);
      const w = result.looks[look]; console.log(look.padEnd(9), "unstyled", w.map((r) => r.unstyled).join(","), "empty", Math.max(...w.map((r) => r.empty)), "stray", Math.max(...w.map((r) => r.stray)), "bloom/body", Math.max(...w.map((r) => r.bloomPerBody || 0)), "| styled/big", w.map((r) => r.big ? +(r.styled / r.big).toFixed(2) : "-").join(" ")); }
  }
  // ---- rapid changes: scales changing every frame (API), then real drags on the price axis ----
  const rapid = async (off, look) => {
    await set(off ? { enabled: false } : { enabled: true, candleLook: look || "neon" }); await f.evaluate((o) => { window.__zaOff = o; window.__za.noBlur = true; }, !!off); await page.waitForTimeout(900);
    await f.evaluate(() => { window.__zaFrames = []; let last = performance.now(); const loop = (t) => { window.__zaFrames.push(t - last); last = t; if (window.__zaFrames.length < 2000 && !window.__zaStop) requestAnimationFrame(loop); }; window.__zaStop = false; requestAnimationFrame(loop); });
    const strays = [];
    for (let i = 0; i < 40; i++) {
      await page.evaluate((i) => { const c = window.tvWidget.activeChart(); c.getTimeScale().setBarSpacing([3, 25, 6, 40, 2, 13][i % 6]); }, i);
      await vz([0.25, 8, 1, 16, 0.5, 4][i % 6]);
      if (i % 5 === 4) { const m = await f.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(window.__zaMeasure())))); strays.push(m.stray); }
    }
    const fr = await f.evaluate(() => { window.__zaStop = true; return window.__zaFrames.slice(2); });
    const s = [...fr].sort((a, b) => a - b), q = (p) => +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1);
    return { frames: fr.length, p50: q(0.5), p95: q(0.95), max: q(1), strayMax: Math.max(...strays) };
  };
  const drag = async (off, look) => {
    await set(off ? { enabled: false } : { enabled: true, candleLook: look || "neon" }); await f.evaluate((o) => { window.__zaOff = o; window.__za.noBlur = true; }, !!off); await vz(1); await ts(8); await page.waitForTimeout(800);
    const ax = await f.evaluate(() => { const r = document.querySelector(".chart-markup-table .price-axis").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const strays = [], empties = [];
    await page.mouse.move(ax.x, ax.y); await page.mouse.down();
    for (let i = 1; i <= 60; i++) { await page.mouse.move(ax.x, ax.y + Math.sin(i / 6) * 260); if (i % 6 === 0) { const m = await f.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(window.__zaMeasure())))); strays.push(m.stray); empties.push(m.empty); } }
    await page.mouse.up(); await settle();
    const after = await f.evaluate(() => window.__zaMeasure());
    return { strayMax: Math.max(...strays), emptyMax: Math.max(...empties), afterStray: after.stray, afterEmpty: after.empty };
  };
  // ---- every timeframe (TF=1): higher timeframes bring much bigger bodies, long wicks and dojis side by side ----
  // per look and timeframe: normal, zoomed in + stretched 16x, zoomed far in (very wide bodies), stretched 64x (blur off)
  // and the first frames after switching to that timeframe (stray / empty), Priism on and off.
  if (process.env.TF) {
    const TFS = (process.env.TFS || "1,5,15,30,60,240,1D,1W").split(","), TFST = [{ n: "normal", sp: 10, vz: 1 }, { n: "in+stretch16", sp: 40, vz: 16 }, { n: "wide200", sp: 200, vz: 1 }, { n: "stretch64", sp: 10, vz: 64 }];
    const setTf = (r) => page.evaluate((r) => new Promise((res) => { let done = false; try { window.tvWidget.activeChart().setResolution(r, () => { done = true; res(true); }); } catch (e) { res(false); } setTimeout(() => !done && res(false), 8000); }), r);
    const switchCheck = async () => { const m = []; for (let i = 0; i < 4; i++) m.push(await f.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(window.__zaMeasure()))))); return { strayMax: Math.max(...m.map((x) => x.stray || 0)), emptyMax: Math.max(...m.map((x) => x.empty || 0)) }; };
    result.tf = { off: {}, looks: {} };
    await set({ enabled: false }); await f.evaluate(() => { window.__zaOff = true; window.__za.noBlur = true; });
    for (const tf of TFS) { await ts(10); await vz(1); await setTf(tf); result.tf.off[tf] = await switchCheck(); await page.waitForTimeout(1200); }
    for (const look of LOOKS) {
      await set({ enabled: true, candleLook: look }); await f.evaluate(() => { window.__zaOff = false; }); await page.waitForTimeout(700);
      const rows = [];
      for (const tf of TFS) {
        await ts(10); await vz(1); await setTf(tf); const sw = await switchCheck(); await page.waitForTimeout(1500);
        base = null; await vz(1); await page.waitForTimeout(300); base = await page.evaluate(() => window.tvWidget.activeChart().getPanes()[0].getMainSourcePriceScale().getVisiblePriceRange());
        for (const s of TFST) { const m = await measureAt(s, true); rows.push({ tf, res: await page.evaluate(() => window.tvWidget.activeChart().resolution()), st: s.n, bodies: m.bodies, bodyW: m.bodyW, tallest: m.tallest, big: m.big, unstyled: m.unstyled, empty: m.empty, stray: m.stray, switchStray: sw.strayMax, switchEmpty: sw.emptyMax }); }
      }
      result.tf.looks[look] = rows;
      const bad = rows.filter((r) => r.unstyled || r.empty);
      console.log("TF", look.padEnd(9), bad.length ? "PROBLEMS " + JSON.stringify(bad.slice(0, 3)) : "ok", "| widest", Math.max(...rows.map((r) => r.bodyW || 0)), "tallest", Math.max(...rows.map((r) => r.tallest || 0)), "| switch stray max", Math.max(...rows.map((r) => r.switchStray)), "empty", Math.max(...rows.map((r) => r.switchEmpty)));
    }
    console.log("TF off switch", JSON.stringify(result.tf.off));
    await setTf("1");
  }
  if (MODES.includes("RAPID")) { result.rapid = { off: await rapid(true), neon: await rapid(false, "neon"), liquid: await rapid(false, "liquid") }; console.log("RAPID", JSON.stringify(result.rapid)); }
  if (MODES.includes("DRAG")) { result.drag = { off: await drag(true), neon: await drag(false, "neon"), lines: await drag(false, "lines") }; console.log("DRAG", JSON.stringify(result.drag)); }
  fs.writeFileSync(path.join(__dirname, `zoomaudit-${TAG}.json`), JSON.stringify(result, null, 1));
  await ctx.close(); fs.rmSync(prof, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
