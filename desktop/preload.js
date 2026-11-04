// Used ONLY by the settings window. Exposes a chrome.storage.local-compatible
// API so popup/popup.js runs unchanged.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("chrome", {
  storage: {
    local: {
      get: (defaults, cb) => ipcRenderer.invoke("store:get", defaults).then(cb),
      set: (obj) => ipcRenderer.invoke("store:set", obj),
    },
  },
});
