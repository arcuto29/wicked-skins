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
    if (cards) await settings.click("#skinCards .card:has-text('Cyber Grid')", { timeout: 30000 });
    await tv.waitForTimeout(2500);
    const saved = JSON.parse(fs.readFileSync(path.join(userData, "settings.json"), "utf8"));
    ok("settings change saved", saved.skin === "cybergrid");
    ok("settings change reaches the chart", await tv.evaluate(() => !!document.getElementById("bd-layer")));
    await settings.screenshot({ path: path.join(OUT, "settings.png") });
  }
  await tv.screenshot({ path: path.join(OUT, "tradingview-after.png") });
  ok("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await app.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nall desktop checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
