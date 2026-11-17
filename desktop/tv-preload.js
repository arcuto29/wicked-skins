// Preload for the TradingView window (sandboxed, no Node). Runs hook.js in the page's own world
// before any of TradingView's scripts, exactly like the extension's document_start content script.
const { ipcRenderer, webFrame, contextBridge } = require("electron");
// Priism's bundled fonts for the chart page (content.js asks for one by name when you pick it)
try { contextBridge.exposeInMainWorld("PriismFontBridge", { get: (name) => ipcRenderer.sendSync("font-data", String(name)) }); } catch {}
const code = ipcRenderer.sendSync("hook-code");
if (code) webFrame.executeJavaScript(code).catch(() => {});
