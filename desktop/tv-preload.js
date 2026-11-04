// Preload for the TradingView window (sandboxed, no Node). Runs hook.js in the page's own world
// before any of TradingView's scripts, exactly like the extension's document_start content script.
const { ipcRenderer, webFrame } = require("electron");
const code = ipcRenderer.sendSync("hook-code");
if (code) webFrame.executeJavaScript(code).catch(() => {});
