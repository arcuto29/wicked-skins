// Quick safety net run on every PR and before every release:
// all JS parses, manifest is valid JSON, and every version number matches.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
let bad = 0;

const js = [];
for (const dir of ["src", "popup", "player", "desktop", "scripts"]) {
  for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith(".js")) js.push(path.join(dir, f));
}
for (const f of js) {
  try { execFileSync(process.execPath, ["--check", path.join(ROOT, f)], { stdio: "pipe" }); }
  catch (e) { bad++; console.error("✗ syntax:", f, "\n", String(e.stderr || e).slice(0, 400)); }
}

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const manifest = read("manifest.json"), root = read("package.json"), desk = read("desktop/package.json");
const versions = { "manifest.json": manifest.version, "package.json": root.version, "desktop/package.json": desk.version };
if (new Set(Object.values(versions)).size !== 1) { bad++; console.error("✗ versions differ:", versions); }

// Chrome Web Store rejects a manifest "description" longer than 132 characters — catch it before upload.
if (manifest.description && manifest.description.length > 132) {
  bad++; console.error(`✗ manifest description is ${manifest.description.length} chars (Chrome Web Store max is 132)`);
}

// every file the manifest points at must exist
const refs = [
  ...manifest.content_scripts.flatMap((c) => [...(c.js || []), ...(c.css || [])]),
  manifest.action.default_popup, manifest.background && manifest.background.service_worker,
  ...Object.values(manifest.icons || {}),
  ...(manifest.web_accessible_resources || []).flatMap((w) => w.resources),
].filter(Boolean);
for (const r of refs) if (!fs.existsSync(path.join(ROOT, r))) { bad++; console.error("✗ manifest points at missing file:", r); }

if (process.env.EXPECT_VERSION && process.env.EXPECT_VERSION !== manifest.version) {
  bad++; console.error(`✗ tag v${process.env.EXPECT_VERSION} doesn't match manifest version ${manifest.version}`);
}

if (bad) { console.error(`\n${bad} problem(s).`); process.exit(1); }
console.log(`✓ ${js.length} JS files parse · manifest OK · version ${manifest.version} everywhere`);
