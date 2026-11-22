/* Priism backups: one file with everything you made, to move to another computer, a new install (store / unpacked,
   desktop, Android) or to keep safe before an uninstall.
   In it: every setting, every saved look and candle style, and the actual files of your uploaded wallpapers (their
   bytes, not just their names), each with its size and CRC-32 so a damaged or cut-off file is caught before
   anything is restored. Not in it: licences, passes, this device's id and secret, and other bookkeeping that belongs
   to one install (EXCLUDE below). Nothing here sends anything anywhere: it's a file you save and open yourself.

   File layout (".priism"):  "PRIISMBK" | u32 format version (1) | u32 header length | header (JSON, UTF-8) | files
   header = { format: "priism-backup", v: 1, created, app: { version, channel, kind }, settings, local,
              media: [{ meta, size, crc, off }], missing: [names], counts }
   Shared by the panel (all platforms) and the tests (Node has Blob too).                                            */
(function (root) {
  const MAGIC = "PRIISMBK", FORMAT = 1;
  // never in a backup: licence / account / device credentials, and things that only make sense on this install
  const EXCLUDE = new Set(["invite", "pass", "deviceId", "deviceSecret", "media", "lastPick", "lastVersion", "justUpdated", "updateReady",
    "updAsk", "updCheck", "updPoke", "dupSeen", "pendingSite", "recToken", "welcomePending", "sites", "siteOfferNo", "dayPnl", "indSeen",
    "migrateBackup", "migrateError", "restoreUndo", "wallMatch", "bracketDebug"]);
  const isExcluded = (k) => EXCLUDE.has(k) || /secret|token|password|licen[cs]e/i.test(k);

  // ---- CRC-32 (the zip one), streamed over a Blob in 4 MB pieces, so a 2 GB video never sits in memory at once ----
  const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  async function crc32(blob, onProgress) {
    let c = 0xffffffff; const step = 4 * 1048576;
    for (let o = 0; o < blob.size; o += step) {
      const b = new Uint8Array(await blob.slice(o, o + step).arrayBuffer());
      for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
      if (onProgress) onProgress(Math.min(blob.size, o + step));
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  const u32 = (n) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, true); return b; };

  // what of a wallpaper entry goes in the header (its bytes go in the file part; src is rebuilt on restore)
  const metaOf = (m) => { const o = {}; for (const k of ["id", "name", "type", "thumb", "w", "h", "oled", "wsId", "converted", "origName"]) if (m[k] !== undefined) o[k] = m[k]; return o; };

  // settings: everything stored; media: [{ meta (the stored entry), blob }]; local: small extras (panel localStorage)
  async function build({ settings, media, local, app, onProgress }) {
    const clean = {};
    for (const [k, v] of Object.entries(settings || {})) if (!isExcluded(k) && v !== undefined) clean[k] = v;
    const items = [], parts = [], missing = [];
    let off = 0, total = 0;
    for (const m of media || []) if (m.blob) total += m.blob.size;
    let done = 0;
    for (const m of media || []) {
      if (!m.blob) { missing.push(m.meta && m.meta.name ? m.meta.name : String(m.meta && m.meta.id)); continue; }
      const crc = await crc32(m.blob, (n) => onProgress && onProgress(done + n, total));
      items.push({ meta: metaOf(m.meta || {}), mime: m.blob.type || "", size: m.blob.size, crc, off });
      parts.push(m.blob); off += m.blob.size; done += m.blob.size;
    }
    const looks = Array.isArray(clean.loadouts) ? clean.loadouts.length : 0;
    const header = { format: "priism-backup", v: FORMAT, created: new Date().toISOString(), app: app || {}, settings: clean, local: local || {},
      media: items, missing, counts: { settings: Object.keys(clean).length, looks, wallpapers: items.length, bytes: off } };
    const head = new TextEncoder().encode(JSON.stringify(header));
    return new Blob([new TextEncoder().encode(MAGIC), u32(FORMAT), u32(head.length), head, ...parts], { type: "application/octet-stream" });
  }

  // read a backup file: { header, file(i) -> Blob } or throws a plain-language Error
  async function open(blob) {
    if (!blob || blob.size < 16) throw new Error("This isn't a Priism backup file.");
    const pre = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    if (new TextDecoder().decode(pre.slice(0, 8)) !== MAGIC) throw new Error("This isn't a Priism backup file.");
    const dv = new DataView(pre.buffer), fmt = dv.getUint32(8, true), hl = dv.getUint32(12, true);
    if (fmt > FORMAT) throw new Error("This backup was made by a newer Priism. Update Priism first, then restore it.");
    if (!hl || 16 + hl > blob.size) throw new Error("This backup file is cut off or damaged. Nothing was changed.");
    let header;
    try { header = JSON.parse(new TextDecoder().decode(await blob.slice(16, 16 + hl).arrayBuffer())); } catch { throw new Error("This backup file is damaged. Nothing was changed."); }
    if (!header || header.format !== "priism-backup" || typeof header.settings !== "object" || !Array.isArray(header.media)) throw new Error("This isn't a Priism backup file.");
    const base = 16 + hl;
    for (const m of header.media) if (!(m.size >= 0) || !(m.off >= 0) || base + m.off + m.size > blob.size) throw new Error("This backup file is cut off: some wallpapers are missing from it. Nothing was changed.");
    return { header, file: (i) => { const m = header.media[i]; return blob.slice(base + m.off, base + m.off + m.size, m.mime || ""); } };
  }
  // every wallpaper's bytes checked against its size and CRC-32 -> { ok, bad: [names] }
  async function verify(opened, onProgress) {
    const bad = [], total = opened.header.media.reduce((s, m) => s + m.size, 0); let done = 0;
    for (let i = 0; i < opened.header.media.length; i++) {
      const m = opened.header.media[i], f = opened.file(i);
      const c = f.size === m.size ? await crc32(f, (n) => onProgress && onProgress(done + n, total)) : -1;
      if (c !== m.crc) bad.push(m.meta && m.meta.name ? m.meta.name : "wallpaper " + (i + 1));
      done += m.size;
    }
    return { ok: !bad.length, bad };
  }

  // a wallpaper got a new id on restore (its old one was taken): point every reference at the new one
  function remapMedia(settings, map) {
    if (!map || !Object.keys(map).length) return settings;
    const fix = (v) => (typeof v === "string" && v.startsWith("media:") && map[v.slice(6)] ? "media:" + map[v.slice(6)] : v);
    const walk = (v) => (Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "mediaId" && map[x] ? map[x] : walk(x)])) : fix(v));
    const out = {};
    for (const [k, v] of Object.entries(settings)) out[k] = k === "mediaId" && map[v] ? map[v] : walk(v);
    return out;
  }
  // two lists of saved things kept together: everything you have now, plus what the backup has that you don't
  function mergeList(now, theirs) {
    const a = Array.isArray(now) ? now.slice() : [], key = (x) => JSON.stringify({ ...x, id: undefined });
    const seen = new Set(a.map(key)), ids = new Set(a.map((x) => x && x.id));
    for (const x of Array.isArray(theirs) ? theirs : []) {
      if (seen.has(key(x))) continue;
      const y = x && typeof x === "object" && x.id && ids.has(x.id) ? { ...x, id: x.id + "-r" + Math.random().toString(36).slice(2, 6) } : x;
      a.push(y); seen.add(key(x)); if (y && y.id) ids.add(y.id);
    }
    return a;
  }
  const blobToDataUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
  // (decoded right here: a data URL already is the file, so nothing goes over the network)
  async function dataUrlToBlob(u) {
    const m = /^data:([^;,]*)(;base64)?,/.exec(String(u || "")); if (!m) return null;
    const body = u.slice(m[0].length), parts = [], step = 4 * 1048576;   // 4 MB of base64 at a time
    if (!m[2]) return new Blob([decodeURIComponent(body)], { type: m[1] });
    for (let o = 0; o < body.length; o += step) { const bin = atob(body.slice(o, o + step)), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); parts.push(a); }
    return new Blob(parts, { type: m[1] });
  }

  root.PriismBackup = { MAGIC, FORMAT, EXCLUDE, isExcluded, crc32, build, open, verify, remapMedia, mergeList, metaOf, blobToDataUrl, dataUrlToBlob };
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
