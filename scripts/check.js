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
// one version everywhere, each in its platform's form (scripts/versions.js)
const V = require("./versions").parse(root.version);
const gradle = fs.readFileSync(path.join(ROOT, "android/app/build.gradle"), "utf8");
const aCode = +((/versionCode (\d+)/.exec(gradle) || [])[1]), aName = (/versionName "([^"]*)"/.exec(gradle) || [])[1];
if (!V) { bad++; console.error(`✗ package.json version ${root.version} isn't 1.2.3 or 1.2.3-beta.N`); }
else {
  const want = { "desktop/package.json": [desk.version, V.semver], "manifest.json version": [manifest.version, V.manifest], "manifest.json version_name": [manifest.version_name, V.versionName],
    "android versionName": [aName, V.semver], "android versionCode": [aCode, V.versionCode] };
  for (const [k, [have, should]] of Object.entries(want)) if (have !== should) { bad++; console.error(`✗ ${k} is ${have}, should be ${should} (run: npm run release ${V.semver})`); }
}

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
// (a "dir/*.ext" pattern must match at least one file)
const exists = (r) => { if (!r.includes("*")) return fs.existsSync(path.join(ROOT, r));
  const dir = path.join(ROOT, path.dirname(r)), re = new RegExp("^" + path.basename(r).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => re.test(f)); };
for (const r of refs) if (!exists(r)) { bad++; console.error("✗ manifest points at missing file:", r); }

if (process.env.EXPECT_VERSION && process.env.EXPECT_VERSION !== root.version) {
  bad++; console.error(`✗ tag v${process.env.EXPECT_VERSION} doesn't match the version ${root.version}`);
}

// Order safety: Priism is visual only. Nothing in src/ may talk to the network beyond the reviewed calls (fonts, invite
// check, Workshop), patch the platform's network objects, cancel the platform's events, or send it synthetic input.
// A new use fails CI until someone has looked at it and updated the reviewed count here.
const REVIEWED = {
  network: { re: /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/g, ok: { "content.js": 1, "invite.js": 1, "workshop.js": 1 } },
  patchNetwork: { re: /\b(?:window\.)?(?:fetch|XMLHttpRequest|WebSocket)(?:\.prototype(?:\.\w+)?)?\s*=(?!=)/g, ok: {} },
  // Priism's own shortcut keys, crop overlay, clip player and magnifier only
  cancelEvents: { re: /\.(?:preventDefault|stopPropagation|stopImmediatePropagation)\(/g, ok: { "content.js": 6 } },
  // lw.js: a ±0.0001 wheel nudge on the chart canvas so Lightweight Charts repaints; no clicks, keys or pointer events
  syntheticInput: { re: /new (?:Mouse|Pointer|Keyboard|Wheel|Touch|Input)Event\(|\.click\(\)/g, ok: { "lw.js": 2, "content.js": 1 } },
};
for (const f of fs.readdirSync(path.join(ROOT, "src"))) if (f.endsWith(".js")) {
  const s = fs.readFileSync(path.join(ROOT, "src", f), "utf8");
  for (const [k, { re, ok }] of Object.entries(REVIEWED)) {
    const n = (s.match(re) || []).length;
    if (n > (ok[f] || 0)) { bad++; console.error(`✗ order safety: ${f} has ${n} ${k} use(s), ${ok[f] || 0} reviewed. Check it can't touch orders, account data or the network, then update REVIEWED in scripts/check.js`); }
  }
}

// fixed ids for unpacked copies (uploads survive updates in a new folder): the keys give exactly the ids written next
// to them, the panel waits for the same first version, and the repo's own manifest never has a key (the store refuses
// it; the build adds it to the unpacked zip only)
{ const K = JSON.parse(fs.readFileSync(path.join(ROOT, "keys", "unpacked.json"), "utf8"));
  const idOf = (b64) => [...require("crypto").createHash("sha256").update(Buffer.from(b64, "base64")).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  if (idOf(K.stable) !== K.stableId || idOf(K.beta) !== K.betaId) { bad++; console.error("✗ keys/unpacked.json: a key doesn't give the id next to it"); }
  if (K.stableId === K.betaId) { bad++; console.error("✗ keys/unpacked.json: stable and beta must have different ids (they never share settings)"); }
  const m = /const KEYED_FROM = "([\d.]+)"/.exec(fs.readFileSync(path.join(ROOT, "popup", "popup.js"), "utf8"));
  if (!m || m[1] !== K.keyedFrom) { bad++; console.error(`✗ popup.js KEYED_FROM (${m && m[1]}) must equal keys/unpacked.json keyedFrom (${K.keyedFrom})`); }
  if ("key" in root) { bad++; console.error("✗ manifest.json must not have a key (the build adds it to the unpacked zip only)"); } }

// licence switches (src/pass.js): requiring a signed pass before the licence function is live would lock everyone out
{ const t = fs.readFileSync(path.join(ROOT, "src", "pass.js"), "utf8"), on = (n) => new RegExp("const " + n + " = true;").test(t);
  if (on("PASS_REQUIRED") && !on("LICENCE_LIVE")) { bad++; console.error("✗ src/pass.js: PASS_REQUIRED = true needs LICENCE_LIVE = true (no pass can be issued without the licence function)"); } }

// secrets never go in the repo: private signing keys, service_role / secret API keys (the licence function keeps them as
// server secrets; the public anon key and the public pass key are meant to be in the app)
{ let files = []; try { files = require("child_process").execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 1 << 26 }).toString().split("\0").filter(Boolean); } catch {}
  const skip = /^(vendor|site\/lib|node_modules)\/|\.(png|jpe?g|gif|webp|webm|mp4|wasm|woff2?|ttf|zip|jks|ico|bin)$|^site\/supabase\.js$/i;
  const jwtRole = (t) => { try { return JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString()).role; } catch { return ""; } };
  for (const f of files) {
    if (skip.test(f)) continue;
    let t; try { const st = fs.statSync(path.join(ROOT, f)); if (st.size > 2e6) continue; t = fs.readFileSync(path.join(ROOT, f), "utf8"); } catch { continue; }
    const hit = /-----BEGIN (?:EC |RSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/.test(t) ? "a private key"
      : /"kty"\s*:\s*"(?:EC|RSA)"[^}]*"d"\s*:\s*"[\w-]{20,}"/.test(t) || /"d"\s*:\s*"[\w-]{20,}"[^}]*"kty"\s*:\s*"(?:EC|RSA)"/.test(t) ? "a private JWK"
      : /\bsb_secret_[A-Za-z0-9_-]{16,}/.test(t) ? "a Supabase secret key"
      : (t.match(/eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g) || []).some((j) => jwtRole(j) === "service_role") ? "a service_role key" : "";
    if (hit) { bad++; console.error(`✗ ${f} contains ${hit}. Remove it and rotate it (docs/BETA_LAUNCH.md).`); }
  } }

if (bad) { console.error(`\n${bad} problem(s).`); process.exit(1); }
console.log(`✓ ${js.length} JS files parse · manifest OK · version ${root.version} everywhere (${V ? V.channel : "?"})`);
