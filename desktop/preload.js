// Used ONLY by the settings window. Gives the shared panel (popup/popup.js) a chrome.storage.local-style API.
// Electron already defines window.chrome, so we can't expose under that name; popup.js plugs this in.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wickedStore", {
  storage: {
    local: {
      get: (defaults, cb) => {
        const p = ipcRenderer.invoke("store:get", typeof defaults === "object" && defaults !== null ? defaults : {});
        return cb ? p.then(cb) : p;
      },
      set: (obj, cb) => { const p = ipcRenderer.invoke("store:set", obj); return cb ? p.then(cb) : p; },
      remove: () => Promise.resolve(),
    },
  },
  // Desktop-only: open / close the skinned TradingView window, and hear when it opens or closes.
  tv: {
    open: () => ipcRenderer.invoke("tv:open"),
    close: () => ipcRenderer.invoke("tv:close"),
    state: () => ipcRenderer.invoke("tv:state"),
    onState: (cb) => ipcRenderer.on("tv:state", (_e, s) => cb(s)),
  },
});
