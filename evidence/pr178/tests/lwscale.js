// nq.vision candle scaling audit (Lightweight Charts stand-in: LW 5.2.1, the app's own grey / black candles like
// nq.vision). Horizontal zoom (bar spacing), the price scale stretched / squeezed by real drags on its axis, both
// together, and fast repeated drags. Measures the chart canvas itself against the rects the chart drew that paint.
//   REPO=<tree> TAG=<name> UP=#f9ecec DOWN=#050505 LOOK=neon DPR=2 node lwscale.js
// Per state: bodies, tallest (px), grey = bodies still in the app's own grey / black (not recoloured), unstyled =
// bodies >= 3 px with no look, empty = bodies with no ink, stray = saturated ink outside every drawn rect (+2 px).
const { chromium } = require("playwright"); const path = require("path"), crypto = require("crypto"), fs = require("fs"), cp = require("child_process");
const REPO = process.env.REPO || "/projects/sandbox/wicked-skins", TAG = process.env.TAG || "now", LOOK = process.env.LOOK || "neon";
const UP = process.env.UP || "#00ffa3", DOWN = process.env.DOWN || "#ff2e97", OUT = "/projects/sandbox/previews/lwscale-" + TAG; fs.mkdirSync(OUT, { recursive: true });
const EXT = "/projects/sandbox/pwtest/ext-lws-" + TAG; fs.rmSync(EXT, { recursive: true, force: true }); fs.mkdirSync(EXT, { recursive: true });
cp.execSync(`cd ${REPO} && tar --exclude=.git --exclude=node_modules --exclude=dist --exclude=store --exclude=site --exclude=android --exclude=desktop -cf - . | tar -xf - -C ${EXT}`);
{ const p = EXT + "/manifest.json", m = JSON.parse(fs.readFileSync(p)); m.content_scripts.forEach((c) => c.matches.push("http://127.0.0.1:8123/*")); m.host_permissions.push("http://127.0.0.1:8123/*"); fs.writeFileSync(p, JSON.stringify(m)); }
const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
(async () => {
  const srv = cp.spawn(process.execPath, [path.join(__dirname, "lwsite/serve.js")], { stdio: "ignore" }); await new Promise((r) => setTimeout(r, 500));
  const prof = path.join(__dirname, "profile-lws-" + TAG + "-" + Date.now());
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1400, height: 820 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, ...(process.env.DPR ? ["--force-device-scale-factor=" + process.env.DPR] : [])] });
  await new Promise((r) => setTimeout(r, 1200)); for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  const page = ctx.pages()[0] || await ctx.newPage(), pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`);
  await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { invite: { code: "PRIISM-TEST-LWSC", ok: true, status: "ok", checked: 4e12, since: 1 }, welcomePending: 0, enabled: true,
    skin: "graphite", opacity: 0.3, ...(process.env.OFF ? { enabled: false } : {}), candleOn: true, candleUp: UP, candleDown: DOWN, candleLook: LOOK, candleGlow: 0.3, autoQuality: false, powerSaver: false });
  await page.bringToFront(); await page.goto("http://127.0.0.1:8123/?v=5.2.1&switch=1&spacing=10" + (process.env.API ? "" : "&noapi=1"), { waitUntil: "load" });
  await page.waitForFunction("window.__ready===true", null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(5000);
  await page.evaluate(({ UP, DOWN }) => {
    const P = CanvasRenderingContext2D.prototype, of = P.fillRect, S = window.__lws = { paints: new WeakMap(), xs: [], noBlur: true };
    P.fillRect = function (x, y, w, h) { const c = this.canvas;
      if (c && c.width > 400 && c.height > 300) { const t = this.getTransform(), X = Math.min(x, x + w) * t.a + t.e, Y = Math.min(y, y + h) * t.d + t.f, W = Math.abs(w * t.a), H = Math.abs(h * t.d);
        let p = S.paints.get(c); if (!p || (W >= c.width * 0.9 && H >= c.height * 0.9)) { p = { rects: [] }; S.paints.set(c, p); } else p.rects.push([X, Y, W, H, String(this.__bdLwOrig || this.fillStyle).toLowerCase()]); }
      return of.call(this, x, y, w, h); };
    const d = Object.getOwnPropertyDescriptor(P, "shadowBlur"); Object.defineProperty(P, "shadowBlur", { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, S.noBlur ? 0 : v); } });
    const L = window.__bdCandleLooks;
    for (const fn of ["draw", "candle"]) { const o = L[fn]; L[fn] = function (g, look, x, y, w, h) { const t = g.getTransform(); if (S.xs.length < 5000) S.xs.push((x + w / 2) * t.a + t.e); return o.apply(this, arguments); }; }
    const isApp = (s) => /^(#dbdbdb|#000000|rgb\(219, 219, 219\)|rgb\(0, 0, 0\)|#000)$/.test(s);
    window.__lwsMeasure = () => {
      let c = null, best = -1; for (const x of document.querySelectorAll(".tv-lightweight-charts canvas")) { const p = S.paints.get(x); if (p && p.rects.length > best) { best = p.rects.length; c = x; } }
      if (!c) return { err: "no paint" };
      const p = S.paints.get(c), W = c.width, H = c.height, img = c.getContext("2d").getImageData(0, 0, W, H).data;
      const cand = p.rects.filter((r) => isApp(r[4]) && r[2] < W * 0.3);
      const bodiesOf = (cand) => {   // per candle: the widest rect is its body; a rect whose centre lies inside a body is that candle's wick / border
        const out = []; for (const r of [...cand].sort((a, z) => z[2] - a[2] || z[3] - a[3])) { const cx = r[0] + r[2] / 2;
          if (!out.some((b) => cx >= b[0] - 1 && cx <= b[0] + b[2] + 1 && r[2] <= b[2])) out.push(r); }
        return out.filter((b) => b[2] >= 1); };
      const bodies = bodiesOf(cand);
      let grey = 0, empty = 0;
      for (const b of bodies) { const x0 = Math.max(0, Math.round(b[0])), x1 = Math.min(W, Math.round(b[0] + b[2])), y0 = Math.max(0, Math.round(b[1])), y1 = Math.min(H, Math.round(b[1] + b[3]));
        let ink = 0, app = 0, n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * W + x) * 4, a = img[i + 3]; n++; if (a > 20) ink++;
          if (a > 200 && ((img[i] === 219 && img[i + 1] === 219 && img[i + 2] === 219) || (img[i] < 3 && img[i + 1] < 3 && img[i + 2] < 3))) app++; }
        if (n && !ink) empty++; if (n && app > n * 0.5) grey++; }
      const allow = new Uint8Array(W * H);
      for (const r of p.rects) { const x0 = Math.max(0, Math.floor(r[0] - 2)), x1 = Math.min(W, Math.ceil(r[0] + r[2] + 2)), y0 = Math.max(0, Math.floor(r[1] - 2)), y1 = Math.min(H, Math.ceil(r[1] + r[3] + 2)); for (let y = y0; y < y1; y++) allow.fill(1, y * W + x0, y * W + x1); }
      let stray = 0; for (let y = 0; y < H; y++) { let row = 0, out = 0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; const mx = Math.max(img[i], img[i + 1], img[i + 2]), mn = Math.min(img[i], img[i + 1], img[i + 2]);
        if (img[i + 3] > 25 && mx && (mx - mn) / mx > 0.3) { row++; if (!allow[y * W + x]) out++; } } if (row < W * 0.55) stray += out; }
      const xs = S.xs, unstyled = bodies.filter((b) => b[2] >= 3 && b[3] >= 3 && !xs.some((x) => Math.abs(x - (b[0] + b[2] / 2)) <= 1.5)).length;
      return { bodies: bodies.length, bodyW: bodies.length ? Math.round(bodies.map((b) => b[2]).sort((a, z) => a - z)[bodies.length >> 1]) : 0, tallest: Math.round(Math.max(0, ...bodies.map((b) => b[3]))), grey, unstyled, empty, stray, ratio: +(W / c.clientWidth).toFixed(2) };
    };
  }, { UP, DOWN });
  const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))));
  const measure = async () => { await page.evaluate(() => { window.__lws.xs = []; window.__chart.timeScale().applyOptions({ barSpacing: window.__chart.timeScale().options().barSpacing + 0.0001 }); }); await frame(); return page.evaluate(() => window.__lwsMeasure()); };
  const sp = (v) => page.evaluate((v) => window.__chart.timeScale().applyOptions({ barSpacing: v }), v);
  const axis = await page.evaluate(() => { const r = document.querySelector(".tv-lightweight-charts").getBoundingClientRect(), w = window.__chart.priceScale("right").width(); return { x: r.right - w / 2, y: r.top + r.height / 2, h: r.height }; });
  const resetV = async () => { await page.mouse.dblclick(axis.x, axis.y); await page.waitForTimeout(200); };
  const dragV = async (dy) => { await page.mouse.move(axis.x, axis.y); await page.mouse.down(); for (let i = 1; i <= 8; i++) await page.mouse.move(axis.x, axis.y + (dy * i) / 8); await page.mouse.up(); await page.waitForTimeout(150); };
  const rows = [];
  const row = async (name) => { const m = await measure(); rows.push({ st: name, ...m }); };
  // ---- LOOKS=all|a,b: every look through compact states (with screenshots for the before / after sheets) ----
  if (process.env.LOOKS) {
    const ALL = fs.readFileSync(EXT + "/src/candlelooks.js", "utf8").match(/const LOOKS = \[([\s\S]*?)\n  \];/)[1].match(/\["([a-z]+)",/g).map((x) => x.slice(2, -2));
    const LS = process.env.LOOKS === "all" ? ALL : process.env.LOOKS.split(",");
    const ST6 = async () => { for (let n = 0; n < 6; n++) await dragV(-500); };
    const STATES = [["normal", 10, null], ["zoomedOut", 4, null], ["stretched", 10, ST6], ["squeezed", 10, () => dragV(300)], ["wide400", 400, null], ["wide400+stretch", 400, () => dragV(-500)], ["out+stretch", 4, ST6]];
    const res = {};
    for (const look of LS) {
      await pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), { candleLook: look }); await page.waitForTimeout(500);
      const rs = [];
      for (const [n, spv, fn] of STATES) { await sp(spv); await resetV(); if (fn) await fn(); const m = await measure(); rs.push({ st: n, ...m });
        await page.evaluate(() => { window.__lws.noBlur = false; }); await frame();
        await page.screenshot({ path: `${OUT}/${look}-${n}.png`, clip: { x: 700, y: 0, width: 620, height: 780 } });
        await page.evaluate(() => { window.__lws.noBlur = true; }); }
      res[look] = rs; const bad = rs.filter((r) => r.grey || r.unstyled || r.empty);
      console.log(look.padEnd(9), bad.length ? "PROBLEMS " + bad.map((r) => `${r.st}: grey ${r.grey} unstyled ${r.unstyled} empty ${r.empty} (w ${r.bodyW} tallest ${r.tallest})`).join("; ") : "ok", "| widest", Math.max(...rs.map((r) => r.bodyW)), "tallest", Math.max(...rs.map((r) => r.tallest)), "ratio", rs[0].ratio);
    }
    fs.writeFileSync(path.join(__dirname, `lwscale-${TAG}.json`), JSON.stringify({ tag: TAG, looks: res }, null, 1));
    await ctx.close(); srv.kill(); fs.rmSync(prof, { recursive: true, force: true }); return;
  }
  for (const s of [2, 4, 6, 10, 16, 25, 40]) { await sp(s); await resetV(); await row("H" + s); }
  await sp(10);
  for (const dy of [-150, -300, -500]) { await resetV(); await dragV(dy); await row("Vstretch" + -dy); }   // drag up: candles taller
  // dragging again and again, as you do to stretch a lot (each drag adds on)
  await resetV(); for (let n = 1; n <= 8; n++) { await dragV(-500); if (n % 2 === 0) await row("Vstretch500x" + n); }
  for (const dy of [150, 300]) { await resetV(); await dragV(dy); await row("Vsqueeze" + dy); }
  for (const [s, dy] of [[4, -500], [40, -500], [40, 300], [6, -300]]) { await sp(s); await resetV(); await dragV(dy); await row(`HV${s}x${dy}`); }
  for (const s of [6, 40]) { await sp(s); await resetV(); for (let n = 0; n < 6; n++) await dragV(-500); await row(`HV${s}x-500x6`); }
  await page.screenshot({ path: `${OUT}/${LOOK}-HV6-stretch.png`, clip: { x: 700, y: 0, width: 620, height: 780 } });
  // fast: the price scale dragged back and forth while the bar spacing changes, measured mid-motion
  await sp(10); await resetV(); await page.mouse.move(axis.x, axis.y); await page.mouse.down(); const mid = [];
  for (let i = 1; i <= 36; i++) { await page.mouse.move(axis.x, axis.y + Math.sin(i / 5) * 320); if (i % 3 === 0) await sp([4, 25, 8, 40, 6, 13][i % 6]);
    if (i % 6 === 0) mid.push(await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(window.__lwsMeasure()))))); }
  await page.mouse.up(); await frame(); const after = await page.evaluate(() => window.__lwsMeasure());
  const out = { tag: TAG, look: LOOK, up: UP, down: DOWN, rows, rapid: { greyMax: Math.max(...mid.map((m) => m.grey)), unstyledMax: Math.max(...mid.map((m) => m.unstyled)), emptyMax: Math.max(...mid.map((m) => m.empty)), strayMax: Math.max(...mid.map((m) => m.stray)), after } };
  for (const r of rows) console.log(r.st.padEnd(14), `ratio ${r.ratio} bodies ${r.bodies} w ${r.bodyW} tallest ${r.tallest} | grey ${r.grey} unstyled ${r.unstyled} empty ${r.empty} stray ${r.stray}`);
  console.log("rapid", JSON.stringify(out.rapid));
  fs.writeFileSync(path.join(__dirname, `lwscale-${TAG}.json`), JSON.stringify(out, null, 1));
  await ctx.close(); srv.kill(); fs.rmSync(prof, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
