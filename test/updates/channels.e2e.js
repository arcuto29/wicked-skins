// Stable and beta installed side by side in one Chrome, on the real tradingview.com chart (no account needed):
//   - a beta copy only opens with account-linked beta access (a shared link / zip alone gives nothing)
//   - a locked beta copy never blanks the stable copy's chart (it used to take the page and draw nothing)
//   - when the beta is activated and used, it takes over; locked again, stable takes the chart back
//   - at every moment exactly ONE copy draws (one wallpaper layer), and each keeps its own settings
//   node test/updates/channels.e2e.js
const { chromium } = require("playwright"); const path = require("path"), fs = require("fs"), os = require("os"), crypto = require("crypto"), cp = require("child_process");
const ROOT = path.join(__dirname, "..", ".."), OUT = path.join(ROOT, "test-output", "updates"); fs.mkdirSync(OUT, { recursive: true });
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + JSON.stringify(d).slice(0, 300) : "")); };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "priism-ch-"));
cp.execFileSync(process.execPath, [path.join(ROOT, "scripts/build-extension.js")], { stdio: "pipe" });
const copyExt = (name, patch) => { const d = path.join(TMP, name); fs.cpSync(path.join(ROOT, "dist/extension"), d, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(d, "manifest.json"))); patch && patch(m); fs.writeFileSync(path.join(d, "manifest.json"), JSON.stringify(m)); return d; };
const idOf = (dir) => [...crypto.createHash("sha256").update(dir).digest("hex").slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
const STABLE = copyExt("stable");
// a beta build, the way scripts/build-extension.js makes one from a beta version
const BETA = copyExt("beta", (m) => { const [a, b, c] = m.version.split(".").map(Number); m.version = `${a}.${b}.${c + 1}.1`; m.version_name = `${a}.${b}.${c + 1}-beta.1`; m.name = m.name.replace(/Priism Skins/, "Priism Skins Beta"); });
const sid = idOf(STABLE), bid = idOf(BETA);
(async () => {
  const ctx = await chromium.launchPersistentContext(path.join(TMP, "profile"), { headless: false, viewport: { width: 1400, height: 860 },
    args: ["--headless=new", "--no-sandbox", "--disable-gpu", `--disable-extensions-except=${STABLE},${BETA}`, `--load-extension=${STABLE},${BETA}`] });
  await new Promise((r) => setTimeout(r, 1500)); for (const p of ctx.pages()) if (/tradingview\.com/.test(p.url())) await p.close().catch(() => {});
  const panel = async (id) => { const p = await ctx.newPage(); await p.goto(`chrome-extension://${id}/popup/popup.html`); await p.waitForTimeout(600); return p; };
  const ps = await panel(sid), pb = await panel(bid);
  const set = (p, o) => p.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
  const base = { welcomePending: 0, enabled: true, candleOn: true };
  await set(ps, { ...base, skin: "aurora", candleUp: "#00ffa3", invite: { code: "PRIISM-STBL-0001", ok: true, status: "ok", checked: 4e12, since: 1 }, lastPick: Date.now() - 60000 });
  // the beta copy has a normal invite code (as if someone shared one), but no account link
  await set(pb, { ...base, skin: "starfield", candleUp: "#ff2e97", invite: { code: "PRIISM-SHRD-0001", ok: true, status: "ok", checked: 4e12, since: 1 }, lastPick: Date.now() });
  const gate = (p) => p.evaluate(() => new Promise((r) => chrome.storage.local.get({ invite: null, pass: "" }, (s) => r({ channel: PriismPass.CHANNEL, plan: PriismPass.planOf(null, s.invite) }))));
  let g = await gate(pb);
  ok("the beta copy knows it's the beta", g.channel === "beta" && (await gate(ps)).channel === "stable");
  ok("a beta copy with a shared invite code but no account link stays locked", g.plan === "none", g);
  ok("...while the same kind of code opens the stable copy", (await gate(ps)).plan === "pro");
  const page = await ctx.newPage(); await page.bringToFront();
  await page.goto("https://www.tradingview.com/chart/?symbol=CME_MINI%3ANQ1%21", { waitUntil: "domcontentloaded", timeout: 60000 });
  const look = () => page.evaluate(() => ({ owner: (document.documentElement.getAttribute("data-bd-owner") || "").split("|")[0], layers: document.querySelectorAll("#bd-layer").length,
    skin: (document.querySelector("#bd-layer canvas[data-bd-skin]") || {}).dataset ? document.querySelector("#bd-layer canvas[data-bd-skin]").dataset.bdSkin : null }));
  const until = async (fn, ms) => { const t = Date.now() + ms; let v; while (Date.now() < t) { v = await look(); if (fn(v)) return v; await page.waitForTimeout(500); } return v; };
  let v = await until((x) => x.layers === 1 && x.owner === sid, 40000);
  ok("stable + a locked, newer, last-used beta: the STABLE copy draws (it isn't blanked)", v.owner === sid && v.layers === 1 && v.skin === "aurora", v);
  await page.waitForTimeout(5000); v = await look();
  ok("...and keeps drawing (the locked beta doesn't take it)", v.owner === sid && v.layers === 1, v);
  await page.screenshot({ path: path.join(OUT, "channels-stable-draws.png") });
  // the tester's beta access is linked to their account; they use the beta's panel
  await set(pb, { invite: { code: "ACCOUNT", ok: true, status: "ok", checked: 4e12, since: 1, kind: "account" }, lastPick: Date.now() });
  ok("beta access linked to an approved account: the beta copy opens", (await gate(pb)).plan === "pro");
  v = await until((x) => x.owner === bid && x.layers === 1 && x.skin === "starfield", 20000);
  ok("the activated beta, used last, takes over the chart: one layer, its own settings", v.owner === bid && v.layers === 1 && v.skin === "starfield", v);
  await page.screenshot({ path: path.join(OUT, "channels-beta-draws.png") });
  // access ends (revoked / beta over): the beta hands the chart back by itself
  await set(pb, { invite: null });
  v = await until((x) => x.owner === sid && x.layers === 1 && x.skin === "aurora", 25000);
  ok("beta locked again: stable takes the chart back by itself, nothing left behind", v.owner === sid && v.layers === 1 && v.skin === "aurora", v);
  // never two at once
  let two = 0; for (let i = 0; i < 10; i++) { if ((await look()).layers > 1) two++; await page.waitForTimeout(300); }
  ok("never two wallpaper layers at once", !two);
  const s1 = await ps.evaluate(() => new Promise((r) => chrome.storage.local.get(["skin", "candleUp"], r))), b1 = await pb.evaluate(() => new Promise((r) => chrome.storage.local.get(["skin", "candleUp"], r)));
  ok("each copy kept its own settings (separate extension ids, nothing shared or overwritten)", s1.skin === "aurora" && b1.skin === "starfield" && s1.candleUp !== b1.candleUp);
  await ctx.close(); fs.rmSync(TMP, { recursive: true, force: true });
  const p = Object.values(R).filter(Boolean).length, n = Object.keys(R).length; console.log("SUMMARY:", p + "/" + n); process.exit(p === n ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
