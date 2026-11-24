// Settings upgrades (src/migrate.js) on every platform's storage: upgrades from older versions keep everything,
// a failing upgrade changes nothing and is retried, the old values are kept and can be put back.
//   node test/updates/migrate.test.mjs
import fs from "fs"; import vm from "vm";
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const SRC = fs.readFileSync(new URL("../../src/migrate.js", import.meta.url), "utf8");
// a copy of Priism: storage like chrome.storage.local (promise form), or desktop / Android (callbacks only)
function copy(stored, { version = "0.1.87", style = "chrome", failSet = false } = {}) {
  const data = JSON.parse(JSON.stringify(stored)), writes = [];
  const local = style === "chrome"
    ? { get: async (d) => (d === null ? JSON.parse(JSON.stringify(data)) : Object.fromEntries(Object.entries(d).map(([k, v]) => [k, k in data ? data[k] : v]))),
        set: async (o) => { if (failSet) throw new Error("disk full"); writes.push(Object.keys(o)); Object.assign(data, JSON.parse(JSON.stringify(o))); },
        remove: async (ks) => { for (const k of [].concat(ks)) delete data[k]; } }
    : { get: (d, cb) => cb(d === null ? JSON.parse(JSON.stringify(data)) : Object.fromEntries(Object.entries(d || {}).map(([k, v]) => [k, k in data ? data[k] : v]))),
        set: (o, cb) => { writes.push(Object.keys(o)); Object.assign(data, JSON.parse(JSON.stringify(o))); cb && cb(); },
        remove: (ks, cb) => { for (const k of [].concat(ks)) delete data[k]; cb && cb(); } };
  const g = { chrome: { storage: { local } }, setTimeout, Promise, JSON, Object, Array, String, Number, Set };
  if (style === "chrome") g.chrome.runtime = { getManifest: () => ({ version }) };
  else g.wickedStore = { app: { version } };
  g.self = g; vm.createContext(g); vm.runInContext(SRC, g);
  return { M: g.WickedMigrate, data, writes };
}
// settings as 0.1.84 left them (keys 0.1.86 removed or renamed), with wallpapers and looks
const OLD = { lastVersion: "0.1.84", skin: "media", mediaId: "abc12345", media: [{ id: "abc12345", name: "Rain", type: "video", file: true }], candleFxEdge: "laser", clarFocus: true, clarFog: true, clarContrast: "soft",
  recordKey: "Alt+Shift+KeyR", loadouts: [{ id: "l1", name: "Night", skin: "aurora", look: { candleFxEdge: "laser", candleLook: "neon" } }], myCandles: [{ clarParallax: true, candleLook: "glass" }], invite: { code: "X", ok: true } };

{ const c = copy(OLD); await c.M.run();
  ok("from 0.1.84: removed settings become their replacements", c.data.candleFxEdge === "off" && c.data.candleBorder === "light" && c.data.vignetteAt === "live" && c.data.smartDim === "soft" && !("clarFog" in c.data) && !("clarFocus" in c.data));
  ok("...an upgrade already done in an earlier version (0.1.69's shortcut) isn't done again", c.data.recordKey === "Alt+Shift+KeyR");
  ok("...saved looks and candle styles are upgraded too", c.data.loadouts[0].look.candleFxEdge === "off" && c.data.loadouts[0].look.candleLook === "neon" && !("clarParallax" in c.data.myCandles[0]));
  ok("...wallpapers, the current wallpaper and the licence are untouched", c.data.media.length === 1 && c.data.mediaId === "abc12345" && c.data.skin === "media" && c.data.invite.code === "X");
  ok("...one write for everything (no half-upgraded settings if it stops)", c.writes.length === 1, c.writes);
  ok("...the version is recorded with it, and 'what's new' knows where you came from", c.data.lastVersion === "0.1.87" && c.data.justUpdated.from === "0.1.84");
  ok("...the old values are kept", c.data.migrateBackup.prev.candleFxEdge === "laser" && c.data.migrateBackup.prev.clarFog === true && c.data.migrateBackup.prev.candleBorder === null);
  await c.M.restoreMigration();
  ok("...and can be put back exactly", c.data.candleFxEdge === "laser" && c.data.clarFog === true && !("candleBorder" in c.data) && !("migrateBackup" in c.data)); }
{ const c = copy({ ...OLD, lastVersion: "0.1.60" }); await c.M.run();
  ok("from 0.1.60: every upgrade since, in order (the clip shortcut moves off TradingView's own too)", c.data.recordKey === "Alt+Shift+KeyV" && c.data.candleFxEdge === "off"); }

{ const c = copy(OLD, { style: "desktop", version: "0.1.87" }); await c.M.run();
  ok("desktop / Android storage (callbacks only): the same upgrade", c.data.candleFxEdge === "off" && c.data.lastVersion === "0.1.87" && !("clarFog" in c.data)); }
{ const c = copy(OLD, { style: "desktop", version: "0.1.87-beta.2" }); await c.M.run();
  ok("a desktop beta (0.1.87-beta.2) records the same version form as the extension", c.data.lastVersion === "0.1.87.2"); }

{ const c = copy(OLD); const before = JSON.stringify(c.data);
  c.M.MIGRATIONS.push({ to: "0.1.87", run() { throw new Error("boom"); } });
  const r = await c.M.run();
  const after = { ...c.data }; delete after.migrateError;
  ok("an upgrade that fails changes NOTHING (not even the ones before it)", r && r.error && JSON.stringify(after) === before);
  ok("...it's recorded", c.data.migrateError && c.data.migrateError.message === "boom" && c.data.migrateError.from === "0.1.84");
  c.M.MIGRATIONS.pop(); await new Promise((r) => setTimeout(r, 5)); await c.M.run();
  ok("...and tried again next time (then it works and the note goes)", c.data.lastVersion === "0.1.87" && c.data.candleFxEdge === "off" && !("migrateError" in c.data)); }

{ const c = copy(OLD, { failSet: true }); const before = JSON.stringify(c.data); let threw = false;
  try { await c.M.run(); } catch { threw = true; }
  ok("storage refusing the write (disk full): settings stay as they were", threw && JSON.stringify(c.data) === before); }

{ const c = copy({}); await c.M.run();
  ok("a brand-new install: nothing to upgrade, no 'updated' card", c.data.lastVersion === "0.1.87" && !c.data.justUpdated && !c.data.migrateBackup); }
{ const c = copy({ lastVersion: "0.1.87", candleLook: "neon" }); await c.M.run();
  ok("same version: nothing written", !c.writes.length); }
console.log("SUMMARY:", Object.values(R).filter(Boolean).length + "/" + Object.keys(R).length);
process.exit(Object.values(R).every(Boolean) ? 0 : 1);
