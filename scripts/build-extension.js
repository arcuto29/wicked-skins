// Builds the store-ready extension zip: dist/priism-skins-<version>.zip
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
const ZIP = path.join(OUT_DIR, `priism-skins-${BETA ? "beta-" : ""}${version}.zip`);

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
for (const item of INCLUDE) fs.cpSync(path.join(ROOT, item), path.join(STAGE, item), { recursive: true });
// source SVGs and the 512px icon aren't needed inside the extension
for (const f of ["icons/logo.svg", "icons/logo-small.svg", "icons/icon-512.png"]) fs.rmSync(path.join(STAGE, f), { force: true });
if (BETA) {
  const m = { ...MAN, name: MAN.name.replace(/Priism Skins/, "Priism Skins Beta"), short_name: "Priism Beta" };
  if (m.action && m.action.default_title) m.action.default_title = m.action.default_title.replace(/Priism Skins/, "Priism Skins Beta");
  fs.writeFileSync(path.join(STAGE, "manifest.json"), JSON.stringify(m, null, 2) + "\n");
}

fs.rmSync(ZIP, { force: true });
try {
  execFileSync("zip", ["-qr", ZIP, "."], { cwd: STAGE, stdio: "inherit" });
} catch {
  // Windows without `zip`: PowerShell can do it
  execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${STAGE}\\*' -DestinationPath '${ZIP}'`], { stdio: "inherit" });
}
const mb = (fs.statSync(ZIP).size / 1024 / 1024).toFixed(1);
console.log(`✓ ${path.relative(ROOT, ZIP)} (${mb} MB)`);
