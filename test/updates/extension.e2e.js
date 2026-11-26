// The real extension in Chrome: backups between two installs, and the update card on each kind of install.
//   npx playwright install chromium && node test/updates/extension.e2e.js
// Two copies with different extension ids, like a zip copy and a store copy:
//   A = loaded unpacked (no update_url)   B = like a store install (update_url in its manifest, never reachable)
// Checks:
//   - a backup from A holds A's uploaded wallpapers (bytes), looks, settings, and no licence / pass / device keys
//   - restoring it in B: wallpapers byte for byte, looks added next to B's own, settings, B keeps its own device id;
//     the result is verified and A is untouched; Undo puts B back exactly; restoring twice adds nothing twice;
//     a damaged backup changes nothing
//   - update card: unpacked -> real GitHub release -> "manual" steps + the zip, never "Restart & update"; offline ->
//     nothing; store copy -> no card until Chrome has really downloaded one (updateReady), then "Restart & update"
const { chromium } = require("playwright"); const path = require("path"), fs = require("fs"), os = require("os"), crypto = require("crypto"), cp = require("child_process");
const ROOT = path.join(__dirname, "..", ".."), OUT = path.join(ROOT, "test-output", "updates"); fs.mkdirSync(OUT, { recursive: true });
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "priism-upd-"));
cp.execFileSync(process.execPath, [path.join(ROOT, "scripts/build-extension.js")], { stdio: "pipe" });
const copyExt = (name, patch) => { const d = path.join(TMP, name); fs.cpSync(path.join(ROOT, "dist/extension"), d, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(d, "manifest.json"))); patch && patch(m); fs.writeFileSync(path.join(d, "manifest.json"), JSON.stringify(m)); return d; };
const idOf = (dir) => [...crypto.createHash("sha256").update(dir).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
const A = copyExt("copyA"), B = copyExt("copyB", (m) => { m.update_url = "https://127.0.0.1:9/never"; });
const profiles = {};   // one browser profile per copy, kept between launches (like a real computer)
const launch = (ext) => chromium.launchPersistentContext(profiles[ext] || (profiles[ext] = fs.mkdtempSync(path.join(TMP, "prof-"))), { headless: false, acceptDownloads: true, viewport: { width: 400, height: 600 },   // the extension popup's real size
  args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
const VER = JSON.parse(fs.readFileSync(path.join(A, "manifest.json"))).version;
const bytes = (n, seed) => { const b = Buffer.alloc(n); let s = seed; for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) >>> 0; b[i] = s >>> 24; } return b; };
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

(async () => {
  // GitHub, as the panel sees it (a release newer than this build), unless "offline"
  let offline = false;
  const github = async (ctx) => ctx.route("https://api.github.com/**", (r) => {
    if (offline) return r.abort("internetdisconnected");
    const u = r.request().url();
    if (/releases\/latest$/.test(u)) return r.fulfill({ json: { tag_name: "v9.9.9", html_url: "https://github.com/arcuto29/priism-skins/releases/tag/v9.9.9", draft: false, prerelease: false,
      assets: [{ name: "priism-skins-9.9.9.zip", browser_download_url: "https://github.com/arcuto29/priism-skins/releases/download/v9.9.9/priism-skins-9.9.9.zip", size: 11e6 }] } });
    if (/releases\/tags\/v9\.9\.9$/.test(u)) return r.fulfill({ json: { body: "- **Candles keep their look at every zoom**\n- **Backups**: everything in one file" } });
    return r.fulfill({ status: 404, json: {} });
  });
  // ---------------- copy A: a full install ----------------
  const ctxA = await launch(A); await github(ctxA);
  const pa = await ctxA.newPage(); await pa.goto(`chrome-extension://${idOf(A)}/popup/popup.html`); await pa.waitForTimeout(800);
  const IMG = bytes(420 * 1024, 7), VID = bytes(9 * 1048576, 11);   // an image and a 9 MB "video" (any bytes: they're stored as they are)
  await pa.evaluate(async ([img, vid, ver]) => {
    const u8 = (a) => new Uint8Array(a);
    await WickedMediaDB.put("aaaa1111", new Blob([u8(img)], { type: "image/png" }));
    await WickedMediaDB.put("bbbb2222", new Blob([u8(vid)], { type: "video/webm" }));
    await new Promise((r) => chrome.storage.local.set({
      lastVersion: ver, welcomePending: 0, skin: "media", mediaId: "bbbb2222", candleOn: true, candleLook: "neon", candleUp: "#00ffa3", dim: 0.33,
      media: [{ id: "aaaa1111", name: "Aurora.png", type: "image", file: true, size: img.length, thumb: "data:image/jpeg;base64,/9j/" }, { id: "bbbb2222", name: "Rain.webm", type: "video", file: true, size: vid.length, thumb: "data:image/jpeg;base64,/9j/" }],
      loadouts: [{ id: "lkA1", name: "Night trader", skin: "media", mediaId: "aaaa1111", look: { candleLook: "glass", dim: 0.2 } }, { id: "lkA2", name: "Calm", skin: "aurora", mediaId: null, look: { candleLook: "solid" } }],
      chartSkins: { chart1: "media:aaaa1111" }, journal: [{ d: "2026-11-21", note: "patience" }],
      invite: { code: "PRIISM-ACCT-SECRET", ok: true, status: "ok", checked: 4e12, since: 1, kind: "account" }, pass: "eyJ.pass.A", deviceId: "device-A-0000001", deviceSecret: "Z".repeat(43) }, r));
    localStorage.setItem("seenVer", ver);
  }, [[...IMG], [...VID], VER]);
  await pa.reload(); await pa.waitForTimeout(1500);
  // the update card on an unpacked copy: the real release, what to do by hand, never "Restart & update"
  // the card as you'd see it: on screen inside the popup, fully visible
  const seen = (v) => { const c = v.querySelector(".pu-card").getBoundingClientRect(); return c.left >= 0 && c.top >= 0 && c.right <= innerWidth + 1 && c.bottom <= innerHeight + 1 && +getComputedStyle(v).opacity > 0.95; };
  const card = () => pa.evaluate((seenSrc) => { const seen = eval(seenSrc), v = document.querySelector(".pu-veil"); return v ? { cls: v.className, text: v.innerText, href: (v.querySelector("a.pu-go") || {}).href || "", seen: seen(v) } : null; }, seen.toString());
  await pa.waitForTimeout(600);   // (past its slide-in)
  let c = await card();
  ok("unpacked copy + newer release: an 'Update available' card with the steps to do it by hand", c && /pu-manual/.test(c.cls) && /Update available/i.test(c.text)
    // (9.9.9 is past keys/unpacked.json keyedFrom: the one-time move to the fixed id; your things move over by themselves, no backup)
    && /NEW folder/.test(c.text) && /Load unpacked/.test(c.text) && /by themselves/.test(c.text) && !/backup/i.test(c.text), c && c.text.slice(0, 400));
  ok("...its button is the release's real zip", c && c.href.endsWith("/v9.9.9/priism-skins-9.9.9.zip"), c && c.href);
  ok("...and it never claims to download or install by itself", c && !/Restart|Downloading|ready/i.test(c.text));
  ok("...it sits in the corner, it doesn't cover the panel, and it's actually on screen in the popup", c && /pu-dock/.test(c.cls) && c.seen);
  await pa.waitForTimeout(500); await pa.screenshot({ path: path.join(OUT, "panel-unpacked-manual.png") });
  await pa.click(".pu-later"); await pa.reload(); await pa.waitForTimeout(1200);
  ok("'Not now': not shown again on the next open", !(await card()));
  offline = true; await pa.evaluate(() => { localStorage.removeItem("updSnooze"); Object.keys(localStorage).filter((k) => k.startsWith("updLatest:")).forEach((k) => localStorage.removeItem(k)); }); await pa.reload(); await pa.waitForTimeout(1500);
  ok("offline: no card, no error, the panel works", !(await card()) && (await pa.isVisible("#tab-skins, nav, main")));
  offline = false;
  // ---- save a backup in A ----
  await pa.evaluate(() => { document.querySelector('#nav [data-tab="tune"]').click(); document.getElementById("bkBox").open = true; });
  await pa.waitForTimeout(1500);
  const dumpA0 = await pa.evaluate(() => new Promise((r) => chrome.storage.local.get(null, r)));
  const [dl] = await Promise.all([pa.waitForEvent("download", { timeout: 60000 }), pa.click("#bkSave")]);
  const file = path.join(TMP, dl.suggestedFilename()); await dl.saveAs(file);
  await pa.waitForFunction(() => /Backup saved/.test(document.getElementById("bkMsg").textContent), null, { timeout: 30000 });
  const saidA = await pa.textContent("#bkMsg");
  ok("backup saved, with what's in it", /2 wallpapers/.test(saidA) && /2 saved looks/.test(saidA), saidA);
  const raw = fs.readFileSync(file);
  ok("the file holds the wallpapers' actual bytes", raw.includes(IMG.subarray(1000, 1400)) && raw.includes(VID.subarray(5e6, 5e6 + 400)) && raw.length > IMG.length + VID.length);
  ok("...and no licence, pass or device keys (not even their values)", !raw.includes("PRIISM-ACCT-SECRET") && !raw.includes("eyJ.pass.A") && !raw.includes("Z".repeat(43)) && !raw.includes("device-A-0000001"));
  const dumpA1 = await pa.evaluate(() => new Promise((r) => chrome.storage.local.get(null, r)));
  ok("saving a backup changes nothing in A", JSON.stringify(dumpA0) === JSON.stringify(dumpA1), Object.keys(dumpA1).filter((k) => JSON.stringify(dumpA0[k]) !== JSON.stringify(dumpA1[k])));
  await ctxA.close();

  // ---------------- copy B: another install with its own things ----------------
  const ctxB = await launch(B); await github(ctxB);
  const pb = await ctxB.newPage(); await pb.goto(`chrome-extension://${idOf(B)}/popup/popup.html`); await pb.waitForTimeout(800);
  const OWN = bytes(200 * 1024, 3);
  await pb.evaluate(async ([own, ver]) => {
    await WickedMediaDB.put("cccc3333", new Blob([new Uint8Array(own)], { type: "image/jpeg" }));
    await new Promise((r) => chrome.storage.local.set({ lastVersion: ver, welcomePending: 0, skin: "starfield", candleLook: "solid", dim: 0.1,
      media: [{ id: "cccc3333", name: "Mine.jpg", type: "image", file: true, size: own.length, thumb: "data:image/jpeg;base64,/9j/" }],
      loadouts: [{ id: "lkB1", name: "My own", skin: "starfield", mediaId: null, look: { candleLook: "solid" } }],
      invite: { code: "PRIISM-B-OWN", ok: true, status: "ok", checked: 4e12, since: 1 }, deviceId: "device-B-0000002" }, r));
    localStorage.setItem("seenVer", ver);
  }, [[...OWN], VER]);
  await pb.reload(); await pb.waitForTimeout(1500);
  const cardB = () => pb.evaluate((seenSrc) => { const seen = eval(seenSrc), v = document.querySelector(".pu-veil"); return v ? { cls: v.className, text: v.innerText, seen: seen(v) } : null; }, seen.toString());
  ok("store copy: no card while Chrome hasn't downloaded an update (no GitHub guesses)", !(await cardB()));
  await pb.evaluate(() => new Promise((r) => chrome.storage.local.set({ updateReady: { version: "9.9.9", at: Date.now() } }, r)));   // what bg.js stores on onUpdateAvailable
  await pb.reload(); await pb.waitForTimeout(1500); await pb.waitForTimeout(600);   // (past its slide-in)
  c = await cardB();
  ok("store copy, Chrome has it waiting: 'Update ready' with Restart & update, on screen", c && /pu-ready/.test(c.cls) && /Update ready/i.test(c.text) && /Restart & update/.test(c.text) && c.seen, c && [c.seen, c.text.slice(0, 160)]);
  await pb.waitForTimeout(500); await pb.screenshot({ path: path.join(OUT, "panel-store-ready.png") });
  await pb.click(".pu-later"); await pb.evaluate(() => new Promise((r) => chrome.storage.local.remove("updateReady", r)));
  const dumpB0 = await pb.evaluate(() => new Promise((r) => chrome.storage.local.get(null, r)));
  // ---- a damaged backup: nothing changes ----
  const bad = Buffer.from(raw); bad[bad.length - 4000] ^= 0xff; const badFile = path.join(TMP, "damaged.priism"); fs.writeFileSync(badFile, bad);
  await pb.evaluate(() => { document.querySelector('#nav [data-tab="tune"]').click(); document.getElementById("bkBox").open = true; });
  await pb.setInputFiles("#bkFile", badFile);
  await pb.waitForFunction(() => /damaged/.test(document.getElementById("bkMsg").textContent), null, { timeout: 60000 });
  const dumpBd = await pb.evaluate(() => new Promise((r) => chrome.storage.local.get(null, r)));
  ok("a damaged backup is refused, naming the wallpaper, and B is unchanged", /Rain\.webm/.test(await pb.textContent("#bkMsg")) && JSON.stringify(dumpB0.media) === JSON.stringify(dumpBd.media) && !(await pb.isVisible("#bkRestoreBtn")));
  // ---- the real backup ----
  await pb.setInputFiles("#bkFile", file);
  await pb.waitForSelector("#bkRestoreBtn", { state: "visible", timeout: 60000 });
  ok("before restoring, it says what's in the backup (all checked)", /2 wallpapers/.test(await pb.textContent("#bkMsg")) && /all checked/.test(await pb.textContent("#bkMsg")));
  await pb.click("#bkRestoreBtn");
  await pb.waitForFunction(() => /Restored/.test(document.getElementById("bkMsg").textContent), null, { timeout: 120000 });
  const said = await pb.textContent("#bkMsg");
  ok("restored and verified (every wallpaper read back)", /Restored and verified/.test(said) && /2 wallpapers read back byte for byte/.test(said), said.slice(0, 220));
  await pb.screenshot({ path: path.join(OUT, "restore-verified.png") });
  const got = await pb.evaluate(async () => { const s = await new Promise((r) => chrome.storage.local.get(null, r)), out = {};
    for (const m of s.media) { const b = await WickedMediaDB.get(m.id); out[m.name] = b ? [...new Uint8Array(await b.arrayBuffer())] : null; }
    return { s, files: out }; });
  const S = got.s;
  ok("B: the wallpapers are the same bytes as in A", sha(Buffer.from(got.files["Aurora.png"])) === sha(IMG) && sha(Buffer.from(got.files["Rain.webm"])) === sha(VID));
  ok("B: its own wallpaper is still there, untouched", got.files["Mine.jpg"] && sha(Buffer.from(got.files["Mine.jpg"])) === sha(OWN) && S.media.length === 3);
  ok("B: A's looks added next to B's own (none lost)", ["Night trader", "Calm", "My own"].every((n) => S.loadouts.some((l) => l.name === n)) && S.loadouts.length === 3);
  ok("B: A's settings and current wallpaper", S.candleLook === "neon" && S.dim === 0.33 && S.skin === "media" && S.media.some((m) => m.id === S.mediaId && m.name === "Rain.webm") && S.journal && S.journal.length === 1);
  ok("B: references follow the wallpapers (looks, per-chart)", S.media.some((m) => m.id === S.loadouts.find((l) => l.name === "Night trader").mediaId && m.name === "Aurora.png") && S.chartSkins.chart1 === "media:" + S.media.find((m) => m.name === "Aurora.png").id);
  ok("B keeps its own licence and device id; A's never arrived", S.invite.code === "PRIISM-B-OWN" && S.deviceId === "device-B-0000002" && !S.deviceSecret && S.pass !== "eyJ.pass.A");
  ok("the undo copy is kept until you choose Keep", !!S.restoreUndo && (await pb.isVisible("#bkKeep")) && (await pb.isVisible("#bkUndo")));
  await pb.reload(); await pb.waitForTimeout(1200);
  ok("...also after closing and reopening the panel: a notice at the top leads to it", (await pb.isVisible("#notice")) && /restored backup is waiting/i.test(await pb.textContent("#notice")));
  await pb.click("#noticeLink"); await pb.waitForTimeout(400);
  ok("...with Keep and Undo restore right there", /You restored a backup/.test(await pb.textContent("#bkMsg")) && (await pb.isVisible("#bkUndo")) && (await pb.isVisible("#bkKeep")));
  // ---- undo: exactly back ----
  await pb.click("#bkUndo"); await pb.waitForTimeout(2000);
  const U = await pb.evaluate(async () => { const s = await new Promise((r) => chrome.storage.local.get(null, r)); const ids = ["aaaa1111", "bbbb2222", ...s.media.map((m) => m.id)];
    const db = {}; for (const id of ids) db[id] = !!(await WickedMediaDB.get(id)); return { s, db }; });
  // (lastPick / updPoke / indSeen are written all the time by the panel and the open chart tab, not by the restore)
  const LIVE = ["lastPick", "updPoke", "updCheck", "indSeen"];
  const strip = (o) => { const x = { ...o }; for (const k of LIVE) delete x[k]; return JSON.stringify(Object.keys(x).sort().map((k) => [k, x[k]])); };
  ok("Undo restore: B is exactly as before", strip(U.s) === strip(dumpB0), Object.keys({ ...U.s, ...dumpB0 }).filter((k) => !LIVE.includes(k) && JSON.stringify(U.s[k]) !== JSON.stringify(dumpB0[k])).map((k) => [k, JSON.stringify(dumpB0[k]).slice(0, 80), JSON.stringify(U.s[k]).slice(0, 80)]));
  ok("...the restored wallpaper files are gone again, B's own stays", !U.db.aaaa1111 && !U.db.bbbb2222 && U.db.cccc3333);
  // ---- restore twice, then Keep ----
  for (let i = 0; i < 2; i++) { await pb.evaluate(() => { document.querySelector('#nav [data-tab="tune"]').click(); document.getElementById("bkBox").open = true; });
    await pb.setInputFiles("#bkFile", file); await pb.waitForSelector("#bkRestoreBtn", { state: "visible", timeout: 60000 }); await pb.click("#bkRestoreBtn");
    await pb.waitForFunction(() => /Restored/.test(document.getElementById("bkMsg").textContent), null, { timeout: 120000 });
    if (i === 0) { await pb.click("#bkKeep"); await pb.waitForTimeout(1500); } }
  const T = await pb.evaluate(() => new Promise((r) => chrome.storage.local.get(null, r)));
  ok("restoring the same backup twice adds nothing twice", T.media.length === 3 && T.loadouts.length === 3, [T.media.length, T.loadouts.length]);
  await pb.click("#bkKeep"); await pb.waitForTimeout(1500);
  ok("Keep: the undo copy is dropped", !(await pb.evaluate(() => new Promise((r) => chrome.storage.local.get({ restoreUndo: null }, (s) => r(s.restoreUndo))))));
  await ctxB.close();
  // ---------------- A afterwards: untouched ----------------
  const ctxA2 = await launch(A); const pa2 = await ctxA2.newPage(); await pa2.goto(`chrome-extension://${idOf(A)}/popup/popup.html`); await pa2.waitForTimeout(800);
  const A2 = await pa2.evaluate(async () => { const s = await new Promise((r) => chrome.storage.local.get(null, r)); return { s, img: !!(await WickedMediaDB.get("aaaa1111")), vid: !!(await WickedMediaDB.get("bbbb2222")) }; });
  ok("A is untouched by all of it (never deleted until you remove it yourself)", A2.img && A2.vid && A2.s.media.length === 2 && A2.s.invite.code === "PRIISM-ACCT-SECRET" && A2.s.loadouts.length === 2, { img: A2.img, vid: A2.vid, media: A2.s.media && A2.s.media.length, inv: A2.s.invite, looks: A2.s.loadouts && A2.s.loadouts.length });
  await ctxA2.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  const p = Object.values(R).filter(Boolean).length, n = Object.keys(R).length; console.log("SUMMARY:", p + "/" + n); process.exit(p === n ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
