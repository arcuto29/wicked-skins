// The panel's licence client (src/invite.js): outages and ended plans never delete what's yours.
// Run:  node test/licence/invite.test.mjs
import fs from "fs";
import vm from "vm";
const R = {}; const ok = (k, v, d) => { R[k] = !!v; console.log((v ? "PASS " : "FAIL ") + k + (d !== undefined ? "  " + d : "")); };

// a fake browser: chrome.storage.local with the user's own things in it, and a server that answers what we tell it
const MINE = { media: [{ id: "m1", name: "my wallpaper.mp4" }], mediaId: "m1", loadouts: [{ name: "Night" }], myCandles: [{ name: "Mine" }], skin: "galaxy",
  candleLook: "glass", dim: 0.4, wmText: "me", lastPick: 5, sites: ["topstepx"] };
const mem = { ...JSON.parse(JSON.stringify(MINE)), deviceId: "dev-abcdef123456" };
let answer = { http: 200, body: { status: "ok", pass: "PASS.TOKEN", plan: "pro", until: null } }, thrown = false, asked = [];
const sandbox = {
  chrome: { storage: { local: {
    get: (d, cb) => { const o = typeof d === "string" ? { [d]: mem[d] } : Object.fromEntries(Object.keys(d).map((k) => [k, k in mem ? mem[k] : d[k]])); cb(o); },
    set: (o, cb) => { Object.assign(mem, JSON.parse(JSON.stringify(o))); cb && cb(); } } } },
  WORKSHOP_CONFIG: { url: "https://db.example", anonKey: "anon" },
  PriismPass: { LICENCE_LIVE: true },
  crypto: globalThis.crypto, AbortController, setTimeout, clearTimeout, console, btoa, Uint8Array,
  fetch: async (url, o) => { asked.push(url); if (thrown) throw new Error("network down"); return { status: answer.http, json: async () => answer.body }; },
};
sandbox.self = sandbox; sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL("../../src/invite.js", import.meta.url), "utf8"), sandbox);
const I = sandbox.PriismInvite;
const mineIntact = () => Object.entries(MINE).every(([k, v]) => JSON.stringify(mem[k]) === JSON.stringify(v));

let r = await I.redeem("PRIISM-GOOD-0001");
ok("a good code unlocks and stores the pass", r.ok && mem.invite.ok && mem.pass === "PASS.TOKEN");

thrown = true; r = await I.recheck(true);
ok("server unreachable: the plan stays on (the pass keeps working until it ends)", r.ok && mem.invite.ok && mem.pass === "PASS.TOKEN");
thrown = false; answer = { http: 503, body: null }; r = await I.recheck(true);
ok("server error (503): the plan stays on", r.ok && mem.pass === "PASS.TOKEN");
answer = { http: 200, body: { status: "limited" } }; r = await I.recheck(true);
ok("'limited' (too many wrong guesses somewhere): the plan stays on, nobody is locked out", r.ok && mem.pass === "PASS.TOKEN");
answer = { http: 200, body: { status: "offline" } }; r = await I.recheck(true);
ok("the server saying offline: the plan stays on", r.ok && mem.pass === "PASS.TOKEN");

answer = { http: 200, body: { status: "expired" } }; r = await I.recheck(true);
ok("an ended plan locks Pro...", !r.ok && r.status === "expired" && mem.pass === "");
ok("...but every wallpaper, upload, saved look, candle style and setting is exactly as it was", mineIntact());
ok("...and the code stays saved, so renewing is one check away", mem.invite.code === "PRIISM-GOOD-0001" && mem.deviceId === "dev-abcdef123456");
answer = { http: 200, body: { status: "ok", pass: "PASS.NEW", plan: "pro" } }; r = await I.recheck(true);
ok("renewed: Pro is back with the same things", r.ok && mem.pass === "PASS.NEW" && mineIntact());

answer = { http: 200, body: { status: "revoked" } }; r = await I.recheck(true);
ok("turned off by the owner: locked, still nothing deleted", !r.ok && r.status === "revoked" && mineIntact());

// a beta account: the beta ending
answer = { http: 200, body: { status: "ok", pass: "PASS.B", until: new Date(Date.now() + 864e5).toISOString() } };
r = await I.link("ABCD-EF23"); ok("a link code joins the beta", r.ok && r.kind === "account" && mem.deviceSecret && mem.pass === "PASS.B");
answer = { http: 200, body: { status: "expired", until: "2026-12-01T00:00:00Z" } }; r = await I.recheck(true);
ok("the beta ends: locked, with the end date; everything of the tester's stays", !r.ok && r.status === "expired" && mem.pass === "" && mineIntact());
ok("the beta never asks a payment service for anything", asked.every((u) => u.startsWith("https://db.example/")));
ok("a limited link attempt says so", await (async () => { answer = { http: 200, body: { status: "limited" } }; const q = await I.link("ABCD-EF23"); return !q.ok && q.status === "limited"; })());
console.log("SUMMARY:", Object.values(R).filter(Boolean).length + "/" + Object.keys(R).length); process.exit(Object.values(R).every(Boolean) ? 0 : 1);
