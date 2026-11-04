/* Background service worker: keeps per-site registrations (sites.js) in sync with the
   permissions you've granted, after install, updates and browser restarts. */
importScripts("sites.js");

chrome.runtime.onInstalled.addListener(() => WickedSites.sync());
chrome.runtime.onStartup.addListener(() => WickedSites.sync());
// If you remove a site's access from chrome://extensions, stop running there too.
chrome.permissions.onRemoved.addListener(() => WickedSites.sync());
