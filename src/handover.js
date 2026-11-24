/* Moving to a new Priism copy by itself: no backup needed.
   Chrome keeps each extension's things (settings, and the files in its database) under its id, and one copy can't read
   another's. When you install a new copy (the Chrome Web Store version, or the unpacked zip with Priism's fixed id from
   0.1.88 on: keys/unpacked.json) next to the one you have, the new, empty copy takes everything from the old one:
   every setting, look and candle style, and the actual files of your wallpapers, each checked byte for byte before it
   counts. Nothing is ever deleted from either copy. Once it's done, both panels say so and you can remove the old one.

   Who talks to whom (Chrome's extension-to-extension messaging, only between extensions in this browser profile):
   - the fixed ids are where copies meet: the store copy, the unpacked copy with the fixed key, and their beta twins
     (stable and beta never mix);
   - a copy with your things says hello to those ids now and then ("hello"); an empty copy at one of them answers by
     pulling everything over a port; a fixed-id copy that's empty also asks the others directly ("offer?");
   - a copy only ever GIVES its things to one of those fixed ids (never to any other extension). It may TAKE from any
     copy that says hello (an older unpacked copy has an id made from its folder, so it can't be known in advance), but
     only when it's empty, and a licence code that comes along only counts once Priism's server says it's good.
   Runs in the background worker (src/bg.js), so it happens without the panel being open.                           */
