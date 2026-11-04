/* Turn Wicked Skins on for other sites that embed TradingView-style charts (prop-firm platforms
   such as TopstepX use TradingView's charting library). Used by the popup and the background worker.
   For each enabled site we register the same scripts that run on tradingview.com, in all frames
   (the chart usually lives in an iframe). The content script only switches on in frames that
   actually contain a chart, so the rest of the platform's UI is never touched. */
(function (root) {
  const KEY = "sites"; // [{ origin: "https://topstepx.com", extra: ["https://charts.example.com"] }]

  const idFor = (origin) => "site_" + origin.replace(/[^a-z0-9]/gi, "_");
  const patternsFor = (site) => [site.origin, ...(site.extra || [])].map((o) => o.replace(/\/$/, "") + "/*");

  async function list() {
    const s = await chrome.storage.local.get({ [KEY]: [] });
    return s[KEY];
  }

  async function registerOne(site) {
    const id = idFor(site.origin), matches = patternsFor(site);
    await chrome.scripting.unregisterContentScripts({ ids: [id + "_hook", id + "_main"] }).catch(() => {});
    await chrome.scripting.registerContentScripts([
      { id: id + "_hook", matches, js: ["src/hook.js"], runAt: "document_start", world: "MAIN", allFrames: true, matchOriginAsFallback: true },
      { id: id + "_main", matches, js: ["src/skins.js", "src/content.js"], css: ["src/content.css"], runAt: "document_idle", allFrames: true, matchOriginAsFallback: true },
    ]);
  }

  async function hasPermission(site) {
    return chrome.permissions.contains({ origins: patternsFor(site) });
  }

  // Re-create registrations from storage (on install/update/startup), dropping sites whose permission was revoked.
  async function sync() {
    const sites = await list(), keep = [];
    const existing = await chrome.scripting.getRegisteredContentScripts().catch(() => []);
    const ids = existing.map((s) => s.id).filter((id) => id.startsWith("site_"));
    if (ids.length) await chrome.scripting.unregisterContentScripts({ ids }).catch(() => {});
    for (const site of sites) {
      if (await hasPermission(site)) { await registerOne(site); keep.push(site); }
    }
    if (keep.length !== sites.length) await chrome.storage.local.set({ [KEY]: keep });
    return keep;
  }

  async function enable(origin, extra = []) {
    const sites = (await list()).filter((s) => s.origin !== origin);
    const site = { origin, extra: [...new Set(extra.filter((o) => o && o !== origin))] };
    await registerOne(site);
    await chrome.storage.local.set({ [KEY]: [...sites, site] });
    return site;
  }

  async function disable(origin) {
    const sites = await list(), site = sites.find((s) => s.origin === origin);
    const id = idFor(origin);
    await chrome.scripting.unregisterContentScripts({ ids: [id + "_hook", id + "_main"] }).catch(() => {});
    await chrome.storage.local.set({ [KEY]: sites.filter((s) => s.origin !== origin) });
    if (site) await chrome.permissions.remove({ origins: patternsFor(site) }).catch(() => {});
  }

  async function find(origin) {
    return (await list()).find((s) => s.origin === origin || (s.extra || []).includes(origin)) || null;
  }

  root.WickedSites = { list, sync, enable, disable, find, patternsFor };
})(typeof self !== "undefined" ? self : window);
