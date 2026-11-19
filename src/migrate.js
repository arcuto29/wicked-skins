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
          if (ch && Object.keys(ch).length) {
            const gone = Object.keys(ch).filter((k) => ch[k] === undefined), keep = Object.fromEntries(Object.entries(ch).filter(([, v]) => v !== undefined));
            Object.assign(s, keep); for (const k of gone) delete s[k];
            if (Object.keys(keep).length) await chrome.storage.local.set(keep);
            if (gone.length) await chrome.storage.local.remove(gone);
          }
        }
      }
      const upd = { lastVersion: version };
      if (!fresh) upd.justUpdated = { from: prev || "older", to: version };
      await chrome.storage.local.set(upd);
      return upd;
    })();
    return running;
  }
  // a saved look / candle style / preset being applied: the same conversion, without the removed keys
  function look(o) { if (!o || typeof o !== "object") return o; const ch = fix(o, false), r = { ...o, ...ch };
    for (const k of Object.keys(ch)) if (ch[k] === undefined) delete r[k]; return r; }
  root.WickedMigrate = { run, fix, look };
})(typeof self !== "undefined" ? self : window);
