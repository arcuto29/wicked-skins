const { app, BrowserWindow, Menu, ipcMain, session, dialog, shell, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");

// The extension's code (src/, popup/, icons/) is shared with the desktop app.
// In development it's next to this folder; in an installed app it's copied into resources/shared.
const ROOT = app.isPackaged ? path.join(process.resourcesPath, "shared") : path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const POPUP = path.join(ROOT, "popup", "popup.html");
const ICON = path.join(ROOT, "icons", "icon-512.png");
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");

// Look like a normal Chrome to TradingView and Google. With Electron's default identity Google refuses "Sign in with
// Google" ("This browser or app may not be secure") and you'd be stuck on a signed-out chart with no layouts.
try {
  const plat = (app.userAgentFallback.match(/\(([^)]+)\)/) || [, process.platform === "darwin" ? "Macintosh; Intel Mac OS X 10_15_7" : process.platform === "win32" ? "Windows NT 10.0; Win64; x64" : "X11; Linux x86_64"])[1];
  app.userAgentFallback = `Mozilla/5.0 (${plat}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;
} catch {}
// Sign-in and broker-connection popups (Google, Apple, your broker's login...) must open INSIDE the app, in the same
// session, or the sign-in never reaches TradingView. Everything else (news, help pages) opens in your browser.
const AUTH_URL = /(accounts|signin|sign-in|login|log-in|oauth|authori[sz]e|\/auth\b|\bauth\.|sso|consent|appleid|connect\/)/i;

let cfg = {};
let tvWin, settingsWin;

const load = () => { try { cfg = JSON.parse(fs.readFileSync(settingsFile(), "utf8")); } catch { cfg = {}; } };
const save = () => fs.writeFileSync(settingsFile(), JSON.stringify(cfg));
const read = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

// hook.js must run before TradingView's own scripts (it wraps the canvas API), so the TV window's
// preload asks for it synchronously and runs it in the page world at document start.
ipcMain.on("hook-code", (e) => { e.returnValue = read("candlelooks.js") + "\n" + read("hook.js"); });

async function inject() {
  if (!tvWin || tvWin.isDestroyed()) return;
  const wc = tvWin.webContents;
  await wc.insertCSS(read("content.css"));
  await wc.executeJavaScript(
    `window.__BD_CFG = ${JSON.stringify(cfg)};\n` +
    `if (window.__bdUpdate) { window.__bdUpdate(window.__BD_CFG); } else {\n${read("skins.js")}\n${read("content.js")}\n}`
  );
}

// Open TradingView WITH skins in its own window. Called from the app's "Open with skins" button — the app no
// longer pops a chart open by itself on launch (you choose when). Reusing an open window just focuses it.
function openTV() {
  if (tvWin && !tvWin.isDestroyed()) { tvWin.show(); tvWin.focus(); notifyTV(); return; }
  tvWin = new BrowserWindow({
    width: 1440, height: 900, backgroundColor: "#000000", icon: ICON, title: "TradingView · Priism Skins",
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "tv-preload.js") }, // no node access for remote content
  });
  tvWin.loadURL("https://www.tradingview.com/chart/");
  tvWin.webContents.on("did-finish-load", inject);
  tvWin.webContents.on("did-navigate-in-page", inject);
  tvWin.on("closed", () => { tvWin = null; notifyTV(); });
  // links that open new windows (news, help) go to the normal browser
  tvWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:/.test(url) && AUTH_URL.test(url))
      return { action: "allow", overrideBrowserWindowOptions: { parent: tvWin, width: 520, height: 720, autoHideMenuBar: true, backgroundColor: "#ffffff",
        title: "Sign in", webPreferences: { contextIsolation: true, sandbox: true } } };
    if (/^https:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  tvWin.setMenuBarVisibility(false);
  // No menu bar in the chart window, so Ctrl+, (Cmd+, on Mac) or F1 brings the Priism Skins settings to the front.
  tvWin.webContents.on("before-input-event", (e, i) => {
    if (i.type === "keyDown" && ((i.key === "," && (i.control || i.meta)) || i.key === "F1")) { e.preventDefault(); openSettings(); }
  });
  notifyTV();
}
function closeTV() { if (tvWin && !tvWin.isDestroyed()) tvWin.close(); }
const tvOpen = () => !!(tvWin && !tvWin.isDestroyed());
// Tell the settings window whether the skinned chart is open, so it can show the right button (like ChartSkins).
function notifyTV() {
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send("tv:state", { open: tvOpen() });
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { if (settingsWin.isMinimized()) settingsWin.restore(); settingsWin.show(); return settingsWin.focus(); }
  settingsWin = new BrowserWindow({
    width: 1360, height: 880, minWidth: 1040, minHeight: 680, title: "Priism Skins", icon: ICON, autoHideMenuBar: true, backgroundColor: "#07080c",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: false },
  });
  // web links from the panel (Share my look, Workshop website) open in your normal browser
  settingsWin.webContents.setWindowOpenHandler(({ url }) => { if (/^https:/.test(url)) shell.openExternal(url); return { action: "deny" }; });
  settingsWin.loadFile(POPUP);
  settingsWin.webContents.on("did-finish-load", notifyTV);
  settingsWin.on("closed", () => { settingsWin = null; });
}

// Commands from the settings window's "Open with skins" / "Turn off" buttons.
ipcMain.handle("tv:open", () => { openTV(); return tvOpen(); });
ipcMain.handle("tv:close", () => { closeTV(); return false; });
ipcMain.handle("tv:state", () => ({ open: tvOpen() }));
// Live numbers for the app's top bar: the chart's wallpaper FPS, and how much of the computer the app is using.
ipcMain.handle("app:stats", async () => {
  let cpu = 0, mem = 0;
  try { for (const p of app.getAppMetrics()) { cpu += (p.cpu && p.cpu.percentCPUUsage) || 0; mem += (p.memory && p.memory.workingSetSize) || 0; } } catch {}
  let fps = null;
  if (tvOpen()) { try { fps = await tvWin.webContents.executeJavaScript("window.__bdFpsNow || null", true); } catch {} }
  return { open: tvOpen(), fps, cpu: Math.round(cpu / Math.max(1, require("os").cpus().length)), mem: Math.round(mem / 1024) };
});
// Record / snapshot buttons in the app's panel: run them in the chart window as if you'd pressed the shortcut there
// (userGesture = true, so screen sharing and sound are allowed).
ipcMain.handle("tv:action", async (_e, kind) => {
  if (!tvOpen()) return { ok: false, reason: "Open your chart first (Open TradingView with skins), then try again." };
  if (!["record", "snapshot"].includes(kind)) return { ok: false };
  try { return await tvWin.webContents.executeJavaScript(`window.__bdAction ? window.__bdAction(${JSON.stringify(kind)}) : { ok: false, reason: "The chart is still loading." }`, true); }
  catch { return { ok: false, reason: "Couldn't reach the chart window." }; }
});

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
      message: `Priism Skins ${info.version} is ready`, detail: "It will be installed when you restart the app." })
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
  // Whole-screen recording + computer sound: Electron has no screen picker of its own, so give it the main screen
  // (macOS 15+ shows the system picker instead). Windows can also capture the computer's sound ("loopback").
  try {
    session.defaultSession.setDisplayMediaRequestHandler((req, cb) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((src) => {
        if (!src[0]) return cb({});
        cb({ video: src[0], ...(req.audioRequested && process.platform === "win32" ? { audio: "loopback" } : {}) });
      }).catch(() => cb({}));
    }, { useSystemPicker: true });
  } catch {}
  load();
  // Allow user-chosen wallpapers (data:/blob:) regardless of the site's media CSP.
  session.defaultSession.webRequest.onHeadersReceived({ urls: ["https://*.tradingview.com/*"] }, (d, cb) => {
    const h = { ...d.responseHeaders };
    for (const k of Object.keys(h)) if (k.toLowerCase() === "content-security-policy") delete h[k];
    cb({ responseHeaders: h });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "Priism Skins", submenu: [
      { label: "Open TradingView with skins", accelerator: "CmdOrCtrl+O", click: openTV },
      { label: "Skins & wallpapers…", accelerator: "CmdOrCtrl+,", click: openSettings },
      { label: "Check for updates…", click: checkNow },
      { label: `Version ${app.getVersion()}`, enabled: false },
      { type: "separator" }, { role: "quit" },
    ] },
    { role: "viewMenu" }, { role: "editMenu" },
  ]));
  openSettings();            // the app opens to its settings/gallery — it no longer pops a chart open by itself
  setupUpdates();
});
app.on("activate", () => { if (!settingsWin || settingsWin.isDestroyed()) openSettings(); });
app.on("window-all-closed", () => app.quit());
