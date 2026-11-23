// Video wallpaper sound, end to end, with desktop Chrome's autoplay rule (sound only after a click / key on the page).
// A local page with two Lightweight Charts (a 2-chart layout) and the extension. Generated test videos:
//   music    portrait 1080x1920 "TikTok-style" clip, 4 s, with a music track (a melody), WebM VP8 + Opus
//   silent   the same picture with no audio track at all
// Checks: off by default (silent), the one-click "Turn sound on" on a page not clicked yet, volume, one sound in a
// 2-chart layout, one sound across two tabs (a new tab takes it once you click it, closing it gives it back), Pause /
// trade focus / background tab stop it, looping keeps it, switching wallpaper or turning Priism off stops it, a video
// without sound, the settings kept after a reload, a video played right in the page, and the converter keeping the sound.
// Pages are read through DevTools without a user gesture, so Chrome's click rule is really in force.
//   node test/audio/audio.e2e.js [--ext <dir>]
const { chromium } = require("playwright");
const path = require("path"), crypto = require("crypto"), fs = require("fs"), http = require("http"), os = require("os");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const EXT = path.resolve(arg("ext", path.join(__dirname, "..", "..")));
const OUT = path.join(__dirname, "..", "..", "test-output", "audio"); fs.mkdirSync(OUT, { recursive: true });
const PORT = 8126, SITE = `http://127.0.0.1:${PORT}`;
const R = {}; const ok = (k, v, d) => { R[k] = { pass: !!v, detail: d === undefined ? null : d }; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGE = `<!doctype html><html><head><style>html,body{margin:0;height:100%;background:#0b0e14}#w{position:fixed;inset:0;display:grid;grid-template-columns:1fr 1fr;gap:4px}#w>div{position:relative}</style></head>
<body><div id="w"><div id="a"></div><div id="b"></div></div><script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script><script>
for (const id of ["a", "b"]) { const ch = LightweightCharts.createChart(document.getElementById(id), { autoSize: true, layout: { background: { type: "solid", color: "#0b0e14" }, textColor: "#d1d4dc" } });
  const s = ch.addCandlestickSeries(); const d = []; let p = 100, t = Math.floor(Date.now() / 1000) - 120 * 86400;
  for (let i = 0; i < 120; i++) { const c = p + Math.sin(i / 4) * 2; d.push({ time: t + i * 86400, open: p, high: Math.max(p, c) + 1, low: Math.min(p, c) - 1, close: c }); p = c; } s.setData(d); }
window.__ready = true;</script></body></html>`;
(async () => {
  const srv = http.createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(PAGE); }).listen(PORT, "127.0.0.1");
  const EXTDIR = path.join(os.tmpdir(), `priism-audio-ext-${process.pid}`); fs.rmSync(EXTDIR, { recursive: true, force: true });
  fs.cpSync(EXT, EXTDIR, { recursive: true, filter: (f) => !/[\\/](\.git|node_modules|test-output|dist|android|desktop|site|store|supabase|test)([\\/]|$)/.test(f.slice(EXT.length)) });
  { const mp = path.join(EXTDIR, "manifest.json"), m = JSON.parse(fs.readFileSync(mp, "utf8")); m.content_scripts.forEach((c) => c.matches.push(SITE + "/*")); m.host_permissions.push(SITE + "/*"); fs.writeFileSync(mp, JSON.stringify(m)); }
  const id = [...crypto.createHash("sha256").update(EXTDIR).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const prof = path.join(os.tmpdir(), `priism-audio-prof-${process.pid}`); fs.rmSync(prof, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(prof, { headless: false, viewport: { width: 1400, height: 800 },
    // desktop Chrome's own rule (sound only after you've clicked / typed on the page); headless Chrome allows more by default
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", "--autoplay-policy=document-user-activation-required", `--disable-extensions-except=${EXTDIR}`, `--load-extension=${EXTDIR}`] });
  await sleep(2500);
  // (a first install opens a TradingView chart of its own: closed, so only the test's charts play)
  for (const p0 of ctx.pages()) if (/tradingview\.com/.test(p0.url())) await p0.close().catch(() => {});
  const pop = await ctx.newPage(); await pop.goto(`chrome-extension://${id}/popup/popup.html?page=media`); await sleep(1000);
  const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  // the test videos, made in the panel page and stored the way uploads are
  const made = await pop.evaluate(async () => {
    const make = async (withSound) => {
      const c = document.createElement("canvas"); c.width = 1080; c.height = 1920; const g = c.getContext("2d");
      const stream = c.captureStream(30);
      let ac = null;
      if (withSound) { ac = new AudioContext(); const dst = ac.createMediaStreamDestination(), o = ac.createOscillator(), gn = ac.createGain(); o.type = "triangle"; gn.gain.value = 0.3;
        o.connect(gn).connect(dst); const notes = [262, 330, 392, 523, 392, 330]; notes.forEach((f, i) => o.frequency.setValueAtTime(f, ac.currentTime + i * 0.6)); o.start();
        stream.addTrack(dst.stream.getAudioTracks()[0]); }
      const rec = new MediaRecorder(stream, { mimeType: withSound ? "video/webm;codecs=vp8,opus" : "video/webm;codecs=vp8" }), parts = [];
      rec.ondataavailable = (e) => parts.push(e.data); rec.start(250); const t0 = performance.now();
      await new Promise((res) => { const f = () => { const t = (performance.now() - t0) / 1000; g.fillStyle = `hsl(${t * 90},70%,30%)`; g.fillRect(0, 0, 1080, 1920);
        g.fillStyle = "#fff"; g.font = "120px sans-serif"; g.fillText(withSound ? "\u266a music" : "no sound", 200, 960 + Math.sin(t * 3) * 200);
        if (t < 4) requestAnimationFrame(f); else { rec.onstop = res; rec.stop(); } }; f(); });
      if (ac) ac.close();
      return new Blob(parts, { type: "video/webm" });
    };
    const music = await make(true), silent = await make(false);
    await window.WickedMediaDB.put("vmusic", music); await window.WickedMediaDB.put("vsilent", silent);
    window.__musicBlob = music;
    return { music: music.size, silent: silent.size };
  });
  await set({ enabled: true, welcomePending: 0, invite: { code: "PRIISM-AUDIO-TEST", ok: true, status: "ok", checked: 4e12, since: 1 }, autoQuality: true,
    media: [{ id: "vmusic", name: "reel.webm", type: "video", file: true, w: 1080, h: 1920 }, { id: "vsilent", name: "silent.webm", type: "video", file: true, w: 1080, h: 1920 }], skin: "media", mediaId: "vmusic" });
  const page = ctx.pages().find((p) => p !== pop) || await ctx.newPage();
  // Everything read from the chart pages goes through DevTools *without* a user gesture: Playwright's own evaluate()
  // counts as a click for Chrome's sound rule, which would hide exactly what this test checks.
  const ev = async (target, expression) => { const s = await ctx.newCDPSession(target);
    try { const r = await s.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: false }); return r.result.value; } finally { await s.detach().catch(() => {}); } };
  const open = async (p) => { await p.bringToFront(); await p.goto(SITE + "/", { waitUntil: "load" });
    for (let i = 0; i < 100 && !(await ev(p, "window.__ready === true").catch(() => false)); i++) await sleep(100); await sleep(4000); };
  const clickPage = (p) => p.mouse.click(700, 400);   // a real click on the chart
  const cardOn = (p) => ev(p, `!!document.getElementById("bd-soundask")`);
  // every wallpaper player on a page: is it playing, with sound, at what volume, audio decoded so far
  const PX = `(() => { const v = document.querySelector("video"); return v ? { playing: !v.paused, muted: v.muted, volume: Math.round(v.volume * 100) / 100, t: Math.round(v.currentTime * 10) / 10, dur: Math.round(v.duration * 10) / 10, audioBytes: v.webkitAudioDecodedByteCount || 0 } : null; })()`;
  const players = (p) => Promise.all(p.frames().filter((f) => /player\/player\.html/.test(f.url())).map((f) => ev(f, PX).catch(() => null))).then((a) => a.filter(Boolean));
  const loud = (a) => a.filter((x) => x.playing && !x.muted);
  await open(page);
  let pl = await players(page);
  ok("setup: a 2-chart layout, one video player per chart", pl.length === 2, { players: pl.length, videos: made });
  ok("Sound is off by default: both videos play silently", pl.length === 2 && pl.every((x) => x.playing && x.muted), pl);
  // turn Sound on (from the panel) on a chart page you haven't clicked yet: Chrome allows no sound there yet
  await set({ wallAudio: true }); await sleep(1500);
  pl = await players(page);
  ok("Sound On, chart page not clicked yet: the video keeps playing silently and a 'Turn sound on' card is offered", loud(pl).length === 0 && pl.every((x) => x.playing) && await cardOn(page), pl);
  await page.screenshot({ path: path.join(OUT, "sound-card.png") });
  // the card's button (a real click: that's what Chrome needs)
  const btn = await page.$("#bd-soundask .bd-ui-btn.pri"); const bb = btn && await btn.boundingBox();
  if (bb) await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(1200);
  pl = await players(page);
  ok("'Turn sound on': the sound plays, card gone", loud(pl).length === 1 && !(await cardOn(page)), pl);
  ok("...from ONE chart only (2-chart layout, the same video): no doubled sound", loud(pl).length === 1 && pl.filter((x) => x.playing).length === 2, pl);
  const b0 = loud(pl)[0] ? loud(pl)[0].audioBytes : 0; await sleep(1500); pl = await players(page);
  ok("...its own audio track really plays (audio is being decoded)", loud(pl).length === 1 && loud(pl)[0].audioBytes > b0, { before: b0, after: loud(pl)[0] && loud(pl)[0].audioBytes });
  ok("...at the default volume, 60%", loud(pl)[0] && loud(pl)[0].volume === 0.6, pl);
  await set({ wallVolume: 0.25 }); await sleep(700); pl = await players(page);
  ok("Volume 25%: the video's own volume follows (the computer's volume is untouched)", loud(pl).length === 1 && loud(pl)[0].volume === 0.25, pl);
  // loops (the clip is 4 s) and keeps its sound
  await sleep(5000); pl = await players(page);
  ok("looping: after more than one loop it still plays, with sound", loud(pl).length === 1 && loud(pl)[0].t < loud(pl)[0].dur, pl);
  // Pause (Animation: Paused)
  await set({ paused: true }); await sleep(700); pl = await players(page);
  ok("Pause: picture and sound stop", pl.every((x) => !x.playing), pl);
  await set({ paused: false }); await sleep(900); pl = await players(page);
  ok("...and resume, with sound, without another click", loud(pl).length === 1, pl);
  // trade focus: in a trade (the chart's own P&L, as the page script publishes it)
  await ev(page, `window.__pnlT = setInterval(() => document.documentElement.setAttribute("data-ws-pnl", JSON.stringify({ v: 12.5, unit: "USD", ts: Date.now() })), 400), 1`);
  await sleep(1500); pl = await players(page);
  ok("trade focus (in a trade): picture and sound hold still", pl.every((x) => !x.playing), pl);
  await ev(page, `clearInterval(window.__pnlT), document.documentElement.removeAttribute("data-ws-pnl"), 1`); await sleep(9500); pl = await players(page);
  ok("...back with sound once the trade is over", loud(pl).length === 1, pl);
  // Focus (hides the wallpaper's motion: the sound stops with it)
  await set({ focus: true }); await sleep(900); pl = await players(page);
  ok("Focus: picture and sound hold still", pl.every((x) => !x.playing), pl);
  await set({ focus: false }); await sleep(900); pl = await players(page);
  ok("...Focus off: sound again, no click needed", loud(pl).length === 1, pl);
  // Power saver: the video holds still while you pan the chart, and comes back with its sound
  await set({ powerSaver: true }); await sleep(3000);
  await page.mouse.move(400, 400); await page.mouse.down();
  let held = false; for (let i = 0; i < 12; i++) { await page.mouse.move(400 - i * 15, 400); await sleep(60); if (i === 8) { pl = await players(page); held = pl.every((x) => !x.playing); } }
  await page.mouse.up(); await sleep(1500); const after = await players(page);
  ok("Power saver: while you pan, picture and sound hold still; then the sound is back", held && loud(after).length === 1, { during: pl, after });
  await set({ powerSaver: false }); await sleep(500);
  // a second chart tab: until you click it, the first tab keeps the sound; once you do, it moves there (one sound only)
  const page2 = await ctx.newPage(); await open(page2);
  let p1 = await players(page), p2 = await players(page2);
  ok("a second chart tab, not clicked yet: the first tab keeps its sound, the new one is silent (card offered)", loud(p1).length === 1 && loud(p2).length === 0 && await cardOn(page2), { tab1: p1, tab2: p2 });
  await clickPage(page2); await sleep(1500);
  p1 = await players(page); p2 = await players(page2);
  ok("...click on it: the sound moves to it, only one sound across both tabs", loud(p1).length === 0 && loud(p2).length === 1 && !(await cardOn(page2)), { tab1: p1, tab2: p2 });
  await page2.close(); await sleep(1500); await page.bringToFront(); await sleep(1200); p1 = await players(page);
  ok("...close it: the first tab has the sound again", loud(p1).length === 1, p1);
  // background tab
  // (the window minimised: headless Chrome keeps a tab behind another one "visible", a minimised window is hidden)
  const cdp = await ctx.newCDPSession(page), { windowId } = await cdp.send("Browser.getWindowForTarget");
  await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "minimized" } }); await sleep(1500);
  const bg = await players(page), hidden = await ev(page, "document.hidden");
  ok("hidden (window minimised): sound stops" + (hidden ? "" : " (this browser didn't hide the tab: not checked)"), !hidden || loud(bg).length === 0, { hidden, bg });
  await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } }); await page.bringToFront(); await sleep(1500);
  pl = await players(page);
  ok("...back in view: sound again, no click needed", loud(pl).length === 1, pl);
  // a video without sound
  await set({ mediaId: "vsilent" }); await sleep(3000); pl = await players(page);
  ok("a video with no audio track, Sound On: plays normally, no error, nothing to hear", pl.length === 2 && pl.every((x) => x.playing) && pl.every((x) => x.audioBytes === 0), pl);
  // switching wallpaper / Priism off
  await set({ mediaId: "vmusic" }); await sleep(3000); pl = await players(page);
  ok("back to the music video: its sound again, no new click needed", loud(pl).length === 1 && !(await cardOn(page)), pl);
  await set({ skin: "aurora" }); await sleep(2000); pl = await players(page);
  ok("switching to a built-in wallpaper: the video and its sound are gone", pl.length === 0, pl);
  await set({ skin: "media", mediaId: "vmusic" }); await sleep(3000);
  await set({ enabled: false }); await sleep(2000); pl = await players(page);
  ok("Priism off: no video, no sound", pl.length === 0, pl);
  await set({ enabled: true }); await sleep(3000);
  // kept after a reload
  await open(page); pl = await players(page);
  const kept = await pop.evaluate(() => new Promise((r) => chrome.storage.local.get(["wallAudio", "wallVolume"], r)));
  // (a reloaded page counts as not clicked yet for Chrome: silent with the card until the first click)
  ok("after a reload: Sound On and 25% kept; silent with the card until you click", kept.wallAudio === true && kept.wallVolume === 0.25 && loud(pl).length === 0 && await cardOn(page), { kept, pl });
  await clickPage(page); await sleep(1500); pl = await players(page);
  ok("...the first click on the chart: its sound at 25%, card gone", loud(pl).length === 1 && loud(pl)[0].volume === 0.25 && !(await cardOn(page)), pl);
  // a video played right in the page (the desktop app, older uploads stored inline): Chrome's rule applies there
  const dataUrl = await pop.evaluate(async () => { const b = window.__musicBlob || await window.WickedMediaDB.get("vmusic"); return await new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); });
  const media = await pop.evaluate(() => new Promise((r) => chrome.storage.local.get("media", (x) => r(x.media))));
  await set({ media: [...media, { id: "vinline", name: "inline.webm", type: "video", src: dataUrl }], skin: "media", mediaId: "vinline" });
  const page3 = await ctx.newPage(); await open(page3);   // (a new tab: no click on it yet)
  const inline = () => ev(page3, `[...document.querySelectorAll("video")].filter((v) => v.src.startsWith("data:")).map((v) => ({ playing: !v.paused, muted: v.muted, volume: Math.round(v.volume * 100) / 100 }))`);
  let iv = await inline(); const card = await ev(page3, `(document.getElementById("bd-soundask") || {}).innerText || null`);
  ok("a video played in the page, before any click: plays silently, and a 'Turn sound on' card is offered", iv.length >= 1 && iv.every((x) => x.playing && x.muted) && /Turn sound on/.test(card || ""), { iv, card });
  const btn3 = await page3.$("#bd-soundask .bd-ui-btn.pri"); const bb3 = btn3 && await btn3.boundingBox();
  if (bb3) await page3.mouse.click(bb3.x + bb3.width / 2, bb3.y + bb3.height / 2); await sleep(1500); iv = await inline();
  ok("...one click on it: the sound plays, from one chart only, card gone", iv.filter((x) => x.playing && !x.muted).length === 1 && !(await cardOn(page3)), iv);
  await page3.close();
  await set({ mediaId: "vmusic" }); await sleep(2500);
  // the panel: the Sound row shows for a video wallpaper only
  await pop.goto(`chrome-extension://${id}/popup/popup.html`); await sleep(1200);
  const ui = await pop.evaluate(() => { const g = document.querySelector('[data-grp="motion"]'); if (g) g.open = true;
    return { row: !document.getElementById("wallSoundRow").hidden, vol: !document.getElementById("wallVolRow").hidden, on: (document.querySelector("#wallSound .on") || {}).textContent }; });
  await pop.evaluate(() => document.querySelector('[data-grp="motion"]').scrollIntoView()); await pop.screenshot({ path: path.join(OUT, "panel-sound.png") });
  ok("panel: Sound (On) and Volume shown in Motion while a video is the wallpaper", ui.row && ui.vol && ui.on === "On", ui);
  await set({ skin: "aurora" }); await pop.reload(); await sleep(1200);
  ok("...and hidden for other wallpapers", await pop.evaluate(() => document.getElementById("wallSoundRow").hidden && document.getElementById("wallVolRow").hidden));
  // the real converter (convertPending, as when you add a video the browser can't play): the music clip stored as a
  // video still to convert; afterwards the stored video must still have its sound
  await pop.goto(`chrome-extension://${id}/popup/popup.html?page=media`); await sleep(1200);
  const conv = await pop.evaluate(async () => {
    const blob = await window.WickedMediaDB.get("vmusic");
    await window.WickedMediaDB.put("vconv:src", blob);
    cfg.media = [...cfg.media, { id: "vconv", name: "phone-clip.mkv", type: "video", file: true, pending: true, origName: "phone-clip.mkv", size: blob.size }];
    await convertPending();
    const m = cfg.media.find((x) => x.id === "vconv"), out = await window.WickedMediaDB.get("vconv");
    if (!m || !out) return { gone: true, hint: document.getElementById("mediaHint").textContent };
    const v = document.createElement("video"); v.muted = true; v.src = URL.createObjectURL(out); await v.play().catch(() => {}); await new Promise((r) => setTimeout(r, 1500));
    return { converted: !!m.converted, size: out.size, audioBytes: v.webkitAudioDecodedByteCount || 0, w: v.videoWidth, h: v.videoHeight, original: !!(await window.WickedMediaDB.get("vconv:src")) };
  }).catch((e) => ({ err: String(e).slice(0, 200) }));
  ok("conversion (the bundled converter, as Priism runs it): the converted video keeps its sound", conv.converted && conv.audioBytes > 0 && !conv.original, conv);
  const p = Object.values(R).filter((x) => x.pass).length;
  console.log(`\nWALLPAPER SOUND: ${p}/${Object.keys(R).length}`);
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(R, null, 1));
  await ctx.close(); srv.close(); fs.rmSync(prof, { recursive: true, force: true }); fs.rmSync(EXTDIR, { recursive: true, force: true });
  process.exitCode = p === Object.keys(R).length ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
