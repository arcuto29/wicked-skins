/* Unlocking Priism: an invite code or a Priism Pro licence key (Whop), entered in the panel (extension, desktop, Android).
   Checked by the licence function on the Workshop backend (supabase/functions/licence), which answers with a signed
   pass (see src/pass.js); before that function is deployed, invites are checked with redeem_invite as before.
   Only the code / key you typed and a random id for this copy of Priism are sent; nothing about your charts or account.
   Shared by the panel (popup.js) and the extension's background worker (bg.js). Stored as
   invite = { code, ok, status, checked, since, plan, until, manage },  pass = the signed pass,  deviceId = random id. */
(function (root) {
  const CFG = () => root.WORKSHOP_CONFIG || {};
  const RECHECK_MS = 24 * 3600e3;            // ask again at most once a day (revoked codes lock within a day)
  const store = () => root.chrome && root.chrome.storage && root.chrome.storage.local;
  const get = (d) => new Promise((r) => { try { store().get(d, r); } catch { r(d); } });
  const put = (o) => new Promise((r) => { try { store().set(o, r); } catch { r(); } });
  const tidy = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
  async function deviceId() {
    const s = await get({ deviceId: "" });
    if (/^[A-Za-z0-9-]{8,64}$/.test(s.deviceId || "")) return s.deviceId;
    const id = (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12));
    await put({ deviceId: id }); return id;
  }
  const app = () => (root.wickedStore ? "desktop" : root.PriismNative ? "android" : "extension");
  // POST to the backend (8 s timeout) -> { http, body } or null when unreachable
  async function post(path, body) {
    const c = CFG(); if (!c.url || !c.anonKey) return null;
    const ctl = typeof AbortController === "function" ? new AbortController() : null, t = setTimeout(() => ctl && ctl.abort(), 8000);
    try {
      const r = await fetch(c.url.replace(/\/$/, "") + path, { method: "POST", signal: ctl && ctl.signal,
        headers: { apikey: c.anonKey, Authorization: "Bearer " + c.anonKey, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      let b = null; try { b = await r.json(); } catch {}
      return { http: r.status, body: b };
    } catch { return null; } finally { clearTimeout(t); }
  }
  // ask the server about a code or licence key -> { status: "ok" | "invalid" | "revoked" | "full" | "expired" | "offline",
  // pass?, plan?, until?, manage? }. The licence function (supabase/functions/licence) knows invites AND Whop keys and
  // answers with a signed pass; until it's deployed, invites are checked the old way (no pass).
  async function ask(code, action) {
    const key = String(code || "").trim().slice(0, 64), dev = await deviceId();
    const r = await post("/functions/v1/licence", { key, device: dev, app: app(), action: action || "check" });
    if (r && r.http === 200 && r.body && typeof r.body.status === "string") return r.body;
    if (r && r.http !== 404) return { status: "offline" };
    if (action === "release") return { status: "ok" };
    const old = await post("/rest/v1/rpc/redeem_invite", { p_code: tidy(code), p_device: dev, p_app: app() });   // no licence function yet
    if (!old || old.http !== 200) return { status: "offline" };
    return { status: ["ok", "invalid", "revoked", "full"].includes(old.body) ? old.body : "offline" };
  }
  const record = (code, r, since) => ({ code, ok: r.status === "ok", status: r.status, checked: Date.now(), since: since || Date.now(),
    plan: r.plan || (r.status === "ok" ? "pro" : ""), until: r.until || null, manage: r.manage || null });
  // you typed a code or key in the panel
  async function redeem(code) {
    const k = String(code || "").trim(), r = await ask(k);
    // (invite codes are saved in capitals; a Whop key exactly as typed)
    if (r.status === "ok") { const inv = record(r.src === "whop" ? k : tidy(k), r); await put({ invite: inv, pass: r.pass || "" }); return inv; }
    return { ok: false, status: r.status };
  }
  // now and then: is the saved code / key still good? A revoked or ended one locks Pro again; no internet keeps it
  // as is (a pass lasts 14 days, so going offline for a while is fine).
  async function recheck(force) {
    const { invite } = await get({ invite: null });
    if (!invite || !invite.code) return invite;
    if (!force && Date.now() - (invite.checked || 0) < RECHECK_MS) return invite;
    const r = await ask(invite.code);
    if (r.status === "offline") return invite;
    const next = record(invite.code, r, invite.since);
    await put({ invite: next, pass: r.status === "ok" ? r.pass || "" : "" }); return next;
  }
  // "Sign out on this device": frees this device on the key (so it can be used on another one), then forgets it here
  async function release() {
    const { invite } = await get({ invite: null });
    if (invite && invite.code) await ask(invite.code, "release");
    await put({ invite: null, pass: "" });
  }
  const isOk = (inv) => !!(inv && inv.ok && inv.code);
  root.PriismInvite = { redeem, recheck, release, isOk, deviceId, tidy };
})(typeof self !== "undefined" ? self : window);
