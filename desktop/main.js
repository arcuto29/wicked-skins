const { app, BrowserWindow, WebContentsView, Menu, ipcMain, session, dialog, shell, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");

// The extension's code (src/, popup/, icons/) is shared with the desktop app.
// In development it's next to this folder; in an installed app it's copied into resources/shared.
const ROOT = app.isPackaged ? path.join(process.resourcesPath, "shared") : path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const POPUP = path.join(ROOT, "popup", "popup.html");
const ICON = path.join(ROOT, "icons", "icon-512.png");
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
const deskFile = () => path.join(app.getPath("userData"), "chart-window.json");   // your tabs + window size, restored next time

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

async function inject(wc) {
  if (!wc || wc.isDestroyed()) return;
  await wc.insertCSS(read("content.css"));
  await wc.executeJavaScript(
    `window.__BD_CFG = ${JSON.stringify(cfg)};\n` +
    `if (window.__bdUpdate) { window.__bdUpdate(window.__BD_CFG); } else {\n${read("skins.js")}\n${read("sounds.js")}\n${read("content.js")}\n}`
  );
}

// ---------- the chart window: TradingView in tabs, like TradingView Desktop ----------
// One window with a slim tab bar (desktop/tabs.html). Each tab is a real tradingview.com page with Priism Skins on it,
// in the same signed-in session. Your tabs (with their layouts: TradingView keeps the layout in the address) and the
// window size are saved and come back next time. Ctrl+T new tab, Ctrl+W close, Ctrl+Tab next, Ctrl+1-9 jump.
const CHART = "https://www.tradingview.com/chart/";
const TV_URL = /^https:\/\/([a-z]+\.)?tradingview\.com\//i;
const BAR = 37;
let tabs = [], activeTab = 0, tabSeq = 0, saveT = 0;
const loadDesk = () => { try { return JSON.parse(fs.readFileSync(deskFile(), "utf8")) || {}; } catch { return {}; } };
function saveDesk() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    if (!tvOpen()) return;
    const urls = tabs.map((t) => t.view.webContents.getURL()).filter((u) => TV_URL.test(u));
    const b = tvWin.getNormalBounds();
    try { fs.writeFileSync(deskFile(), JSON.stringify({ tabs: urls.length ? urls : [CHART], active: Math.max(0, tabs.findIndex((t) => t.id === activeTab)), bounds: b, max: tvWin.isMaximized() })); } catch {}
  }, 400);
}
const activeWC = () => { const t = tabs.find((x) => x.id === activeTab); return t && !t.view.webContents.isDestroyed() ? t.view.webContents : null; };
function sendTabs() {
  if (!tvOpen()) return;
  tvWin.webContents.send("tabs:state", { tabs: tabs.map((t) => ({ id: t.id, title: t.title })), active: activeTab });
  const t = tabs.find((x) => x.id === activeTab); tvWin.setTitle(((t && t.title) || "TradingView") + " \u00B7 Priism Skins");
}
function layoutTabs() {
  if (!tvOpen()) return;
  const { width, height } = tvWin.getContentBounds();
  for (const t of tabs) {
    const on = t.id === activeTab;
    t.view.setBounds({ x: 0, y: BAR, width, height: Math.max(0, height - BAR) });
    t.view.setVisible(on);
    // a tab you're not looking at pauses its wallpaper (it would only use your computer for nothing)
    t.view.webContents.executeJavaScript(`window.__bdBackground = ${!on}`).catch(() => {});
  }
}
function tabKeys(e, i) {
  if (i.type !== "keyDown") return;
  const mod = i.control || i.meta, k = (i.key || "").toLowerCase();
  const act = () => { e.preventDefault(); };
  if ((k === "," && mod) || i.key === "F1") { act(); openSettings(); }
  else if (mod && k === "t") { act(); addTab(CHART); }
  else if (mod && k === "w") { act(); closeTab(activeTab); }
  else if (mod && k === "tab") { act(); const n = tabs.findIndex((t) => t.id === activeTab), d = i.shift ? -1 : 1; selectTab(tabs[(n + d + tabs.length) % tabs.length].id); }
  else if (mod && /^[1-9]$/.test(k)) { act(); const t = k === "9" ? tabs[tabs.length - 1] : tabs[+k - 1]; if (t) selectTab(t.id); }
}
function addTab(url, activate = true) {
  if (!tvOpen()) return;
  const view = new WebContentsView({ webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "tv-preload.js") } });  // no node access for remote content
  view.setBackgroundColor("#000000");
  const t = { id: ++tabSeq, view, title: "TradingView" };
  tabs.push(t);
  tvWin.contentView.addChildView(view);
  const wc = view.webContents;
  wc.on("did-finish-load", () => inject(wc));
  wc.on("did-navigate-in-page", () => { inject(wc); saveDesk(); });
  wc.on("page-title-updated", (_e, title) => { t.title = title; sendTabs(); });
  // After signing in, TradingView lands on its home page: bring you back to your chart.
  let signingIn = false;
  wc.on("did-navigate", (_e, u) => {
    if (/tradingview\.com\/accounts\/signin/.test(u)) signingIn = true;
    else if (signingIn && /^https:\/\/(www\.)?tradingview\.com\/?(\?.*)?$/.test(u)) { signingIn = false; wc.loadURL(CHART); }
    saveDesk();
  });
  // sign-in popups stay in the app (same session); chart links open as a new tab; everything else in your browser
  wc.setWindowOpenHandler(({ url: u }) => {
    if (/^https:/.test(u) && AUTH_URL.test(u))
      return { action: "allow", overrideBrowserWindowOptions: { parent: tvWin, width: 520, height: 720, autoHideMenuBar: true, backgroundColor: "#ffffff",
        title: "Sign in", webPreferences: { contextIsolation: true, sandbox: true } } };
    if (/^https:\/\/(www\.)?tradingview\.com\/chart\//.test(u)) { setImmediate(() => addTab(u)); return { action: "deny" }; }
    if (/^https:/.test(u)) shell.openExternal(u);
    return { action: "deny" };
  });
  wc.on("before-input-event", tabKeys);
  wc.loadURL(TV_URL.test(url) ? url : CHART);
  if (activate || tabs.length === 1) selectTab(t.id); else { layoutTabs(); sendTabs(); }
  saveDesk();
  return t;
}
function selectTab(id) { if (!tabs.some((t) => t.id === id)) return; activeTab = id; layoutTabs(); sendTabs(); const wc = activeWC(); if (wc) wc.focus(); saveDesk(); }
function closeTab(id) {
  const n = tabs.findIndex((t) => t.id === id); if (n < 0) return;
  if (tabs.length === 1) return tvWin.close();            // closing the last tab closes the window (like a browser)
  const [t] = tabs.splice(n, 1);
  try { tvWin.contentView.removeChildView(t.view); t.view.webContents.close(); } catch {}
  if (activeTab === id) activeTab = tabs[Math.min(n, tabs.length - 1)].id;
  layoutTabs(); sendTabs(); saveDesk();
}

