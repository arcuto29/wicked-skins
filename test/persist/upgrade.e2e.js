// Your uploads and settings survive every kind of update, checked on real installs (not only that names show).
//   1. A real older release (v0.1.86 from GitHub Releases), loaded unpacked. Through its own panel: a picture, an
//      animated GIF, a short clip with sound and a large video with sound (~40 MB), plus a saved look, your own candle
//      colours, a saved candle set, a published look and a Workshop download.
//   2. Updated in place to this build (the folder's files replaced, version raised: what Chrome does for a store
//      update and what the update card asks of unpacked copies), and the browser restarted.
//      Checked: every setting as it was; every file byte for byte (SHA-256); pictures decode; videos play in Priism's
//      own wallpaper player and their sound is still there.
//   3. Two panel pages open at once (the popup, and the tab that converts videos), each adding a wallpaper: both kept.
//      (Before: the page with the older list wrote it back and dropped the other's wallpaper.)
//   4. A file still stored but missing from the list (how 3 used to leave it), and a video's original waiting to be
//      converted: both put back in My uploads, and they play.
//   5. Copies with the fixed id (keys/unpacked.json, from 0.1.88 on): updated into a DIFFERENT folder, everything stays.
//      Without the key a new folder is a new, empty copy (shown too, as the reason for the key).
//   node test/persist/upgrade.e2e.js [--old <zip>]
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs"), os = require("os"), crypto = require("crypto"), { execFileSync } = require("child_process");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "test-output", "persist"); fs.mkdirSync(OUT, { recursive: true });
const OLD_URL = "https://github.com/arcuto29/wicked-skins/releases/download/v0.1.86/priism-skins-0.1.86.zip";
const KEYS = JSON.parse(fs.readFileSync(path.join(ROOT, "keys", "unpacked.json"), "utf8"));
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 400) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "priism-persist-"));
// an animated GIF (2 frames, loops)
const GIF = Buffer.from("R0lGODlhAQABAPAAAP8AAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAAAICTAEAOw==", "base64");

// this build, staged like the zip (optionally another version, optionally the fixed key)
function stage(dir, { version, key } = {}) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const i of ["manifest.json", "src", "popup", "player", "icons", "vendor"]) fs.cpSync(path.join(ROOT, i), path.join(dir, i), { recursive: true });
  const mp = path.join(dir, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8"));
  if (version) m.version = version; delete m.key; if (key) m.key = KEYS.stable; fs.writeFileSync(mp, JSON.stringify(m, null, 2));
  return dir;
}
// replace a folder's files in place (what unzipping over it does), keeping the folder itself
function replaceIn(dir, from) { for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { recursive: true, force: true }); fs.cpSync(from, dir, { recursive: true }); }

