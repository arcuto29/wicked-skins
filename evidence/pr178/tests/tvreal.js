// All 34 candle looks on the REAL tradingview.com chart (no account), driven only by the mouse and keyboard like a
// person: wheel to zoom in / out, drags on the price axis to stretch / squeeze, Alt+R to reset. For each look and
// state it measures the chart canvas against the rects TradingView drew in that paint, and takes a screenshot.
//   REPO=<tree> TAG=<name> LOOKS=all|neon,glass node tvreal.js
// Per state: bodies, tallest, unstyled (>= 3 px bodies with no look), empty (no ink), stray (saturated ink outside
// every rect drawn, +2 px; blur off, so stale or overflowing ink shows), plus a screenshot of the chart.
const { chromium } = require("playwright"); const path = require("path"), crypto = require("crypto"), fs = require("fs"), cp = require("child_process");
const SITE = "https://www.tradingview.com/chart/?symbol=CME_MINI%3ANQ1%21", REPO = process.env.REPO || "/projects/sandbox/wicked-skins", TAG = process.env.TAG || "now";
const OUT = "/projects/sandbox/previews/tvreal-" + TAG; fs.mkdirSync(OUT, { recursive: true });
const EXT = "/projects/sandbox/pwtest/ext-tvreal-" + TAG; fs.rmSync(EXT, { recursive: true, force: true }); fs.mkdirSync(EXT, { recursive: true });
cp.execSync(`cd ${REPO} && tar --exclude=.git --exclude=node_modules --exclude=dist --exclude=store --exclude=site --exclude=android --exclude=desktop -cf - . | tar -xf - -C ${EXT}`);
const ALL = fs.readFileSync(EXT + "/src/candlelooks.js", "utf8").match(/const LOOKS = \[([\s\S]*?)\n  \];/)[1].match(/\["([a-z]+)",/g).map((s) => s.slice(2, -2));
const LOOKS = !process.env.LOOKS || process.env.LOOKS === "all" ? ALL : process.env.LOOKS.split(",");
const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
const UP = "#00ffa3", DOWN = "#ff2e97";
// states: a sequence of actions from a reset chart
const ST = [["axis", -300], ["axis", -300], ["axis", -300], ["axis", -300], ["axis", -300], ["axis", -300]];   // six drags: candles many times taller than the pane
const STATES = [
  { st: "normal", act: [] },
  { st: "zoomedOut", act: [["wheel", 900]] },
  { st: "zoomedIn", act: [["wheel", -1200]] },
  { st: "squeezed", act: [["axis", 260]] },
  { st: "stretched", act: ST },
  { st: "outStretched", act: [["wheel", 700], ...ST] },
  { st: "inStretched", act: [["wheel", -1200], ...ST] },
];
(async () => {
  const prof = path.join(__dirname, "profile-tvreal-" + TAG + "-" + Date.now());
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1500, height: 860 }, locale: "en-US",
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
  await new Promise((r) => setTimeout(r, 1200));
  const page = ctx.pages()[0] || await ctx.newPage(), pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  await set({ invite: { code: "PRIISM-TEST-TVRL", ok: true, status: "ok", checked: 4e12, since: 1 }, welcomePending: 0, enabled: true, skin: "graphite", opacity: 0.3,
    candleOn: true, candleUp: UP, candleDown: DOWN, candleLook: "neon", candleGlow: 0.3, autoQuality: false, powerSaver: false });
  for (const p of ctx.pages()) if (p !== page && p !== pop) await p.close().catch(() => {});
  await page.bringToFront(); await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(15000);
  // close banners / dialogs that cover the chart (cookies, sign-in offers)
  for (const t of ["Accept all", "Got it", "Accept", "Close", "No thanks"]) { const b = page.getByRole("button", { name: t }); if (await b.count().catch(() => 0)) await b.first().click({ timeout: 1500 }).catch(() => {}); }
  await page.keyboard.press("Escape").catch(() => {});
  const instrument = () => page.evaluate(({ UP, DOWN }) => {
    if (window.__za) return;
    const P = CanvasRenderingContext2D.prototype, of = P.fillRect, S = window.__za = { paints: new WeakMap(), xs: [], noBlur: true };
    P.fillRect = function (x, y, w, h) { const c = this.canvas;
      if (c && c.width > 400 && c.height > 300 && c.isConnected) { const t = this.getTransform(), X = Math.min(x, x + w) * t.a + t.e, Y = Math.min(y, y + h) * t.d + t.f, W = Math.abs(w * t.a), H = Math.abs(h * t.d);
        let p = S.paints.get(c); if (!p || (W >= c.width * 0.97 && H >= c.height * 0.97)) { p = { rects: [] }; S.paints.set(c, p); } else p.rects.push([X, Y, W, H, String(this.fillStyle).toLowerCase()]); }
      return of.call(this, x, y, w, h); };
    const d = Object.getOwnPropertyDescriptor(P, "shadowBlur"); Object.defineProperty(P, "shadowBlur", { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, S.noBlur ? 0 : v); } });
    const L = window.__bdCandleLooks;
    for (const fn of ["draw", "candle"]) { const o = L[fn]; L[fn] = function (g, look, x, y, w, h) { const t = g.getTransform(); if (S.xs.length < 5000) S.xs.push((x + w / 2) * t.a + t.e); return o.apply(this, arguments); }; }
    const hexOf = (s) => { if (/^#[0-9a-f]{6}$/.test(s)) return s; const r = /rgba?\(([^)]+)\)/.exec(s); if (!r) return null; const v = r[1].split(",").map(Number); if (v[3] !== undefined && v[3] < 0.95) return null; return "#" + v.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join(""); };
    window.__zaMeasure = () => {
      let c = null, best = -1; for (const x of document.querySelectorAll(".chart-markup-table.pane canvas")) { const p = S.paints.get(x); if (p && p.rects.length > best) { best = p.rects.length; c = x; } }
      if (!c) return { err: "no paint" };
      const p = S.paints.get(c), W = c.width, H = c.height, img = c.getContext("2d").getImageData(0, 0, W, H).data;
      const cand = p.rects.filter((r) => [UP, DOWN].includes(hexOf(r[4])) && r[2] < W * 0.3);
      const bodiesOf = (cand) => {   // per candle: the widest rect is its body; a rect whose centre lies inside a body is that candle's wick / border
        const out = []; for (const r of [...cand].sort((a, z) => z[2] - a[2] || z[3] - a[3])) { const cx = r[0] + r[2] / 2;
          if (!out.some((b) => cx >= b[0] - 1 && cx <= b[0] + b[2] + 1 && r[2] <= b[2])) out.push(r); }
        return out.filter((b) => b[2] >= 1); };
      const bodies = bodiesOf(cand);
      let empty = 0; for (const b of bodies) { const x0 = Math.max(0, Math.round(b[0])), x1 = Math.min(W, Math.round(b[0] + b[2])), y0 = Math.max(0, Math.round(b[1])), y1 = Math.min(H, Math.round(b[1] + b[3])); let ink = 0, n = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { n++; if (img[(y * W + x) * 4 + 3] > 20) ink++; } if (n && !ink) empty++; }
      const allow = new Uint8Array(W * H); for (const r of p.rects) { const x0 = Math.max(0, Math.floor(r[0] - 2)), x1 = Math.min(W, Math.ceil(r[0] + r[2] + 2)), y0 = Math.max(0, Math.floor(r[1] - 2)), y1 = Math.min(H, Math.ceil(r[1] + r[3] + 2)); for (let y = y0; y < y1; y++) allow.fill(1, y * W + x0, y * W + x1); }
      let stray = 0; for (let y = 0; y < H; y++) { let row = 0, out = 0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, mx = Math.max(img[i], img[i + 1], img[i + 2]), mn = Math.min(img[i], img[i + 1], img[i + 2]);
        if (img[i + 3] > 25 && mx && (mx - mn) / mx > 0.3) { row++; if (!allow[y * W + x]) out++; } } if (row < W * 0.55) stray += out; }
      const xs = S.xs, unstyled = bodies.filter((b) => b[2] >= 3 && b[3] >= 3 && !xs.some((x) => Math.abs(x - (b[0] + b[2] / 2)) <= 1.5)).length;
      const ws = bodies.map((b) => b[2]).sort((a, z) => a - z);
      return { bodies: bodies.length, bodyW: ws.length ? Math.round(ws[ws.length >> 1]) : 0, tallest: Math.round(Math.max(0, ...bodies.map((b) => b[3]))), big: bodies.filter((b) => b[2] >= 3 && b[3] >= 3).length, unstyled, empty, stray };
    };
  }, { UP, DOWN });
  await instrument();
  const pane = await page.evaluate(() => { const r = document.querySelector(".chart-markup-table.pane").getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
  const axis = await page.evaluate(() => { const e = document.querySelector(".chart-markup-table .price-axis"); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))));
  // TradingView shows a sign-up dialog to visitors without an account now and then; close anything over the chart
  const clear = async () => {
    for (let i = 0; i < 3; i++) {
      const open = await page.evaluate(() => { const ds = [...document.querySelectorAll("[role=dialog], [data-dialog-name], [class*='dialog-'][class*='visible']")].filter((d) => d.getBoundingClientRect().width > 200);
        for (const d of ds) { const b = d.querySelector("[data-name=close], [aria-label=Close], button[class*='close'], [class*='close-']"); if (b) b.click(); } return ds.length; });
      await page.keyboard.press("Escape").catch(() => {});
      // TradingView's own tips ("Got it!", the toast at the bottom) catch the mouse over the chart
      await page.evaluate(() => { for (const b of document.querySelectorAll("button")) { const t = (b.innerText || "").trim(); if (/^(Got it!?|OK)$/i.test(t) && b.getBoundingClientRect().width) b.click(); }
        for (const c of document.querySelectorAll("[class*=toast] [class*=close], [data-name=toast] button, [class*=notice] [class*=close]")) c.click(); }).catch(() => {});
      if (!open) break; await page.waitForTimeout(300);
    }
  };
  const reset = async () => { await clear(); await page.mouse.click(pane.l + pane.w * 0.5, pane.t + pane.h * 0.5); await page.keyboard.press("Alt+r"); await page.waitForTimeout(500); };
  const act = async ([k, v]) => {
    if (k === "wheel") { await page.mouse.move(pane.l + pane.w * 0.4, pane.t + pane.h * 0.5); for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, v / 6); await page.waitForTimeout(40); } }
    else { await page.mouse.move(axis.x, axis.y); await page.mouse.down(); for (let i = 1; i <= 8; i++) await page.mouse.move(axis.x, axis.y + (v * i) / 8); await page.mouse.up(); }
    await page.waitForTimeout(250);
  };
  // a guaranteed repaint for the measurement: move the crosshair off the chart and back
  const measure = async () => { await page.evaluate(() => { window.__za.xs = []; }); await page.mouse.move(pane.l + 5, pane.t + pane.h - 5); await page.mouse.move(pane.l + 6, pane.t + pane.h - 6);
    await page.mouse.wheel(0, 1); await page.mouse.wheel(0, -1); await settle(); return page.evaluate(() => window.__zaMeasure()); };
  const result = { tag: TAG, site: SITE, looks: {} };
  // TF=1: every timeframe on the real site (the interval in the address, as when you pick one), these looks and states
  if (process.env.TF) {
    const TFS = (process.env.TFS || "1,5,15,30,60,240,D,W").split(","), TST = STATES.filter((s) => ["normal", "zoomedIn", "stretched", "inStretched", "outStretched"].includes(s.st));
    result.tf = {};
    for (const tf of TFS) {
      await page.goto(SITE + "&interval=" + tf, { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForTimeout(13000); await clear(); await instrument();
      const iv = await page.evaluate(() => { const b = document.querySelector("#header-toolbar-intervals"); return b ? b.innerText.trim().split("\n")[0] : ""; });
      for (const look of LOOKS) {
        await set({ enabled: true, candleLook: look }); await page.waitForTimeout(500);
        for (const s of TST) { await reset(); for (const a of s.act) await act(a); let m = await measure();
          if (!m.bodies) { await clear(); await reset(); for (const a of s.act) await act(a); m = { ...(await measure()), retried: true }; }
          (result.tf[tf] = result.tf[tf] || []).push({ look, st: s.st, shown: iv, ...m });
          if (look === LOOKS[0]) { await page.evaluate(() => { window.__za.noBlur = false; }); await settle(); await page.screenshot({ path: `${OUT}/tf${tf}-${look}-${s.st}.png`, clip: { x: pane.l + pane.w * 0.55, y: pane.t, width: pane.w * 0.42, height: pane.h } }); await page.evaluate(() => { window.__za.noBlur = true; }); } }
      }
      const rs = result.tf[tf], bad = rs.filter((r) => r.unstyled || r.empty || !r.bodies);
      console.log("TF", tf.padEnd(4), "shown:", (iv || "?").padEnd(4), bad.length ? "PROBLEMS " + JSON.stringify(bad.slice(0, 4).map((r) => [r.look, r.st, r.bodies, r.unstyled, r.empty])) : "ok", "| widest", Math.max(...rs.map((r) => r.bodyW || 0)), "tallest", Math.max(...rs.map((r) => r.tallest || 0)));
    }
    fs.writeFileSync(path.join(__dirname, `tvreal-${TAG}.json`), JSON.stringify(result, null, 1)); await ctx.close(); fs.rmSync(prof, { recursive: true, force: true }); return;
  }
  for (const look of LOOKS) {
    await set({ enabled: true, candleLook: look }); await page.waitForTimeout(700);
    const rows = [];
    for (const s of STATES) {
      await reset(); for (const a of s.act) await act(a);
      let m = await measure();
      if (!m.bodies) { await clear(); await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(14000); await clear();   // covered or lost: once more from a fresh chart
        await instrument(); await reset(); for (const a of s.act) await act(a); m = { ...(await measure()), retried: true }; }
      rows.push({ st: s.st, ...m });
      await page.evaluate(() => { window.__za.noBlur = false; }); await page.mouse.move(pane.l + 6, pane.t + pane.h - 7); await settle();
      await page.screenshot({ path: `${OUT}/${look}-${s.st}.png`, clip: { x: pane.l + pane.w * 0.55, y: pane.t, width: pane.w * 0.42, height: pane.h } });
      await page.evaluate(() => { window.__za.noBlur = true; });
    }
    result.looks[look] = rows;
    console.log(look.padEnd(9), rows.map((r) => `${r.st}:${r.err ? r.err : `w${r.bodyW}/t${r.tallest} big${r.big} u${r.unstyled} e${r.empty} s${r.stray}`}`).join("  "));
  }
  fs.writeFileSync(path.join(__dirname, `tvreal-${TAG}.json`), JSON.stringify(result, null, 1));
  await ctx.close(); fs.rmSync(prof, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
