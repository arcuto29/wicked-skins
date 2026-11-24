// src/backup.js: the backup file itself (Node has Blob, so this runs in CI without a browser).
//   node test/updates/backup.test.mjs
import fs from "fs"; import vm from "vm"; import crypto from "crypto";
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const g = { Blob, TextEncoder, TextDecoder, Uint8Array, Uint32Array, DataView, JSON, Math, Date, Promise, Set, Object, Array, String, Error, console };
g.self = g; vm.createContext(g); vm.runInContext(fs.readFileSync(new URL("../../src/backup.js", import.meta.url), "utf8"), g);
const B = g.PriismBackup;

// a real-looking install: settings with secrets in them, two wallpapers (an image and a 12 MB "video")
const img = new Blob([crypto.randomBytes(300 * 1024)], { type: "image/png" }), vid = new Blob([crypto.randomBytes(12 * 1048576)], { type: "video/webm" });
const settings = { skin: "media", mediaId: "a1b2c3d4", candleLook: "neon", candleUp: "#00ffa3", chartSkins: { "c1": "media:z9y8x7w6" },
  loadouts: [{ id: "lk1", name: "Night", skin: "media", mediaId: "a1b2c3d4", look: { candleLook: "neon" } }, { id: "lk2", name: "Calm", skin: "aurora", mediaId: null, look: {} }],
  myCandles: [{ candleLook: "glass" }], journal: [{ d: "2026-11-20", note: "patience" }],
  invite: { code: "PRIISM-SECR-ET01", ok: true }, pass: "eyJ.signed.pass", deviceId: "dev-1234-5678", deviceSecret: "s".repeat(43),
  lastPick: 123, lastVersion: "0.1.86", sites: { "x.com": 1 }, myApiToken: "nope", updCheck: { at: 1 } };
const media = [{ meta: { id: "a1b2c3d4", name: "Aurora loop.png", type: "image", file: true, thumb: "data:image/jpeg;base64,AAAA", size: img.size, w: 3840, h: 2160 }, blob: img },
  { meta: { id: "z9y8x7w6", name: "Rain.webm", type: "video", file: true, size: vid.size, converted: true }, blob: vid },
  { meta: { id: "gone0001", name: "Lost.mp4", type: "video", file: true }, blob: null }];
let progress = 0;
const file = await B.build({ settings, media, local: { myLooks: [{ t: "Night", s: "aurora" }] }, app: { version: "0.1.87", channel: "stable", kind: "extension" }, onProgress: (n) => { progress = n; } });
ok("the backup is one file, holding the wallpapers' actual bytes", file.size > img.size + vid.size && file.size < img.size + vid.size + 64 * 1024, { size: file.size });
ok("progress is reported from the real bytes", progress === img.size + vid.size, { progress });
const o = await B.open(file), h = o.header;
ok("header: format, app version, counts", h.format === "priism-backup" && h.v === 1 && h.app.version === "0.1.87" && h.counts.wallpapers === 2 && h.counts.looks === 2, h.counts);
const leaked = ["invite", "pass", "deviceId", "deviceSecret", "lastPick", "lastVersion", "sites", "myApiToken", "updCheck", "media"].filter((k) => k in h.settings);
ok("no licence, pass, device id / secret, token or install bookkeeping in it", !leaked.length, leaked);
ok("...and nothing secret anywhere in the file, not even by value", !(await file.text()).includes("PRIISM-SECR-ET01") && !(await file.text()).includes("s".repeat(43)) && !(await file.text()).includes("eyJ.signed.pass"));
ok("settings, looks, saved candles and journal are in it", h.settings.candleLook === "neon" && h.settings.loadouts.length === 2 && h.settings.myCandles.length === 1 && h.settings.journal.length === 1);
ok("a wallpaper whose file is gone is listed as missing, not silently skipped", h.missing.length === 1 && h.missing[0] === "Lost.mp4", h.missing);
const same = async (a, b) => Buffer.compare(Buffer.from(await a.arrayBuffer()), Buffer.from(await b.arrayBuffer())) === 0;
ok("wallpapers come back byte for byte (image and video)", (await same(o.file(0), img)) && (await same(o.file(1), vid)) && o.file(1).type === "video/webm");
ok("their names, sizes and labels come back", h.media[0].meta.name === "Aurora loop.png" && h.media[0].meta.w === 3840 && h.media[1].meta.converted === true && !("file" in h.media[0].meta));
ok("every wallpaper checks out (size + CRC-32)", (await B.verify(o)).ok);
// damage
const bytes = new Uint8Array(await file.arrayBuffer());
const flip = bytes.slice(); flip[flip.length - 5000] ^= 0xff;
const v2 = await B.verify(await B.open(new Blob([flip])));
ok("one changed byte in a wallpaper is caught (and named)", !v2.ok && v2.bad.includes("Rain.webm"), v2);
let msg = ""; try { await B.open(new Blob([bytes.slice(0, bytes.length - 1000)])); } catch (e) { msg = e.message; }
ok("a cut-off file is refused before anything happens", /cut off/.test(msg), msg);
msg = ""; try { await B.open(new Blob([new TextEncoder().encode("{\"not\":\"a backup\"}")])); } catch (e) { msg = e.message; }
ok("another file is refused", /isn't a Priism backup/.test(msg), msg);
const newer = bytes.slice(); new DataView(newer.buffer).setUint32(8, 9, true); msg = ""; try { await B.open(new Blob([newer])); } catch (e) { msg = e.message; }
ok("a backup from a newer Priism says to update first", /newer Priism/.test(msg), msg);
// restoring next to what's there already
const map = { a1b2c3d4: "n3wid001" };
const re = B.remapMedia(h.settings, map);
ok("a wallpaper given a new id: every reference follows (current, saved looks)", re.mediaId === "n3wid001" && re.loadouts[0].mediaId === "n3wid001" && re.chartSkins.c1 === "media:z9y8x7w6");
const mine = [{ id: "lk1", name: "Mine", skin: "aurora", look: { a: 1 } }];
const merged = B.mergeList(mine, h.settings.loadouts);
ok("saved looks: yours stay, the backup's are added, nothing is overwritten", merged.length === 3 && merged[0].name === "Mine" && merged.filter((x) => x.id === "lk1").length === 1, merged.map((x) => [x.id, x.name]));
ok("...and restoring the same backup twice doesn't double them", B.mergeList(merged, h.settings.loadouts).length === 3);
console.log("SUMMARY:", Object.values(R).filter(Boolean).length + "/" + Object.keys(R).length);
process.exit(Object.values(R).every(Boolean) ? 0 : 1);
