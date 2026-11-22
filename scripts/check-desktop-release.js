// Checks a desktop build before it is published (release.yml runs it on every OS, the updater tests too):
// every file the update metadata (latest*.yml / beta*.yml) points to must be in the build folder under exactly that
// name, with the same size and SHA-512, and the name must be one GitHub keeps as it is. (GitHub turns a space in
// an uploaded file's name into a dot, while electron-updater asks for a hyphen: that mismatch made every desktop
// update a 404 up to 0.1.86.) Exits 1 with the reason if anything is off.
//   node scripts/check-desktop-release.js desktop/dist
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const dir = path.resolve(process.argv[2] || "desktop/dist");
const SAFE = /^[A-Za-z0-9._-]+$/;   // GitHub keeps these characters in release asset names as they are
const problems = [], checked = [];

// electron-builder's metadata: `version`, `files: [{ url, sha512, size }]`, `path`, `sha512`
function parse(text) {
  const out = { files: [] }; let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, ""); if (!line.trim()) continue;
    const item = /^\s*-\s+url:\s*(.+)$/.exec(line);
    if (item) { cur = { url: unq(item[1]) }; out.files.push(cur); continue; }
    const kv = /^(\s*)([A-Za-z0-9]+):\s*(.*)$/.exec(line); if (!kv || kv[2] === "files") continue;
    if (kv[1].length && cur) cur[kv[2]] = unq(kv[3]); else { cur = kv[1].length ? cur : null; out[kv[2]] = unq(kv[3]); }
  }
  return out;
}
const unq = (s) => s.trim().replace(/^['"]|['"]$/g, "");
const sha512 = (f) => crypto.createHash("sha512").update(fs.readFileSync(f)).digest("base64");

const ymls = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^(latest|beta|alpha)(-mac|-linux)?\.yml$/.test(f)) : [];
if (!ymls.length) problems.push(`no update metadata (latest*.yml) in ${dir}`);
for (const y of ymls) {
  const m = parse(fs.readFileSync(path.join(dir, y), "utf8"));
  if (!m.version) problems.push(`${y}: no version`);
  if (!m.files.length) problems.push(`${y}: lists no files`);
  for (const f of m.files) {
    const where = `${y} -> ${f.url}`;
    if (!SAFE.test(f.url)) { problems.push(`${where}: GitHub would rename this file (only letters, digits, . _ - are kept)`); continue; }
    const p = path.join(dir, f.url);
    if (!fs.existsSync(p)) { problems.push(`${where}: no such file in the build (the update would be a 404)`); continue; }
    const size = fs.statSync(p).size;
    if (f.size && +f.size !== size) problems.push(`${where}: size ${size}, metadata says ${f.size}`);
    if (f.sha512 && sha512(p) !== f.sha512) problems.push(`${where}: SHA-512 doesn't match the metadata`);
    // the block map next to it (used for small, partial downloads) must be published under the matching name
    if (/\.(exe|zip)$/.test(f.url) && !fs.existsSync(p + ".blockmap")) problems.push(`${where}: no ${f.url}.blockmap next to it`);
    checked.push(`${where} (${(size / 1048576).toFixed(1)} MB, SHA-512 ok)`);
  }
  if (m.path && !m.files.some((f) => f.url === m.path)) problems.push(`${y}: path ${m.path} isn't one of its files`);
}
// every file that will be uploaded must keep its name on GitHub
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
  if (/\.(exe|zip|AppImage|blockmap|yml|dmg)$/.test(f) && !SAFE.test(f)) problems.push(`${f}: GitHub would rename this file when it's uploaded`);
}
for (const c of checked) console.log("ok  " + c);
if (problems.length) { for (const p of problems) console.error("FAIL " + p); process.exit(1); }
console.log(`Desktop release in ${dir}: ${checked.length} update file(s) match their metadata.`);
