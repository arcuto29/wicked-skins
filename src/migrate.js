/* Settings migrations, so updates never break saved settings.
   Runs from the background worker AND the panel (extension, desktop app, Android): whenever the running version
   differs from the last one that ran (store auto-update, zip replaced + ↻, a new desktop / Android install), it
   upgrades the settings once and remembers the update so the panel can show what's new.
   Safe by design:
    - every migration is worked out in memory first; only when ALL of them succeeded is anything written, in one go,
      so an error half-way never leaves half-migrated settings (it's recorded in migrateError and tried again on the
      next start, with nothing changed);
    - the old value of every setting a migration changes is kept in migrateBackup ({ from, to, at, prev }), so it
      can be put back (restoreMigration()).
   Add a migration whenever a setting is renamed/removed. */
(function (root) {
  const MIGRATIONS = [
    { to: "0.1.0", run(s) {
      const out = {};
      if (s.media && !Array.isArray(s.media)) out.media = [];                    // very first builds stored one object
      if (s.skin === "ghostcandles" || s.skin === "custom") out.skin = "aurora";   // removed skins
      if (s.scaleBg === undefined) out.scaleBg = "auto";
      return out;
    } },
    // Alt+Shift+R is TradingView's own Rectangle tool: Priism's Record-a-clip shortcut moves to Alt+Shift+V
    { to: "0.1.69", run(s) { return s.recordKey === "Alt+Shift+KeyR" ? { recordKey: "Alt+Shift+KeyV" } : {}; } },
    // 0.1.86 removed duplicate settings (see fix() below): in your settings, every saved look, saved candle style and
    // each chart's own style
    { to: "0.1.86", run(s) {
      const out = fix(s, true), same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      if (Array.isArray(s.loadouts)) { const l = s.loadouts.map((x) => (x && x.look && typeof x.look === "object" ? { ...x, look: look(x.look) } : x)); if (!same(l, s.loadouts)) out.loadouts = l; }
      if (Array.isArray(s.myCandles)) { const l = s.myCandles.map((x) => (x && typeof x === "object" ? look(x) : x)); if (!same(l, s.myCandles)) out.myCandles = l; }
      if (s.chartStyle && typeof s.chartStyle === "object") { const o = {}; for (const [k, v] of Object.entries(s.chartStyle)) o[k] = v && typeof v === "object" ? look(v) : v;
        if (!same(o, s.chartStyle)) out.chartStyle = o; }
      return out;
    } },
  ];
  // The settings 0.1.84-0.1.85 added that duplicated older ones, turned into the older ones. Returns only what changes.
  // all = your whole settings (a missing key means its default); otherwise a saved look / candle style (only its keys).
  //   Laser edge light       -> Candle parts › Borders › Light
  //   Cinematic focus        -> Vignette, centred on the live price (at least 40%)
  //   Smart contrast         -> Picture › Smart dim (same values; it was on by default and now is off unless chosen)
  //   Depth fog, Parallax    -> removed (the Fog wallpaper effect and the still wallpaper cover them)
  function fix(s, all) {
    const out = {};
    if (!s || typeof s !== "object") return out;
    if (s.candleFxEdge === "laser") { out.candleFxEdge = "off"; if (!s.candleBorder || s.candleBorder === "none") out.candleBorder = "light"; }
    if (s.clarFocus === true) { out.vignetteAt = "live"; if (all || "vignette" in s) { if (!(+s.vignette >= 0.4)) out.vignette = 0.4; } else out.vignette = 0.4; }
    if ("clarContrast" in s) { if (["soft", "strong"].includes(s.clarContrast)) out.smartDim = s.clarContrast; }
    for (const k of ["clarFocus", "clarFog", "clarParallax", "clarContrast"]) if (k in s) out[k] = undefined;
    return out;
  }
  const cmp = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

  // the storage this copy uses (chrome.storage.local in the extension; the same shape on desktop / Android, where
  // some calls only take callbacks)
  const S = () => root.chrome && root.chrome.storage && root.chrome.storage.local;
  const sget = () => new Promise((res, rej) => { try { const r = S().get(null, (v) => res(v || {})); if (r && r.then) r.then((v) => res(v || {}), rej); } catch (e) { rej(e); } });
  const sset = (o) => new Promise((res, rej) => { try { const r = S().set(o, () => res()); if (r && r.then) r.then(() => res(), rej); } catch (e) { rej(e); } });
  const srem = (ks) => new Promise((res) => { try { if (!S().remove) return res(); const r = S().remove(ks, () => res()); if (r && r.then) r.then(() => res(), () => res()); } catch { res(); } });
  const thisVersion = () => { try { const m = root.chrome.runtime.getManifest(); if (m && m.version) return m.version; } catch {}
    const a = root.wickedStore && root.wickedStore.app; if (a && a.version) return String(a.version).replace(/-beta\.?(\d+)$/, ".$1");
    try { if (root.PriismNative && root.PriismNative.version) return String(root.PriismNative.version()).replace(/-beta\.?(\d+)$/, ".$1"); } catch {}
    return ""; };
  // all the changes from prev to now, worked out in memory: { set, gone, prev } (throws if a migration fails)
  function plan(s, prev) {
    const cur = { ...s }, set = {}, gone = new Set(), old = {};
    for (const m of MIGRATIONS) {
      if (prev && cmp(prev, m.to) >= 0) continue;
      const ch = m.run(cur) || {};
      for (const [k, v] of Object.entries(ch)) {
        if (!(k in old)) old[k] = k in s ? s[k] : null;
        if (v === undefined) { delete cur[k]; delete set[k]; gone.add(k); } else { cur[k] = v; set[k] = v; gone.delete(k); }
      }
    }
    return { set, gone: [...gone], prev: old };
  }
  let running = null;
  function run(versionArg) {
    if (running) return running;
    running = (async () => {
      const version = versionArg || thisVersion();
      if (!version || !S()) return null;
      const s = await sget();
      const prev = s.lastVersion;
      if (prev === version) return null;
      const fresh = !prev && !Object.keys(s).some((k) => !["updCheck", "migrateError"].includes(k));   // brand-new install: nothing to migrate
      let p = { set: {}, gone: [], prev: {} };
      if (!fresh) {
        try { p = plan(s, prev); }
        catch (e) {                                  // nothing written: the settings stay exactly as they were
          await sset({ migrateError: { from: prev || "older", to: version, at: Date.now(), message: String((e && e.message) || e).slice(0, 300) } }).catch(() => {});
          return { error: true };
        }
      }
      const upd = { ...p.set, lastVersion: version };
      if (!fresh) upd.justUpdated = { from: prev || "older", to: version };
      if (Object.keys(p.prev).length) upd.migrateBackup = { from: prev || "older", to: version, at: Date.now(), prev: p.prev };
      await sset(upd);                               // one write: the new values, the backup and the new version together
      if (p.gone.length) await srem(p.gone);
      if ("migrateError" in s) await srem(["migrateError"]);
      return upd;
    })();
    running.finally(() => { setTimeout(() => { running = null; }, 0); });
    return running;
  }
  // put back the settings the last migration changed (from migrateBackup)
  async function restoreMigration() {
    const b = (await sget()).migrateBackup;
    if (!b || !b.prev) return false;
    const put = {}, del = [];
    for (const [k, v] of Object.entries(b.prev)) { if (v === null) del.push(k); else put[k] = v; }   // null = it didn't exist before
    await sset({ ...put, lastVersion: b.from === "older" ? "0.0.0" : b.from });
    if (del.length) await srem(del);
    await srem(["migrateBackup"]);
    return true;
  }
  // a saved look / candle style / preset being applied: the same conversion, without the removed keys
  function look(o) { if (!o || typeof o !== "object") return o; const ch = fix(o, false), r = { ...o, ...ch };
    for (const k of Object.keys(ch)) if (ch[k] === undefined) delete r[k]; return r; }
  root.WickedMigrate = { run, fix, look, plan, restoreMigration, MIGRATIONS };
})(typeof self !== "undefined" ? self : window);
