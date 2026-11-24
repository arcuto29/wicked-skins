// The update card in every state, drawn from popup/update-card.js + popup.css at the panel's real size, with
// screenshots (test-output/updates/card-*.png). Also checks it shows only what it's given and that progress follows
// the real numbers.   node test/updates/card.visual.js
const { chromium } = require("playwright"); const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, "..", ".."), OUT = path.join(ROOT, "test-output", "updates"); fs.mkdirSync(OUT, { recursive: true });
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 240) : "")); };
(async () => {
  const b = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu"] });
  const page = await b.newPage({ viewport: { width: 420, height: 600 } });   // the extension popup's size
  await page.route("https://api.github.com/**", (r) => r.fulfill({ json: { body: "- **Candles keep their look at every zoom and timeframe**\n- **Backup & restore**: wallpapers, looks and settings in one file\n- **Desktop updates show real progress**" } }));
  const html = path.join(OUT, "_card.html");
  fs.writeFileSync(html, `<html><head><link rel="stylesheet" href="file://${ROOT}/popup/popup.css"></head><body style="background:#07080c;color:#eee;font:13px system-ui;margin:0">
    <main style="padding:14px"><h3>Priism panel</h3><p>Settings, looks, wallpapers…</p><button id="under">A panel button</button></main>
    <script src="file://${ROOT}/src/version.js"></script><script src="file://${ROOT}/popup/update-card.js"></script></body></html>`);
  await page.goto("file://" + html);
  await page.waitForFunction(() => !!window.PriismUpdateCard);
  const show = (o) => page.evaluate((o) => { window.__clicked = ""; PriismUpdateCard.show({ ...o, onPrimary: () => (window.__clicked = "primary"), onLater: () => (window.__clicked = "later") }); }, o);
  const state = () => page.evaluate(() => { const v = document.querySelector(".pu-veil"); if (!v) return null; const c = v.querySelector(".pu-card").getBoundingClientRect();
    return { cls: v.className, text: v.innerText, box: [c.left, c.top, c.right, c.bottom].map(Math.round), bar: (v.querySelector(".pu-bar i") || {}).style ? v.querySelector(".pu-bar i").style.width : null }; });
  const shot = async (n) => { await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, `card-${n}.png`) }); };
  const inView = (s) => s && s.box[0] >= 0 && s.box[1] >= 0 && s.box[2] <= 420 && s.box[3] <= 600;

  await show({ mode: "available", from: "0.1.86", to: "0.1.87" }); let s = await state();
  ok("available: 'Downloading update', no number until the download reports one", /Downloading update/i.test(s.text) && !/%/.test(s.text) && inView(s), s.text.slice(0, 120));
  await shot("available");
  await page.evaluate(() => PriismUpdateCard.update({ percent: 37.4, transferred: 45.9 * 1048576, total: 122.7 * 1048576, speed: 4.2 * 1048576 }));
  await page.waitForTimeout(500); s = await state();
  ok("downloading: the real percent, sizes, speed and time left", /37%/.test(s.text) && /45\.9 MB of 123 MB/.test(s.text) && /4\.2 MB\/s/.test(s.text) && /s left|min left/.test(s.text) && s.bar === "37.4%", s.text.slice(0, 260));
  await shot("downloading");
  await page.evaluate(() => PriismUpdateCard.update({ percent: 99.1, transferred: 121.6 * 1048576, total: 122.7 * 1048576, speed: 5 * 1048576 })); s = await state();
  ok("...the same card updates in place (no flicker, still not 'ready' at 99%)", s.bar === "99.1%" && !/Restart/.test(s.text) && /Downloading/i.test(s.text));
  ok("downloading never blocks the panel (docked, the page underneath stays clickable)", /pu-dock/.test(s.cls) && (await page.evaluate(() => { const e = document.elementFromPoint(40, 90); return !!e && !e.closest(".pu-veil"); })));
  await show({ mode: "ready", from: "0.1.86", to: "0.1.87", primary: "Restart & update" }); s = await state();
  ok("ready: Restart & update + Not now, release notes, in the panel's corner", /Update ready/i.test(s.text) && /Restart & update/.test(s.text) && /Not now/.test(s.text) && inView(s), s.text.slice(0, 200));
  await page.waitForTimeout(700); s = await state();
  ok("...with the release's real headlines", /Candles keep their look/.test(s.text) && /Backup & restore/.test(s.text));
  await shot("ready");
  await page.click(".pu-go"); ok("Restart & update calls the real install", (await page.evaluate(() => window.__clicked)) === "primary" && !(await state()));
  await show({ mode: "error", from: "0.1.86", to: "0.1.87", error: { kind: "damaged", message: "The download didn't match the release, so it wasn't installed. Priism downloads it again by itself." } }); s = await state();
  ok("error: the real reason, Try again, amber not green, nothing about restarting", /Update paused/i.test(s.text) && /didn't match the release/.test(s.text) && /Try again/.test(s.text) && !/Restart/.test(s.text) && /pu-error/.test(s.cls));
  await shot("error");
  await show({ mode: "manual", from: "0.1.86", to: "0.1.87-beta.2", lead: "This copy was loaded unpacked, so Chrome can't update it by itself.", steps: ["Download it.", "Unzip it over the same folder.", "Press Reload in chrome://extensions."], primary: "Download 0.1.87 Beta 2", href: "https://github.com/x/y/releases/download/v0.1.87-beta.2/priism-skins-beta-0.1.87.2.zip" }); s = await state();
  ok("manual (unpacked / Android / Mac): numbered steps, a real download link, beta labelled", /Update available/i.test(s.text) && /1|Download it/.test(s.text) && /0\.1\.87 Beta 2/.test(s.text) && /BETA/i.test(s.text) && !/Restart|Downloading/.test(s.text));
  await shot("manual-beta");
  await page.keyboard.press("Escape"); ok("Esc on a docked card leaves it (it never takes the keyboard)", !!(await state()));
  await page.click(".pu-later");
  await show({ mode: "updated", from: "0.1.86", to: "0.1.87", items: ["fallback"] }); await page.waitForTimeout(700); s = await state();
  ok("updated: once, centred, what came with it", /Updated/i.test(s.text) && /Candles keep their look/.test(s.text) && !/pu-dock/.test(s.cls));
  await shot("updated");
  await page.keyboard.press("Escape"); ok("Esc closes the 'updated' card", !(await state()));
  await b.close(); fs.rmSync(html, { force: true });
  const p = Object.values(R).filter(Boolean).length, n = Object.keys(R).length; console.log("SUMMARY:", p + "/" + n); process.exit(p === n ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
