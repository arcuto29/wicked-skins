const { app, BrowserWindow, Menu, ipcMain, session } = require("electron");
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src");
const POPUP = path.join(__dirname, "..", "popup", "popup.html");
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");

let cfg = {};
let tvWin, settingsWin;

const load = () => { try { cfg = JSON.parse(fs.readFileSync(settingsFile(), "utf8")); } catch { cfg = {}; } };
const save = () => fs.writeFileSync(settingsFile(), JSON.stringify(cfg));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

async function inject() {
  if (!tvWin || tvWin.isDestroyed()) return;
  const wc = tvWin.webContents;
  await wc.insertCSS(read("content.css"));
  await wc.executeJavaScript(
    `window.__BD_CFG = ${JSON.stringify(cfg)};\n` +
    `if (window.__bdUpdate) { window.__bdUpdate(window.__BD_CFG); } else {\n${read("skins.js")}\n${read("content.js")}\n}`
  );
}

function createTV() {
  tvWin = new BrowserWindow({
    width: 1440, height: 900, backgroundColor: "#000000",
    webPreferences: { contextIsolation: true, sandbox: true }, // no node access for remote content
  });
  tvWin.loadURL("https://www.tradingview.com/chart/");
  tvWin.webContents.on("did-finish-load", inject);
  tvWin.webContents.on("did-navigate-in-page", inject);
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) return settingsWin.focus();
  settingsWin = new BrowserWindow({
    width: 420, height: 640, title: "Wicked Skins", autoHideMenuBar: true, resizable: false,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: false },
  });
  settingsWin.loadFile(POPUP);
}

ipcMain.handle("store:get", (_e, defaults) => ({ ...defaults, ...cfg }));
ipcMain.handle("store:set", (_e, obj) => {
  Object.assign(cfg, obj);
  save();
  if (tvWin && !tvWin.isDestroyed()) {
    tvWin.webContents.executeJavaScript(`window.__bdUpdate && window.__bdUpdate(${JSON.stringify(obj)})`).catch(() => {});
  }
});

app.whenReady().then(() => {
  load();
  // Allow user-chosen wallpapers (data:/blob:) regardless of the site's media CSP.
  session.defaultSession.webRequest.onHeadersReceived({ urls: ["https://*.tradingview.com/*"] }, (d, cb) => {
    const h = { ...d.responseHeaders };
    for (const k of Object.keys(h)) if (k.toLowerCase() === "content-security-policy") delete h[k];
    cb({ responseHeaders: h });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Wicked Skins", submenu: [{ label: "Skins & wallpapers…", accelerator: "CmdOrCtrl+,", click: openSettings }, { role: "quit" }] },
    { role: "viewMenu" }, { role: "editMenu" },
  ]));
  createTV();
  openSettings();
});
app.on("window-all-closed", () => app.quit());
