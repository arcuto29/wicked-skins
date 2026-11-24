// The TradingView logo on the chart, restyled (never hidden or moved), on real TradingView charts:
//   charting library  TradingView's trading-terminal demo (the library TopstepX is built on): the round logo the library
//                     draws on the chart canvas, light and dark theme
//   Lightweight Charts  a local page with Lightweight Charts 4.2 (nq.vision's library): its #tv-attr-logo link
// For each style (TradingView's, Your look, Glass, Colour incl. hard colours, Glow): the colours that really land on
// the canvas (a recorder under Priism's hook), the "TV" mark's contrast on its disc, nothing else on the chart
// changed, and before / after pictures. Results + pictures in test-output/logo/.
//   node test/logo/tvlogo.e2e.js [--ext <dir>]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os"), http = require("http");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const SITE = "https://trading-terminal.tradingview-widget.com", PORT = 8131, LW = `http://127.0.0.1:${PORT}`;
const OUT = path.join(__dirname, "..", "..", "test-output", "logo"); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const R = {}; const ok = (k, v, d) => { R[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 400) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lum = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const toHex = (s) => { const m = /^#([0-9a-f]{6})/i.exec(s); if (m) return "#" + m[1].toLowerCase(); const r = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(s || ""); return r ? "#" + [r[1], r[2], r[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join("") : null; };
// a recorder installed before Priism's hook: every fill on the chart canvases, split into "the logo spot" and the rest
const REC = `(() => { if (window.__lr) return; const P = CanvasRenderingContext2D.prototype, fsD = Object.getOwnPropertyDescriptor(P, "fillStyle");
  const L = (window.__lr = { logo: [], other: {}, on: false });
  const o = P.fill; P.fill = function (...a) { try { if (L.on) { const c = this.canvas, t = this.getTransform(), up = c.height - t.f, col = String(fsD.get.call(this));
      if (c.getAttribute("data-name") === "pane-canvas" && t.a === 1 && t.d === 1 && t.e >= 10 && t.e <= 21 && up >= 35 && up <= 48) { if (L.logo.length < 30) L.logo.push({ col, path: a[0] instanceof Path2D, blur: this.shadowBlur, sc: String(this.shadowColor) }); }
      else L.other[col] = (L.other[col] || 0) + 1; } } catch {} return o.apply(this, a); }; })();`;
const PAGE = `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#0b0e14}#c{position:fixed;inset:0}</style></head><body><div id="c"></div>
<script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script><script>
const ch = LightweightCharts.createChart(document.getElementById("c"), { autoSize: true, layout: { background: { type: "solid", color: "#0b0e14" }, textColor: "#d1d4dc" } });
const s = ch.addCandlestickSeries(), d = []; let p = 100, t = Math.floor(Date.now() / 1000) - 120 * 86400;
for (let i = 0; i < 120; i++) { const c = p + Math.sin(i / 4) * 2; d.push({ time: t + i * 86400, open: p, high: Math.max(p, c) + 1, low: Math.min(p, c) - 1, close: c }); p = c; } s.setData(d); window.__ready = true;</script></body></html>`;

(async () => {
  const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(PAGE); }).listen(PORT, "127.0.0.1");
  const EXTDIR = path.join(os.tmpdir(), `priism-logo-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  { const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); delete m.key;
    m.content_scripts.forEach((c) => c.matches.push(SITE + "/*", LW + "/*")); m.host_permissions.push(SITE + "/*", LW + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(os.tmpdir(), `priism-logo-prof-${process.pid}`); fs.rmSync(prof, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1400, height: 820 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
  await ctx.addInitScript(REC);
  await sleep(2500); for (const p0 of ctx.pages()) if (/tradingview\.com/.test(p0.url())) await p0.close().catch(() => {});
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(1000);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  await set({ enabled: true, welcomePending: 0, invite: { code: "PRIISM-LOGO-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, skin: "aurora", uiAccent: "#ff4fd8", tvLogo: "own", tvLogoGlow: 0 });
  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage(); await page.bringToFront();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  await page.goto(SITE + "/", { waitUntil: "domcontentloaded", timeout: 90000 });
  let F = null;
  for (let t0 = Date.now(); Date.now() - t0 < 90000 && !F; await sleep(1000)) for (const f of page.frames()) { try { if (await f.evaluate(() => !!document.querySelector('canvas[data-name="pane-canvas"]') && !!window.__lr)) { F = f; break; } } catch {} }
  if (!F) throw new Error("no chart");
  await sleep(6000); for (let i = 0; i < 4; i++) { const l = page.getByRole("button", { name: /got it/i }); if (!(await l.count())) break; await l.first().click({ force: true }).catch(() => {}); await sleep(300); }
  const box = await (await F.frameElement()).boundingBox();
  const pane = await F.evaluate(() => { const r = document.querySelector('canvas[data-name="pane-canvas"]').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const clip = { x: box.x + pane.x, y: box.y + pane.y + pane.h - 70, width: 110, height: 70 };
  const record = async () => { await F.evaluate(() => { window.__lr.logo = []; window.__lr.other = {}; window.__lr.on = true; });
    await page.mouse.move(box.x + pane.x + pane.w * 0.5, box.y + pane.y + pane.h * 0.4); await sleep(400); await page.mouse.move(box.x + pane.x + pane.w * 0.55, box.y + pane.y + pane.h * 0.45); await sleep(1200);
    await page.mouse.move(5, 5); await sleep(300); return F.evaluate(() => { window.__lr.on = false; return { logo: window.__lr.logo.slice(), other: window.__lr.other }; }); };
  const parts = (rec) => { const round = rec.logo.filter((x) => !x.path).map((x) => toHex(x.col)), mark = rec.logo.filter((x) => x.path).map((x) => toHex(x.col));
    return { ring: round[0], disc: round[1], mark: mark[0], rawDisc: (rec.logo.filter((x) => !x.path)[1] || {}).col, glow: rec.logo.some((x) => x.blur > 0) }; };
  const shots = [];
  const style = async (name, o) => { await set(o); await sleep(1500); const rec = await record(), p = parts(rec); const f = path.join(OUT, `terminal-${name}.png`); await page.screenshot({ path: f, clip }); shots.push([name, f]); return { rec, p }; };

  for (const theme of ["light", "dark"]) {
    if (theme === "dark") { await page.evaluate(() => window.tvWidget.changeTheme("Dark")); await sleep(3000); }
    const own = await style(`${theme}-own`, { tvLogo: "own", tvLogoGlow: 0 });
    ok(`${theme}: setup: the library draws its logo where Priism looks (ring, disc, "TV" mark)`, own.p.ring && own.p.disc && own.p.mark, own.p);
    const ownSet = new Set([own.p.ring, own.p.disc, own.p.mark]);
    ok(`${theme}: TradingView's (the default): the logo exactly as TradingView draws it`, [own.p.ring, own.p.disc, own.p.mark].every((c) => /^#([0-9a-f]{2})\1\1$/.test(c)), own.p);
    for (const [name, o, base] of [["look", { tvLogo: "look" }, "#ff4fd8"], ["glass", { tvLogo: "glass" }, null], ["color-blue", { tvLogo: "color", tvLogoColor: "#2f7bff" }, "#2f7bff"],
      ["color-yellow", { tvLogo: "color", tvLogoColor: "#ffe14a" }, "#ffe14a"], ["color-grey", { tvLogo: "color", tvLogoColor: "#7a7a7a" }, "#7a7a7a"], ["look-glow", { tvLogo: "look", tvLogoGlow: 1 }, "#ff4fd8"]]) {
      const r = await style(`${theme}-${name}`, { tvLogoGlow: 0, ...o }), p = r.p;
      const discHex = toHex(p.rawDisc || ""), con = p.mark && discHex ? contrast(p.mark, discHex) : 0;
      ok(`${theme} ${name}: restyled (not TradingView's colours any more), still all three parts in the same place`, p.ring && p.disc && p.mark && !(ownSet.has(p.mark) && ownSet.has(p.disc)), p);
      ok(`${theme} ${name}: the "TV" mark reads on its disc (contrast ${con.toFixed(1)}:1, at least 4.5)`, con >= 4.5, { mark: p.mark, disc: p.rawDisc });
      if (base) ok(`${theme} ${name}: in that colour's family (the ring is the colour itself)`, p.ring === base, p);
      if (name === "look-glow") ok(`${theme} ${name}: glows`, p.glow, p); else ok(`${theme} ${name}: no glow unless asked`, !p.glow, p);
      // nothing else on the chart changed colour: the same colours as with TradingView's logo, apart from the logo
      const a = Object.keys(own.rec.other).sort().join(), b = Object.keys(r.rec.other).sort().join();
      ok(`${theme} ${name}: nothing else on the chart changed (the same fill colours everywhere else)`, a === b, a === b ? undefined : { own: a, now: b });
    }
  }
  await set({ tvLogo: "own", tvLogoGlow: 0 }); await sleep(1500); { const p = parts(await record());
    ok("back to TradingView's: TradingView's own colours again", [p.ring, p.disc, p.mark].every((c) => /^#([0-9a-f]{2})\1\1$/.test(c)), p); }
  ok("no page errors (charting library)", !errs.length, errs);

  // ---------- Lightweight Charts ----------
  const lw = await ctx.newPage(); await lw.goto(LW + "/", { waitUntil: "load" }); await lw.waitForFunction("window.__ready === true"); await sleep(3500);
  const lwRead = () => lw.evaluate(() => { const a = document.getElementById("tv-attr-logo"); if (!a) return null; const cs = getComputedStyle(a), r = a.getBoundingClientRect();
    return { fill: cs.getPropertyValue("--fill").trim(), stroke: cs.getPropertyValue("--stroke").trim(), filter: cs.filter, visible: cs.visibility !== "hidden" && +cs.opacity > 0.9 && r.width > 20, box: [r.x, r.y, r.width, r.height].map(Math.round) }; });
  await set({ tvLogo: "own" }); await sleep(1200); const lw0 = await lwRead();
  ok("Lightweight Charts: its TradingView logo is there, in its own colours", lw0 && lw0.visible && !/!important/.test(lw0.fill), lw0);
  await lw.screenshot({ path: path.join(OUT, "lw-own.png"), clip: { x: 0, y: 820 - 70, width: 110, height: 70 } });
  for (const [name, o] of [["look", { tvLogo: "look", tvLogoGlow: 1 }], ["glass", { tvLogo: "glass", tvLogoGlow: 0 }], ["color-yellow", { tvLogo: "color", tvLogoColor: "#ffe14a", tvLogoGlow: 0 }]]) {
    await set(o); await sleep(1200); const v = await lwRead(); await lw.screenshot({ path: path.join(OUT, `lw-${name}.png`), clip: { x: 0, y: 820 - 70, width: 110, height: 70 } });
    const f = toHex(v.fill), st = toHex(v.stroke), con = f && st ? contrast(st, f) : 0;
    ok(`Lightweight Charts ${name}: recoloured, same place and size, still visible, mark readable (${con.toFixed(1)}:1)`, v.visible && v.fill !== lw0.fill && v.box.join() === lw0.box.join() && con >= 4.5 && (name !== "look" || /drop-shadow/.test(v.filter)), v);
  }
  await set({ tvLogo: "own" }); await sleep(1200); { const v = await lwRead(); ok("Lightweight Charts: back to its own colours", v.fill === lw0.fill && v.stroke === lw0.stroke && v.filter === lw0.filter, v); }

  // ---------- the panel ----------
  await pop.reload(); await sleep(1000);
  const ui = await pop.evaluate(async () => { const q = (i) => document.getElementById(i), btn = (i, t) => [...q(i).querySelectorAll("button")].find((b) => b.textContent === t);
    const one = document.querySelectorAll("#tvLogo").length === 1, glowHidden = q("tvLogoGlowRow").hidden;
    btn("tvLogo", "Colour").click(); await new Promise((r) => setTimeout(r, 200)); const pickShown = !q("tvLogoPick").hidden;
    btn("tvLogoGlow", "Strong").click(); await new Promise((r) => setTimeout(r, 200));
    const st = await new Promise((r) => chrome.storage.local.get(["tvLogo", "tvLogoGlow", "tvLogoColor"], r));
    return { one, glowHidden, pickShown, glowShown: !q("tvLogoGlowRow").hidden, st, inLooks: LOOK_KEYS.includes("tvLogo") }; });
  ok("panel: one TradingView logo row (Bars & panels); colour picker and glow only when they apply; each saves; part of saved looks", ui.one && ui.glowHidden && ui.pickShown && ui.glowShown && ui.st.tvLogo === "color" && ui.st.tvLogoGlow === 1 && /^#/.test(ui.st.tvLogoColor) && ui.inLooks, ui);

  // a sheet of the pictures
  const sheet = await pop.evaluate(async (rows) => { const W = 220, H = 140, cols = 4, c = document.createElement("canvas"); c.width = cols * (W + 10) + 10; c.height = Math.ceil(rows.length / cols) * (H + 30) + 10;
    const g = c.getContext("2d"); g.fillStyle = "#0b0b0d"; g.fillRect(0, 0, c.width, c.height); g.font = "600 13px system-ui"; g.fillStyle = "#fff";
    for (let i = 0; i < rows.length; i++) { const [n, src] = rows[i], x = 10 + (i % cols) * (W + 10), y = 10 + Math.floor(i / cols) * (H + 30); const im = new Image(); im.src = src; await im.decode(); g.drawImage(im, x, y + 16, W, H); g.fillText(n, x, y + 12); }
    return c.toDataURL("image/png").split(",")[1]; }, shots.map(([n, f]) => [n, "data:image/png;base64," + fs.readFileSync(f).toString("base64")]));
  fs.writeFileSync(path.join(OUT, "sheet.png"), Buffer.from(sheet, "base64"));
  const n = Object.values(R).filter((x) => x.pass).length;
  console.log(`\nTRADINGVIEW LOGO: ${n}/${Object.keys(R).length}`);
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(R, null, 1));
  await ctx.close(); srv.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXTDIR, { recursive: true, force: true });
  process.exitCode = n === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