async function launch(prof, dir) {
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1200, height: 900 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", `--disable-extensions-except=${dir}`, `--load-extension=${dir}`] });
  let sw = ctx.serviceWorkers()[0]; if (!sw) sw = await ctx.waitForEvent("serviceworker", { timeout: 20000 });
  const id = sw.url().split("/")[2];
  await sleep(1500);
  for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  return { ctx, id };
}
const panel = async (ctx, id, q = "?page=media") => { const p = await ctx.newPage(); await p.goto(`chrome-extension://${id}/popup/popup.html${q}`); await sleep(1500); return p; };
const pick = async (p, files) => { await p.setInputFiles("#file", files); await p.waitForFunction(() => !/Checking files/.test((document.getElementById("mediaHint") || {}).textContent || ""), null, { timeout: 120000 }); await sleep(800); };
const store = (p, keys = null) => p.evaluate((k) => new Promise((r) => chrome.storage.local.get(k, r)), keys);
// every stored file: its size and SHA-256, from the extension's own database
const files = (p) => p.evaluate(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open("wicked-media"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const st = db.transaction("files").objectStore("files"), keys = await new Promise((r) => { const q = st.getAllKeys(); q.onsuccess = () => r(q.result); });
  const out = {};
  for (const k of keys) { const b = await new Promise((r) => { const q = db.transaction("files").objectStore("files").get(k); q.onsuccess = () => r(q.result); });
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", await b.arrayBuffer())); out[k] = { size: b.size, type: b.type, sha: [...h.slice(0, 12)].map((x) => x.toString(16).padStart(2, "0")).join("") }; }
  return out;
});
// play one wallpaper in Priism's own player page (what the chart shows), with its sound on: is it moving, any audio?
async function playInPlayer(ctx, id, m) {
  const p = await ctx.newPage();
  await p.goto(`chrome-extension://${id}/player/player.html?id=${encodeURIComponent(m.id)}&type=${m.type}`); await sleep(1200);
  await p.evaluate(() => window.postMessage({ __wicked: "look", look: { fit: "cover", speed: 1, paused: false, audio: true, volume: 0.5, page: "test" } }, "*"));
  await sleep(2500);
  const r = await p.evaluate(() => { const v = document.querySelector("video"), i = document.querySelector("img");
    if (v) return { kind: "video", playing: !v.paused, t: +v.currentTime.toFixed(1), w: v.videoWidth, audioBytes: v.webkitAudioDecodedByteCount || 0, muted: v.muted };
    if (i) return { kind: "image", w: i.naturalWidth, h: i.naturalHeight }; return null; });
  await p.close(); return r;
}

(async () => {
  // ---------- test files ----------
  const OLDZIP = arg("old") || path.join(OUT, "priism-skins-0.1.86.zip");
  if (!fs.existsSync(OLDZIP)) execFileSync("curl", ["-sSfL", "-o", OLDZIP, OLD_URL]);
  const OLD = path.join(TMP, "old"); fs.mkdirSync(OLD); execFileSync("unzip", ["-q", OLDZIP, "-d", OLD]);
  const oldVer = JSON.parse(fs.readFileSync(path.join(OLD, "manifest.json"), "utf8")).version;
  const X = path.join(TMP, "Priism"); fs.cpSync(OLD, X, { recursive: true });   // the user's install folder
  const prof = path.join(TMP, "profile");
  let { ctx, id } = await launch(prof, X);
  let p = await panel(ctx, id);
  // pictures and videos (made in the browser: a clip with a melody, and a large high-bitrate video with sound)
  const made = await p.evaluate(async () => {
    const vid = async (w, h, secs, bps, label) => {
      const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"), stream = c.captureStream(30);
      const ac = new AudioContext(), dst = ac.createMediaStreamDestination(), o = ac.createOscillator(), gn = ac.createGain(); gn.gain.value = 0.3; o.connect(gn).connect(dst);
      [262, 330, 392, 523].forEach((f, i) => o.frequency.setValueAtTime(f, ac.currentTime + i * 0.5)); o.start(); stream.addTrack(dst.stream.getAudioTracks()[0]);
      const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus", videoBitsPerSecond: bps }), parts = []; rec.ondataavailable = (e) => parts.push(e.data); rec.start(500);
      const img = g.createImageData(w, h), t0 = performance.now();
      await new Promise((res) => { const f = () => { const t = (performance.now() - t0) / 1000;
        if (bps > 4e6) { const d = img.data; for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = v; d[i + 1] = (v * 7) & 255; d[i + 2] = 255 - v; d[i + 3] = 255; } g.putImageData(img, 0, 0); }
        else { g.fillStyle = `hsl(${t * 80},70%,35%)`; g.fillRect(0, 0, w, h); }
        g.fillStyle = "#fff"; g.font = "60px sans-serif"; g.fillText(label, 40, 120 + (t * 40) % (h - 160));
        if (t < secs) requestAnimationFrame(f); else { rec.onstop = res; rec.stop(); } }; f(); });
      ac.close(); const b = new Blob(parts, { type: "video/webm" }), u = new Uint8Array(await b.arrayBuffer());
      let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
    const png = async () => { const c = document.createElement("canvas"); c.width = 1600; c.height = 900; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 1600, 900);
      gr.addColorStop(0, "#1b1030"); gr.addColorStop(1, "#00d1ff"); g.fillStyle = gr; g.fillRect(0, 0, 1600, 900);
      const b = await new Promise((r) => c.toBlob(r, "image/png")), u = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
    return { png: await png(), clip: await vid(720, 1280, 3, 2e6, "\u266a clip"), big: await vid(1280, 720, 14, 25e6, "big video") };
  });
  const F = { png: Buffer.from(made.png, "base64"), clip: Buffer.from(made.clip, "base64"), big: Buffer.from(made.big, "base64") };
  console.log(`old version ${oldVer}; files: png ${F.png.length} B, gif ${GIF.length} B, clip ${F.clip.length} B, big video ${(F.big.length / 1048576).toFixed(1)} MB`);
  // (real files on disk, picked like in the file picker)
  const DIR = path.join(TMP, "my-files"); fs.mkdirSync(DIR);
  const onDisk = (name, buf) => { const f = path.join(DIR, name); fs.writeFileSync(f, buf); return f; };
  await pick(p, [onDisk("sunset.png", F.png), onDisk("sparkle.gif", GIF), onDisk("tiktok-clip.webm", F.clip), onDisk("big-4k-loop.webm", F.big)]);
  // your customisation, as the panel stores it
  const before0 = await store(p, "media");
  const ws = before0.media.find((m) => m.name === "sunset.png");
  await p.evaluate((wsId) => new Promise((r) => chrome.storage.local.get("media", (s) => chrome.storage.local.set({
    media: s.media.map((m) => (m.name === "sunset.png" ? { ...m, wsId } : m)),
    candleOn: true, candleUp: "#3fa9f5", candleDown: "#f5a623", candlePreset: "custom", scaleText: "#ffe6a0", dim: 0.42, skin: "media",
    mediaId: s.media.find((m) => m.name === "big-4k-loop.webm").id,
    loadouts: [{ name: "My night look", skin: "media", mediaId: s.media.find((m) => m.name === "tiktok-clip.webm").id, look: { candleUp: "#3fa9f5", candleDown: "#f5a623", dim: 0.5 } }],
    myCandles: [{ name: "Blue / orange", up: "#3fa9f5", down: "#f5a623" }],
  }, r))), "ws-wall-123");
  await p.evaluate(() => localStorage.setItem("myLooks", JSON.stringify([{ t: "Published look", s: "aurora", l: { dim: 0.3 }, at: 1 }])));
  const before = await store(p), fb = await files(p), myLooks0 = await p.evaluate(() => localStorage.getItem("myLooks"));
  ok(`setup (v${oldVer}): 4 uploads added through its own panel, files stored`, before.media.length === 4 && Object.keys(fb).length === 4, before.media.map((m) => m.name));
  await ctx.close();

  // ---------- 2. update in place to this build, then restart ----------
  const NEW = stage(path.join(TMP, "new"), { version: "0.1.87" });
  replaceIn(X, NEW);
  ({ ctx, id } = await launch(prof, X));
  p = await panel(ctx, id); await sleep(1500);
  const after = await store(p), fa = await files(p), myLooks1 = await p.evaluate(() => localStorage.getItem("myLooks"));
  ok("updated in place: this build is running, same extension id (same storage)", after.lastVersion === "0.1.87" || (await p.evaluate(() => chrome.runtime.getManifest().version)) === "0.1.87", { lastVersion: after.lastVersion });
  const SAME = ["candleOn", "candleUp", "candleDown", "candlePreset", "scaleText", "dim", "skin", "mediaId", "loadouts", "myCandles"];
  const changed = SAME.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  ok("every setting as it was: candles, wallpaper, saved look, saved candle set", changed.length === 0, Object.fromEntries(changed.map((k) => [k, [before[k], after[k]]])));
  ok("...and the published looks (kept in the panel's own page storage)", myLooks1 === myLooks0);
  const lost = before.media.filter((m) => !after.media.some((x) => x.id === m.id && x.name === m.name && x.type === m.type));
  ok("every upload still listed, with its id, name and type, and the Workshop link", lost.length === 0 && after.media.find((m) => m.name === "sunset.png").wsId === "ws-wall-123", { lost: lost.map((m) => m.name) });
  const diffs = Object.keys(fb).filter((k) => !fa[k] || fa[k].sha !== fb[k].sha || fa[k].size !== fb[k].size);
  ok("every file byte for byte the same (SHA-256), the large video too", diffs.length === 0 && Object.keys(fa).length === 4, { diffs, sizes: Object.fromEntries(Object.entries(fa).map(([k, v]) => [k, v.size])) });
  const plays = {};
  for (const m of after.media) plays[m.name] = await playInPlayer(ctx, id, m);
  ok("pictures (PNG, animated GIF) show in Priism's wallpaper player", plays["sunset.png"] && plays["sunset.png"].w === 1600 && plays["sparkle.gif"] && plays["sparkle.gif"].w === 1, { png: plays["sunset.png"], gif: plays["sparkle.gif"] });
  ok("videos play in the wallpaper player, with their sound (audio decoded)", ["tiktok-clip.webm", "big-4k-loop.webm"].every((n) => plays[n] && plays[n].kind === "video" && plays[n].playing && plays[n].t > 0.2 && plays[n].audioBytes > 0),
    { clip: plays["tiktok-clip.webm"], big: plays["big-4k-loop.webm"] });
  await ctx.close();
  // a computer / browser restart: the same again
  ({ ctx, id } = await launch(prof, X));
  p = await panel(ctx, id);
  { const s = await store(p, "media"), f2 = await files(p);
    ok("after restarting the browser: the same uploads and files", s.media.length === 4 && Object.keys(f2).every((k) => fb[k] && f2[k].sha === fb[k].sha) && Object.keys(f2).length === 4); }

  // ---------- 3. two panel pages at once ----------
  const popup = await panel(ctx, id, "");          // the popup, opened first: its list is the 4 uploads
  const tab = await panel(ctx, id);               // the uploads tab
  await pick(tab, [{ name: "from-the-tab.png", mimeType: "image/png", buffer: Buffer.concat([F.png, Buffer.from([0])]) }]);
  await popup.setInputFiles("#file", [{ name: "from-the-popup.gif", mimeType: "image/gif", buffer: Buffer.concat([GIF, Buffer.from([0])]) }]); await sleep(2500);
  { const s = await store(p, "media"), names = s.media.map((m) => m.name);
    ok("two panel pages each adding a wallpaper: both kept (and the 4 from before)", names.includes("from-the-tab.png") && names.includes("from-the-popup.gif") && s.media.length === 6, names); }
  await popup.close(); await tab.close();

  // ---------- 4. files stored but missing from the list: put back ----------
  await p.evaluate(async ({ clip, png }) => {
    const b = (s, t) => new Blob([Uint8Array.from(atob(s), (c) => c.charCodeAt(0))], { type: t });
    await window.WickedMediaDB.put("lostvid1", b(clip, "video/webm"));
    await window.WickedMediaDB.put("lostpic1", b(png, ""));                         // (type unknown: worked out)
    await window.WickedMediaDB.put("lostsrc1:src", b(clip, "video/webm"));           // an original waiting to be converted
  }, { clip: made.clip, png: made.png });
  const p2 = await ctx.newPage();
  await p2.addInitScript(() => { window.__hints = []; new MutationObserver((ms) => { for (const m of ms) if (m.target && m.target.id === "mediaHint") for (const n of m.addedNodes) window.__hints.push(n.textContent); }).observe(document, { subtree: true, childList: true, characterData: true }); });
  await p2.goto(`chrome-extension://${id}/popup/popup.html?page=media`); await sleep(4000);
  const hintSeen = await p2.evaluate(() => window.__hints || []);
  ok("...the panel says it found them", hintSeen.some((h) => /Found 3 wallpapers/.test(h)), hintSeen.slice(-3));
  { await p2.waitForFunction(() => !/Converting/.test(document.getElementById("mediaHint").textContent), null, { timeout: 120000 }).catch(() => {});
    const s = await store(p2, ["media", "mediaId"]), rec = s.media.filter((m) => m.recovered);
    const brief = rec.map((m) => ({ id: m.id, type: m.type, pending: !!m.pending, converted: !!m.converted }));
    // (the uploads tab converts the recovered original straight away)
    ok("files nothing listed any more: back in My uploads (a video, a picture of unknown type, a video's original), your wallpaper unchanged",
      rec.length === 3 && s.mediaId !== "lostsrc1" && rec.some((m) => m.id === "lostvid1" && m.type === "video") && rec.some((m) => m.id === "lostpic1" && m.type === "image") && rec.some((m) => m.id === "lostsrc1"), brief);
    const pv = await playInPlayer(ctx, id, rec.find((m) => m.id === "lostvid1")), pp = await playInPlayer(ctx, id, rec.find((m) => m.id === "lostpic1"));
    ok("...and they play", pv && pv.playing && pv.audioBytes > 0 && pp && pp.w === 1600, { pv, pp });
    const again = await panel(ctx, id); await sleep(2000); const s2 = await store(again, "media");
    ok("...only once (opening the panel again adds nothing)", s2.media.length === s.media.length, s2.media.length); await again.close(); }
  { const now = await files(p2); ok("nothing was ever deleted: every file from before is still stored, unchanged", Object.keys(fb).every((k) => now[k] && now[k].sha === fb[k].sha)); }
  await ctx.close();

  // ---------- 5. fixed id: update into ANOTHER folder ----------
  const prof2 = path.join(TMP, "profile-keyed");
  const Y = stage(path.join(TMP, "priism-skins-0.1.88"), { version: "0.1.88", key: true });
  ({ ctx, id } = await launch(prof2, Y));
  ok("an unpacked copy with the fixed key has the fixed id", id === KEYS.stableId, id);
  p = await panel(ctx, id);
  await pick(p, [{ name: "keyed.png", mimeType: "image/png", buffer: F.png }, { name: "keyed-video.webm", mimeType: "video/webm", buffer: F.clip }]);
  await p.evaluate(() => new Promise((r) => chrome.storage.local.set({ candleUp: "#123456", loadouts: [{ name: "Keyed look", skin: "aurora", look: {} }] }, r)));
  const kb = await files(p); await ctx.close();
  const Z = stage(path.join(TMP, "Downloads", "priism-skins-0.1.89"), { version: "0.1.89", key: true });   // unzipped somewhere else
  ({ ctx, id } = await launch(prof2, Z));
  p = await panel(ctx, id);
  { const s = await store(p), kf = await files(p);
    ok("updated into a different folder: same id, uploads, files and settings all there", id === KEYS.stableId && s.media.length === 2 && s.candleUp === "#123456" && s.loadouts[0].name === "Keyed look"
      && Object.keys(kb).every((k) => kf[k] && kf[k].sha === kb[k].sha), { id, n: s.media.length });
    const v = await playInPlayer(ctx, id, s.media.find((m) => m.name === "keyed-video.webm"));
    ok("...and the video plays with its sound", v && v.playing && v.audioBytes > 0, v); }
  await ctx.close();
  // (why: without the key, that same update into another folder starts empty)
  const prof3 = path.join(TMP, "profile-nokey"), A = stage(path.join(TMP, "a", "Priism"), { version: "0.1.87" });
  ({ ctx, id } = await launch(prof3, A)); p = await panel(ctx, id); await pick(p, [{ name: "a.png", mimeType: "image/png", buffer: F.png }]); const idA = id; await ctx.close();
  const B = stage(path.join(TMP, "b", "Priism"), { version: "0.1.88" });
  ({ ctx, id } = await launch(prof3, B)); p = await panel(ctx, id);
  { const s = await store(p, "media"), h = await p.$eval("#mediaHint", (e) => e.textContent);
    ok("(without the key, another folder is another copy: a new id, empty, and it says where your uploads may be)", id !== idA && (s.media || []).length === 0 && /come over by themselves/.test(h), { idA, idB: id, h }); }
  await ctx.close();

  const n = Object.values(R).filter(Boolean).length;
  console.log(`\nUPLOADS SURVIVE UPDATES: ${n}/${Object.keys(R).length}`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exitCode = n === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} process.exit(1); });
