/* Android settings shim. The shared popup (popup.js) expects window.chrome.storage.local; on Android there is
   no extension API, so we back it with the native bridge (window.PriismNative, from MainActivity.Bridge).
   This mirrors desktop/preload.js, which exposes the same shape as window.wickedStore for the Electron app.
   Injected by MainActivity at onPageFinished, before popup.js reads storage on load. */
(function () {
  if (!window.PriismNative) return;                 // not running inside the Android shell
  const N = window.PriismNative;
  const read = () => { try { return JSON.parse(N.get() || "{}"); } catch { return {}; } };
  const listeners = [];

  const storage = {
    local: {
      get(defaults, cb) {
        const stored = read();
        const out = {};
        if (defaults && typeof defaults === "object" && !Array.isArray(defaults)) {
          for (const k in defaults) out[k] = k in stored ? stored[k] : defaults[k];
        } else if (typeof defaults === "string") {
          out[defaults] = stored[defaults];
        } else if (Array.isArray(defaults)) {
          for (const k of defaults) out[k] = stored[k];
        } else {
          Object.assign(out, stored);
        }
        cb && cb(out);
      },
      set(obj, cb) {
        N.set(JSON.stringify(obj));                 // native persists + pushes to the chart live
        const changes = {};
        for (const k in obj) changes[k] = { newValue: obj[k] };
        listeners.forEach((f) => { try { f(changes, "local"); } catch {} });
        cb && cb();
      },
    },
    onChanged: { addListener: (f) => listeners.push(f) },
  };

  window.chrome = window.chrome || {};
  window.chrome.storage = storage;
  // popup.js has no extension id on Android, so EXT_MODE is false and it runs in its page-only mode.

  // Give the sheet a way to close itself (a header button could call this).
  window.priismClose = () => N.closeSettings && N.closeSettings();
})();
