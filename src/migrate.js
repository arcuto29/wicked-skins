/* Settings migrations, so updates never break saved settings.
   Runs from the background worker AND the panel: whenever the running version differs from the last one
   that ran (store auto-update, zip replaced + ↻, anything), it upgrades the settings once and remembers
   the update so the panel can show "What's new". Add a migration whenever a setting is renamed/removed. */
(function (root) {
  const MIGRATIONS = [
    { to: "0.1.0", run(s) {
      const out = {};
      if (s.media && !Array.isArray(s.media)) out.media = [];                    // very first builds stored one object
      if (s.skin === "ghostcandles" || s.skin === "custom") out.skin = "aurora";   // removed skins
      if (s.scaleBg === undefined) out.scaleBg = "auto";
      return out;
    } },
  ];
  const cmp = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

  let running = null;
  function run() {
    if (running) return running;
    running = (async () => {
      const version = chrome.runtime.getManifest().version;
      const s = await chrome.storage.local.get(null);
      const prev = s.lastVersion;
      if (prev === version) return null;
      const fresh = !prev && !Object.keys(s).some((k) => k !== "updCheck");   // brand-new install: nothing to migrate
      if (!fresh) {
        for (const m of MIGRATIONS) {
          if (prev && cmp(prev, m.to) >= 0) continue;
          const ch = m.run(s);
          if (ch && Object.keys(ch).length) { Object.assign(s, ch); await chrome.storage.local.set(ch); }
        }
      }
      const upd = { lastVersion: version };
      if (!fresh) upd.justUpdated = { from: prev || "older", to: version };
      await chrome.storage.local.set(upd);
      return upd;
    })();
    return running;
  }
  root.WickedMigrate = { run };
})(typeof self !== "undefined" ? self : window);
