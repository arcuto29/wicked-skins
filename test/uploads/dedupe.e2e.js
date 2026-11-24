// Uploads are stored once: the same file picked again (even renamed), dropped twice in one go, or uploaded before this
// check existed is not added a second time; the copy you already have goes on the chart instead.
// Drives the real panel (popup/popup.html?page=media) with the extension loaded, through its file picker.
//   node test/uploads/dedupe.e2e.js [--ext <dir>]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const EXTDIR = path.join(os.tmpdir(), `priism-dedupe-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(os.tmpdir(), `priism-dedupe-prof-${process.pid}`); fs.rmSync(prof, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1200, height: 900 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
  await sleep(2500);
  for (const p0 of ctx.pages()) if (/tradingview\.com/.test(p0.url())) await p0.close().catch(() => {});
  const pop = await ctx.newPage();
  const url = `chrome-extension://${id}/popup/popup.html?page=media`;
  await pop.goto(url); await sleep(1000);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  const get = () => pop.evaluate(() => new Promise((r) => chrome.storage.local.get(["media", "mediaId", "skin"], r)));
  // test pictures (PNG): A, B, C differ; one large-ish file (> 3 MB) to cover the start / middle / end check
  const pics = await pop.evaluate(async () => {
    const png = async (hue, w, h, noise) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
      g.fillStyle = `hsl(${hue},70%,40%)`; g.fillRect(0, 0, w, h);
      if (noise) { const d = g.getImageData(0, 0, w, h); for (let i = 0; i < d.data.length; i++) d.data[i] = (Math.random() * 256) | 0; g.putImageData(d, 0, 0); }
      const b = await new Promise((r) => c.toBlob(r, "image/png")); const u = new Uint8Array(await b.arrayBuffer()); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
    return { A: await png(10, 640, 360), B: await png(140, 640, 360), C: await png(260, 640, 360), BIG: await png(0, 1400, 900, true) };
  });
  const file = (name, k) => ({ name, mimeType: "image/png", buffer: Buffer.from(pics[k], "base64") });
  // an upload from before this check: stored without a fingerprint
  await pop.evaluate(async (b64) => { const u = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); await window.WickedMediaDB.put("oldA", new Blob([u], { type: "image/png" })); }, pics.A);
  await set({ enabled: true, welcomePending: 0, media: [{ id: "oldA", name: "old-a.png", type: "image", file: true, size: Buffer.from(pics.A, "base64").length }], skin: "aurora" });
  await pop.reload(); await sleep(1200);
  const pick = async (files) => { await pop.setInputFiles("#file", files); await pop.waitForFunction(() => !/Checking files/.test(document.getElementById("mediaHint").textContent), null, { timeout: 30000 }); await sleep(600); };
  const hintText = () => pop.$eval("#mediaHint", (e) => e.textContent);
  const dbKeys = () => pop.evaluate(() => new Promise((res) => { const r = indexedDB.open("wicked-media"); r.onsuccess = () => { const db = r.result, names = [...db.objectStoreNames]; const t = db.transaction(names[0]).objectStore(names[0]).getAllKeys(); t.onsuccess = () => res(t.result); t.onerror = () => res(null); }; r.onerror = () => res(null); }));

  // 1. the same picture as the old upload, renamed
  await pick([file("renamed-a.png", "A")]);
  let s = await get(), h = await hintText();
  ok("a file you'd uploaded before (renamed): not added again", s.media.length === 1, { n: s.media.length, h });
  ok("...the copy you have goes on the chart", s.skin === "media" && s.mediaId === "oldA", { skin: s.skin, mediaId: s.mediaId });
  ok("...and the panel says so", /Already in your uploads/.test(h) && /renamed-a\.png/.test(h), h);
  ok("...the old upload got its fingerprint", !!s.media[0].fp, s.media[0]);
  // 2. a new picture: added
  await pick([file("b.png", "B")]);
  s = await get();
  ok("a new picture: added", s.media.length === 2 && !!s.media[1].fp, s.media.map((m) => m.name));
  // 3. one batch: B again, C twice, BIG -> only C and BIG added, once each
  await pick([file("b-copy.png", "B"), file("c.png", "C"), file("c (1).png", "C"), file("big.png", "BIG")]);
  s = await get(); h = await hintText();
  ok("one batch with repeats: each new file added once (C, big)", s.media.length === 4 && s.media.filter((m) => m.name === "c.png").length === 1 && s.media.some((m) => m.name === "big.png") && !s.media.some((m) => m.name === "c (1).png" || m.name === "b-copy.png"), s.media.map((m) => m.name));
  ok("...the panel lists what was skipped", /b-copy\.png/.test(h) && /c \(1\)\.png/.test(h) && /Added 2 files/.test(h), h);
  // 4. a large file again
  await pick([file("big-again.png", "BIG")]);
  s = await get();
  ok("a large file (start / middle / end check) picked again: not added", s.media.length === 4, s.media.map((m) => m.name));
  // 5. different pictures of the same size are not mistaken for each other (A, B, C have the same size class)
  ok("different files are never merged: 4 distinct fingerprints", new Set(s.media.map((m) => m.fp)).size === 4, s.media.map((m) => m.fp));
  const keys = await dbKeys();
  ok("the browser's storage holds one copy of each (no orphan files)", Array.isArray(keys) && keys.length === 4, keys);
  // 6. delete one, add it again: allowed (it's no longer there)
  // (with the panel's own Remove button, which asks first and deletes the file too)
  await pop.reload(); await sleep(1000);
  pop.once("dialog", (d) => d.accept());
  await pop.evaluate(() => { const c = [...document.querySelectorAll("#mediaCards .card")].find((x) => /b\.png/.test(x.textContent)); c.querySelector(".x").click(); }); await sleep(800);
  await pick([file("b.png", "B")]);
  s = await get();
  ok("a file you deleted can be added again", s.media.length === 4 && s.media.some((m) => m.name === "b.png"), s.media.map((m) => m.name));
  const p = Object.values(R).filter(Boolean).length;
  console.log(`\nNO DUPLICATE UPLOADS: ${p}/${Object.keys(R).length}`);
  await ctx.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXTDIR, { recursive: true, force: true });
  process.exitCode = p === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
