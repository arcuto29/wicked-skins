/* Background service worker:
   - keeps per-site registrations (sites.js) in sync with the permissions you've granted
   - upgrades saved settings after any update (migrate.js) so they keep working */
importScripts("sites.js", "migrate.js");

WickedMigrate.run();                                   // every worker start: cheap no-op unless the version changed
chrome.runtime.onInstalled.addListener((d) => {
  WickedMigrate.run();
  WickedSites.sync().then(() => { if (d.reason === "install" || d.reason === "update") refreshOpenTabs(); });
});

// After an install or update, charts that were already open still run the old copy, which can no longer talk to the
// extension — so the panel couldn't reach them until you refreshed the page. Put a fresh copy into those tabs now;
// it takes over from the old one (see "one instance per page" in content.js) without reloading TradingView.
async function refreshOpenTabs() {
  const sites = await WickedSites.list().catch(() => []);
  const urls = ["https://*.tradingview.com/*", ...sites.flatMap((s) => [s.origin, ...(s.extra || [])].map((o) => o.replace(/\/$/, "") + "/*"))];
  const tabs = await chrome.tabs.query({ url: urls }).catch(() => []);
  for (const tab of tabs) {
    if (tab.discarded || !tab.id) continue;
    const target = { tabId: tab.id, allFrames: true };
    try {
      await chrome.scripting.executeScript({ target, world: "MAIN", files: ["src/candlelooks.js", "src/hook.js", "src/lw.js"] });
      await chrome.scripting.insertCSS({ target, files: ["src/content.css"] });
      await chrome.scripting.executeScript({ target, files: ["src/skins.js", "src/content.js"] });
    } catch {}   // a tab we can't reach (error page, permission removed) just keeps its old copy until refreshed
  }
}
chrome.runtime.onStartup.addListener(() => WickedSites.sync());
// "Turn on here": if Chrome's permission prompt closed the panel before it could finish, finish it here so a
// single click is enough (register the site, then reload its tab so the chart is skinned straight away).
chrome.permissions.onAdded.addListener(async (perm) => {
  await new Promise((r) => setTimeout(r, 1200));                  // give the panel the chance to finish first
  const { pendingSite: p } = await chrome.storage.local.get("pendingSite");
  if (!p || Date.now() - p.t > 5 * 60000) return;
  const want = [p.origin, ...(p.frames || [])].map((o) => o + "/*");
  if (!(await chrome.permissions.contains({ origins: want }))) return;
  await chrome.storage.local.remove("pendingSite");
  await WickedSites.enable(p.origin, p.frames || []);
  if (p.tabId) chrome.tabs.reload(p.tabId).catch(() => {});
});
// If you remove a site's access from chrome://extensions, stop running there too.
chrome.permissions.onRemoved.addListener(() => WickedSites.sync());
