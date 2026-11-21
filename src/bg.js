/* Background service worker:
   - keeps per-site registrations (sites.js) in sync with the permissions you've granted
   - upgrades saved settings after any update (migrate.js) so they keep working */
importScripts("sites.js", "migrate.js", "workshop-config.js", "invite.js");
// Invite only: re-check the saved invite code now and then (at most once a day), so a revoked code locks this copy.
const inviteCheck = () => { try { PriismInvite.recheck(false); } catch {} };
inviteCheck(); setInterval(inviteCheck, 6 * 3600e3);

WickedMigrate.run();                                   // every worker start: cheap no-op unless the version changed
chrome.runtime.onInstalled.addListener((d) => {
  WickedMigrate.run();
  if (d.reason === "update") chrome.storage.local.remove("updateReady");
  WickedSites.sync().then(() => { if (d.reason === "install" || d.reason === "update") refreshOpenTabs(); });
  // First install (e.g. from the Chrome Web Store): open a TradingView chart, where a welcome card explains how to
  // pin Priism Skins and pick a look. The chart is already skinned, so you see what it does straight away.
  if (d.reason === "install") {
    chrome.storage.local.set({ welcomePending: Date.now() });
    chrome.tabs.create({ url: "https://www.tradingview.com/chart/" }).catch(() => {});
  }
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
      // already running the current copy (e.g. a tab that opened during the install): nothing to do
      const probe = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => !!window.__bdContentAlive }).catch(() => []);
      if (probe.some((r) => r.result)) continue;
      await chrome.scripting.executeScript({ target, world: "MAIN", files: ["src/candlelooks.js", "src/hook.js", "src/lw.js"] });
      await chrome.scripting.insertCSS({ target, files: ["src/content.css"] });
      await chrome.scripting.executeScript({ target, files: ["src/skins.js", "src/sounds.js", "src/pass.js", "src/acct.js", "src/content.js"] });
    } catch {}   // a tab we can't reach (error page, permission removed) just keeps its old copy until refreshed
  }
}
chrome.runtime.onStartup.addListener(() => WickedSites.sync());
// A store update has downloaded and is waiting: the panel offers "Update now" (popup.js). If nobody takes it, Chrome
// still applies it by itself when Priism is idle, and the panel shows "Updated" instead.
chrome.runtime.onUpdateAvailable.addListener((d) => chrome.storage.local.set({ updateReady: { version: d.version, at: Date.now() } }));
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
// "Turn on" on the card offer.js shows on a trading platform Priism knows. The site is the page that asked (Chrome
// says which), never one named in the message, and it must be one Priism already has access to (manifest
// host_permissions). Frames from other sites Priism isn't allowed on are left out; if the chart itself is only in one
// of those, it isn't turned on and the card says what to do.
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (!msg || msg.priism !== "site-on") return;
  (async () => {
    if (!sender.tab || sender.frameId !== 0 || !/^https:\/\//.test(sender.origin || "")) return reply({ ok: false });
    const origin = sender.origin;
    if (!(await chrome.permissions.contains({ origins: [origin + "/*"] }))) return reply({ ok: false });
    const frames = [...new Set((Array.isArray(msg.frames) ? msg.frames : []).filter((o) => typeof o === "string" && /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(o) && o !== origin))].slice(0, 8);
    const missing = [];
    for (const o of frames) if (!(await chrome.permissions.contains({ origins: [o + "/*"] }))) missing.push(o);
    // only a problem when the chart itself is in one of those frames (not e.g. a ticker widget next to it)
    if (missing.length && !msg.direct) return reply({ ok: false, missing });
    await WickedSites.enable(origin, frames.filter((o) => !missing.includes(o)));
    reply({ ok: true });
    chrome.tabs.reload(sender.tab.id).catch(() => {});
  })().catch(() => reply({ ok: false }));
  return true;   // answers after the awaits
});
// If you remove a site's access from chrome://extensions, stop running there too.
chrome.permissions.onRemoved.addListener(() => WickedSites.sync());
