const { app, BrowserWindow, Menu, ipcMain, session, dialog, shell } = require("electron");
const fs = require("fs");
const path = require("path");

// The extension's code (src/, popup/, icons/) is shared with the desktop app.
// In development it's next to this folder; in an installed app it's copied into resources/shared.
const ROOT = app.isPackaged ? path.join(process.resourcesPath, "shared") : path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const POPUP = path.join(ROOT, "popup", "popup.html");
const ICON = path.join(ROOT, "icons", "icon-512.png");
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");

let cfg = {};
let tvWin, settingsWin;

const load = () => { try { cfg = JSON.parse(fs.readFileSync(settingsFile(), "utf8")); } catch { cfg = {}; } };
const save = () => fs.writeFileSync(settingsFile(), JSON.stringify(cfg));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

// hook.js must run before TradingView's own scripts (it wraps the canvas API), so the TV window's
// preload asks for it synchronously and runs it in the page world at document start.
ipcMain.on("hook-code", (e) => { e.returnValue = read("hook.js"); });

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
    width: 1440, height: 900, backgroundColor: "#000000", icon: ICON, title: "Wicked Skins",
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "tv-preload.js") }, // no node access for remote content
  });
  tvWin.loadURL("https://www.tradingview.com/chart/");
  tvWin.webContents.on("did-finish-load", inject);
  tvWin.webContents.on("did-navigate-in-page", inject);
  // links that open new windows (news, help) go to the normal browser
  tvWin.webContents.setWindowOpenHandler(({ url }) => { if (/^https:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) return settingsWin.focus();
  settingsWin = new BrowserWindow({
    width: 420, height: 640, title: "Wicked Skins", icon: ICON, autoHideMenuBar: true, resizable: false,
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

// ---------- auto-updates (installed builds only) ----------
// Releases are published to GitHub by .github/workflows/release.yml; electron-updater finds them there,
// downloads in the background and installs on the next restart.
let updater = null;
function setupUpdates() {
  if (!app.isPackaged) return;
  try { ({ autoUpdater: updater } = require("electron-updater")); } catch { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on("update-downloaded", (info) => {
    dialog.showMessageBox({ type: "info", buttons: ["Restart now", "Later"], defaultId: 0,
      message: `Wicked Skins ${info.version} is ready`, detail: "It will be installed when you restart the app." })
      .then(({ response }) => { if (response === 0) updater.quitAndInstall(); });
  });
  updater.on("error", () => {}); // offline etc.: try again next time
  updater.checkForUpdates().catch(() => {});
  setInterval(() => updater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);
}
async function checkNow() {
  if (!updater) return dialog.showMessageBox({ message: "Updates are checked automatically in the installed app." });
  try {
    const r = await updater.checkForUpdates();
    const latest = r && r.updateInfo && r.updateInfo.version;
    if (!latest || latest === app.getVersion()) dialog.showMessageBox({ message: `You're on the latest version (${app.getVersion()}).` });
    else dialog.showMessageBox({ message: `Downloading ${latest}…`, detail: "You'll be asked to restart when it's ready." });
  } catch { dialog.showMessageBox({ message: "Couldn't check for updates right now." }); }
}

app.whenReady().then(() => {
  load();
  // Allow user-chosen wallpapers (data:/blob:) regardless of the site's media CSP.
  session.defaultSession.webRequest.onHeadersReceived({ urls: ["https://*.tradingview.com/*"] }, (d, cb) => {
    const h = { ...d.responseHeaders };
    for (const k of Object.keys(h)) if (k.toLowerCase() === "content-security-policy") delete h[k];
    cb({ responseHeaders: h });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Wicked Skins", submenu: [
      { label: "Skins & wallpapers…", accelerator: "CmdOrCtrl+,", click: openSettings },
      { label: "Check for updates…", click: checkNow },
      { label: `Version ${app.getVersion()}`, enabled: false },
      { type: "separator" }, { role: "quit" },
    ] },
    { role: "viewMenu" }, { role: "editMenu" },
  ]));
  createTV();
  openSettings();
  setupUpdates();
});
app.on("window-all-closed", () => app.quit());
