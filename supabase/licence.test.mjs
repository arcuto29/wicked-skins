// Tests the licence check (supabase/functions/licence/core.mjs) against a fake Whop API and a fake invite check.
// Run:  node supabase/licence.test.mjs
import { handle, verifyPass, judge, MAX_DEVICES, PASS_DAYS, WHOP_VERSION } from "./functions/licence/core.mjs";
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); };
const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const PRIV = await crypto.subtle.exportKey("jwk", kp.privateKey), PUB = await crypto.subtle.exportKey("jwk", kp.publicKey);
const env = { SUPABASE_URL: "https://db.example", SUPABASE_ANON_KEY: "anon", WHOP_API_KEY: "whop_secret_123", WHOP_PRODUCT_IDS: "prod_priism", PASS_PRIVATE_JWK: JSON.stringify(PRIV) };
const D1 = "dev-11111111", D2 = "dev-22222222", D3 = "dev-33333333", D4 = "dev-44444444";
// fake backends
const invites = { "PRIISM-GOOD-0001": "ok", "PRIISM-GONE-0001": "revoked", "PRIISM-FULL-0001": "full", "BETA-ACCT-0001": "account", "BETA-ENDED-001": "expired" };
// beta accounts: a stand-in for link_device / device_check / unlink_device (the real ones are tested in test.mjs)
const SEC = "k".repeat(43), SEC2 = "q".repeat(43), SOON = new Date(Date.now() + 3 * 864e5).toISOString(), LATER = new Date(Date.now() + 60 * 864e5).toISOString();
const links = { "ABCD-EF23": SOON, "WXYZ-2345": LATER, "FULL-FULL": "full" }, linked = {};
let dbDown = false;
const memberships = {
  "AAAAAA-MONTHLY-0001": { id: "mem_1", status: "active", product: { id: "prod_priism" }, renewal_price: { amount: "14.99" }, billing_period_days: 30, current_period_end: "2026-12-04T00:00:00.000Z", manage_url: "https://whop.com/billing/manage/mem_1", metadata: {} },
  "BBBBBB-LIFETIME-001": { id: "mem_2", status: "active", product: { id: "prod_priism" }, renewal_price: { amount: "0.00" }, billing_period_days: null, metadata: {} },
  "CCCCCC-CANCELED-001": { id: "mem_3", status: "canceled", product: { id: "prod_priism" }, metadata: {} },
  "DDDDDD-OTHERPRD-001": { id: "mem_4", status: "active", product: { id: "prod_other" }, metadata: {} },
  "EEEEEE-PASTDUE-0001": { id: "mem_5", status: "past_due", product: { id: "prod_priism" }, renewal_price: { amount: "14.99" }, billing_period_days: 30, metadata: {} },
};
for (const [k, m] of Object.entries(memberships)) m.license_key = k;
const calls = [];
const fakeFetch = async (url, o = {}) => {
  calls.push({ url, method: o.method || "GET", headers: o.headers || {}, body: o.body });
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  if (dbDown && url.startsWith("https://db.example")) return res(503, {});
  if (url.startsWith("https://db.example/rest/v1/rpc/link_device")) { const b = JSON.parse(o.body); const u = links[b.p_link];
    if (u === "full") return res(200, { status: "full", next: "2026-12-01T00:00:00Z" });
    if (!u) return res(200, { status: "invalid" }); linked[b.p_device + b.p_secret] = u; delete links[b.p_link]; return res(200, { status: "ok", until: u }); }
  if (url.startsWith("https://db.example/rest/v1/rpc/device_check")) { const b = JSON.parse(o.body); const u = linked[b.p_device + b.p_secret];
    return res(200, u === "moved" ? { status: "moved" } : u ? { status: "ok", until: u } : { status: "invalid" }); }
  if (url.startsWith("https://db.example/rest/v1/rpc/unlink_device")) { const b = JSON.parse(o.body); if (linked[b.p_device + b.p_secret]) linked[b.p_device + b.p_secret] = "moved"; return res(200, "ok"); }
  if (url.startsWith("https://db.example/rest/v1/rpc/redeem_invite")) { const b = JSON.parse(o.body); return res(200, invites[b.p_code] || "invalid"); }
  const m = url.match(/^https:\/\/api\.whop\.com\/api\/v1\/memberships\/([^/?]+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (id === "FFFFFF-WHOPDOWN-01") return res(500, {});
    const mem = memberships[id] || Object.values(memberships).find((x) => x.id === id);
    if (!mem) return res(404, { error: "not found" });
    if (o.method === "PATCH") { Object.assign(mem.metadata, JSON.parse(o.body).metadata); return res(200, mem); }
    return res(200, JSON.parse(JSON.stringify(mem)));
  }
  return res(404, {});
};
const run = (key, device, extra = {}) => handle({ key, device, app: "extension", ...extra }, env, fakeFetch);

// invites
let r = await run("priism-good-0001", D1), p = await verifyPass(PUB, r.pass);
ok("an invite code still unlocks (as Pro), any letter case", r.status === "ok" && p && p.plan === "pro" && p.src === "invite" && p.dev === D1, r.status);
ok("the pass expires after " + PASS_DAYS + " days", p && p.exp - p.iat === PASS_DAYS * 86400);
ok("a revoked invite is refused", (await run("PRIISM-GONE-0001", D1)).status === "revoked");
ok("a full invite is refused", (await run("PRIISM-FULL-0001", D1)).status === "full");
// Whop
calls.length = 0;
r = await run("AAAAAA-MONTHLY-0001", D1); p = await verifyPass(PUB, r.pass);
ok("a monthly Whop key unlocks Pro, with its renewal date and billing link", r.status === "ok" && p.plan === "pro" && p.src === "whop" && r.until === "2026-12-04T00:00:00.000Z" && /billing\/manage/.test(r.manage), r);
const wh = calls.find((c) => c.url.includes("api.whop.com") && c.method === "GET");
ok("Whop is asked with the server's key and a pinned API version", wh && wh.headers.Authorization === "Bearer whop_secret_123" && wh.headers["Api-Version-Date"] === WHOP_VERSION);
ok("the device is saved on the membership", memberships["AAAAAA-MONTHLY-0001"].metadata.priism_devices === D1);
ok("the answer never contains Whop's key", !JSON.stringify(r).includes("whop_secret"));
calls.length = 0; r = await run("AAAAAA-MONTHLY-0001", D1);
ok("the same device again: ok, nothing rewritten", r.status === "ok" && !calls.some((c) => c.method === "PATCH"));
await run("AAAAAA-MONTHLY-0001", D2); await run("AAAAAA-MONTHLY-0001", D3);
ok(`up to ${MAX_DEVICES} devices`, memberships["AAAAAA-MONTHLY-0001"].metadata.priism_devices.split(",").length === 3);
ok("a 4th device is refused (full)", (await run("AAAAAA-MONTHLY-0001", D4)).status === "full");
ok("signing out frees a device", (await run("AAAAAA-MONTHLY-0001", D3, { action: "release" })).status === "ok" && !memberships["AAAAAA-MONTHLY-0001"].metadata.priism_devices.includes(D3));
ok("...so the 4th device fits now", (await run("AAAAAA-MONTHLY-0001", D4)).status === "ok");
r = await run("BBBBBB-LIFETIME-001", D1); p = await verifyPass(PUB, r.pass);
ok("a one-time (Lifetime) purchase unlocks as Lifetime, no end date", r.status === "ok" && p.plan === "lifetime" && r.until === null);
ok("past due (Whop still retrying the card): still unlocked", (await run("EEEEEE-PASTDUE-0001", D1)).status === "ok");
ok("a cancelled / ended membership: expired", (await run("CCCCCC-CANCELED-001", D1)).status === "expired");
ok("a key for another product: invalid", (await run("DDDDDD-OTHERPRD-001", D1)).status === "invalid");
ok("an unknown key: invalid", (await run("ZZZZZZ-NOSUCHKEY-01", D1)).status === "invalid");
ok("Whop down: offline (Priism keeps the pass it has)", (await run("FFFFFF-WHOPDOWN-01", D1)).status === "offline");
ok("bad input: invalid, nothing asked", (await handle({ key: "x", device: D1 }, env, fakeFetch)).status === "invalid" && (await handle({ key: "AAAAAA-MONTHLY-0001", device: "bad device!" }, env, fakeFetch)).status === "invalid" && (await handle(null, env, fakeFetch)).status === "invalid");
// passes can't be forged or moved
r = await run("AAAAAA-MONTHLY-0001", D1);
const [body, sig] = r.pass.split("."), forged = btoa(JSON.stringify({ ...JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/"))), plan: "lifetime", exp: 9e9 })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") + "." + sig;
ok("an edited pass is rejected", (await verifyPass(PUB, forged)) === null);
const other = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
ok("a pass checked with another key is rejected", (await verifyPass(await crypto.subtle.exportKey("jwk", other.publicKey), r.pass)) === null);
ok("judge: a membership with no status is not unlocked", judge({ product: { id: "prod_priism" } }, D1, ["prod_priism"]).status === "expired");
// beta: copies linked to an account
const acct = (extra) => handle({ device: D1, app: "extension", ...extra }, env, fakeFetch);
ok("a beta code typed in the panel: 'account' (add it on the website)", (await run("BETA-ACCT-0001", D1)).status === "account");
ok("an ended code: expired", (await run("BETA-ENDED-001", D1)).status === "expired");
r = await acct({ action: "link", link: "abcdef23", secret: SEC }); p = await verifyPass(PUB, r.pass);
ok("a link code joins the account: a pass for this copy, from the account", r.status === "ok" && p && p.src === "account" && p.dev === D1 && p.plan === "pro" && r.until === SOON, r.status);
ok("the pass ends when the beta ends (not 14 days later)", p && p.exp === Math.floor(Date.parse(SOON) / 1000));
ok("a link code works once", (await acct({ action: "link", link: "ABCD-EF23", secret: SEC })).status === "invalid");
r = await acct({ secret: SEC }); p = await verifyPass(PUB, r.pass);
ok("the daily check renews the pass", r.status === "ok" && p && p.src === "account");
ok("a long beta still gets a 14-day pass", await (async () => { const q = await handle({ device: D2, action: "link", link: "WXYZ-2345", secret: SEC2 }, env, fakeFetch); const pp = await verifyPass(PUB, q.pass); return pp.exp - pp.iat === PASS_DAYS * 86400; })());
ok("account full: says when a move is allowed", await (async () => { const q = await acct({ action: "link", link: "FULL-FULL", secret: SEC }); return q.status === "full" && q.next === "2026-12-01T00:00:00Z" && !q.pass; })());
ok("the wrong secret: invalid, no pass", await (async () => { const q = await acct({ secret: SEC2 }); return q.status === "invalid" && !q.pass; })());
ok("a short or missing secret is refused before asking", (await acct({ secret: "abc" })).status === "invalid" && (await acct({ action: "link", link: "ABCD-EF23" })).status === "invalid");
ok("a badly formed link code is refused", (await acct({ action: "link", link: "IIII-0000", secret: SEC })).status === "invalid");
await acct({ action: "release", secret: SEC });
ok("sign out: the copy is told it moved next time", (await acct({ secret: SEC })).status === "moved");
dbDown = true;
ok("database down: offline (Priism keeps the pass it has)", (await handle({ device: D2, secret: SEC2 }, env, fakeFetch)).status === "offline");
dbDown = false;
console.log("SUMMARY:", Object.values(R).filter(Boolean).length + "/" + Object.keys(R).length);
process.exit(Object.values(R).every(Boolean) ? 0 : 1);
