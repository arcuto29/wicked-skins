// Moving to a new Priism copy by itself, no backup (src/handover.js), on real installs in one Chrome profile.
//   A  your current copy: unpacked, no fixed id (its id comes from its folder), version 0.1.87. Through its panel: a
//      picture, an animated GIF, a clip with music and a large video with sound (~58 MB), a saved look, your candle
//      colours, a saved candle set, and a licence code that isn't real.
//   B  the next version (0.1.88), unzipped into another folder, with Priism's fixed id.
// Checked: B takes everything from A without anyone doing anything; every file byte for byte (SHA-256); the videos
// play in B's wallpaper player with their sound; B opens on your wallpaper and candles; A is untouched; the made-up
// licence does NOT come alive in B (the server is asked); a move cut off halfway finishes on the next start; a copy
// that already has things of its own never takes anything; nothing moves twice.
//   node test/persist/handover.e2e.js
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs"), os = require("os");
const ROOT = path.join(__dirname, "..", "..");
const KEYS = JSON.parse(fs.readFileSync(path.join(ROOT, "keys", "unpacked.json"), "utf8"));
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 400) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "priism-handover-"));
const GIF = Buffer.from("R0lGODlhAQABAPAAAP8AAP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAAAICTAEAOw==", "base64");
function stage(dir, { version, key } = {}) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const i of ["manifest.json", "src", "popup", "player", "icons", "vendor"]) fs.cpSync(path.join(ROOT, i), path.join(dir, i), { recursive: true });
  const mp = path.join(dir, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8"));
  if (version) m.version = version; delete m.key; if (key) m.key = KEYS.stable; fs.writeFileSync(mp, JSON.stringify(m, null, 2));
  return dir;
}
async function launch(prof, dirs) {
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1200, height: 900 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", "--autoplay-policy=no-user-gesture-required", `--disable-extensions-except=${dirs.join(",")}`, `--load-extension=${dirs.join(",")}`] });
  for (let i = 0; i < 40 && ctx.serviceWorkers().length < dirs.length; i++) await sleep(250);
  const ids = ctx.serviceWorkers().map((w) => w.url().split("/")[2]);
  await sleep(1000); for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  return { ctx, ids };
}
const panel = async (ctx, id, q = "?page=media") => { const p = await ctx.newPage(); await p.goto(`chrome-extension://${id}/popup/popup.html${q}`); await sleep(1200); return p; };
const pick = async (p, files) => { await p.setInputFiles("#file", files); await p.waitForFunction(() => !/Checking files/.test((document.getElementById("mediaHint") || {}).textContent || ""), null, { timeout: 120000 }); await sleep(800); };
const store = (p, k = null) => p.evaluate((k) => new Promise((r) => chrome.storage.local.get(k, r)), k);
const files = (p) => p.evaluate(async () => {
  const keys = await window.WickedMediaDB.keys(), out = {};
  for (const k of keys) { const b = await window.WickedMediaDB.get(k), h = new Uint8Array(await crypto.subtle.digest("SHA-256", await b.arrayBuffer())); out[k] = { size: b.size, sha: [...h.slice(0, 12)].map((x) => x.toString(16).padStart(2, "0")).join("") }; }
  return out; });
async function playInPlayer(ctx, id, m) {
  const p = await ctx.newPage(); await p.goto(`chrome-extension://${id}/player/player.html?id=${encodeURIComponent(m.id)}&type=${m.type}`); await sleep(1200);
  await p.evaluate(() => window.postMessage({ __wicked: "look", look: { fit: "cover", speed: 1, paused: false, audio: true, volume: 0.5, page: "test" } }, "*")); await sleep(2500);
  const r = await p.evaluate(() => { const v = document.querySelector("video"), i = document.querySelector("img");
    return v ? { kind: "video", playing: !v.paused, t: +v.currentTime.toFixed(1), audioBytes: v.webkitAudioDecodedByteCount || 0 } : i ? { kind: "image", w: i.naturalWidth } : null; });
  await p.close(); return r;
}
const waitDone = async (ctx, id, ms = 240000) => { const p = await panel(ctx, id, ""); const t0 = Date.now(); let h = null;
  while (Date.now() - t0 < ms) { h = (await store(p, "handover")).handover; if (h && (h.done || h.error)) break; await sleep(1500); } await p.close(); return h; };