(function (root) {
  const STABLE = ["ilmoloilbeblmgkanbiekhdegagfdloa", "clnbopeffinekcpboohdadbmilhaelab"];   // store, unpacked (fixed key)
  const BETA = ["fchkpnmabjolaaodlknfmjgijghdpfhf"];                                          // unpacked beta (fixed key); the beta listing's id joins once it exists
  const CHUNK = 4 * 1048576, SEGMENT = 16 * 1048576, HELLO_EVERY_MIN = 15;
  const me = chrome.runtime.id;
  const man = chrome.runtime.getManifest();
  const channel = /beta/i.test((man.name || "") + " " + (man.version_name || "")) ? "beta" : "stable";
  const siblings = (channel === "beta" ? BETA : STABLE).filter((id) => id !== me);
  const isSibling = (id) => (channel === "beta" ? BETA : STABLE).includes(id) && id !== me;
  const S = chrome.storage.local;
  const B = () => root.PriismBackup, DB = () => root.WickedMediaDB;
  const log = (...a) => { try { console.log("[priism handover]", ...a); } catch {} };

  // ---------- what this copy has ----------
  async function summary() {
    const s = await S.get(null), files = DB() ? (await DB().keys().catch(() => [])).filter((k) => !String(k).startsWith("hv:")) : [];
    return { media: Array.isArray(s.media) ? s.media.length : 0, looks: Array.isArray(s.loadouts) ? s.loadouts.length : 0,
      candles: Array.isArray(s.myCandles) ? s.myCandles.length : 0, files: files.length, version: man.version, channel };
  }
  // empty: nothing of yours yet (a new install), and it has never taken things from another copy
  async function isEmpty() {
    const s = await S.get(["media", "loadouts", "myCandles", "handover"]);
    return !(Array.isArray(s.media) && s.media.length) && !(Array.isArray(s.loadouts) && s.loadouts.length) && !(Array.isArray(s.myCandles) && s.myCandles.length) && !(s.handover && s.handover.done);
  }
  const hasThings = (x) => !!x && x.channel === channel && (x.media > 0 || x.looks > 0 || x.candles > 0 || x.files > 0);

  // ---------- giving (only to Priism's fixed ids) ----------
  // what may leave: everything a backup would carry (src/backup.js EXCLUDE: no licence secrets, no device bookkeeping),
  // plus the licence code and this device's id, which are re-checked with the server on the other side
  async function meta() {
    const s = await S.get(null), settings = {};
    for (const [k, v] of Object.entries(s)) if (!B().isExcluded(k) && k !== "handover" && k !== "handoverTo") settings[k] = v;
    const media = (Array.isArray(s.media) ? s.media : []).filter((m) => m && m.id);
    const files = [];
    for (const m of media) for (const key of m.file ? [m.id, m.id + ":src"] : []) {
      const b = await DB().get(key).catch(() => null); if (!b) continue;
      files.push({ key, size: b.size, type: b.type, crc: await B().crc32(b) });
    }
    return { v: 1, version: man.version, channel, settings, media, files,
      licence: s.invite && s.invite.code ? { code: s.invite.code, deviceId: s.deviceId || "" } : null };
  }
  async function chunk(key, off) {
    const b = await DB().get(key); if (!b) return { err: "missing" };
    const u = new Uint8Array(await b.slice(off, off + CHUNK).arrayBuffer()); let bin = "";
    for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return { b64: btoa(bin), n: u.length };
  }
  function serve(port) {
    if (!port.sender || !isSibling(port.sender.id)) { try { port.disconnect(); } catch {} return; }
    port.onMessage.addListener(async (q) => {
      try {
        if (q.t === "meta") port.postMessage({ t: "meta", body: await meta() });
        else if (q.t === "chunk") port.postMessage({ t: "chunk", key: q.key, off: q.off, ...(await chunk(String(q.key), Math.max(0, +q.off || 0))) });
        else if (q.t === "done") { const { handoverTo = {} } = await S.get("handoverTo"); handoverTo[port.sender.id] = { at: Date.now(), ...(q.counts || {}) }; await S.set({ handoverTo }); log("given to", port.sender.id, q.counts); }
      } catch (e) { try { port.postMessage({ t: "error", msg: String((e && e.message) || e).slice(0, 200) }); } catch {} }
    });
  }

  // ---------- taking (an empty copy) ----------
  let pulling = null;
  function pullFrom(from) {
    if (pulling) return pulling;
    pulling = (async () => {
      if (!(await isEmpty())) return { skipped: "not empty" };
      await S.set({ handover: { from, started: Date.now(), done: false } });
      const port = chrome.runtime.connect(from, { name: "priism-handover" });
      const waiters = []; let closed = false;
      port.onMessage.addListener((m) => { const w = waiters.shift(); if (w) w.res(m); });
      port.onDisconnect.addListener(() => { closed = true; for (const w of waiters.splice(0)) w.rej(new Error("the other copy closed the connection")); });
      const ask = (q) => new Promise((res, rej) => { if (closed) return rej(new Error("closed")); waiters.push({ res, rej }); port.postMessage(q); });
      try {
        const r = await ask({ t: "meta" }); if (!r || r.t !== "meta" || !r.body || r.body.channel !== channel) throw new Error("not a Priism copy of this channel");
        const M = r.body;
        // 1. the files, each written in pieces and checked (size + CRC-32) before anything refers to it
        let done = 0;
        for (const f of M.files || []) {
          if (!/^[A-Za-z0-9_-]{1,64}(:src)?$/.test(f.key) || !(f.size >= 0)) continue;
          const have = await DB().get(f.key).catch(() => null);
          if (have && have.size === f.size && (await B().crc32(have)) === f.crc) { done++; continue; }   // (an earlier, interrupted move got this far)
          const segs = []; let parts = [], partBytes = 0, seg = 0;
          const flush = async () => { if (!parts.length) return; const k = `hv:${f.key}:${seg++}`; await DB().put(k, new Blob(parts)); segs.push(k); parts = []; partBytes = 0; };
          for (let off = 0; off < f.size; off += CHUNK) {
            const c = await ask({ t: "chunk", key: f.key, off });
            if (!c || c.t !== "chunk" || c.err) throw new Error(`file ${f.key}: ${(c && c.err) || "no answer"}`);
            const bin = atob(c.b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
            parts.push(u); partBytes += u.length; if (partBytes >= SEGMENT) await flush();
          }
          await flush();
          const pieces = []; for (const k of segs) pieces.push(await DB().get(k));
          const blob = new Blob(pieces, { type: f.type || "" });
          if (blob.size !== f.size || (await B().crc32(blob)) !== f.crc) throw new Error(`file ${f.key} didn't arrive intact`);
          await DB().put(f.key, blob);
          const back = await DB().get(f.key);
          if (!back || back.size !== f.size) throw new Error(`file ${f.key} couldn't be stored (disk full?)`);
          for (const k of segs) await DB().del(k).catch(() => {});
          done++;
          await S.set({ handover: { from, started: Date.now(), done: false, files: done, of: (M.files || []).length } });
        }
        // 2. only now the list and the settings (still empty? the user may have started customising meanwhile)
        if (!(await isEmpty())) throw new Error("this copy got things of its own in the meantime: left as it is");
        const stored = new Set((await DB().keys()).map(String));
        const media = (M.media || []).filter((m) => m && typeof m.id === "string" && (!m.file || stored.has(m.id) || stored.has(m.id + ":src")));
        const settings = {}; for (const [k, v] of Object.entries(M.settings || {})) if (!B().isExcluded(k)) settings[k] = v;
        // (settings from an older version go through the same upgrade an update would)
        const older = root.WickedMigrate && M.version && M.version !== man.version;
        await S.set({ ...settings, media, ...(older ? { lastVersion: M.version } : {}) });
        if (older) await root.WickedMigrate.run().catch(() => {});
        // 3. the licence: the same device (same browser), so the same device id; it only counts once the server agrees
        let licence = "none";
        if (M.licence && M.licence.code && root.PriismInvite) {
          if (/^[A-Za-z0-9-]{8,64}$/.test(M.licence.deviceId || "")) await S.set({ deviceId: M.licence.deviceId });
          const inv = await root.PriismInvite.redeem(M.licence.code).catch(() => null);
          licence = inv && inv.ok ? "ok" : inv && inv.status === "offline" ? "later" : (inv && inv.status) || "later";
          if (licence === "later") await S.set({ handoverLicence: M.licence.code });
        }
        const counts = { wallpapers: media.length, files: done, looks: (settings.loadouts || []).length, candles: (settings.myCandles || []).length };
        await S.set({ handover: { from, at: Date.now(), done: true, ...counts, licence, fromVersion: M.version } });
        try { port.postMessage({ t: "done", counts }); } catch {}
        log("taken from", from, counts, "licence", licence);
        return counts;
      } catch (e) {
        log("stopped:", e && e.message);
        await S.set({ handover: { from, at: Date.now(), done: false, error: String((e && e.message) || e).slice(0, 200) } });
        return { error: String((e && e.message) || e) };
      } finally { try { port.disconnect(); } catch {} pulling = null; }
    })();
    return pulling;
  }

  // ---------- meeting ----------
  const send = (id, msg) => new Promise((res) => { try { chrome.runtime.sendMessage(id, msg, (r) => { void chrome.runtime.lastError; res(r || null); }); } catch { res(null); } });
  // a copy with things: let the fixed-id copies know (they take it only if they're new and empty)
  async function hello() {
    const sum = await summary(); if (!hasThings(sum)) return;
    const { handoverTo = {} } = await S.get("handoverTo");
    for (const id of siblings) if (!handoverTo[id]) await send(id, { priism: "hello", v: 1, ...sum });
  }
  // an empty copy: ask the fixed-id copies whether one of them has your things
  async function ask() {
    if (!(await isEmpty())) return;
    for (const id of siblings) { const r = await send(id, { priism: "offer?", v: 1 }); if (hasThings(r)) return pullFrom(id); }
  }
  // a licence code that came along while offline: tried again
  async function licenceLater() {
    const { handoverLicence: c, invite } = await S.get(["handoverLicence", "invite"]); if (!c) return;
    if (invite && invite.ok) return S.remove("handoverLicence");
    const inv = root.PriismInvite && (await root.PriismInvite.redeem(c).catch(() => null));
    if (inv && inv.status !== "offline") await S.remove("handoverLicence");
  }

  chrome.runtime.onConnectExternal.addListener((port) => { if (port.name === "priism-handover") serve(port); });
  chrome.runtime.onMessageExternal.addListener((msg, sender, reply) => {
    if (!msg || msg.v !== 1) return;
    if (msg.priism === "offer?") { if (!isSibling(sender.id)) return; summary().then(reply); return true; }   // (only Priism's fixed ids learn what's here)
    if (msg.priism === "hello") { reply({ ok: true }); if (hasThings(msg)) isEmpty().then((e) => { if (e) pullFrom(sender.id); }); }
  });
  const tick = () => { hello().catch(() => {}); ask().catch(() => {}); licenceLater().catch(() => {}); };
  try { chrome.alarms.create("priism-handover", { periodInMinutes: HELLO_EVERY_MIN }); chrome.alarms.onAlarm.addListener((a) => { if (a.name === "priism-handover") tick(); }); } catch {}
  setTimeout(tick, 2000);
  root.PriismHandover = { tick, summary, isEmpty, pullFrom, siblings };
})(typeof self !== "undefined" ? self : globalThis);
