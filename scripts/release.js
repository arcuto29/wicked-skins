// Prepare a release:   npm run release 0.3.0
//  1. sets that version in manifest.json, package.json and desktop/package.json
//  2. adds a section to CHANGELOG.md for you to fill in
//  3. commits and creates the tag v0.3.0
// Then:  git push --follow-tags   → GitHub Actions builds, publishes and every user updates automatically.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const v = (process.argv[2] || "").replace(/^v/, "");
if (!/^\d+\.\d+\.\d+$/.test(v)) { console.error("Usage: npm run release 1.2.3"); process.exit(1); }

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
if (git("status", "--porcelain")) { console.error("Commit or stash your changes first."); process.exit(1); }
const tags = git("tag", "--list", `v${v}`);
if (tags) { console.error(`Tag v${v} already exists.`); process.exit(1); }

for (const f of ["manifest.json", "package.json", "desktop/package.json"]) {
  const p = path.join(ROOT, f), j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.version = v;
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
}

const cl = path.join(ROOT, "CHANGELOG.md");
const old = fs.existsSync(cl) ? fs.readFileSync(cl, "utf8") : "# Changelog\n";
const date = new Date().toISOString().slice(0, 10);
const entry = `## ${v} (${date})\n- \n`;
fs.writeFileSync(cl, old.replace(/^# Changelog\n/, `# Changelog\n\n${entry}`));

execFileSync(process.execPath, [path.join(__dirname, "check.js")], { stdio: "inherit" });
console.log(`\nWrite what changed in CHANGELOG.md (users see it after updating), then run:\n` +
  `  git commit -am "Release v${v}" && git tag v${v} && git push --follow-tags\n`);
