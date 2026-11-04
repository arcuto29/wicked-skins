/* Background service worker:
   - keeps per-site registrations (sites.js) in sync with the permissions you've granted
   - upgrades saved settings after any update (migrate.js) so they keep working */
importScripts("sites.js", "migrate.js");

WickedMigrate.run();                                   // every worker start: cheap no-op unless the version changed
chrome.runtime.onInstalled.addListener(() => { WickedMigrate.run(); WickedSites.sync(); });
chrome.runtime.onStartup.addListener(() => WickedSites.sync());
// If you remove a site's access from chrome://extensions, stop running there too.
chrome.permissions.onRemoved.addListener(() => WickedSites.sync());
