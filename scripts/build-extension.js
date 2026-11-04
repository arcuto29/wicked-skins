// Builds the store-ready extension zip: dist/wicked-skins-<version>.zip
// Only the files the extension actually uses go in (no desktop app, docs, scripts or git files).
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const INCLUDE = ["manifest.json", "src", "popup", "player", "icons", "vendor"];
const OUT_DIR = path.join(ROOT, "dist"), STAGE = path.join(OUT_DIR, "extension");
const ZIP = path.join(OUT_DIR, `wicked-skins-${version}.zip`);

fs.rmSync(STAGE, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
for (const item of INCLUDE) fs.cpSync(path.join(ROOT, item), path.join(STAGE, item), { recursive: true });
// source SVGs and the 512px icon aren't needed inside the extension
for (const f of ["icons/logo.svg", "icons/logo-small.svg", "icons/icon-512.png"]) fs.rmSync(path.join(STAGE, f), { force: true });

fs.rmSync(ZIP, { force: true });
try {
  execFileSync("zip", ["-qr", ZIP, "."], { cwd: STAGE, stdio: "inherit" });
} catch {
  // Windows without `zip`: PowerShell can do it
  execFileSync("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${STAGE}\\*' -DestinationPath '${ZIP}'`], { stdio: "inherit" });
}
const mb = (fs.statSync(ZIP).size / 1024 / 1024).toFixed(1);
console.log(`✓ ${path.relative(ROOT, ZIP)} (${mb} MB)`);