(async () => {
  const A = stage(path.join(TMP, "Priism"), { version: "0.1.87" });
  const B = stage(path.join(TMP, "Downloads", "priism-skins-0.1.88"), { version: "0.1.88", key: true });
  const prof = path.join(TMP, "profile");
  // ---------- your copy A, with your things ----------
  let { ctx, ids } = await launch(prof, [A]); const idA = ids[0];
  let p = await panel(ctx, idA);
  const made = await p.evaluate(async () => {
    const vid = async (w, h, secs, bps) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"), st = c.captureStream(30);
      const ac = new AudioContext(), dst = ac.createMediaStreamDestination(), o = ac.createOscillator(), gn = ac.createGain(); gn.gain.value = 0.3; o.connect(gn).connect(dst); o.start(); st.addTrack(dst.stream.getAudioTracks()[0]);
      const rec = new MediaRecorder(st, { mimeType: "video/webm;codecs=vp8,opus", videoBitsPerSecond: bps }), parts = []; rec.ondataavailable = (e) => parts.push(e.data); rec.start(500);
      const img = g.createImageData(w, h), t0 = performance.now();
      await new Promise((res) => { const f = () => { const t = (performance.now() - t0) / 1000;
        if (bps > 4e6) { const d = img.data; for (let i = 0; i < d.length; i += 4) { const v = (Math.random() * 255) | 0; d[i] = v; d[i + 1] = (v * 7) & 255; d[i + 2] = 255 - v; d[i + 3] = 255; } g.putImageData(img, 0, 0); }
        else { g.fillStyle = `hsl(${t * 80},70%,35%)`; g.fillRect(0, 0, w, h); }
        if (t < secs) requestAnimationFrame(f); else { rec.onstop = res; rec.stop(); } }; f(); });
      ac.close(); const u = new Uint8Array(await new Blob(parts).arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
    const c = document.createElement("canvas"); c.width = 1600; c.height = 900; const g = c.getContext("2d"); g.fillStyle = "#1b1030"; g.fillRect(0, 0, 1600, 900); g.fillStyle = "#00d1ff"; g.fillRect(400, 200, 800, 500);
    const pb = new Uint8Array(await (await new Promise((r) => c.toBlob(r, "image/png"))).arrayBuffer()); let ps = ""; for (let i = 0; i < pb.length; i += 0x8000) ps += String.fromCharCode(...pb.subarray(i, i + 0x8000));
    return { png: btoa(ps), clip: await vid(720, 1280, 3, 2e6), big: await vid(1280, 720, 14, 25e6) };
  });
  const DIR = path.join(TMP, "my-files"); fs.mkdirSync(DIR);
  const onDisk = (n, b) => { const f = path.join(DIR, n); fs.writeFileSync(f, b); return f; };
  const big = Buffer.from(made.big, "base64");
  await pick(p, [onDisk("sunset.png", Buffer.from(made.png, "base64")), onDisk("sparkle.gif", GIF), onDisk("tiktok-clip.webm", Buffer.from(made.clip, "base64")), onDisk("big-loop.webm", big)]);
  await p.evaluate(() => new Promise((r) => chrome.storage.local.get("media", (s) => chrome.storage.local.set({
    candleOn: true, candleUp: "#3fa9f5", candleDown: "#f5a623", candlePreset: "custom", dim: 0.42, skin: "media", mediaId: s.media.find((m) => m.name === "big-loop.webm").id,
    loadouts: [{ name: "My night look", skin: "aurora", look: { dim: 0.5 } }], myCandles: [{ name: "Blue / orange", up: "#3fa9f5", down: "#f5a623" }],
    invite: { code: "PRIISM-MADE-UP0", ok: true, status: "ok", checked: 4e12, since: 1 }, deviceId: "dev-abcdef123456",
  }, r))));
  const sA = await store(p), fA = await files(p);
  ok(`setup: your copy (id from its folder), 4 uploads (big video ${(big.length / 1048576).toFixed(0)} MB), a look, candles`, sA.media.length === 4 && Object.keys(fA).length === 4 && idA !== KEYS.stableId);
  await ctx.close();

  // ---------- the new version B installed next to it: nothing else done ----------
  ({ ctx, ids } = await launch(prof, [A, B]));
  ok("both copies running, B with Priism's fixed id", ids.includes(idA) && ids.includes(KEYS.stableId), ids);
  const h = await waitDone(ctx, KEYS.stableId);
  ok("B took everything from A by itself (no backup, nothing clicked)", h && h.done && h.wallpapers === 4 && h.files === 4 && h.looks === 1, h);
  p = await panel(ctx, KEYS.stableId);
  const sB = await store(p), fB = await files(p);
  const SAME = ["candleOn", "candleUp", "candleDown", "candlePreset", "dim", "skin", "mediaId", "loadouts", "myCandles"];
  const diff = SAME.filter((k) => JSON.stringify(sA[k]) !== JSON.stringify(sB[k]));
  ok("B has your settings: wallpaper, candles, saved look, candle set (it opens on the same wallpaper)", diff.length === 0, Object.fromEntries(diff.map((k) => [k, [sA[k], sB[k]]])));
  ok("B lists every upload, same ids and names", sA.media.every((m) => sB.media.some((x) => x.id === m.id && x.name === m.name && x.type === m.type)) && sB.media.length === 4);
  const bad = Object.keys(fA).filter((k) => !fB[k] || fB[k].sha !== fA[k].sha);
  ok("every file in B byte for byte the same (SHA-256), the big video too; no leftovers from the move", bad.length === 0 && Object.keys(fB).length === 4, { bad, keys: Object.keys(fB) });
  const plays = {}; for (const m of sB.media) plays[m.name] = await playInPlayer(ctx, KEYS.stableId, m);
  ok("in B: the pictures show, the videos play with their sound", plays["sunset.png"].w === 1600 && plays["sparkle.gif"].w === 1 && ["tiktok-clip.webm", "big-loop.webm"].every((n) => plays[n].playing && plays[n].audioBytes > 0), plays);
  ok("the made-up licence did NOT come alive in B (the server was asked)", !(sB.invite && sB.invite.ok), { invite: sB.invite, licence: h && h.licence });
  ok("...and no licence secrets or device bookkeeping were copied except the device id", !sB.pass && sB.deviceId === "dev-abcdef123456");
  const toastB = await p.evaluate(() => [...document.querySelectorAll(".toast, #toast")].map((t) => t.textContent).join(" | "));
  ok("B's panel says everything came over and the other copy can go", /came over from your other Priism copy/.test(toastB), toastB.slice(0, 200));
  const pa = await panel(ctx, idA), sA2 = await store(pa), fA2 = await files(pa);
  ok("A untouched: its list, files and settings as they were (it knows its things are in B too)", sA2.media.length === 4 && Object.keys(fA).every((k) => fA2[k] && fA2[k].sha === fA[k].sha) && sA2.candleUp === "#3fa9f5" && sA2.handoverTo && sA2.handoverTo[KEYS.stableId]);
  // you change something in B, restart: nothing moves again
  await p.evaluate(() => new Promise((r) => chrome.storage.local.set({ candleUp: "#00ff88" }, r)));
  await ctx.close();
  ({ ctx, ids } = await launch(prof, [A, B])); await sleep(6000);
  p = await panel(ctx, KEYS.stableId);
  ok("restarted with both: nothing moves twice, your change in B stays", (await store(p, "candleUp")).candleUp === "#00ff88" && (await store(p, "media")).media.length === 4);
  await ctx.close();

  // ---------- a copy that already has things of its own never takes anything ----------
  const prof2 = path.join(TMP, "profile2");
  ({ ctx, ids } = await launch(prof2, [B]));
  p = await panel(ctx, KEYS.stableId); await pick(p, [onDisk("mine-in-b.png", Buffer.from(made.png, "base64").subarray(0, Buffer.from(made.png, "base64").length - 1))]);
  await ctx.close();
  ({ ctx, ids } = await launch(prof2, [A, B])); await sleep(15000);
  p = await panel(ctx, KEYS.stableId);
  { const s = await store(p, ["media", "handover"]); ok("a copy with uploads of its own takes nothing", s.media.length === 1 && !(s.handover && s.handover.done), { n: s.media.length, h: s.handover }); }
  await ctx.close();

  // ---------- a move cut off halfway finishes on the next start ----------
  const prof3 = path.join(TMP, "profile3");
  ({ ctx, ids } = await launch(prof3, [A]));
  p = await panel(ctx, ids[0]); await pick(p, [onDisk("big-again.webm", big), onDisk("clip-again.webm", Buffer.from(made.clip, "base64"))]); const idA3 = ids[0];
  const f3 = await files(p); await ctx.close();
  ({ ctx, ids } = await launch(prof3, [A, B]));
  { const pp = await panel(ctx, KEYS.stableId, ""); for (let i = 0; i < 60; i++) { const hv = (await store(pp, "handover")).handover; if (hv && hv.started && !hv.done) break; await sleep(100); } }
  await ctx.close();   // (closed while the files were coming over)
  ({ ctx, ids } = await launch(prof3, [A, B]));
  const h3 = await waitDone(ctx, KEYS.stableId);
  p = await panel(ctx, KEYS.stableId);
  { const s = await store(p, "media"), f = await files(p);
    ok("a move cut off halfway (browser closed) finishes on the next start, files intact", h3 && h3.done && s.media.length === 2 && Object.keys(f3).every((k) => f[k] && f[k].sha === f3[k].sha) && !Object.keys(f).some((k) => k.startsWith("hv:")), { h3, keys: Object.keys(f) }); }
  await ctx.close();

  const n = Object.values(R).filter(Boolean).length;
  console.log(`\nMOVES BY ITSELF: ${n}/${Object.keys(R).length}`);
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exitCode = n === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {} process.exit(1); });
