// Prepare a release:   npm run release 0.3.0     (or a beta for testers: npm run release 0.3.0-beta.1)
//  1. sets that version everywhere: manifest.json, package.json, desktop/package.json, android/app/build.gradle
//     (each in its own form: scripts/versions.js)
//  2. adds a section to CHANGELOG.md for you to fill in
// Then commit, tag and push the tag. GitHub Actions builds and tests everything, then WAITS for the owner's approval
// (environment "release"); only after it does anything get published (RELEASING.md).
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const v = (process.argv[2] || "").replace(/^v/, "");
const V = require("./versions").parse(v);
if (!V) { console.error("Usage: npm run release 1.2.3   (or 1.2.3-beta.1 for a beta)"); process.exit(1); }

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
if (git("status", "--porcelain")) { console.error("Commit or stash your changes first."); process.exit(1); }
const tags = git("tag", "--list", `v${v}`);
if (tags) { console.error(`Tag v${v} already exists.`); process.exit(1); }

for (const f of ["manifest.json", "package.json", "desktop/package.json"]) {
  const p = path.join(ROOT, f), j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (f === "manifest.json") { j.version = V.manifest; if (V.versionName) j.version_name = V.versionName; else delete j.version_name; }
  else j.version = V.semver;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
}
{ const p = path.join(ROOT, "android/app/build.gradle"); let g = fs.readFileSync(p, "utf8");
  g = g.replace(/versionCode \d+/, `versionCode ${V.versionCode}`).replace(/versionName "[^"]*"/, `versionName "${V.semver}"`); fs.writeFileSync(p, g); }

const cl = path.join(ROOT, "CHANGELOG.md");
const old = fs.existsSync(cl) ? fs.readFileSync(cl, "utf8") : "# Changelog\n";
const date = new Date().toISOString().slice(0, 10);
const entry = `## ${v} (${date})\n- \n`;
fs.writeFileSync(cl, old.replace(/^# Changelog\n/, `# Changelog\n\n${entry}`));

execFileSync(process.execPath, [path.join(__dirname, "check.js")], { stdio: "inherit" });
console.log(`\nWrite what changed in CHANGELOG.md (users see it after updating), then run:\n` +
  `  git commit -am "Release v${V.semver}" && git tag v${V.semver} && git push --follow-tags\n` +
  `Nothing is published until the owner approves the release in GitHub Actions.\n`);
