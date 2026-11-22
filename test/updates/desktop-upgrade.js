// Real installed Priism desktop apps updating themselves (Windows / Linux, in CI: .github/workflows/updates.yml).
// github.com resolves to the local stand-in (github-mock.js) on the test machine; the apps themselves are the real
// published / freshly built ones, unmodified.
//   node desktop-upgrade.js install <installer|AppImage>     install it (Windows: silent NSIS; Linux: the AppImage)
//   node desktop-upgrade.js seed                              settings with wallpapers, looks, a licence
//   node desktop-upgrade.js expect-404 <old> <new>            BEFORE: the installed <old> asks for <new> and gets a 404
//   node desktop-upgrade.js self-update <from> <to>           an installed <from> downloads <to> by itself and installs
//                                                             it when closed ("installs the next time you close Priism")
//   node desktop-upgrade.js restart-flow <from> <to>          the new updater: real errors (file missing, damaged,
//                                                             offline) change nothing; real progress; Restart & update
// Results: test-output/desktop-<os>/results.json + screenshots of the panel's update card.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process"), crypto = require("crypto");
const WIN = process.platform === "win32", OUT = path.join(__dirname, "..", "..", "test-output", "desktop-" + process.platform); fs.mkdirSync(OUT, { recursive: true });
const RES = path.join(OUT, "results.json"), results = fs.existsSync(RES) ? JSON.parse(fs.readFileSync(RES, "utf8")) : {};
const ok = (k, v, d) => { results[k] = { pass: !!v, detail: d === undefined ? null : d }; fs.writeFileSync(RES, JSON.stringify(results, null, 1)); console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 400) : "")); if (!v) process.exitCode = 1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOCK_LOG = process.env.MOCK_LOG || path.join(OUT, "mock-log.jsonl"), MODE = process.env.MOCK_MODE_FILE || path.join(OUT, "mode.txt");
const setMode = (m) => fs.writeFileSync(MODE, m);
const mockLog = () => (fs.existsSync(MOCK_LOG) ? fs.readFileSync(MOCK_LOG, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
// where things are
const LOCAL = process.env.LOCALAPPDATA || "", HOME = os.homedir();
const userData = WIN ? path.join(process.env.APPDATA, "Priism Skins") : path.join(HOME, ".config", "Priism Skins");
const pending = WIN ? path.join(LOCAL, "priism-skins-desktop-updater", "pending") : path.join(HOME, ".cache", "priism-skins-desktop-updater", "pending");
const APPIMAGE = path.join(HOME, "Applications", "Priism-Skins.AppImage");
function exe() {
  if (!WIN) return APPIMAGE;
  for (const base of [path.join(LOCAL, "Programs")]) { if (!fs.existsSync(base)) continue;
    for (const d of fs.readdirSync(base)) { const p = path.join(base, d, "Priism Skins.exe"); if (fs.existsSync(p)) return p; } }
  return null;
}
function installedVersion() {
  if (WIN) { const e = exe(); if (!e) return null; try { return cp.execFileSync("powershell", ["-NoProfile", "-Command", `(Get-Item '${e}').VersionInfo.ProductVersion`], { encoding: "utf8" }).trim().replace(/^(\d+\.\d+\.\d+)\.0$/, "$1"); } catch { return null; } }   // (Windows writes 0.1.85 as 0.1.85.0)
  // Linux: the version inside the AppImage (its resources/app.asar package.json), read by extracting it
  if (!fs.existsSync(APPIMAGE)) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-"));
  try { cp.execFileSync(APPIMAGE, ["--appimage-extract", "resources/app.asar"], { cwd: tmp, stdio: "pipe" });
    const txt = fs.readFileSync(path.join(tmp, "squashfs-root", "resources", "app.asar")).toString("latin1"), i = txt.search(/"name"\s*:\s*"priism-skins-desktop"/);
    if (i < 0) return null; const m = /"version"\s*:\s*"([^"]+)"/.exec(txt.slice(Math.max(0, i - 400), i + 800)); return m ? m[1] : null; }
  catch { return null; } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
let proc = null;
function launch(extra = []) {
  const e = exe(); if (!e) throw new Error("not installed");
  proc = cp.spawn(e, [...extra, ...(WIN ? [] : ["--no-sandbox"])], { detached: !WIN, stdio: "ignore", env: { ...process.env, ELECTRON_ENABLE_LOGGING: "1" } });
  proc.unref(); return proc;
}
// the app's main process ids (Electron's other processes have --type=)
function mainPids() {
  if (WIN) { try { const out = cp.execFileSync("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='Priism Skins.exe'\" | ForEach-Object { \"$($_.ProcessId)|$($_.CommandLine)\" }"], { encoding: "utf8" });
    return out.split(/\r?\n/).filter((l) => l && !/--type=/.test(l)).map((l) => +l.split("|")[0]); } catch { return []; } }
  const out = []; for (const p of fs.readdirSync("/proc").filter((x) => /^\d+$/.test(x))) { try { const ex = fs.readlinkSync(`/proc/${p}/exe`), cmd = fs.readFileSync(`/proc/${p}/cmdline`, "utf8");
    if (/priism-skins-desktop$/.test(ex) && !/--type=/.test(cmd)) out.push(+p); } catch {} } return out;
}
const running = () => mainPids().length > 0;
async function closeGracefully() {   // like closing the window: the app quits normally (and installs a waiting update)
  if (WIN) { try { cp.execSync('taskkill /IM "Priism Skins.exe"', { stdio: "pipe" }); } catch {} }
  else for (const p of mainPids()) { try { process.kill(p, "SIGTERM"); } catch {} }
  for (let i = 0; i < 60 && running(); i++) await sleep(500);
  return !running();
}
async function waitFor(fn, ms, step = 500) { const t = Date.now() + ms; while (Date.now() < t) { try { const v = await fn(); if (v) return v; } catch {} await sleep(step); } return null; }
const pendingInfo = () => { try { return JSON.parse(fs.readFileSync(path.join(pending, "update-info.json"), "utf8")); } catch { return null; } };
const stateFile = () => { try { return JSON.parse(fs.readFileSync(path.join(userData, "update-state.json"), "utf8")); } catch { return null; } };
const settings = () => { try { return JSON.parse(fs.readFileSync(path.join(userData, "settings.json"), "utf8")); } catch { return null; } };
// what must survive: your choices exactly, each wallpaper's file (its data) and name, looks, licence, journal.
// (The app may add things next to them, e.g. a wallpaper's measured size, or lastVersion: that's not a loss.)
const SEED_KEYS = ["skin", "mediaId", "candleLook", "candleUp", "dim", "invite", "journal"];
const seedOf = (s) => JSON.stringify([...SEED_KEYS.map((k) => [k, s && s[k]]),
  ["media", ((s && s.media) || []).map((m) => [m.id, m.name, m.type, crypto.createHash("sha256").update(String(m.src || "")).digest("hex")])],
  ["loadouts", ((s && s.loadouts) || []).map((l) => [l.id, l.name, l.mediaId, JSON.stringify(l.look)])]]);
const seedDiff = (s) => { const want = JSON.parse(fs.readFileSync(path.join(OUT, "seed.json"), "utf8")), have = JSON.parse(seedOf(s));
  return want.filter((w, i) => JSON.stringify(w) !== JSON.stringify(have[i])).map((w) => w[0]); };

(async () => {
  const [cmd, a1, a2] = process.argv.slice(2);
  if (cmd === "install") {
    if (WIN) { cp.execFileSync(a1, ["/S"], { stdio: "inherit" }); await waitFor(() => exe(), 120000); }
    else { fs.mkdirSync(path.dirname(APPIMAGE), { recursive: true }); fs.copyFileSync(a1, APPIMAGE); fs.chmodSync(APPIMAGE, 0o755); }
    console.log("installed", exe(), installedVersion());
    return;
  }
  if (cmd === "seed") {
    fs.mkdirSync(userData, { recursive: true });
    const img = crypto.randomBytes(1024 * 1024).toString("base64");
    const s = { skin: "media", mediaId: "seed0001", media: [{ id: "seed0001", name: "My wallpaper.png", type: "image", src: "data:image/png;base64," + img }], candleOn: true, candleLook: "neon", candleUp: "#00ffa3", dim: 0.31,
      loadouts: [{ id: "lk1", name: "Night", skin: "media", mediaId: "seed0001", look: { candleLook: "glass" } }], invite: { code: "PRIISM-DESK-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, journal: [{ d: "2026-11-21", note: "keep" }], welcomePending: 0 };
    fs.writeFileSync(path.join(userData, "settings.json"), JSON.stringify(s));
    fs.writeFileSync(path.join(OUT, "seed.json"), seedOf(s));
    console.log("seeded", path.join(userData, "settings.json"), (fs.statSync(path.join(userData, "settings.json")).size / 1048576).toFixed(1) + " MB");
    return;
  }
  const seed = () => fs.readFileSync(path.join(OUT, "seed.json"), "utf8");
  if (cmd === "expect-404") {          // BEFORE the fix: what every installed copy does today
    setMode("ok"); fs.rmSync(pending, { recursive: true, force: true });
    ok(`before: ${a1} is installed`, installedVersion() === a1, installedVersion());
    launch();
    const hit = await waitFor(() => mockLog().find((l) => /\/download\//.test(l.url || "") && /\.(exe|AppImage)$/.test(l.url) && l.status === 404), 120000);
    await sleep(3000);
    const asked = mockLog().filter((l) => /\/download\//.test(l.url || "")).map((l) => `${l.status} ${l.url.split("/").pop()}`);
    ok(`before: ${a1} finds ${a2} but asks for a file name that isn't on the release -> 404`, !!hit, asked);
    ok("before: so nothing is downloaded (users never get the update)", !pendingInfo());
    await closeGracefully(); await sleep(4000);
    ok(`before: still ${a1} after closing`, installedVersion() === a1, installedVersion());
    return;
  }
  if (cmd === "self-update") {         // AFTER: a copy that's out there today updates itself to the fixed release
    setMode("ok"); fs.rmSync(pending, { recursive: true, force: true }); fs.writeFileSync(MOCK_LOG, "");
    const before = settings();
    ok(`${a1} is installed, with your settings`, installedVersion() === a1 && seedOf(before) === seed(), [installedVersion(), seedDiff(before)]);
    launch();
    const info = await waitFor(() => { const p = pendingInfo(); return p && p.fileName && fs.existsSync(path.join(pending, p.fileName)) ? p : null; }, 240000, 1000);
    const asked = mockLog().filter((l) => /\/download\//.test(l.url || "")).map((l) => `${l.status} ${l.url.split("/").pop()}`);
    ok(`${a1} found ${a2}, downloaded it (200, verified by its updater) without any help`, !!info && asked.some((x) => /^20[06] /.test(x) && /\.(exe|AppImage)$/.test(x)), { asked, info });
    ok(`...still running ${a1} meanwhile (nothing installs while you use it)`, running() && installedVersion() === a1);
    const closed = await closeGracefully();
    ok("closing Priism: the app quits normally", closed);
    const v = await waitFor(() => (installedVersion() === a2 ? a2 : null), 180000, 2000);
    ok(`...and ${a2} is installed when it's closed (no reinstall by hand)`, v === a2, installedVersion());
    ok("...your settings, wallpapers, looks and licence are all still there", seedOf(settings()) === seed(), seedDiff(settings()));
    launch();
    const st = await waitFor(() => { const s = stateFile(); return s && s.current === a2 && ["current", "available", "downloading", "ready", "error"].includes(s.state) ? s : null; }, 120000, 1000);
    ok(`${a2} starts, and its updater reports in`, !!st, st);
    await closeGracefully();
    return;
  }
  if (cmd === "restart-flow") {        // the new updater, from the inside: errors, progress, Restart & update
    const { chromium } = require("playwright");
    fs.rmSync(pending, { recursive: true, force: true }); fs.writeFileSync(MOCK_LOG, "");
    ok(`${a1} is installed`, installedVersion() === a1, installedVersion());
    setMode("404");
    launch(["--remote-debugging-port=9333"]);
    const browser = await waitFor(() => chromium.connectOverCDP("http://127.0.0.1:9333"), 60000, 1000);
    const panel = await waitFor(async () => { for (const c of browser.contexts()) for (const p of c.pages()) if (/popup\.html/.test(p.url())) return p; return null; }, 60000, 1000);
    await panel.waitForFunction(() => window.wickedStore && window.PriismUpdateCard, null, { timeout: 60000 });
    const state = () => panel.evaluate(() => window.wickedStore.app.state());
    const card = () => panel.evaluate(() => { const v = document.querySelector(".pu-veil"); return v ? { cls: v.className, text: v.innerText, bar: (v.querySelector(".pu-bar i") || { style: {} }).style.width || "" } : null; });
    const shot = (n) => panel.screenshot({ path: path.join(OUT, `card-${n}.png`) }).catch(() => {});
    const again = () => panel.evaluate(() => window.wickedStore.app.check());
    const stillA1 = () => installedVersion() === a1 && running();
    // 1. the file isn't on the server
    let s = await waitFor(async () => { const x = await state(); return x.state === "error" ? x : null; }, 120000);
    let c = await card();
    ok("installer missing on the server: 'Update paused' with the plain reason, nothing installed", s && s.error.kind === "missing" && c && /pu-error/.test(c.cls) && /isn't on the server/.test(c.text) && stillA1(), { s, c: c && c.text.slice(0, 160) });
    await shot("desktop-error-missing");
    // 2. a damaged download
    setMode("corrupt"); await again();
    s = await waitFor(async () => { const x = await state(); return x.state === "error" && x.error.kind === "damaged" ? x : null; }, 240000, 1000);
    c = await card();
    await new Promise((r) => setTimeout(r, 800)); c = await card();
    ok("damaged download (one byte changed): caught by its SHA-512, not installed, said plainly (the card switches from Downloading to the reason)", s && c && /pu-error/.test(c.cls) && /didn't match the release/.test(c.text) && stillA1() && !(pendingInfo() && fs.existsSync(path.join(pending, pendingInfo().fileName || "-"))), { s, c: c && c.text.slice(0, 160) });
    await shot("desktop-error-damaged");
    // 3. offline
    setMode("down"); await again();
    s = await waitFor(async () => { const x = await state(); return x.state === "error" && x.error.kind === "offline" ? x : null; }, 120000);
    ok("offline: 'No connection', the app keeps running, nothing changed", !!s && stillA1(), s);
    ok("...the error is kept for after a restart too (update-state.json)", (stateFile() || {}).state === "error");
    // 4. back online: real progress, then ready
    setMode("slow"); const seen = [], texts = [];
    await again();
    const t0 = Date.now();
    while (Date.now() - t0 < 300000) {
      const x = await state(); seen.push([x.state, Math.round(x.percent || 0), x.transferred || 0]);
      const cc = await card(); if (cc) texts.push([x.state, cc.bar, /Restart/.test(cc.text)]);
      if (x.state === "downloading" && x.percent > 30 && x.percent < 70 && !fs.existsSync(path.join(OUT, "card-desktop-downloading.png"))) await shot("desktop-downloading");
      if (x.state === "ready" || (x.state === "error" && Date.now() - t0 > 5000)) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    const pcts = seen.filter((x) => x[0] === "downloading").map((x) => x[1]);
    ok("downloading: real progress from the download (rising percent, real bytes)", pcts.length >= 5 && pcts[pcts.length - 1] > pcts[0] && pcts.every((p, i) => !i || p >= pcts[i - 1]), { samples: pcts.length, first: pcts[0], last: pcts[pcts.length - 1] });
    ok("...the card's bar follows it, and 'Restart & update' never shows before it's ready", texts.some((x) => x[0] === "downloading" && /%$/.test(x[1])) && texts.filter((x) => x[0] !== "ready").every((x) => !x[2]));
    s = await state(); c = await card();
    ok(`ready: ${a2} downloaded and verified, 'Restart & update' offered, still on ${a1}`, s.state === "ready" && s.version === a2 && c && /Restart & update/.test(c.text) && stillA1(), { s, c: c && c.text.slice(0, 120) });
    await shot("desktop-ready");
    // 5. Restart & update (the real button)
    await panel.click(".pu-go").catch(() => {});
    try { await browser.close(); } catch {}
    const v = await waitFor(() => (installedVersion() === a2 ? a2 : null), 240000, 2000);
    ok(`Restart & update: ${a2} is installed`, v === a2, installedVersion());
    const st = await waitFor(() => { const x = stateFile(); return x && x.current === a2 && running() ? x : null; }, 180000, 1000);
    ok(`...and Priism started again by itself on ${a2}`, !!st, st);
    ok("...with your settings, wallpapers, looks and licence", seedOf(settings()) === seed(), seedDiff(settings()));
    await closeGracefully();
    return;
  }
  console.error("unknown command"); process.exitCode = 2;
})().catch((e) => { console.error(e); ok("no crash in the test itself", false, String(e && e.stack || e).slice(0, 400)); process.exitCode = 1; });
