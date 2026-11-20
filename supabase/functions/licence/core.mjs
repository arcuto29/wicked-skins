// Licence check for Priism Pro: an invite code (the invites table) or a Whop licence key. Pure logic, no Deno or Node
// APIs, so the edge function (index.ts) and the tests (supabase/licence.test.mjs) run exactly this code.
//
// In:  { key, device, app, action?: "check" | "release" }
// Out: { status: "ok", pass, plan, until, manage } | { status: "invalid" | "revoked" | "full" | "expired" | "offline" }
//
// The pass is a signed note ({ v, plan, src, dev, iat, exp, until }), ECDSA P-256 / SHA-256, that Priism checks with
// the public key in src/pass.js. It's only valid for this device and for PASS_DAYS; Priism asks again once a day.
// Whop's API key stays here (an edge function secret). Nothing about the user's charts or trading is sent or kept.
export const PASS_DAYS = 14;
export const MAX_DEVICES = 3;                      // the extension, the desktop app and a phone
export const WHOP_API = "https://api.whop.com/api/v1";
export const WHOP_VERSION = "2026-07-23";          // pinned (docs.whop.com/developer/api/versioning)
// Whop membership states that unlock Pro. past_due: Whop is still retrying the card, so access continues meanwhile.
export const GOOD = new Set(["active", "trialing", "completed", "past_due"]);
const DEV_RE = /^[A-Za-z0-9-]{8,64}$/, KEY_RE = /^[A-Za-z0-9-]{6,64}$/;

const b64u = (bytes) => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = (s) => { const t = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)); return Uint8Array.from(t, (c) => c.charCodeAt(0)); };
const ALG = { name: "ECDSA", namedCurve: "P-256" }, SIG = { name: "ECDSA", hash: "SHA-256" };

export async function signPass(privateJwk, payload, subtle = crypto.subtle) {
  const key = await subtle.importKey("jwk", privateJwk, ALG, false, ["sign"]);
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const sig = new Uint8Array(await subtle.sign(SIG, key, body));
  return b64u(body) + "." + b64u(sig);
}
export async function verifyPass(publicJwk, token, subtle = crypto.subtle) {
  try {
    const [a, b] = String(token || "").split("."); if (!a || !b) return null;
    const key = await subtle.importKey("jwk", publicJwk, ALG, false, ["verify"]), body = unb64u(a);
    if (!(await subtle.verify(SIG, key, unb64u(b), body))) return null;
    return JSON.parse(new TextDecoder().decode(body));
  } catch { return null; }
}

// a Whop membership -> may it unlock Pro on this device?
export function judge(m, device, productIds) {
  if (!m || typeof m !== "object") return { status: "invalid" };
  if (productIds && productIds.length && !(m.product && productIds.includes(m.product.id))) return { status: "invalid" };   // a key for another product
  if (!GOOD.has(m.status)) return { status: "expired" };
  const devices = String((m.metadata && m.metadata.priism_devices) || "").split(",").filter((d) => DEV_RE.test(d));
  const known = devices.includes(device);
  if (!known && devices.length >= MAX_DEVICES) return { status: "full", devices };
  const renews = m.renewal_price && +m.renewal_price.amount > 0 && m.billing_period_days;
  return { status: "ok", devices: known ? devices : [...devices, device], changed: !known, plan: renews ? "pro" : "lifetime",
    until: renews ? m.current_period_end || null : null, manage: m.manage_url || null };
}

// env: { SUPABASE_URL, SUPABASE_ANON_KEY, WHOP_API_KEY, WHOP_PRODUCT_IDS ("prod_a,prod_b"), PASS_PRIVATE_JWK (JSON) }
export async function handle(input, env, fetch, now = Date.now()) {
  const key = String((input && input.key) || "").trim(), device = String((input && input.device) || ""), action = input && input.action === "release" ? "release" : "check";
  if (!KEY_RE.test(key) || !DEV_RE.test(device)) return { status: "invalid" };
  const app = String((input && input.app) || "").slice(0, 20);
  const pass = async (src, j) => ({ status: "ok", src, plan: j.plan, until: j.until || null, manage: j.manage || null,
    pass: await signPass(JSON.parse(env.PASS_PRIVATE_JWK), { v: 1, plan: j.plan, src, dev: device, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + PASS_DAYS * 86400, until: j.until || null }) });
  // 1) an invite code (the same check as before, so invites keep working and count as Pro)
  if (action === "check" && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    let inv = "offline";
    try {
      const r = await fetch(env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/rpc/redeem_invite", { method: "POST",
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: "Bearer " + env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_code: key.toUpperCase(), p_device: device, p_app: app }) });
      if (r.ok) inv = await r.json();
    } catch {}
    if (inv === "ok") return pass("invite", { plan: "pro" });
    if (inv === "revoked" || inv === "full") return { status: inv };
  }
  // 2) a Whop licence key
  if (!env.WHOP_API_KEY) return { status: "invalid" };
  const H = { Authorization: "Bearer " + env.WHOP_API_KEY, "Api-Version-Date": WHOP_VERSION, "Content-Type": "application/json" };
  let m;
  try {
    const r = await fetch(`${WHOP_API}/memberships/${encodeURIComponent(key)}`, { headers: H });
    if (r.status === 404 || r.status === 400 || r.status === 422) return { status: "invalid" };
    if (!r.ok) return { status: "offline" };
    m = await r.json();
  } catch { return { status: "offline" }; }
  if (m && m.license_key && m.license_key !== key) return { status: "invalid" };   // looked up by key: it must be this one
  const ids = String(env.WHOP_PRODUCT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const save = async (devices) => {   // the devices this key is used on live on the membership itself (Whop metadata)
    const r = await fetch(`${WHOP_API}/memberships/${encodeURIComponent(m.id)}`, { method: "PATCH", headers: H, body: JSON.stringify({ metadata: { priism_devices: devices.join(",") } }) });
    return r.ok;
  };
  if (action === "release") {
    const left = String((m.metadata && m.metadata.priism_devices) || "").split(",").filter((d) => DEV_RE.test(d) && d !== device);
    try { return (await save(left)) ? { status: "ok" } : { status: "offline" }; } catch { return { status: "offline" }; }
  }
  const j = judge(m, device, ids);
  if (j.status !== "ok") return { status: j.status };
  if (j.changed) { try { if (!(await save(j.devices))) return { status: "offline" }; } catch { return { status: "offline" }; } }
  return pass("whop", j);
}
