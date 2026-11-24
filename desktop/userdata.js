// The app's settings (uploads included) live in its own folder (Electron's userData, named after the app). The app
// was called "Wicked Skins" before it was renamed Priism Skins, and the folder's name changed with it, so the first
// start after that update found an empty folder. If this folder has no settings yet, an older folder's settings are
// copied over (copied, never moved or deleted: the old folder stays exactly as it was, and is never read again once
// this one has settings).
const fs = require("fs"), path = require("path");
const OLD_NAMES = ["Wicked Skins", "wicked-skins-desktop", "wicked-skins", "priism-skins-desktop"];
const FILES = ["settings.json", "chart-window.json"];
function readable(f) { try { const v = JSON.parse(fs.readFileSync(f, "utf8")); return !!v && typeof v === "object"; } catch { return false; } }
function recoverOldSettings(appData, userData, names = OLD_NAMES) {
  const mine = path.join(userData, "settings.json");
  if (fs.existsSync(mine) || fs.existsSync(mine + ".bak")) return null;   // this folder already has settings: never touched
  for (const n of names) {
    const dir = path.join(appData, n);
    if (path.resolve(dir) === path.resolve(userData)) continue;
    const src = [path.join(dir, "settings.json"), path.join(dir, "settings.json.bak")].find(readable);
    if (!src) continue;
    fs.mkdirSync(userData, { recursive: true });
    fs.copyFileSync(src, mine + ".tmp"); fs.renameSync(mine + ".tmp", mine);
    for (const f of FILES.slice(1)) { const o = path.join(dir, f); if (readable(o) && !fs.existsSync(path.join(userData, f))) fs.copyFileSync(o, path.join(userData, f)); }
    fs.writeFileSync(path.join(userData, "recovered-from.txt"), `Settings copied from ${src} on ${new Date().toISOString()}\n`);
    return src;
  }
  return null;
}
module.exports = { recoverOldSettings, OLD_NAMES };
