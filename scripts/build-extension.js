// Builds the extension zips:
//   dist/priism-skins-<version>.zip         to load unpacked (GitHub Releases, test builds): from keys/unpacked.json's
//                                           keyedFrom version on (or with --keyed) it carries a fixed key, so it has the
//                                           same extension id in any folder and its uploads / settings survive updates
//   dist/priism-skins-<version>-store.zip   for the Chrome Web Store: never a key (the store refuses one, and assigns
//                                           its own id)
// A beta version (manifest version_name 1.2.3-beta.N) builds "Priism Skins Beta" instead:
// dist/priism-skins-beta-<version>.zip, for the beta Chrome Web Store listing (its own extension id, so it never
// mixes up settings with the stable one) and for testers' zips.
// Only the files the extension actually uses go in (no desktop app, docs, scripts or git files).
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const MAN = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8")), { version } = MAN;
const BETA = /-beta/i.test(MAN.version_name || "");
const INCLUDE = ["manifest.json", "src", "popup", "player", "icons", "vendor"];
const OUT_DIR = path.join(ROOT, "dist"), STAGE = path.join(OUT_DIR, "extension");
const ZIP = path.join(OUT_DIR, `priism-skins-${BETA ? "beta-" : ""}${version}.zip`), STORE_ZIP = ZIP.replace(/\.zip$/, "-store.zip");
const KEYS = JSON.parse(fs.readFileSync(path.join(ROOT, "keys", "unpacked.json"), "utf8"));
const vnum = (v) => String(v).split(".").map(Number), atLeast = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return true; };
const KEYED = process.argv.includes("--keyed") || (!process.argv.includes("--no-key") && atLeast(version, KEYS.keyedFrom));

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
for (const item of INCLUDE) fs.cpSync(path.join(ROOT, item), path.join(STAGE, item), { recursive: true });
// source SVGs and the 512px icon aren't needed inside the extension
for (const f of ["icons/logo.svg", "icons/logo-small.svg", "icons/icon-512.png"]) fs.rmSync(path.join(STAGE, f), { force: true });
const man = { ...MAN };
if (BETA) {
  Object.assign(man, { name: MAN.name.replace(/Priism Skins/, "Priism Skins Beta"), short_name: "Priism Beta" });
  if (man.action && man.action.default_title) man.action = { ...man.action, default_title: man.action.default_title.replace(/Priism Skins/, "Priism Skins Beta") };
}
delete man.key;
const zip = (out, m) => {
  fs.writeFileSync(path.join(STAGE, "manifest.json"), JSON.stringify(m, null, 2) + "\n");
  fs.rmSync(out, { force: true });
  try {
    execFileSync("zip", ["-qr", out, "."], { cwd: STAGE, stdio: "inherit" });
  } catch {
    // Windows without `zip`: PowerShell can do it
    execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${STAGE}\\*' -DestinationPath '${out}'`], { stdio: "inherit" });
  }
  console.log(`✓ ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
};
zip(STORE_ZIP, man);
zip(ZIP, KEYED ? { ...man, key: BETA ? KEYS.beta : KEYS.stable } : man);
console.log(KEYED ? `  unpacked zip: fixed id ${BETA ? KEYS.betaId : KEYS.stableId} (the same in any folder)` : `  unpacked zip: no fixed id yet (from ${KEYS.keyedFrom} on)`);