// Open TradingView WITH skins. Called from the app's "Open with skins" button (the app doesn't pop a chart open by
// itself). Reusing an open window just focuses it. Your tabs and window size come back from last time.
function openTV() {
  if (tvWin && !tvWin.isDestroyed()) { tvWin.show(); tvWin.focus(); notifyTV(); return; }
  const st = loadDesk(), b = st.bounds || {};
  tvWin = new BrowserWindow({
    width: b.width || 1440, height: b.height || 900, ...(Number.isFinite(b.x) && Number.isFinite(b.y) ? { x: b.x, y: b.y } : {}),
    minWidth: 720, minHeight: 480, backgroundColor: "#0b0d12", icon: ICON, title: "TradingView \u00B7 Priism Skins",
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "tabs-preload.js") },
  });
  if (st.max) tvWin.maximize();
  tabs = []; activeTab = 0;
  tvWin.loadFile(path.join(__dirname, "tabs.html"));
  const urls = (Array.isArray(st.tabs) ? st.tabs : []).filter((u) => typeof u === "string" && TV_URL.test(u)).slice(0, 12);
  (urls.length ? urls : [CHART]).forEach((u, i) => addTab(u, i === (st.active || 0)));
  if (!tabs.some((t) => t.id === activeTab) && tabs[0]) selectTab(tabs[0].id);
  tvWin.on("resize", () => { layoutTabs(); saveDesk(); });
  tvWin.on("move", saveDesk);
  tvWin.on("close", () => { clearTimeout(saveT); try {   // save right away: the tabs are about to go
    const urls = tabs.map((t) => t.view.webContents.getURL()).filter((u) => TV_URL.test(u));
    fs.writeFileSync(deskFile(), JSON.stringify({ tabs: urls.length ? urls : [CHART], active: Math.max(0, tabs.findIndex((t) => t.id === activeTab)), bounds: tvWin.getNormalBounds(), max: tvWin.isMaximized() }));
  } catch {} });
  tvWin.on("closed", () => { tvWin = null; tabs = []; notifyTV(); flushCookies(); });
  tvWin.webContents.on("before-input-event", tabKeys);
  tvWin.setMenuBarVisibility(false);
  notifyTV();
}
ipcMain.on("tabs:ready", sendTabs);
ipcMain.on("tabs:add", () => addTab(CHART));
ipcMain.on("tabs:select", (_e, id) => selectTab(id));
ipcMain.on("tabs:close", (_e, id) => closeTab(id));
ipcMain.on("tabs:settings", () => openSettings());
// Stay signed in: write the session's cookies to disk now and then, and when the app closes.
const flushCookies = () => { try { session.defaultSession.cookies.flushStore(); } catch {} };
setInterval(flushCookies, 60000);
app.on("before-quit", flushCookies);
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
  const wc = activeWC(); if (wc) { try { fps = await wc.executeJavaScript("window.__bdFpsNow || null", true); } catch {} }
  return { open: tvOpen(), fps, cpu: Math.round(cpu / Math.max(1, require("os").cpus().length)), mem: Math.round(mem / 1024) };
});
// Record / snapshot buttons in the app's panel: run them in the chart window as if you'd pressed the shortcut there
// (userGesture = true, so screen sharing and sound are allowed).
ipcMain.handle("tv:action", async (_e, kind) => {
  if (!tvOpen()) return { ok: false, reason: "Open your chart first (Open TradingView with skins), then try again." };
  if (!["record", "snapshot"].includes(kind)) return { ok: false };
  const wc = activeWC(); if (!wc) return { ok: false, reason: "Open your chart first (Open TradingView with skins), then try again." };
  try { return await wc.executeJavaScript(`window.__bdAction ? window.__bdAction(${JSON.stringify(kind)}) : { ok: false, reason: "The chart is still loading." }`, true); }
  catch { return { ok: false, reason: "Couldn't reach the chart window." }; }
});

