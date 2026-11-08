// Preload for the chart window's tab bar (desktop/tabs.html): a tiny API to the main process. No Node for the page.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("priismTabs", {
  onState: (cb) => ipcRenderer.on("tabs:state", (_e, s) => cb(s)),   // { tabs: [{ id, title }], active }
  ready: () => ipcRenderer.send("tabs:ready"),
  add: () => ipcRenderer.send("tabs:add"),
  select: (id) => ipcRenderer.send("tabs:select", id),
  close: (id) => ipcRenderer.send("tabs:close", id),
  settings: () => ipcRenderer.send("tabs:settings"),
});
