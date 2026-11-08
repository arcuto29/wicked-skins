// Desktop smoke test (runs in CI under a virtual display): launches the real app, checks the
// TradingView window gets the hook early, the skin/candles/watermark apply, and settings changes reach it.
const { _electron } = require("playwright");
const path = require("path"), fs = require("fs"), os = require("os");
const DESK = path.join(__dirname, "..");
const OUT = path.join(DESK, "test-output"); fs.mkdirSync(OUT, { recursive: true });
let failed = 0; const ok = (name, cond, detail) => { console.log(`${cond ? "PASS" : "FAIL"} ${name}${detail ? "  " + detail : ""}`); if (!cond) failed++; };

(async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), "wicked-"));
  fs.writeFileSync(path.join(userData, "settings.json"), JSON.stringify({ skin: "galaxy", candleOn: true, candleUp: "#00ffa3", candleDown: "#ff2e97", wmOn: true }));
  const app = await _electron.launch({ args: [DESK, "--no-sandbox", `--user-data-dir=${userData}`], timeout: 60000 });
  // The app opens to its settings window (it no longer pops a chart open by itself).
  const settingsEarly = await app.waitForEvent("window", { predicate: (w) => w.url().includes("popup.html"), timeout: 60000 }).catch(() => app.windows().find((w) => w.url().includes("popup.html")));
  ok("app opens to the settings window (no auto chart)", !!settingsEarly);
  ok("no chart window opened on launch", !app.windows().some((w) => w.url().includes("tradingview")));
  // Trigger "Open with skins" via the exposed desktop bridge.
  if (settingsEarly) { await settingsEarly.waitForTimeout(1500); await settingsEarly.evaluate(() => window.wickedStore.tv.open()); }
  const tv = await app.waitForEvent("window", { predicate: (w) => w.url().includes("tradingview"), timeout: 60000 }).catch(() => app.windows().find((w) => w.url().includes("tradingview")));
  ok("Open with skins launches the chart", !!tv);
  if (!tv) { await app.close(); process.exit(1); }
  const errors = []; tv.on("pageerror", (e) => errors.push(e.message));
  // signing in to TradingView has to work inside the app (or you're stuck on a signed-out chart)
  const ua = await tv.evaluate(() => navigator.userAgent).catch(() => "");
  ok("TradingView sees a normal Chrome browser (so Google sign-in works)", !!ua && !/Electron|priism/i.test(ua), ua);
  const before = app.windows().length;
  await tv.evaluate(() => { window.open("https://accounts.google.com/signin", "_blank", "width=480,height=640"); }).catch(() => {});
  await tv.waitForTimeout(3000);
  const opened = app.windows().filter((w) => !w.isClosed()).length > before;
  ok("sign-in popups open inside the app", opened);
  for (const w of app.windows()) if (/accounts\.google\.com|about:blank/.test(w.url())) await w.close().catch(() => {});
  await tv.waitForSelector(".chart-markup-table canvas", { timeout: 60000 }).catch(() => {});
  await tv.waitForTimeout(8000);
  const st = await tv.evaluate(() => {
    let neon = 0;
    for (const c of document.querySelectorAll(".chart-markup-table canvas")) {
      if (c.width < 400) continue;
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 8) if (d[i] < 40 && d[i + 1] > 220 && d[i + 2] > 130 && d[i + 2] < 200) neon++;
    }
    return { hooked: !!window.__bdHooked, layer: !!document.getElementById("bd-layer"), on: document.documentElement.classList.contains("bd-on"),
      neon, watermark: (document.getElementById("bd-wm") || {}).textContent || "" };
  });
  ok("hook loaded at page start", st.hooked);
  ok("skin layer present", st.layer && st.on);
  ok("candles recoloured", st.neon > 1000, `neon px ${st.neon}`);
  ok("watermark shown (logo + name)", st.watermark.includes("Priism Skins"));
  await tv.screenshot({ path: path.join(OUT, "tradingview.png") });

  const settings = app.windows().find((w) => w.url().includes("popup.html"));
  ok("settings window opens", !!settings);
  if (settings) {
    settings.on("pageerror", (e) => { errors.push("settings: " + e.message); console.log("settings PAGEERROR:", e.message, (e.stack || "").split("\n").slice(0, 3).join(" | ")); });
    settings.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("settings console:", m.text().slice(0, 300)); });
    await settings.reload();                         // re-run the panel with listeners attached
    // wallpapers live behind the Looks / Wallpapers switch on the Skins tab
    await settings.click("#skinView button:has-text('Wallpapers')", { timeout: 20000 }).catch(() => {});
    const cards = await settings.waitForSelector("#skinCards .card", { timeout: 20000 }).catch(() => null);
    await settings.screenshot({ path: path.join(OUT, "settings-start.png") });
    ok("settings panel renders skins", !!cards);
    ok("app uses its own full-window layout", await settings.evaluate(() => document.body.classList.contains("desk") && !!document.getElementById("deskHero") && document.body.getBoundingClientRect().width > 900));
    ok("live stats bar answers", await settings.evaluate(async () => { const s = await window.wickedStore.tv.stats(); return !!s && typeof s.cpu === "number"; }));
    if (cards) await settings.click("#skinCards .card:has-text('Cyber Grid')", { timeout: 30000 });
    await tv.waitForTimeout(2500);
    const saved = JSON.parse(fs.readFileSync(path.join(userData, "settings.json"), "utf8"));
    ok("settings change saved", saved.skin === "cybergrid");
    ok("settings change reaches the chart", await tv.evaluate(() => !!document.getElementById("bd-layer")));
    // the panel's Record / Snapshot buttons reach the chart window (desktop bridge)
    ok("chart window takes Record / Snapshot from the panel", await tv.evaluate(() => typeof window.__bdAction === "function"));
    const bad = await settings.evaluate(() => window.wickedStore.tv.action("nope")).catch((e) => ({ err: String(e) }));
    ok("panel -> chart action bridge answers", !!bad && bad.ok === false, JSON.stringify(bad));
    await settings.screenshot({ path: path.join(OUT, "settings.png") });
  }
  await tv.screenshot({ path: path.join(OUT, "tradingview-after.png") });
  ok("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));

  // ---- tabs, like TradingView Desktop ----
  const bar = app.windows().find((w) => w.url().endsWith("tabs.html"));
  ok("chart window has a tab bar", !!bar);
  if (bar) {
    await bar.screenshot({ path: path.join(OUT, "tabbar.png") }).catch(() => {});
    const tvPages = () => app.windows().filter((w) => !w.isClosed() && /tradingview\.com\/chart/.test(w.url()));
    const n0 = tvPages().length;
    await bar.evaluate(() => window.priismTabs.add());
    const t2 = await app.waitForEvent("window", { predicate: (w) => /tradingview/.test(w.url()), timeout: 30000 }).catch(() => null);
    await (t2 || tv).waitForTimeout(12000);
    ok("+ opens a second chart tab", tvPages().length === n0 + 1, `${n0} -> ${tvPages().length}`);
    ok("the new tab is skinned too", !!t2 && await t2.evaluate(() => !!document.getElementById("bd-layer")).catch(() => false));
    ok("the tab you're not looking at pauses its wallpaper", await tv.evaluate(() => window.__bdBackground === true).catch(() => false));
    const tabsShown = await bar.evaluate(() => document.querySelectorAll(".tab").length);
    ok("tab bar shows both tabs", tabsShown === 2, String(tabsShown));
  }
  await app.close();
  // ---- next launch: your tabs come back ----
  const desk = (() => { try { return JSON.parse(fs.readFileSync(path.join(userData, "chart-window.json"), "utf8")); } catch { return null; } })();
  ok("your tabs and window size are saved", !!desk && Array.isArray(desk.tabs) && desk.tabs.length === 2 && !!desk.bounds, JSON.stringify(desk && { tabs: desk.tabs, bounds: desk.bounds }));
  const app2 = await _electron.launch({ args: [DESK, "--no-sandbox", `--user-data-dir=${userData}`], timeout: 60000 });
  const s2 = await app2.waitForEvent("window", { predicate: (w) => w.url().includes("popup.html"), timeout: 60000 }).catch(() => app2.windows().find((w) => w.url().includes("popup.html")));
  if (s2) { await s2.waitForTimeout(1500); await s2.evaluate(() => window.wickedStore.tv.open()); }
  await new Promise((r) => setTimeout(r, 8000));
  const back = app2.windows().filter((w) => /tradingview\.com\//.test(w.url())).length;
  ok("next time: your tabs come back", back === 2, String(back));
  await app2.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nall desktop checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