ipcMain.handle("store:get", (_e, defaults) => ({ ...defaults, ...cfg }));
ipcMain.handle("store:set", (_e, obj) => {
  Object.assign(cfg, obj);
  save();
  for (const t of tabs) {              // every open tab takes the change
    if (!t.view.webContents.isDestroyed()) t.view.webContents.executeJavaScript(`window.__bdUpdate && window.__bdUpdate(${JSON.stringify(obj)})`).catch(() => {});
  }
});

// ---------- auto-updates (installed builds only) ----------
// Releases are published to GitHub by .github/workflows/release.yml; electron-updater finds them there,
// downloads in the background and installs on the next restart.
// When one is ready, the panel shows the "Update ready" card (popup/update-card.js, shared with the extension).
// It never pops up over the chart: if the panel is closed, the card waits for it, and the update installs anyway
// when you quit. "Restart & update" reopens your chart tabs afterwards if they were open.
let updater = null, pendingUpdate = null;
const resumeFile = () => path.join(app.getPath("userData"), "resume-chart.json");
ipcMain.on("app:version", (e) => { e.returnValue = app.getVersion(); });
ipcMain.handle("upd:pending", () => pendingUpdate);
ipcMain.handle("upd:install", () => {
  if (!updater || !pendingUpdate) return false;
  try { fs.writeFileSync(resumeFile(), JSON.stringify({ chart: tvOpen(), at: Date.now() })); } catch {}
  saveDesk(); flushCookies();
  setTimeout(() => updater.quitAndInstall(true, true), 500);     // let the tab list save first; silent install, relaunch
  return true;
});
function setupUpdates() {
  if (!app.isPackaged) return;
  try { ({ autoUpdater: updater } = require("electron-updater")); } catch { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on("update-downloaded", (info) => {
    pendingUpdate = { version: info.version };
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send("upd:ready", pendingUpdate);
  });
  updater.on("error", () => {}); // offline etc.: try again next time
  updater.checkForUpdates().catch(() => {});
  setInterval(() => updater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);
}
async function checkNow() {
  if (!updater) return dialog.showMessageBox({ message: "Updates are checked automatically in the installed app." });
  if (pendingUpdate) {                                   // already downloaded: show the card
    openSettings();
    const send = () => settingsWin && !settingsWin.isDestroyed() && settingsWin.webContents.send("upd:ready", pendingUpdate);
    return settingsWin.webContents.isLoading() ? settingsWin.webContents.once("did-finish-load", send) : send();
  }
  try {
    const r = await updater.checkForUpdates();
    const latest = r && r.updateInfo && r.updateInfo.version;
    if (!latest || latest === app.getVersion()) dialog.showMessageBox({ message: `You're on the latest version (${app.getVersion()}).` });
    else dialog.showMessageBox({ message: `Downloading ${latest}…`, detail: "The panel tells you when it's ready to install." });
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
  // just restarted by "Restart & update" with the chart open: bring the chart tabs back
  try { const r = JSON.parse(fs.readFileSync(resumeFile(), "utf8")); fs.unlinkSync(resumeFile()); if (r && r.chart && Date.now() - r.at < 10 * 60000) openTV(); } catch {}
  setupUpdates();
});
app.on("activate", () => { if (!settingsWin || settingsWin.isDestroyed()) openSettings(); });
app.on("window-all-closed", () => app.quit());
